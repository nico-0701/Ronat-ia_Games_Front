import type { GameSession } from '@/api/types';

/** O texto de cima do resultado: quem venceu, ou o empate (em empate todo mundo vence, como no app original). */
export function headline(session: GameSession, teamGame: boolean): string {
  const winners = session.standings.filter((standing) => standing.isWinner);
  if (winners.length === 0) {
    return 'Partida encerrada';
  }

  if (winners.length === session.standings.length && session.standings.length > 1) {
    return 'Empate! Todo mundo venceu.';
  }

  if (teamGame) {
    const teams = [
      ...new Set(winners.map((winner) => winner.team).filter((team): team is number => team !== null)),
    ];
    return teams.length === 1 ? `O Time ${teams[0]! + 1} venceu!` : 'Fim de jogo!';
  }

  return winners.length === 1
    ? `${winners[0]!.displayName} venceu!`
    : `${winners.map((winner) => winner.displayName).join(' e ')} venceram!`;
}
