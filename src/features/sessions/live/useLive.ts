import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useServices } from '@/app/servicesContext';
import { useToast } from '@/ui/toast';
import { sessionKeys, useStoreSession } from '../queries';
import type { LiveStatus, SessionListener } from './hub';

/**
 * Acompanha uma partida ao vivo: as mudanças vão direto para o cache da partida (a versão só sobe), e a presença, a revanche
 * e a perda de acesso são tratadas aqui. Devolve o estado da conexão (para cair em busca periódica quando não estiver ao vivo).
 */
export function useSessionLive(sessionId: string) {
  const { live } = useServices();
  const store = useStoreSession();
  const navigate = useNavigate();
  const toast = useToast();
  const [status, setStatus] = useState<LiveStatus>('idle');
  const [online, setOnline] = useState<ReadonlySet<string>>(() => new Set());
  const handlers = useRef({ navigate, toast });

  useEffect(() => {
    handlers.current = { navigate, toast };
  }, [navigate, toast]);

  useEffect(() => {
    const listener: SessionListener = {
      onSnapshot: (session, onlineMemberIds) => {
        store(session, 'fetch');
        setOnline(new Set(onlineMemberIds));
      },
      onUpdate: (session) => store(session, 'push'),
      onPresence: (memberId, isOnline) =>
        setOnline((previous) => {
          const next = new Set(previous);
          if (isOnline) {
            next.add(memberId);
          } else {
            next.delete(memberId);
          }

          return next;
        }),
      onRematch: (newSessionId) => {
        handlers.current.toast.show('Nova partida criada!', 'success');
        void handlers.current.navigate(`/partidas/${newSessionId}`, { replace: true });
      },
      onRevoked: () => {
        handlers.current.toast.show('Você não tem mais acesso a esta partida.', 'error');
        void handlers.current.navigate('/', { replace: true });
      },
      onStatus: setStatus,
    };

    return live.watchSession(sessionId, listener);
  }, [live, sessionId, store]);

  return { status, online };
}

/** Recarrega a lista de partidas do grupo quando o servidor avisa que mudou. */
export function useGroupSessionsLive(groupId: string) {
  const { live } = useServices();
  const queryClient = useQueryClient();

  useEffect(
    () =>
      live.watchGroup(groupId, () => {
        void queryClient.invalidateQueries({ queryKey: sessionKeys.ofGroup(groupId), exact: true });
      }),
    [live, groupId, queryClient],
  );
}
