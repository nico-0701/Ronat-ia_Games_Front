import { describe, expect, it } from 'vitest';
import { DEFAULT_MIMICA_CONFIG, outcomeText, parseMimicaConfig, parseMimicaView, scoreOf } from './model';

const VIEW = {
  phase: 'playing',
  round: 3,
  totalRounds: 10,
  turn: 4,
  totalTurns: 20,
  team: 0,
  performerPlayerId: 'p-ana',
  turnSeconds: 60,
  prepSeconds: 3,
  stealSeconds: 30,
  prepEndsAt: null,
  playEndsAt: '2026-10-05T20:15:30Z',
  stealEndsAt: null,
  scores: { '0': 3, '1': 2 },
  card: { categoryId: 'famosos', kicker: 'Famoso ou personagem:', text: 'Pelé', promptId: 'fam-001' },
  lastTurn: {
    turn: 3,
    team: 1,
    performerPlayerId: 'p-beto',
    outcome: 'stealHit',
    card: { categoryId: 'cotidiano', kicker: 'Dia a dia:', text: 'Escovar os dentes', promptId: 'cot-001' },
  },
};

describe('parseMimicaView', () => {
  it('lê a visão completa que o servidor manda', () => {
    const view = parseMimicaView(VIEW)!;

    expect(view.phase).toBe('playing');
    expect(view.round).toBe(3);
    expect(view.totalRounds).toBe(10);
    expect(view.team).toBe(0);
    expect(view.performerPlayerId).toBe('p-ana');
    expect(view.playEndsAt).toBe('2026-10-05T20:15:30Z');
    expect(view.card).toEqual({
      categoryId: 'famosos',
      kicker: 'Famoso ou personagem:',
      text: 'Pelé',
      promptId: 'fam-001',
    });
    expect(view.lastTurn).toMatchObject({
      outcome: 'stealHit',
      team: 1,
      card: { text: 'Escovar os dentes' },
    });
    expect(scoreOf(view, 0)).toBe(3);
    expect(scoreOf(view, 1)).toBe(2);
  });

  it('quem não é o mímico não recebe a carta', () => {
    expect(parseMimicaView({ ...VIEW, card: null })!.card).toBeNull();
  });

  it('devolve null para o que não é uma visão da Mímica', () => {
    expect(parseMimicaView(null)).toBeNull();
    expect(parseMimicaView('texto')).toBeNull();
    expect(parseMimicaView([])).toBeNull();
    expect(parseMimicaView({ phase: 'fase-que-nao-existe' })).toBeNull();
  });

  it('é tolerante com campos que faltam', () => {
    const view = parseMimicaView({ phase: 'turnIntro' })!;

    expect(view.team).toBeNull();
    expect(view.card).toBeNull();
    expect(view.lastTurn).toBeNull();
    expect(view.prepSeconds).toBe(3);
    expect(scoreOf(view, 1)).toBe(0);
  });

  it('ignora um lastTurn com desfecho desconhecido', () => {
    expect(
      parseMimicaView({ ...VIEW, lastTurn: { ...VIEW.lastTurn, outcome: 'novo' } })!.lastTurn,
    ).toBeNull();
  });
});

describe('parseMimicaConfig', () => {
  it('lê a configuração normalizada', () => {
    expect(
      parseMimicaConfig({ rounds: 20, turnSeconds: 30, categories: ['famosos'], lateGraceSeconds: 5 }),
    ).toEqual({
      rounds: 20,
      turnSeconds: 30,
      categories: ['famosos'],
      lateGraceSeconds: 5,
    });
  });

  it('assume o padrão no que faltar', () => {
    expect(parseMimicaConfig(null)).toEqual(DEFAULT_MIMICA_CONFIG);
    expect(parseMimicaConfig({ rounds: 5, categories: [] })).toEqual({ ...DEFAULT_MIMICA_CONFIG, rounds: 5 });
  });
});

describe('textos', () => {
  it('descreve cada desfecho', () => {
    expect(outcomeText('hit')).toBe('Acertaram!');
    expect(outcomeText('skipped')).toBe('A vez foi pulada.');
  });
});
