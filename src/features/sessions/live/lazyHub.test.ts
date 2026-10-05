import { describe, expect, it, vi } from 'vitest';
import { FakeConnection } from '@/test/fakeConnection';
import { SESSION_ID, sessionFixture } from '@/test/sessions';
import { LazyHub } from './lazyHub';
import type { SessionListener } from './hub';

function listener(): SessionListener {
  return {
    onSnapshot: vi.fn(),
    onUpdate: vi.fn(),
    onPresence: vi.fn(),
    onRematch: vi.fn(),
    onRevoked: vi.fn(),
    onStatus: vi.fn(),
  };
}

describe('LazyHub', () => {
  it('só carrega e conecta quando alguém começa a assistir', async () => {
    const connections: FakeConnection[] = [];
    const hub = new LazyHub({
      url: 'http://api.test/hubs/sessions',
      accessToken: async () => 't',
      createConnection: () => {
        const connection = new FakeConnection();
        connection.snapshots.set(SESSION_ID, { session: sessionFixture(), onlineMemberIds: [] });
        connections.push(connection);
        return connection;
      },
    });
    expect(connections).toHaveLength(0);

    const watcher = listener();
    hub.watchSession(SESSION_ID, watcher);

    await vi.waitFor(() => expect(watcher.onSnapshot).toHaveBeenCalledTimes(1));
    expect(connections).toHaveLength(1);
  });

  it('cancelar antes de o módulo carregar desfaz o pedido', async () => {
    const connections: FakeConnection[] = [];
    const hub = new LazyHub({
      url: 'http://api.test/hubs/sessions',
      accessToken: async () => 't',
      createConnection: () => {
        const connection = new FakeConnection();
        connections.push(connection);
        return connection;
      },
    });

    const stop = hub.watchSession(SESSION_ID, listener());
    stop(); // antes de o import terminar
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(connections).toHaveLength(0);
  });

  it('stop e resume não carregam nada se ninguém usou o tempo real', async () => {
    const hub = new LazyHub({ url: 'x', accessToken: async () => null });

    await expect(hub.stop()).resolves.toBeUndefined();
    await expect(hub.resume()).resolves.toBeUndefined();
  });
});
