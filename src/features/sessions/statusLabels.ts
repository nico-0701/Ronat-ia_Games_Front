import type { SessionStatus } from '@/api/types';

const LABELS: Record<SessionStatus, string> = {
  waiting: 'No lobby',
  inProgress: 'Em andamento',
  finished: 'Terminada',
  cancelled: 'Cancelada',
};

export function statusLabel(status: SessionStatus): string {
  return LABELS[status];
}

/** Partida que ainda dá para entrar ou acompanhar. */
export function isOpen(status: SessionStatus): boolean {
  return status === 'waiting' || status === 'inProgress';
}
