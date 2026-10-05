import type { Game, GameSession } from '@/api/types';

function jogadores(count: number): string {
  return count === 1 ? '1 jogador' : `${count} jogadores`;
}

/**
 * O que falta para a partida poder começar, em uma frase, ou `null` se está pronta. Espelha as conferências do servidor
 * (`session.not_enough_players`, `session.teams_incomplete`), só para avisar antes de tocar no botão.
 */
export function readiness(session: GameSession, game: Game | undefined): string | null {
  if (!game) {
    return null;
  }

  const count = session.players.length;
  if (count < game.minPlayers) {
    const missing = game.minPlayers - count;
    return `Faltam ${jogadores(missing)} para começar (mínimo ${game.minPlayers}).`;
  }

  if (game.teamCount > 0) {
    const unassigned = session.players.filter((player) => player.team === null).length;
    if (unassigned > 0) {
      return `Escolha o time de ${jogadores(unassigned)}.`;
    }

    for (let team = 0; team < game.teamCount; team++) {
      const members = session.players.filter((player) => player.team === team).length;
      if (members < game.minPlayersPerTeam) {
        return `O Time ${team + 1} precisa de pelo menos ${jogadores(game.minPlayersPerTeam)} (tem ${members}).`;
      }
    }
  }

  return null;
}
