import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { unwrap } from '@/api/client';
import type { HistoryPage, MyStats, Ranking, RankingPeriod } from '@/api/types';
import { useApi, useAuthStatus } from '@/app/servicesContext';

export const rankingKeys = {
  ranking: (groupId: string, gameId: string | undefined, period: RankingPeriod) =>
    ['groups', groupId, 'ranking', gameId ?? 'todos', period] as const,
  history: (groupId: string, gameId: string | undefined) =>
    ['groups', groupId, 'history', gameId ?? 'todos'] as const,
  myStats: ['me', 'stats'] as const,
};

export const PERIOD_OPTIONS: readonly { value: RankingPeriod; label: string }[] = [
  { value: 'all', label: 'Sempre' },
  { value: 'year', label: 'Ano' },
  { value: 'quarter', label: '90 dias' },
  { value: 'month', label: '30 dias' },
  { value: 'week', label: '7 dias' },
];

/** O ranking do grupo: calculado das partidas encerradas, por jogo e período. */
export function useRanking(groupId: string, gameId: string | undefined, period: RankingPeriod) {
  const api = useApi();

  return useQuery<Ranking>({
    queryKey: rankingKeys.ranking(groupId, gameId, period),
    queryFn: () =>
      unwrap(
        api.GET('/api/v1/groups/{groupId}/ranking', {
          params: { path: { groupId }, query: { gameId, period } },
        }),
      ),
    staleTime: 10_000,
  });
}

const PAGE_SIZE = 20;

/** As partidas encerradas do grupo, da mais recente para a mais antiga, com paginação por cursor. */
export function useHistory(groupId: string, gameId: string | undefined) {
  const api = useApi();

  return useInfiniteQuery<
    HistoryPage,
    Error,
    { pages: HistoryPage[] },
    readonly unknown[],
    string | undefined
  >({
    queryKey: rankingKeys.history(groupId, gameId),
    initialPageParam: undefined,
    queryFn: ({ pageParam }) =>
      unwrap(
        api.GET('/api/v1/groups/{groupId}/history', {
          params: { path: { groupId }, query: { gameId, before: pageParam, limit: PAGE_SIZE } },
        }),
      ),
    getNextPageParam: (last) => last.nextBefore ?? undefined,
    staleTime: 10_000,
  });
}

/** As estatísticas da própria pessoa, somando todos os grupos. */
export function useMyStats() {
  const api = useApi();
  const status = useAuthStatus();

  return useQuery<MyStats>({
    queryKey: rankingKeys.myStats,
    queryFn: () => unwrap(api.GET('/api/v1/users/me/stats')),
    enabled: status === 'authenticated',
    staleTime: 30_000,
  });
}
