import { HubConnectionBuilder, HubConnectionState, LogLevel, type HubConnection } from '@microsoft/signalr';
import type { GameSession } from '@/api/types';

export type LiveStatus = 'idle' | 'connecting' | 'live' | 'reconnecting' | 'offline';

/** Quem acompanha uma partida ao vivo. */
export interface SessionListener {
  /** O estado completo, logo depois de assinar (ou de reconectar). */
  onSnapshot: (session: GameSession, onlineMemberIds: string[]) => void;
  /** Mudança na partida: a visão de quem recebe. */
  onUpdate: (session: GameSession) => void;
  onPresence: (memberId: string, online: boolean) => void;
  /** O anfitrião criou a revanche: é hora de ir para a partida nova. */
  onRematch: (newSessionId: string) => void;
  /** A pessoa perdeu o acesso à partida (saiu ou foi removida do grupo). */
  onRevoked: () => void;
  onStatus: (status: LiveStatus) => void;
}

/**
 * O tempo real (SignalR) do ponto de vista das telas: avisa e entrega a visão, e só isso. Agir continua sendo pelo REST.
 * Existe como interface para os testes trocarem a conexão por uma de mentira.
 */
export interface LiveHub {
  watchSession(sessionId: string, listener: SessionListener): () => void;
  /** Avisa que a lista de partidas do grupo mudou (para recarregar `GET /groups/{id}/sessions`). */
  watchGroup(groupId: string, onChanged: () => void): () => void;
  /** O app voltou ao primeiro plano: reconecta se preciso e assina tudo de novo. */
  resume(): Promise<void>;
  /** Fecha a conexão (ao sair da conta). */
  stop(): Promise<void>;
}

/** O que o hub precisa de uma conexão SignalR (facilita o teste com uma de mentira). */
export type HubConnectionLike = Pick<
  HubConnection,
  'on' | 'invoke' | 'start' | 'stop' | 'onclose' | 'onreconnecting' | 'onreconnected' | 'state'
>;

export interface SignalRHubOptions {
  /** URL do hub (`{API}/hubs/sessions`). */
  url: string;
  /** Um token de acesso válido (renovado se preciso); chamado a cada (re)conexão. */
  accessToken: () => Promise<string | null>;
  /** Para os testes. */
  createConnection?: (url: string, accessToken: () => Promise<string>) => HubConnectionLike;
  /** Quanto esperar sem ninguém assistindo antes de fechar a conexão. */
  idleCloseMs?: number;
  /** Intervalos (ms) das novas tentativas quando a conexão cai de vez. */
  retryDelaysMs?: readonly number[];
}

interface Snapshot {
  session: GameSession;
  onlineMemberIds: string[];
}

function defaultConnection(url: string, accessToken: () => Promise<string>): HubConnectionLike {
  return new HubConnectionBuilder()
    .withUrl(url, { accessTokenFactory: accessToken, withCredentials: false })
    .withAutomaticReconnect([0, 1000, 3000, 5000, 10000])
    .configureLogging(LogLevel.Warning)
    .build();
}

function isAccessError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : '';
  return message.includes('session.not_found') || message.includes('group.not_found');
}

/**
 * Uma única conexão SignalR para o app inteiro, compartilhada por quem assiste a partidas e grupos. Assina de novo tudo o que
 * está sendo assistido sempre que a conexão volta (o `Subscribe` devolve o estado completo, então não há mensagem perdida a
 * repor) e fecha a conexão depois de um tempo sem ninguém assistindo.
 */
export class SignalRHub implements LiveHub {
  private connection: HubConnectionLike | null = null;
  private starting: Promise<void> | null = null;
  private status: LiveStatus = 'idle';
  private readonly sessions = new Map<string, Set<SessionListener>>();
  private readonly groups = new Map<string, Set<() => void>>();
  private idleTimer: ReturnType<typeof setTimeout> | undefined;
  private retryTimer: ReturnType<typeof setTimeout> | undefined;
  private retryAttempt = 0;

  constructor(private readonly options: SignalRHubOptions) {}

  watchSession(sessionId: string, listener: SessionListener): () => void {
    this.cancelIdleClose();
    const listeners = this.sessions.get(sessionId) ?? new Set<SessionListener>();
    this.sessions.set(sessionId, listeners);
    listeners.add(listener);
    listener.onStatus(this.status);

    if (this.connected) {
      void this.subscribeSession(sessionId, listener);
    } else {
      void this.ensureStarted(); // ao conectar, tudo o que está sendo assistido é assinado
    }

    return () => {
      const current = this.sessions.get(sessionId);
      current?.delete(listener);
      if (current?.size === 0) {
        this.sessions.delete(sessionId);
        void this.invokeQuietly('Unsubscribe', sessionId);
      }

      this.scheduleIdleClose();
    };
  }

  watchGroup(groupId: string, onChanged: () => void): () => void {
    this.cancelIdleClose();
    const callbacks = this.groups.get(groupId) ?? new Set<() => void>();
    this.groups.set(groupId, callbacks);
    callbacks.add(onChanged);

    if (this.connected) {
      void this.invokeQuietly('SubscribeGroup', groupId);
    } else {
      void this.ensureStarted();
    }

    return () => {
      const current = this.groups.get(groupId);
      current?.delete(onChanged);
      if (current?.size === 0) {
        this.groups.delete(groupId);
        void this.invokeQuietly('UnsubscribeGroup', groupId);
      }

      this.scheduleIdleClose();
    };
  }

  async resume(): Promise<void> {
    if (this.sessions.size === 0 && this.groups.size === 0) {
      return;
    }

    if (this.connected) {
      await this.resubscribeAll();
    } else {
      await this.ensureStarted();
    }
  }

