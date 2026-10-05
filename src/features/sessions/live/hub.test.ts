import { HubConnectionState } from '@microsoft/signalr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeConnection } from '@/test/fakeConnection';
import { SESSION_ID, sessionFixture } from '@/test/sessions';
import { GROUP_ID } from '@/test/fixtures';
import { SignalRHub, type LiveStatus, type SessionListener } from './hub';

function listener(): SessionListener & { statuses: LiveStatus[] } {
  const statuses: LiveStatus[] = [];
  return {
    statuses,
    onSnapshot: vi.fn(),
    onUpdate: vi.fn(),
    onPresence: vi.fn(),
    onRematch: vi.fn(),
    onRevoked: vi.fn(),
    onStatus: (status) => statuses.push(status),
  };
}

function setup(options: { retryDelaysMs?: number[]; idleCloseMs?: number } = {}) {
  const connections: FakeConnection[] = [];
  const factories: (() => Promise<string>)[] = [];
  const token = vi.fn<() => Promise<string | null>>(async () => 'token-1');
  const hub = new SignalRHub({
    url: 'http://api.test/hubs/sessions',
    accessToken: token,
    createConnection: (_url, accessToken) => {
      factories.push(accessToken);
      const connection = new FakeConnection();
      const session = sessionFixture();
      connection.snapshots.set(SESSION_ID, { session, onlineMemberIds: ['m1'] });
      connections.push(connection);
      return connection;
    },
    ...options,
  });
  return { hub, connections, token, factories };
}

/** Deixa as promessas pendentes terminarem. */
const settle = () => vi.advanceTimersByTimeAsync(0);

