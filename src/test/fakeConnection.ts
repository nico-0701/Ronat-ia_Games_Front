import { HubConnectionState } from '@microsoft/signalr';
import type { GameSession } from '@/api/types';
import type { HubConnectionLike } from '@/features/sessions/live/hub';

type Handler = (...args: never[]) => void;

/** Uma conexão SignalR de mentira, controlada pelo teste: registra chamadas e dispara mensagens do servidor. */
export class FakeConnection implements HubConnectionLike {
  state: HubConnectionState = HubConnectionState.Disconnected;
  startCalls = 0;
  stopCalls = 0;
  /** Quantas das próximas chamadas a `start()` devem falhar. */
  failStarts = 0;
  readonly invocations: { method: string; args: unknown[] }[] = [];
  /** O que `Subscribe(sessionId)` devolve. */
  readonly snapshots = new Map<string, { session: GameSession; onlineMemberIds: string[] }>();
  /** Erros a devolver em `Subscribe(sessionId)`. */
  readonly subscribeErrors = new Map<string, Error>();

  private readonly handlers = new Map<string, Handler[]>();
  private readonly closeHandlers: Handler[] = [];
  private readonly reconnectingHandlers: Handler[] = [];
  private readonly reconnectedHandlers: Handler[] = [];

  on(methodName: string, handler: (...args: never[]) => void): void {
    this.handlers.set(methodName, [...(this.handlers.get(methodName) ?? []), handler]);
  }

  onclose(handler: (error?: Error) => void): void {
    this.closeHandlers.push(handler as Handler);
  }

  onreconnecting(handler: (error?: Error) => void): void {
    this.reconnectingHandlers.push(handler as Handler);
  }

  onreconnected(handler: (connectionId?: string) => void): void {
    this.reconnectedHandlers.push(handler as Handler);
  }

  start(): Promise<void> {
    this.startCalls += 1;
    if (this.failStarts > 0) {
      this.failStarts -= 1;
      return Promise.reject(new Error('sem rede'));
    }

    // Como o SignalR de verdade: conectando até o aperto de mão terminar.
    this.state = HubConnectionState.Connecting;
    return Promise.resolve().then(() => {
      this.state = HubConnectionState.Connected;
    });
  }

  stop(): Promise<void> {
    this.stopCalls += 1;
    this.state = HubConnectionState.Disconnected;
    return Promise.resolve();
  }

  invoke<T = unknown>(methodName: string, ...args: unknown[]): Promise<T> {
    this.invocations.push({ method: methodName, args });
    if (methodName === 'Subscribe') {
      const sessionId = String(args[0]);
      const error = this.subscribeErrors.get(sessionId);
      if (error) {
        return Promise.reject(error);
      }

      return Promise.resolve(this.snapshots.get(sessionId) as T);
    }

    return Promise.resolve(undefined as T);
  }

  calls(method: string): unknown[][] {
    return this.invocations.filter((call) => call.method === method).map((call) => call.args);
  }

  // --- o servidor fazendo coisas ---

  emit(methodName: string, payload: unknown): void {
    (this.handlers.get(methodName) ?? []).forEach((handler) =>
      (handler as (payload: unknown) => void)(payload),
    );
  }

  /** A conexão caiu e o cliente está tentando voltar sozinho. */
  startReconnecting(): void {
    this.state = HubConnectionState.Reconnecting;
    this.reconnectingHandlers.forEach((handler) => (handler as () => void)());
  }

  finishReconnecting(): void {
    this.state = HubConnectionState.Connected;
    this.reconnectedHandlers.forEach((handler) => (handler as () => void)());
  }

  /** A conexão acabou de vez (o servidor fechou ao vencer o token, ou as tentativas acabaram). */
  closeForGood(): void {
    this.state = HubConnectionState.Disconnected;
    this.closeHandlers.forEach((handler) => (handler as () => void)());
  }
}
