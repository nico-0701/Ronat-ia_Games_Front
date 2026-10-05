import createClient from 'openapi-fetch';
import { ApiError, networkError, problemFrom } from './errors';
import type { AuthSession } from './session';
import type { paths } from './schema';

export type ApiClient = ReturnType<typeof createClient<paths>>;

export type FetchLike = (input: Request) => Promise<Response>;

/** Rotas que não levam o token (quem chama ainda não entrou, ou a rota é pública). */
const PUBLIC_PATHS = new Set([
  '/api/v1/meta',
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
  '/api/v1/avatars/presets',
]);

const defaultFetch: FetchLike = (request) => fetch(request);

function pathOf(request: Request): string {
  try {
    return new URL(request.url).pathname;
  } catch {
    return request.url;
  }
}

function withToken(request: Request, token: string | null): Request {
  if (!token) {
    return request;
  }

  const headers = new Headers(request.headers);
  headers.set('Authorization', `Bearer ${token}`);
  return new Request(request, { headers });
}

/** Cliente sem autenticação (login, cadastro, renovação, `/meta`). */
export function createPublicApi(baseUrl: string, fetchImpl: FetchLike = defaultFetch): ApiClient {
  return createClient<paths>({ baseUrl, fetch: fetchImpl });
}

/**
 * Cliente autenticado: manda o `Bearer`, renova o token antes de vencer e, se o servidor recusar (401), renova uma vez e repete
 * a requisição. Se a sessão morreu, devolve o 401 e a `AuthSession` já limpou os tokens (a interface volta para a entrada).
 * Se a renovação falhar por rede ou servidor, a requisição falha como erro de rede e a sessão **continua**: não se desloga
 * ninguém por causa de um sinal ruim.
 */
export function createApi(
  baseUrl: string,
  session: AuthSession,
  fetchImpl: FetchLike = defaultFetch,
): ApiClient {
  const authedFetch: FetchLike = async (request) => {
    if (PUBLIC_PATHS.has(pathOf(request))) {
      return fetchImpl(request);
    }

    const pristine = request.clone(); // o corpo só pode ser lido uma vez; a cópia serve para a repetição
    const token = await session.validAccessToken();
    const first = await fetchImpl(withToken(request, token));
    if (first.status !== 401 || !token) {
      return first;
    }

    const renewed = await session.renewAfterRejection(token); // lança em falha transitória
    return renewed ? fetchImpl(withToken(pristine, renewed)) : first;
  };

  return createClient<paths>({ baseUrl, fetch: authedFetch });
}

interface Settled<T> {
  data?: T;
  error?: unknown;
  response: Response;
}

/** Aguarda uma chamada do cliente e devolve só os dados; qualquer falha vira `ApiError` (rede ou `problem+json`). */
export async function unwrap<T>(pending: Promise<Settled<T>>): Promise<T> {
  let result: Settled<T>;
  try {
    result = await pending;
  } catch (cause) {
    throw cause instanceof ApiError ? cause : networkError(cause);
  }

  if (!result.response.ok) {
    throw problemFrom(result.response, result.error);
  }

  return result.data as T;
}