  async stop(): Promise<void> {
    this.cancelIdleClose();
    clearTimeout(this.retryTimer);
    const connection = this.connection;
    this.connection = null;
    this.starting = null;
    this.retryAttempt = 0;
    this.setStatus('idle');
    await connection?.stop().catch(() => undefined);
  }

  // --- conexão ---

  private get connected(): boolean {
    return this.connection?.state === HubConnectionState.Connected;
  }

  private ensureStarted(): Promise<void> {
    if (this.connected) {
      return Promise.resolve();
    }

    if (this.starting) {
      return this.starting;
    }

    const state = this.connection?.state;
    if (state === HubConnectionState.Connecting || state === HubConnectionState.Reconnecting) {
      return Promise.resolve(); // a própria conexão se resolve (onreconnected assina tudo de novo)
    }

    const connection = this.connection ?? this.buildConnection();
    this.connection = connection;
    this.setStatus(this.retryAttempt > 0 ? 'reconnecting' : 'connecting');

    const starting: Promise<void> = connection
      .start()
      .then(async () => {
        this.retryAttempt = 0;
        this.setStatus('live');
        await this.resubscribeAll();
      })
      .catch(() => {
        if (this.connection === connection) {
          this.setStatus('offline');
          this.scheduleRetry();
        }
      })
      .finally(() => {
        if (this.starting === starting) {
          this.starting = null;
        }
      });

    this.starting = starting;
    return starting;
  }

  private buildConnection(): HubConnectionLike {
    const create = this.options.createConnection ?? defaultConnection;
    const connection = create(this.options.url, async () => (await this.options.accessToken()) ?? '');

    connection.on('SessionUpdated', (session: GameSession) => {
      this.sessions.get(session.id)?.forEach((listener) => listener.onUpdate(session));
    });
    connection.on('PresenceChanged', (message: { sessionId: string; memberId: string; online: boolean }) => {
      this.sessions
        .get(message.sessionId)
        ?.forEach((listener) => listener.onPresence(message.memberId, message.online));
    });
    connection.on('RematchCreated', (message: { sessionId: string; newSessionId: string }) => {
      this.sessions.get(message.sessionId)?.forEach((listener) => listener.onRematch(message.newSessionId));
    });
    connection.on('AccessRevoked', (message: { sessionId: string }) => {
      this.sessions.get(message.sessionId)?.forEach((listener) => listener.onRevoked());
    });
    connection.on('GroupSessionsChanged', (message: { groupId: string }) => {
      this.groups.get(message.groupId)?.forEach((callback) => callback());
    });

    connection.onreconnecting(() => this.setStatus('reconnecting'));
    connection.onreconnected(() => {
      this.setStatus('live');
      void this.resubscribeAll();
    });
    connection.onclose(() => {
      // O servidor encerra a conexão quando o token vence, e a reconexão automática desiste depois de algumas tentativas.
      if (this.connection === connection) {
        this.connection = null;
        this.starting = null;
        this.setStatus('offline');
        this.scheduleRetry();
      }
    });

    return connection;
  }

  private scheduleRetry(): void {
    if (this.sessions.size === 0 && this.groups.size === 0) {
      return;
    }

    clearTimeout(this.retryTimer);
    const delays = this.options.retryDelaysMs ?? [2000, 5000, 10000, 20000];
    const delay = delays[Math.min(this.retryAttempt, delays.length - 1)] ?? 10000;
    this.retryAttempt += 1;
    this.retryTimer = setTimeout(() => void this.ensureStarted(), delay);
  }

  // --- assinaturas ---

  private async resubscribeAll(): Promise<void> {
    await Promise.all([
      ...[...this.sessions.keys()].map((id) => this.subscribeSession(id)),
      ...[...this.groups.keys()].map((id) => this.invokeQuietly('SubscribeGroup', id)),
    ]);
  }

  /** Assina (é idempotente) e entrega o estado completo a `only`, ou a todos que assistem a esta partida. */
  private async subscribeSession(sessionId: string, only?: SessionListener): Promise<void> {
    const connection = this.connection;
    if (!connection) {
      return;
    }

    try {
      const snapshot = await connection.invoke<Snapshot>('Subscribe', sessionId);
      const targets = only ? [only] : [...(this.sessions.get(sessionId) ?? [])];
      targets.forEach((listener) => listener.onSnapshot(snapshot.session, snapshot.onlineMemberIds));
    } catch (error) {
      if (isAccessError(error)) {
        this.sessions.get(sessionId)?.forEach((listener) => listener.onRevoked());
      }
    }
  }

  private async invokeQuietly(method: string, ...args: unknown[]): Promise<void> {
    if (!this.connected || !this.connection) {
      return;
    }

    try {
      await this.connection.invoke(method, ...args);
    } catch {
      // assinar/cancelar é "melhor esforço": na próxima reconexão tudo é assinado de novo
    }
  }

  // --- ciclo de vida ---

  private setStatus(status: LiveStatus): void {
    if (this.status === status) {
      return;
    }

    this.status = status;
    this.sessions.forEach((listeners) => listeners.forEach((listener) => listener.onStatus(status)));
  }

  private scheduleIdleClose(): void {
    if (this.sessions.size > 0 || this.groups.size > 0) {
      return;
    }

    this.cancelIdleClose();
    this.idleTimer = setTimeout(() => void this.stop(), this.options.idleCloseMs ?? 30_000);
  }

  private cancelIdleClose(): void {
    clearTimeout(this.idleTimer);
    this.idleTimer = undefined;
  }
}
