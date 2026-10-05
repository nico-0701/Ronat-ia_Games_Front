import type { LiveHub, SessionListener, SignalRHubOptions } from './hub';

/**
 * O mesmo `LiveHub`, mas só carrega o SignalR (uns 60 KB) quando alguém abre uma partida ou a lista de partidas de um grupo:
 * quem só entra, vê o início ou o perfil não baixa o cliente de tempo real.
 */
export class LazyHub implements LiveHub {
  private implementation: Promise<LiveHub> | null = null;

  constructor(private readonly options: SignalRHubOptions) {}

  private load(): Promise<LiveHub> {
    this.implementation ??= import('./hub').then((module) => new module.SignalRHub(this.options));
    return this.implementation;
  }

  watchSession(sessionId: string, listener: SessionListener): () => void {
    return this.watch((hub) => hub.watchSession(sessionId, listener));
  }

  watchGroup(groupId: string, onChanged: () => void): () => void {
    return this.watch((hub) => hub.watchGroup(groupId, onChanged));
  }

  async resume(): Promise<void> {
    if (this.implementation) {
      await (await this.implementation).resume();
    }
  }

  async stop(): Promise<void> {
    if (this.implementation) {
      await (await this.implementation).stop();
    }
  }

  /** Assiste quando o módulo carregar; cancelar antes disso desfaz o pedido. */
  private watch(start: (hub: LiveHub) => () => void): () => void {
    let stop: (() => void) | undefined;
    let cancelled = false;

    void this.load().then((hub) => {
      if (!cancelled) {
        stop = start(hub);
      }
    });

    return () => {
      cancelled = true;
      stop?.();
    };
  }
}
