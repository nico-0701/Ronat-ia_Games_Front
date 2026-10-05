import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { unwrap, type ApiClient } from '@/api/client';
import { isApiError } from '@/api/errors';
import type { ActionResponse, Game, GameSession, GameSessionSummary } from '@/api/types';
import { useApi, useAuthStatus } from '@/app/servicesContext';
import { newId } from '@/lib/id';
import { reconcileSession } from './reconcile';

export const sessionKeys = {
  games: ['games'] as const,
  ofGroup: (groupId: string) => ['groups', groupId, 'sessions'] as const,
  detail: (sessionId: string) => ['sessions', sessionId] as const,
};

/** O catálogo de jogos instalados no servidor. */
export function useGames() {
  const api = useApi();
  const status = useAuthStatus();

  return useQuery<Game[]>({
    queryKey: sessionKeys.games,
    queryFn: () => unwrap(api.GET('/api/v1/games')),
    enabled: status === 'authenticated',
    staleTime: 10 * 60_000,
  });
}

/** As partidas de um grupo (as abertas primeiro). */
export function useGroupSessions(groupId: string) {
  const api = useApi();

  return useQuery<GameSessionSummary[]>({
    queryKey: sessionKeys.ofGroup(groupId),
    queryFn: () => unwrap(api.GET('/api/v1/groups/{groupId}/sessions', { params: { path: { groupId } } })),
    staleTime: 5_000,
  });
}

/**
 * A partida como quem consulta a enxerga. Com o tempo real ligado as mudanças chegam sozinhas; sem ele (rede ruim, WebSocket
 * bloqueado), busca a cada poucos segundos. A resposta nunca volta no tempo: a versão só sobe.
 */
export function useSession(sessionId: string, { live }: { live: boolean }) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useQuery<GameSession>({
    queryKey: sessionKeys.detail(sessionId),
    queryFn: async () => {
      const fetched = await unwrap(
        api.GET('/api/v1/sessions/{sessionId}', { params: { path: { sessionId } } }),
      );
      // Uma busca explícita vale também com a mesma versão: algumas fases mudam só com o relógio.
      return reconcileSession(queryClient.getQueryData(sessionKeys.detail(sessionId)), fetched, {
        allowEqual: true,
      });
    },
    staleTime: 2_000,
    refetchInterval: live ? false : 4_000,
  });
}

/** Guarda no cache uma partida que chegou (resposta de uma ação, busca ou mensagem do tempo real). */
export function useStoreSession() {
  const queryClient = useQueryClient();

  return useCallback(
    (session: GameSession, source: 'push' | 'fetch') => {
      queryClient.setQueryData<GameSession>(sessionKeys.detail(session.id), (current) =>
        reconcileSession(current, session, { allowEqual: source === 'fetch' }),
      );
    },
    [queryClient],
  );
}

function useSessionMutation<TVars = void>(run: (api: ApiClient, vars: TVars) => Promise<GameSession>) {
  const api = useApi();
  const store = useStoreSession();
  const queryClient = useQueryClient();

  return useMutation<GameSession, Error, TVars>({
    mutationFn: (vars) => run(api, vars),
    onSuccess: (session) => {
      store(session, 'fetch');
      void queryClient.invalidateQueries({ queryKey: sessionKeys.ofGroup(session.groupId), exact: true });
    },
  });
}

export function useCreateSession() {
  return useSessionMutation<{ groupId: string; gameId: string }>((api, body) =>
    unwrap(api.POST('/api/v1/sessions', { body })),
  );
}

export function useJoinSession(sessionId: string) {
  return useSessionMutation((api) =>
    unwrap(api.POST('/api/v1/sessions/{sessionId}/join', { params: { path: { sessionId } } })),
  );
}

export function useLeaveSession(sessionId: string) {
  return useSessionMutation((api) =>
    unwrap(api.POST('/api/v1/sessions/{sessionId}/leave', { params: { path: { sessionId } } })),
  );
}

export function useAddSessionPlayer(sessionId: string) {
  return useSessionMutation<string>((api, memberId) =>
    unwrap(
      api.POST('/api/v1/sessions/{sessionId}/players', {
        params: { path: { sessionId } },
        body: { memberId },
      }),
    ),
  );
}

export function useRemoveSessionPlayer(sessionId: string) {
  return useSessionMutation<string>((api, playerId) =>
    unwrap(
      api.DELETE('/api/v1/sessions/{sessionId}/players/{playerId}', {
        params: { path: { sessionId, playerId } },
      }),
    ),
  );
}

export function useAssignTeams(sessionId: string) {
  return useSessionMutation<{ playerId: string; team: number | null }[]>((api, assignments) =>
    unwrap(
      api.PUT('/api/v1/sessions/{sessionId}/teams', {
        params: { path: { sessionId } },
        body: { assignments },
      }),
    ),
  );
}

export function useShuffleTeams(sessionId: string) {
  return useSessionMutation((api) =>
    unwrap(api.POST('/api/v1/sessions/{sessionId}/teams/shuffle', { params: { path: { sessionId } } })),
  );
}

export function useUpdateSessionConfig(sessionId: string) {
  return useSessionMutation<unknown>((api, config) =>
    unwrap(
      api.PATCH('/api/v1/sessions/{sessionId}/config', { params: { path: { sessionId } }, body: { config } }),
    ),
  );
}

export function useStartSession(sessionId: string) {
  return useSessionMutation((api) =>
    unwrap(api.POST('/api/v1/sessions/{sessionId}/start', { params: { path: { sessionId } } })),
  );
}

export function useFinishSession(sessionId: string) {
  return useSessionMutation((api) =>
    unwrap(api.POST('/api/v1/sessions/{sessionId}/finish', { params: { path: { sessionId } } })),
  );
}

export function useCancelSession(sessionId: string) {
  return useSessionMutation((api) =>
    unwrap(api.POST('/api/v1/sessions/{sessionId}/cancel', { params: { path: { sessionId } } })),
  );
}

/** Cria a revanche (partida nova no lobby com o mesmo jogo, configuração e jogadores). */
export function useRematch(sessionId: string) {
  return useSessionMutation((api) =>
    unwrap(api.POST('/api/v1/sessions/{sessionId}/rematch', { params: { path: { sessionId } } })),
  );
}

/**
 * Envia uma ação do jogo. O `clientActionId` torna o envio idempotente: se a resposta se perder e a ação for reenviada, o
 * servidor devolve o estado atual (`replayed`) sem aplicar de novo. Um conflito de concorrência (`409`) é tentado mais uma vez.
 */
export function useGameAction(sessionId: string) {
  const api = useApi();
  const store = useStoreSession();

  return useMutation<ActionResponse, Error, { type: string; payload?: unknown }>({
    mutationFn: async ({ type, payload }) => {
      const body = { clientActionId: newId(), type, payload };
      const send = () =>
        unwrap(api.POST('/api/v1/sessions/{sessionId}/actions', { params: { path: { sessionId } }, body }));
      try {
        return await send();
      } catch (error) {
        if (isApiError(error, 'session.concurrent_update')) {
          return send();
        }

        throw error;
      }
    },
    onSuccess: (response) => store(response.session, 'fetch'),
  });
}