describe('SignalRHub', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('conecta só quando alguém começa a assistir e entrega o estado completo', async () => {
    const { hub, connections } = setup();
    expect(connections).toHaveLength(0);

    const watcher = listener();
    hub.watchSession(SESSION_ID, watcher);
    await settle();

    expect(connections).toHaveLength(1);
    expect(connections[0]!.calls('Subscribe')).toEqual([[SESSION_ID]]);
    expect(watcher.onSnapshot).toHaveBeenCalledWith(expect.objectContaining({ id: SESSION_ID }), ['m1']);
    expect(watcher.statuses).toEqual(['idle', 'connecting', 'live']);
  });

  it('entrega cada mensagem só a quem assiste àquela partida', async () => {
    const { hub, connections } = setup();
    const watcher = listener();
    const other = listener();
    hub.watchSession(SESSION_ID, watcher);
    hub.watchSession('outra-partida', other);
    await settle();
    const connection = connections[0]!;

    connection.emit('SessionUpdated', sessionFixture({ version: 7 }));
    connection.emit('PresenceChanged', { sessionId: SESSION_ID, memberId: 'm2', online: true });
    connection.emit('RematchCreated', { sessionId: SESSION_ID, newSessionId: 'nova' });
    connection.emit('AccessRevoked', { sessionId: SESSION_ID });

    expect(watcher.onUpdate).toHaveBeenCalledWith(expect.objectContaining({ version: 7 }));
    expect(watcher.onPresence).toHaveBeenCalledWith('m2', true);
    expect(watcher.onRematch).toHaveBeenCalledWith('nova');
    expect(watcher.onRevoked).toHaveBeenCalled();
    expect(other.onUpdate).not.toHaveBeenCalled();
    expect(other.onRevoked).not.toHaveBeenCalled();
  });

  it('um segundo observador recebe o próprio estado completo sem repetir para o primeiro', async () => {
    const { hub, connections } = setup();
    const first = listener();
    const second = listener();
    hub.watchSession(SESSION_ID, first);
    await settle();

    hub.watchSession(SESSION_ID, second);
    await settle();

    expect(connections).toHaveLength(1);
    expect(first.onSnapshot).toHaveBeenCalledTimes(1);
    expect(second.onSnapshot).toHaveBeenCalledTimes(1);
  });

  it('cancela a assinatura quando o último observador sai e fecha a conexão depois de um tempo parado', async () => {
    const { hub, connections } = setup({ idleCloseMs: 5000 });
    const stop = hub.watchSession(SESSION_ID, listener());
    await settle();

    stop();
    await settle();
    expect(connections[0]!.calls('Unsubscribe')).toEqual([[SESSION_ID]]);
    expect(connections[0]!.stopCalls).toBe(0);

    await vi.advanceTimersByTimeAsync(5000);
    expect(connections[0]!.stopCalls).toBe(1);
  });

  it('assistir de novo antes do fim do prazo cancela o fechamento', async () => {
    const { hub, connections } = setup({ idleCloseMs: 5000 });
    hub.watchSession(SESSION_ID, listener())();
    await settle();

    await vi.advanceTimersByTimeAsync(3000);
    hub.watchSession(SESSION_ID, listener());
    await vi.advanceTimersByTimeAsync(10_000);

    expect(connections[0]!.stopCalls).toBe(0);
  });

  it('ao reconectar assina tudo de novo e mostra o estado ao vivo', async () => {
    const { hub, connections } = setup();
    const watcher = listener();
    hub.watchSession(SESSION_ID, watcher);
    hub.watchGroup(GROUP_ID, vi.fn());
    await settle();
    const connection = connections[0]!;

    connection.startReconnecting();
    expect(watcher.statuses.at(-1)).toBe('reconnecting');
    connection.finishReconnecting();
    await settle();

    expect(watcher.statuses.at(-1)).toBe('live');
    expect(connection.calls('Subscribe')).toHaveLength(2);
    expect(connection.calls('SubscribeGroup')).toHaveLength(2);
    expect(watcher.onSnapshot).toHaveBeenCalledTimes(2);
  });

  it('quando a conexão acaba de vez (token vencido), tenta de novo com uma conexão nova', async () => {
    const { hub, connections } = setup({ retryDelaysMs: [1000] });
    const watcher = listener();
    hub.watchSession(SESSION_ID, watcher);
    await settle();

    connections[0]!.closeForGood();
    expect(watcher.statuses.at(-1)).toBe('offline');
    await vi.advanceTimersByTimeAsync(1000);

    expect(connections).toHaveLength(2);
    expect(connections[1]!.calls('Subscribe')).toEqual([[SESSION_ID]]);
    expect(watcher.statuses.at(-1)).toBe('live');
    expect(watcher.onSnapshot).toHaveBeenCalledTimes(2);
  });

  it('se não consegue conectar, fica offline e insiste até conseguir', async () => {
    const { hub, connections } = setup({ retryDelaysMs: [1000] });
    const watcher = listener();
    const original = vi.spyOn(FakeConnection.prototype, 'start');
    original.mockRejectedValueOnce(new Error('sem rede')).mockRejectedValueOnce(new Error('sem rede'));

    hub.watchSession(SESSION_ID, watcher);
    await settle();
    expect(watcher.statuses.at(-1)).toBe('offline');

    await vi.advanceTimersByTimeAsync(1000);
    expect(watcher.statuses.at(-1)).toBe('offline');
    await vi.advanceTimersByTimeAsync(1000);

    expect(watcher.statuses.at(-1)).toBe('live');
    expect(connections).toHaveLength(1); // as tentativas reaproveitam a mesma conexão
    expect(watcher.onSnapshot).toHaveBeenCalledTimes(1);
  });

  it('avisa quando perdeu o acesso à partida ao assinar', async () => {
    const { hub, connections } = setup();
    const watcher = listener();
    const prototypeInvoke = vi.spyOn(FakeConnection.prototype, 'invoke');
    prototypeInvoke.mockRejectedValueOnce(new Error('session.not_found: Partida não encontrada.'));

    hub.watchSession(SESSION_ID, watcher);
    await settle();

    expect(connections[0]!.state).toBe(HubConnectionState.Connected);
    expect(watcher.onRevoked).toHaveBeenCalledTimes(1);
    expect(watcher.onSnapshot).not.toHaveBeenCalled();
  });

  it('avisa quando a lista de partidas do grupo mudou', async () => {
    const { hub, connections } = setup();
    const changed = vi.fn();
    hub.watchGroup(GROUP_ID, changed);
    await settle();

    connections[0]!.emit('GroupSessionsChanged', { groupId: GROUP_ID });
    connections[0]!.emit('GroupSessionsChanged', { groupId: 'outro-grupo' });

    expect(connections[0]!.calls('SubscribeGroup')).toEqual([[GROUP_ID]]);
    expect(changed).toHaveBeenCalledTimes(1);
  });

  it('stop fecha a conexão e não tenta voltar sozinho', async () => {
    const { hub, connections } = setup({ retryDelaysMs: [1000] });
    const watcher = listener();
    hub.watchSession(SESSION_ID, watcher);
    await settle();

    await hub.stop();
    await vi.advanceTimersByTimeAsync(60_000);

    expect(connections).toHaveLength(1);
    expect(connections[0]!.stopCalls).toBe(1);
    expect(watcher.statuses.at(-1)).toBe('idle');
  });

  it('resume reassina o que está sendo assistido', async () => {
    const { hub, connections } = setup();
    const watcher = listener();
    hub.watchSession(SESSION_ID, watcher);
    await settle();

    await hub.resume();

    expect(connections[0]!.calls('Subscribe')).toHaveLength(2);
    expect(watcher.onSnapshot).toHaveBeenCalledTimes(2);
  });

  it('pede um token válido ao conectar (e manda vazio se a sessão acabou)', async () => {
    const { hub, token, factories } = setup();
    hub.watchSession(SESSION_ID, listener());
    await settle();

    expect(await factories[0]!()).toBe('token-1');
    token.mockResolvedValueOnce(null);
    expect(await factories[0]!()).toBe('');
  });
});
