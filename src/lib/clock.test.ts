import { describe, expect, it } from 'vitest';
import { ServerClock } from './clock';

describe('ServerClock', () => {
  it('começa alinhado ao relógio do aparelho', () => {
    const clock = new ServerClock(() => 1_000);
    expect(clock.now()).toBe(1_000);
    expect(clock.offset).toBe(0);
  });

  it('corrige a diferença pelo meio da viagem (latência simétrica)', () => {
    let local = 0;
    const clock = new ServerClock(() => local);
    // O aparelho está 5 s ATRASADO: o servidor carimbou 10:00:05 no instante em que o aparelho marcava 10:00:00 (+/- 200 ms de ida e volta).
    const base = Date.parse('2026-10-05T10:00:00Z');
    clock.calibrate('2026-10-05T10:00:05Z', base - 100, base + 100);
    local = base;
    expect(clock.now()).toBe(base + 5_000);
    expect(clock.offset).toBe(5_000);
  });

  it('ignora respostas inválidas', () => {
    const clock = new ServerClock(() => 0);
    clock.calibrate('não é data', 0, 10);
    clock.calibrate('2026-10-05T10:00:00Z', 20, 10);
    expect(clock.offset).toBe(0);
  });

  it('calcula quanto falta para um prazo, sem passar de zero', () => {
    const now = Date.parse('2026-10-05T10:00:00Z');
    const clock = new ServerClock(() => now);
    expect(clock.msUntil('2026-10-05T10:00:30Z')).toBe(30_000);
    expect(clock.msUntil('2026-10-05T09:59:00Z')).toBe(0);
    expect(clock.msUntil(null)).toBe(0);
    expect(clock.msUntil('lixo')).toBe(0);
  });
});
