import { QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { vi } from 'vitest';
import { App } from '@/app/App';
import { routes } from '@/app/routes';
import { createServices } from '@/app/services';
import { ServerClock } from '@/lib/clock';
import { FakeHub } from './fakeHub';
import { authFixture, createMutex, jsonResponse, memoryStorage } from './helpers';
import { gameFixture } from './sessions';

export type Handler = (request: Request) => Response | Promise<Response>;

/** Um servidor de mentira: cada rota é `"MÉTODO /caminho"`. Requisição sem rota combinada falha o teste. */
export function fakeApi(handlers: Record<string, Handler> = {}) {
  const calls: { key: string; body: unknown; auth: string | null; search: string }[] = [];
  const defaults: Record<string, Handler> = {
    'GET /api/v1/meta': () =>
      jsonResponse({
        apiVersion: '1',
        minClientVersion: '0.0.0',
        serverTimeUtc: new Date().toISOString(),
        auth: { captchaRequired: false, captchaSiteKey: null, registrationOpen: true },
      }),
    'GET /api/v1/games': () => jsonResponse([gameFixture()]),
    'GET /api/v1/groups/{groupId}/sessions': () => jsonResponse([]),
    'GET /api/v1/users/me/stats': () => jsonResponse({ played: 0, wins: 0, groups: 0, byGame: [] }),
    'GET /api/v1/auth/sessions': () => jsonResponse([]),
    'GET /api/v1/avatars/presets': () =>
      jsonResponse({
        default: 'preset-1',
        keys: ['preset-1', 'preset-2', 'preset-3', 'preset-4', 'preset-5', 'preset-6'],
      }),
  };
  const table: Record<string, Handler> = { ...defaults, ...handlers };

  /** A rota pode ter parâmetros: `"GET /api/v1/groups/{groupId}"` casa com `"GET /api/v1/groups/abc"`. */
  const findHandler = (key: string): Handler | undefined => {
    if (table[key]) {
      return table[key];
    }

    for (const [pattern, handler] of Object.entries(table)) {
      if (pattern.includes('{')) {
        const regex = new RegExp(`^${pattern.replace(/\{[^}]+\}/g, '[^/]+')}$`);
        if (regex.test(key)) {
          return handler;
        }
      }
    }

    return undefined;
  };

  const fetchImpl = vi.fn(async (request: Request) => {
    const url = new URL(request.url);
    const key = `${request.method} ${url.pathname}`;
    const text = request.method === 'GET' ? '' : await request.clone().text();
    let body: unknown = text;
    try {
      body = text ? JSON.parse(text) : undefined;
    } catch {
      // corpo que não é JSON (ex.: multipart): fica como texto
    }

    calls.push({ key, body, auth: request.headers.get('Authorization'), search: url.search });
    const handler = findHandler(key);
    if (!handler) {
      throw new Error(`Requisição inesperada nos testes: ${key}`);
    }

    return handler(request);
  });

  return {
    fetch: fetchImpl,
    calls,
    on: (key: string, handler: Handler) => void (table[key] = handler),
    /** As chamadas feitas a uma rota (`"POST /api/v1/groups"`; aceita `{param}`). */
    called: (pattern: string) => {
      const regex = new RegExp(`^${pattern.replace(/\{[^}]+\}/g, '[^/]+')}$`);
      return calls.filter((call) => regex.test(call.key));
    },
  };
}

interface RenderAppOptions {
  route?: string;
  hub?: FakeHub;
  handlers?: Record<string, Handler>;
  signedIn?: boolean;
}

/** Monta o app inteiro (rotas, provedores e serviços) contra o servidor de mentira. */
export function renderApp({
  route = '/',
  handlers,
  signedIn = false,
  hub = new FakeHub(),
}: RenderAppOptions = {}) {
  const api = fakeApi(handlers);
  const storage = memoryStorage();
  const clock = new ServerClock();
  const services = createServices({
    baseUrl: 'http://api.test',
    storage,
    fetch: api.fetch,
    clock,
    lock: createMutex(),
    live: hub,
    queryClient: new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    }),
  });
  if (signedIn) {
    services.session.signIn(authFixture());
  }

  const router = createMemoryRouter(routes, { initialEntries: [route] });
  const user = userEvent.setup();
  const view = render(<App services={services} router={router} />);
  return { ...view, user, router, services, api, clock, storage, hub };
}
