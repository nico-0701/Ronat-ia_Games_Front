import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useServices } from '@/app/servicesContext';
import { sessionKeys } from './queries';

/** O relógio do servidor, atualizado a cada `intervalMs` (ms desde 1970). */
export function useServerNow(intervalMs = 200): number {
  const { clock } = useServices();
  const [now, setNow] = useState(() => clock.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(clock.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [clock, intervalMs]);

  return now;
}

/** Quantos ms faltam para um prazo em UTC (sempre pelo relógio do servidor, nunca negativo). */
export function useCountdown(deadline: string | null | undefined, intervalMs = 200): number {
  const now = useServerNow(intervalMs);
  const target = deadline ? Date.parse(deadline) : Number.NaN;
  return Number.isFinite(target) ? Math.max(0, target - now) : 0;
}

/** Segundos inteiros para mostrar no cronômetro (arredonda para cima: 0 só quando acabou). */
export function secondsLeft(ms: number): number {
  return Math.ceil(ms / 1000);
}

/**
 * Pede o estado de novo logo depois de cada prazo: algumas fases mudam só com o relógio (o preparo vira "valendo", a chance de
 * roubo acaba) sem que o servidor grave nada nem avise, e `allowedActions` precisa acompanhar. Prazos que já passaram são ignorados.
 */
export function useRefetchAfter(
  sessionId: string,
  deadlines: readonly (string | null | undefined)[],
  marginMs = 300,
) {
  const { clock } = useServices();
  const queryClient = useQueryClient();
  const key = deadlines.filter(Boolean).join('|');

  useEffect(() => {
    const timers = key
      .split('|')
      .filter(Boolean)
      .map((deadline) => ({ deadline, wait: clock.msUntil(deadline) }))
      .filter(({ wait }) => wait > 0)
      .map(({ wait }) =>
        window.setTimeout(
          () => void queryClient.invalidateQueries({ queryKey: sessionKeys.detail(sessionId), exact: true }),
          wait + marginMs,
        ),
      );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [key, clock, queryClient, sessionId, marginMs]);
}
