/**
 * O que o servidor manda da Mímica dentro de `session.view` e `session.config` (ver `docs/games/MIMICA.md` do Back). Esses
 * campos chegam como JSON solto no contrato OpenAPI, então são lidos aqui com validação: o que não bate vira `null`.
 */

export type MimicaPhase = 'turnIntro' | 'prep' | 'playing' | 'steal' | 'finished';
export type MimicaOutcome = 'hit' | 'stealHit' | 'stealMiss' | 'skipped';

export interface MimicaCard {
  categoryId: string;
  /** O rótulo do tema, ex.: "Famoso ou personagem:". */
  kicker: string;
  text: string;
  promptId: string;
}

export interface MimicaLastTurn {
  turn: number;
  team: number;
  performerPlayerId: string | null;
  outcome: MimicaOutcome;
  /** A carta revelada ("A mímica era..."). */
  card: MimicaCard | null;
}

export interface MimicaView {
  phase: MimicaPhase;
  round: number;
  totalRounds: number;
  turn: number;
  totalTurns: number;
  /** O time da vez (0 ou 1); `null` ao terminar. */
  team: number | null;
  performerPlayerId: string | null;
  turnSeconds: number;
  prepSeconds: number;
  stealSeconds: number;
  prepEndsAt: string | null;
  playEndsAt: string | null;
  stealEndsAt: string | null;
  /** Pontos por time. */
  scores: Record<string, number>;
  /** A carta: só o mímico a vê (e o anfitrião, quando o mímico é um perfil sem conta). */
  card: MimicaCard | null;
  lastTurn: MimicaLastTurn | null;
}

const PHASES: readonly MimicaPhase[] = ['turnIntro', 'prep', 'playing', 'steal', 'finished'];
const OUTCOMES: readonly MimicaOutcome[] = ['hit', 'stealHit', 'stealMiss', 'skipped'];

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function text(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function int(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function parseCard(value: unknown): MimicaCard | null {
  const raw = record(value);
  const cardText = text(raw?.text);
  if (!raw || cardText === null) {
    return null;
  }

  return {
    categoryId: text(raw.categoryId) ?? '',
    kicker: text(raw.kicker) ?? '',
    text: cardText,
    promptId: text(raw.promptId) ?? '',
  };
}

function parseLastTurn(value: unknown): MimicaLastTurn | null {
  const raw = record(value);
  const outcome = OUTCOMES.find((candidate) => candidate === raw?.outcome);
  if (!raw || !outcome) {
    return null;
  }

  return {
    turn: int(raw.turn, 0),
    team: int(raw.team, 0),
    performerPlayerId: text(raw.performerPlayerId),
    outcome,
    card: parseCard(raw.card),
  };
}

export function parseMimicaView(value: unknown): MimicaView | null {
  const raw = record(value);
  const phase = PHASES.find((candidate) => candidate === raw?.phase);
  if (!raw || !phase) {
    return null;
  }

  const scores: Record<string, number> = {};
  for (const [team, points] of Object.entries(record(raw.scores) ?? {})) {
    scores[team] = int(points, 0);
  }

  return {
    phase,
    round: int(raw.round, 1),
    totalRounds: int(raw.totalRounds, 1),
    turn: int(raw.turn, 0),
    totalTurns: int(raw.totalTurns, 0),
    team: typeof raw.team === 'number' ? raw.team : null,
    performerPlayerId: text(raw.performerPlayerId),
    turnSeconds: int(raw.turnSeconds, 60),
    prepSeconds: int(raw.prepSeconds, 3),
    stealSeconds: int(raw.stealSeconds, 30),
    prepEndsAt: text(raw.prepEndsAt),
    playEndsAt: text(raw.playEndsAt),
    stealEndsAt: text(raw.stealEndsAt),
    scores,
    card: parseCard(raw.card),
    lastTurn: parseLastTurn(raw.lastTurn),
  };
}

export interface MimicaConfig {
  rounds: number;
  turnSeconds: number;
  categories: string[];
  lateGraceSeconds: number;
}

export const MIMICA_CATEGORIES: readonly { id: string; label: string }[] = [
  { id: 'expressoes', label: 'Expressões populares' },
  { id: 'famosos', label: 'Famosos e personagens' },
  { id: 'cotidiano', label: 'Dia a dia' },
];

export const ROUND_OPTIONS = [5, 10, 20, 30] as const;
export const TURN_SECONDS_OPTIONS = [30, 60, 90, 120] as const;

export const DEFAULT_MIMICA_CONFIG: MimicaConfig = {
  rounds: 10,
  turnSeconds: 60,
  categories: MIMICA_CATEGORIES.map((category) => category.id),
  lateGraceSeconds: 3,
};

/** A configuração normalizada que o servidor devolve em `session.config`; o que faltar assume o padrão. */
export function parseMimicaConfig(value: unknown): MimicaConfig {
  const raw = record(value);
  const categories = Array.isArray(raw?.categories)
    ? raw.categories.filter((category): category is string => typeof category === 'string')
    : [];

  return {
    rounds: int(raw?.rounds, DEFAULT_MIMICA_CONFIG.rounds),
    turnSeconds: int(raw?.turnSeconds, DEFAULT_MIMICA_CONFIG.turnSeconds),
    categories: categories.length > 0 ? categories : DEFAULT_MIMICA_CONFIG.categories,
    lateGraceSeconds: int(raw?.lateGraceSeconds, DEFAULT_MIMICA_CONFIG.lateGraceSeconds),
  };
}

export function categoryLabel(id: string): string {
  return MIMICA_CATEGORIES.find((category) => category.id === id)?.label ?? id;
}

/** Os pontos de um time (0 se ainda não pontuou). */
export function scoreOf(view: MimicaView, team: number): number {
  return view.scores[String(team)] ?? 0;
}

export function teamName(team: number): string {
  return `Time ${team + 1}`;
}

const OUTCOME_TEXT: Record<MimicaOutcome, string> = {
  hit: 'Acertaram!',
  stealHit: 'O outro time roubou o ponto!',
  stealMiss: 'Ninguém acertou.',
  skipped: 'A vez foi pulada.',
};

export function outcomeText(outcome: MimicaOutcome): string {
  return OUTCOME_TEXT[outcome];
}
