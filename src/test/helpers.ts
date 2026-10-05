import type { AuthResponse, UserDto } from '@/api/types';
import type { LockRunner } from '@/api/session';
import type { StorageLike } from '@/api/tokens';

/** Armazenamento em memória com a mesma interface do `localStorage` (para simular duas abas, use a mesma instância). */
export function memoryStorage(
  initial: Record<string, string> = {},
): StorageLike & { dump(): Record<string, string> } {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
    dump: () => Object.fromEntries(data),
  };
}

/** Uma fila: só uma tarefa por vez, como o Web Locks faz entre abas. */
export function createMutex(): LockRunner {
  let tail: Promise<unknown> = Promise.resolve();
  return (_name, task) => {
    const run = tail.then(task, task);
    tail = run.catch(() => undefined);
    return run;
  };
}

export function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json', ...headers },
  });
}

export function problemResponse(
  status: number,
  code: string,
  detail = 'Mensagem do servidor.',
  extra: object = {},
): Response {
  return jsonResponse(
    { type: `urn:ronat-ia:error:${code}`, title: 'Erro', status, detail, code, traceId: 'trace-1', ...extra },
    status,
  );
}

export function userFixture(overrides: Partial<UserDto> = {}): UserDto {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    displayName: 'Ana',
    phoneLast4: '7777',
    avatar: { kind: 'preset', preset: 'preset-1', url: null },
    createdAt: '2026-10-01T12:00:00Z',
    ...overrides,
  };
}

/** Uma resposta de login/renovação. Os tempos são relativos a `now` (ms). */
export function authFixture(
  options: { now?: number; accessMinutes?: number; tag?: string; user?: UserDto } = {},
): AuthResponse {
  const now = options.now ?? Date.now();
  const tag = options.tag ?? 'a';
  return {
    accessToken: `access-${tag}`,
    accessTokenExpiresAt: new Date(now + (options.accessMinutes ?? 30) * 60_000).toISOString(),
    refreshToken: `refresh-${tag}`,
    refreshTokenExpiresAt: new Date(now + 90 * 24 * 3_600_000).toISOString(),
    isNewUser: false,
    user: options.user ?? userFixture(),
  };
}
