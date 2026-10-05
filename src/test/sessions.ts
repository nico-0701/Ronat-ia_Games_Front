import type { Game, GameSession, SessionPlayer } from '@/api/types';
import { GROUP_ID, ME_ID, uuid } from './fixtures';

export const SESSION_ID = '33333333-3333-4333-8333-333333333333';
export const MY_MEMBER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const BETO_MEMBER_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

export function playerFixture(overrides: Partial<SessionPlayer> = {}): SessionPlayer {
  const memberId = overrides.memberId ?? uuid();
  return {
    id: uuid(),
    memberId,
    displayName: 'Beto',
    avatar: { kind: 'preset', preset: 'preset-2', url: null },
    hasAccount: true,
    isMe: false,
    score: 0,
    seat: 0,
    team: null,
    ...overrides,
  };
}

/** Uma partida da Mímica no lobby, vista por "Ana" (anfitriã, jogadora 0). */
export function sessionFixture(overrides: Partial<GameSession> = {}): GameSession {
  const ana = playerFixture({
    id: 'p-ana',
    memberId: MY_MEMBER_ID,
    displayName: 'Ana',
    isMe: true,
    seat: 0,
    team: 0,
  });
  const beto = playerFixture({
    id: 'p-beto',
    memberId: BETO_MEMBER_ID,
    displayName: 'Beto',
    seat: 1,
    team: 1,
  });
  return {
    id: SESSION_ID,
    groupId: GROUP_ID,
    gameId: 'mimica',
    rulesVersion: 1,
    status: 'waiting',
    hostMemberId: MY_MEMBER_ID,
    myMemberId: MY_MEMBER_ID,
    myPlayerId: ana.id,
    canManage: true,
    version: 1,
    config: {
      rounds: 10,
      turnSeconds: 60,
      categories: ['expressoes', 'famosos', 'cotidiano'],
      lateGraceSeconds: 3,
    },
    players: [ana, beto],
    teamScores: [],
    standings: [],
    allowedActions: [],
    view: null,
    deadlineAt: null,
    createdAt: '2026-10-05T12:00:00Z',
    startedAt: null,
    finishedAt: null,
    ...overrides,
  };
}

export function gameFixture(overrides: Partial<Game> = {}): Game {
  return {
    id: 'mimica',
    name: 'Mímica',
    description: 'Dois times, uma carta e muita mímica.',
    minPlayers: 2,
    maxPlayers: 24,
    minPlayersPerTeam: 1,
    teamCount: 2,
    rulesVersion: 1,
    configDefaults: {
      rounds: 10,
      turnSeconds: 60,
      categories: ['expressoes', 'famosos', 'cotidiano'],
      lateGraceSeconds: 3,
    },
    ...overrides,
  };
}

export { ME_ID };

/** A `view` pública da Mímica (`docs/games/MIMICA.md` do Back); o teste muda só o que importa. */
export function mimicaView(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    phase: 'turnIntro',
    round: 1,
    totalRounds: 10,
    turn: 0,
    totalTurns: 20,
    team: 0,
    performerPlayerId: 'p-ana',
    turnSeconds: 60,
    prepSeconds: 3,
    stealSeconds: 30,
    prepEndsAt: null,
    playEndsAt: null,
    stealEndsAt: null,
    scores: { '0': 0, '1': 0 },
    card: null,
    lastTurn: null,
    ...overrides,
  };
}

export const CARD = {
  categoryId: 'famosos',
  kicker: 'Famoso ou personagem:',
  text: 'Pelé',
  promptId: 'fam-001',
};
