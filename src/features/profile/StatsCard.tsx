import { useGames } from '@/features/sessions/queries';
import { useMyStats } from '@/features/ranking/queries';
import { Card, Hint } from '@/ui/Card';
import styles from './StatsCard.module.css';

/** As estatísticas da própria pessoa, somando todos os grupos. */
export function StatsCard() {
  const stats = useMyStats();
  const games = useGames();

  if (stats.isPending) {
    return null;
  }

  if (stats.isError) {
    return (
      <Card>
        <h2>Minhas estatísticas</h2>
        <Hint>Não foi possível carregar agora.</Hint>
      </Card>
    );
  }

  const { played, wins, groups, byGame } = stats.data;
  const nameOf = (id: string) => games.data?.find((game) => game.id === id)?.name ?? id;

  return (
    <Card>
      <h2>Minhas estatísticas</h2>
      <dl className={styles.tiles}>
        <div className={styles.tile}>
          <dt>Partidas</dt>
          <dd>{played}</dd>
        </div>
        <div className={styles.tile}>
          <dt>Vitórias</dt>
          <dd>{wins}</dd>
        </div>
        <div className={styles.tile}>
          <dt>Grupos</dt>
          <dd>{groups}</dd>
        </div>
      </dl>
      {byGame.length > 0 ? (
        <ul className={styles.games} aria-label="Por jogo">
          {byGame.map((game) => (
            <li key={game.gameId}>
              <strong>{nameOf(game.gameId)}:</strong> {game.played}{' '}
              {game.played === 1 ? 'partida' : 'partidas'} · {game.wins}{' '}
              {game.wins === 1 ? 'vitória' : 'vitórias'} · {game.score} pontos
            </li>
          ))}
        </ul>
      ) : (
        <Hint>Jogue uma partida para ver os números aparecerem aqui.</Hint>
      )}
    </Card>
  );
}
