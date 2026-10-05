import { describe, expect, it, vi } from 'vitest';
import {
  authFixture,
  createMutex,
  jsonResponse,
  memoryStorage,
  problemResponse,
  userFixture,
} from '@/test/helpers';
import { createApi, createPublicApi, unwrap } from './client';
import { ApiError, networkError } from './errors';
import { AuthSession } from './session';
import { TokenStore } from './tokens';
import type { AuthResponse } from './types';

const NOW = Date.parse('2026-10-05T12:00:00Z');
const BASE = 'http://api.test';

function setup(options: { refresh?: (token: string) => Promise<AuthResponse>; signedIn?: boolean } = {}) {
  const store = new TokenStore(memoryStorage());
  const requestRefresh = vi.fn(options.refresh ?? (async () => authFixture({ now: NOW, tag: 'b' })));
  const session = new AuthSession({ store, now: () => NOW, lock: createMutex(), requestRefresh });
  if (options.signedIn !== false) {
    session.signIn(authFixture({ now: NOW, tag: 'a' }));
  }

  const seen: { url: string; method: string; auth: string | null; body: string | null }[] = [];
  const server = vi.fn<(request: Request) => Promise<Response>>();
  const fetchImpl = async (request: Request) => {
    const copy = request.clone();
    seen.push({
      url: new URL(request.url).pathname,
      method: request.method,
      auth: request.headers.get('Authorization'),
      body: request.method === 'GET' ? null : await copy.text(),
    });
    return server(request);
  };

  return {
    session,
    requestRefresh,
    seen,
    server,
    api: createApi(BASE, session, fetchImpl),
    publicApi: createPublicApi(BASE, fetchImpl),
  };
}

describe('createApi', () => {
  it('manda o Bearer nas rotas autenticadas', async () => {
    const { api, server, seen } = setup();
    server.mockResolvedValue(jsonResponse(userFixture()));

    const user = await unwrap(api.GET('/api/v1/users/me'));

    expect(user.displayName).toBe('Ana');
    expect(seen[0]).toMatchObject({ url: '/api/v1/users/me', auth: 'Bearer access-a' });
  });

  it('não manda token nas rotas públicas', async () => {
    const { api, server, seen } = setup();
    server.mockResolvedValue(jsonResponse({ apiVersion: '1' }));

    await unwrap(api.GET('/api/v1/meta'));

    expect(seen[0]?.auth).toBeNull();
  });

  it('renova uma vez no 401 e repete a requisição com o corpo intacto', async () => {
    const { api, server, seen, requestRefresh } = setup();
    server.mockResolvedValueOnce(problemResponse(401, 'auth.unauthorized'));
    server.mockResolvedValueOnce(jsonResponse({ id: 'g1', name: 'Amigos' }, 201));

    const group = await unwrap(api.POST('/api/v1/groups', { body: { name: 'Amigos' } }));

    expect(group).toMatchObject({ name: 'Amigos' });
    expect(requestRefresh).toHaveBeenCalledTimes(1);
    expect(seen.map((s) => s.auth)).toEqual(['Bearer access-a', 'Bearer access-b']);
    expect(seen[1]?.body).toBe(JSON.stringify({ name: 'Amigos' }));
  });

  it('várias requisições recusadas ao mesmo tempo renovam uma só vez', async () => {
    const { api, server, requestRefresh } = setup();
    server.mockImplementation(async (request) =>
      request.headers.get('Authorization') === 'Bearer access-b'
        ? jsonResponse([])
        : problemResponse(401, 'auth.unauthorized'),
    );

    await Promise.all([
      unwrap(api.GET('/api/v1/groups')),
      unwrap(api.GET('/api/v1/games')),
      unwrap(api.GET('/api/v1/users/me/stats')),
    ]);

    expect(requestRefresh).toHaveBeenCalledTimes(1);
  });

  it('se a sessão morreu, devolve o 401 e deixa a pessoa deslogada', async () => {
    const { api, server, session } = setup({
      refresh: async () => {
        throw new ApiError({ status: 401, code: 'auth.invalid_refresh_token', detail: 'Entre de novo.' });
      },
    });
    server.mockResolvedValue(problemResponse(401, 'auth.unauthorized', 'Sua sessão terminou.'));

    await expect(unwrap(api.GET('/api/v1/groups'))).rejects.toMatchObject({
      status: 401,
      code: 'auth.unauthorized',
    });
    expect(session.getStatus()).toBe('anonymous');
  });

  it('falha de rede ao renovar vira erro de rede e mantém a sessão', async () => {
    const { api, server, session } = setup({
      refresh: async () => {
        throw networkError();
      },
    });
    server.mockResolvedValue(problemResponse(401, 'auth.unauthorized'));

    await expect(unwrap(api.GET('/api/v1/groups'))).rejects.toMatchObject({
      code: 'network.unreachable',
      status: 0,
    });
    expect(session.getStatus()).toBe('authenticated');
  });

  it('sem sessão, manda a requisição sem token e entrega o 401 sem tentar renovar', async () => {
    const { api, server, requestRefresh, seen } = setup({ signedIn: false });
    server.mockResolvedValue(problemResponse(401, 'auth.unauthorized'));

    await expect(unwrap(api.GET('/api/v1/groups'))).rejects.toMatchObject({ status: 401 });
    expect(seen[0]?.auth).toBeNull();
    expect(requestRefresh).not.toHaveBeenCalled();
  });
});

describe('unwrap', () => {
  it('devolve undefined em respostas 204', async () => {
    const { api, server } = setup();
    server.mockResolvedValue(jsonResponse(null, 204));

    await expect(unwrap(api.POST('/api/v1/auth/logout'))).resolves.toBeUndefined();
  });

  it('converte falha de fetch em erro de rede', async () => {
    const api = createPublicApi(BASE, async () => {
      throw new TypeError('Failed to fetch');
    });

    await expect(unwrap(api.GET('/api/v1/meta'))).rejects.toMatchObject({ isNetwork: true });
  });

  it('transforma problem+json em ApiError com o code do servidor', async () => {
    const { publicApi, server } = setup();
    server.mockResolvedValue(
      problemResponse(404, 'auth.user_not_found', 'Não existe conta com este telefone.'),
    );

    const failure = unwrap(publicApi.POST('/api/v1/auth/login', { body: { phone: '11988887777' } }));

    await expect(failure).rejects.toMatchObject({
      status: 404,
      code: 'auth.user_not_found',
      detail: 'Não existe conta com este telefone.',
    });
  });
});
