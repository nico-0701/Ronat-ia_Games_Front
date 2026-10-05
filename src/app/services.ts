import { QueryClient } from '@tanstack/react-query';
import { createApi, createPublicApi, unwrap, type ApiClient, type FetchLike } from '@/api/client';
import { isApiError } from '@/api/errors';
import { AuthSession, type LockRunner } from '@/api/session';
import { browserStorage, TokenStore, type StorageLike } from '@/api/tokens';
import type { ServerClock } from '@/lib/clock';
import { serverClock } from '@/lib/clock';
import { apiBaseUrl } from '@/lib/env';
import type { LiveHub } from '@/features/sessions/live/hub';
import { LazyHub } from '@/features/sessions/live/lazyHub';

/** Tudo o que as telas usam para falar com o servidor, montado uma vez (e substituível nos testes). */
export interface Services {
  baseUrl: string;
  tokenStore: TokenStore;
  session: AuthSession;
  /** Cliente autenticado (renova o token sozinho). */
  api: ApiClient;
  /** Cliente sem token: login, cadastro, `/meta`, avatares prontos. */
  publicApi: ApiClient;
  clock: ServerClock;
  queryClient: QueryClient;
  /** Tempo real (SignalR): avisa e entrega a visão da partida; agir é pelo REST. */
  live: LiveHub;
}

export interface ServicesOptions {
  baseUrl?: string;
  /** `null` = só na memória. Omitido = `localStorage` do navegador. */
  storage?: StorageLike | null;
  fetch?: FetchLike;
  clock?: ServerClock;
  lock?: LockRunner;
  queryClient?: QueryClient;
  live?: LiveHub;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 15_000,
        gcTime: 5 * 60_000,
        // Erros do servidor (4xx) não melhoram tentando de novo; rede e 5xx (servidor acordando) sim.
        retry: (failures, error) =>
          failures < 2 && (!isApiError(error) || error.status === 0 || error.status >= 500),
        refetchOnWindowFocus: true,
      },
      mutations: { retry: false },
    },
  });
}

export function createServices(options: ServicesOptions = {}): Services {
  const baseUrl = (options.baseUrl ?? apiBaseUrl()).replace(/\/+$/, '');
  const clock = options.clock ?? serverClock;
  const tokenStore = new TokenStore(options.storage === undefined ? browserStorage() : options.storage);
  const publicApi = createPublicApi(baseUrl, options.fetch);

  const session = new AuthSession({
    store: tokenStore,
    now: () => clock.now(),
    lock: options.lock,
    requestRefresh: (refreshToken) =>
      unwrap(publicApi.POST('/api/v1/auth/refresh', { body: { refreshToken } })),
  });

  return {
    baseUrl,
    tokenStore,
    session,
    api: createApi(baseUrl, session, options.fetch),
    publicApi,
    clock,
    queryClient: options.queryClient ?? createQueryClient(),
    live:
      options.live ??
      new LazyHub({
        url: `${baseUrl}/hubs/sessions`,
        accessToken: () => session.validAccessToken(),
      }),
  };
}
