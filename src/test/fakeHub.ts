import type { GameSession } from '@/api/types';
import type { LiveHub, LiveStatus, SessionListener } from '@/features/sessions/live/hub';

/** O tempo real de mentira: guarda quem está assistindo e deixa o teste empurrar mensagens do servidor. */
export class FakeHub implements LiveHub {
  status: LiveStatus = 'live';
  readonly watchedSessions: string[] = [];
  readonly watchedGroups: string[] = [];
  private readonly sessions = new Map<string, Set<SessionListener>>();
  private readonly groups = new Map<string, Set<() => void>>();
  /** O que `Subscribe` entregaria ao começar a assistir (opcional). */
  readonly snapshots = new Map<string, { session: GameSession; online: string[] }>();

  watchSession(sessionId: string, listener: SessionListener): () => void {
    this.watchedSessions.push(sessionId);
    const listeners = this.sessions.get(sessionId) ?? new Set<SessionListener>();
    this.sessions.set(sessionId, listeners);
    listeners.add(listener);
    listener.onStatus(this.status);
    const snapshot = this.snapshots.get(sessionId);
    if (snapshot) {
      listener.onSnapshot(snapshot.session, snapshot.online);
    }

    return () => {
      listeners.delete(listener);
    };
  }

  watchGroup(groupId: string, onChanged: () => void): () => void {
    this.watchedGroups.push(groupId);
    const callbacks = this.groups.get(groupId) ?? new Set<() => void>();
    this.groups.set(groupId, callbacks);
    callbacks.add(onChanged);
    return () => {
      callbacks.delete(onChanged);
    };
  }

  resume(): Promise<void> {
    return Promise.resolve();
  }

  stop(): Promise<void> {
    return Promise.resolve();
  }

  // --- o servidor empurrando mensagens ---

  update(session: GameSession): void {
    this.sessions.get(session.id)?.forEach((listener) => listener.onUpdate(session));
  }

  presence(sessionId: string, memberId: string, online: boolean): void {
    this.sessions.get(sessionId)?.forEach((listener) => listener.onPresence(memberId, online));
  }

  rematch(sessionId: string, newSessionId: string): void {
    this.sessions.get(sessionId)?.forEach((listener) => listener.onRematch(newSessionId));
  }

  revoke(sessionId: string): void {
    this.sessions.get(sessionId)?.forEach((listener) => listener.onRevoked());
  }

  groupChanged(groupId: string): void {
    this.groups.get(groupId)?.forEach((callback) => callback());
  }

  setStatus(status: LiveStatus): void {
    this.status = status;
    this.sessions.forEach((listeners) => listeners.forEach((listener) => listener.onStatus(status)));
  }
}
