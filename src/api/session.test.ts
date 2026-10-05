import { describe, expect, it, vi } from 'vitest';
import { createMutex, authFixture, memoryStorage } from '@/test/helpers';
import { ApiError, networkError } from './errors';
import { AuthSession, type LockRunner } from './session';
import { TokenStore } from './tokens';
import type { AuthResponse } from './types';

const NOW = Date.parse('2026-10-05T12:00:00Z');

function makeTab(options: {
  storage?: ReturnType<typeof memoryStorage>;
  lock?: LockRunner;
  requestRefresh: (token: string) => Promise<AuthResponse>;
}) {
  const store = new TokenStore(options.storage ?? memoryStorage());
  const session = new AuthSession({
    store,
    now: () => NOW,
    lock: options.lock ?? createMutex(),
    requestRefresh: options.requestRefresh,
  });
  return { store, session };
}

describe('AuthSession', () => {
  it('sem sessão não há token nem renovação', async () => {
    const requestRefresh = vi.fn();
    const { session } = makeTab({ requestRefresh });

    expect(session.getStatus()).toBe('anonymous');
    expect(await session.validAccessToken()).toBeNull();
    expect(requestRefresh).not.toHaveBeenCalled();
  });

  it('signIn guarda os tokens e muda o status; signOut limpa', () => {
    const { session } = makeTab({ requestRefresh: vi.fn() });
    const listener = vi.fn();
    session.subscribe(listener);

    session.signIn(authFixture({ now: NOW, tag: 'a' }));
    expect(session.getStatus()).toBe('authenticated');
    expect(session.accessToken()).toBe('access-a');

    session.signOut();
    expect(session.getStatus()).toBe('anonymous');
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('usa o token como está enquanto falta mais de 30 s para vencer', async () => {
    const requestRefresh = vi.fn();
    const { session } = makeTab({ requestRefresh });
    session.signIn(authFixture({ now: NOW, accessMinutes: 5, tag: 'a' }));

    expect(await session.validAccessToken()).toBe('access-a');
    expect(requestRefresh).not.toHaveBeenCalled();
  });

  it('renova antes de usar um token que vence em menos de 30 s e entrega o par novo', async () => {
    const requestRefresh = vi.fn(async () => authFixture({ now: NOW, tag: 'b' }));
    const { session } = makeTab({ requestRefresh });
    session.signIn(authFixture({ now: NOW, accessMinutes: 0.2, tag: 'a' }));

    expect(await session.validAccessToken()).toBe('access-b');
    expect(requestRefresh).toHaveBeenCalledWith('refresh-a');
    expect(session.accessToken()).toBe('access-b');
  });

  it('várias chamadas ao mesmo tempo gastam o refresh token uma única vez', async () => {
    let release: (auth: AuthResponse) => void = () => {};
    const requestRefresh = vi.fn(() => new Promise<AuthResponse>((resolve) => (release = resolve)));
    const { session } = makeTab({ requestRefresh });
    session.signIn(authFixture({ now: NOW, accessMinutes: 0, tag: 'a' }));

    const calls = [
      session.validAccessToken(),
      session.validAccessToken(),
      session.renewAfterRejection('access-a'),
    ];
    await vi.waitFor(() => expect(requestRefresh).toHaveBeenCalledTimes(1));
    release(authFixture({ now: NOW, tag: 'b' }));

    expect(await Promise.all(calls)).toEqual(['access-b', 'access-b', 'access-b']);
    expect(requestRefresh).toHaveBeenCalledTimes(1);
  });

  it('um 401 tardio de uma requisição antiga não gasta outro refresh se já houve renovação', async () => {
    const requestRefresh = vi.fn();
    const { session } = makeTab({ requestRefresh });
    session.signIn(authFixture({ now: NOW, tag: 'novo' })); // já é o par novo

    expect(await session.renewAfterRejection('access-velho')).toBe('access-novo');
    expect(requestRefresh).not.toHaveBeenCalled();
  });

  it('um 401 do token que ainda é o atual força a renovação', async () => {
    const requestRefresh = vi.fn(async () => authFixture({ now: NOW, tag: 'b' }));
    const { session } = makeTab({ requestRefresh });
    session.signIn(authFixture({ now: NOW, tag: 'a' })); // válido pelo relógio, mas o servidor recusou

    expect(await session.renewAfterRejection('access-a')).toBe('access-b');
    expect(requestRefresh).toHaveBeenCalledTimes(1);
  });

  it('refresh token inválido encerra a sessão e devolve null', async () => {
    const requestRefresh = vi.fn(async () => {
      throw new ApiError({ status: 401, code: 'auth.invalid_refresh_token', detail: 'Sessão encerrada.' });
    });
    const { session } = makeTab({ requestRefresh });
    session.signIn(authFixture({ now: NOW, tag: 'a' }));

    expect(await session.renewAfterRejection('access-a')).toBeNull();
    expect(session.getStatus()).toBe('anonymous');
  });

  it('falha de rede na renovação não derruba a sessão', async () => {
    const requestRefresh = vi.fn(async () => {
      throw networkError();
    });
    const { session } = makeTab({ requestRefresh });
    session.signIn(authFixture({ now: NOW, accessMinutes: 0, tag: 'a' }));

    // Renovação proativa: devolve o token que há, sem lançar.
    expect(await session.validAccessToken()).toBe('access-a');
    // Renovação por 401: lança, para quem chamou saber que foi transitório.
    await expect(session.renewAfterRejection('access-a')).rejects.toMatchObject({
      code: 'network.unreachable',
    });
    expect(session.getStatus()).toBe('authenticated');
  });

  it('repete uma vez a renovação que colidiu com outra (auth.refresh_conflict)', async () => {
    let calls = 0;
    const requestRefresh = vi.fn(async () => {
      calls += 1;
      if (calls === 1) {
        throw new ApiError({ status: 409, code: 'auth.refresh_conflict', detail: 'Tente de novo.' });
      }
      return authFixture({ now: NOW, tag: 'b' });
    });
    const { session } = makeTab({ requestRefresh });
    session.signIn(authFixture({ now: NOW, accessMinutes: 0, tag: 'a' }));

    vi.useFakeTimers();
    try {
      const pending = session.validAccessToken();
      await vi.advanceTimersByTimeAsync(500);
      expect(await pending).toBe('access-b');
    } finally {
      vi.useRealTimers();
    }
    expect(requestRefresh).toHaveBeenCalledTimes(2);
  });

  it('duas abas com o token vencido renovam uma única vez e as duas ficam com o par novo', async () => {
    const storage = memoryStorage();
    const lock = createMutex(); // o Web Locks compartilhado entre as abas
    const requestRefresh = vi.fn(async (refreshToken: string) => {
      if (refreshToken !== 'refresh-a') {
        // gastar de novo o token já trocado derrubaria a sessão de verdade
        throw new ApiError({ status: 401, code: 'auth.invalid_refresh_token', detail: 'Token já usado.' });
      }
      return authFixture({ now: NOW, tag: 'b' });
    });
    const tabA = makeTab({ storage, lock, requestRefresh });
    const tabB = makeTab({ storage, lock, requestRefresh });
    tabA.session.signIn(authFixture({ now: NOW, accessMinutes: 0, tag: 'a' }));
    tabB.store.reload();

    const [fromA, fromB] = await Promise.all([
      tabA.session.validAccessToken(),
      tabB.session.validAccessToken(),
    ]);

    expect(requestRefresh).toHaveBeenCalledTimes(1);
    expect(fromA).toBe('access-b');
    expect(fromB).toBe('access-b');
    expect(tabA.session.getStatus()).toBe('authenticated');
    expect(tabB.session.getStatus()).toBe('authenticated');
  });

  it('sair em uma aba reflete nas outras depois do reload do armazenamento', () => {
    const storage = memoryStorage();
    const tabA = makeTab({ storage, requestRefresh: vi.fn() });
    const tabB = makeTab({ storage, requestRefresh: vi.fn() });
    tabA.session.signIn(authFixture({ now: NOW }));
    tabB.store.reload();
    expect(tabB.session.getStatus()).toBe('authenticated');

    tabA.session.signOut();
    tabB.store.reload();

    expect(tabB.session.getStatus()).toBe('anonymous');
  });
});
