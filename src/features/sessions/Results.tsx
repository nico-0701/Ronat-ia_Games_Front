import { useNavigate } from 'react-router';
import type { Game, GameSession, SessionPlayer } from '@/api/types';
import { Avatar } from '@/ui/Avatar';
import { Button, LinkButton } from '@/ui/Button';
import { Card, Hint } from '@/ui/Card';
import { ErrorNote } from '@/ui/ErrorNote';
import { Icon } from '@/ui/Icon';
import { useRematch } from './queries';
import { headline } from './resultHeadline';
import styles from './Results.module.css';

/** A tela de uma partida encerrada: o resultado e a revanche. */
export function Results({ session, game }: { session: GameSession; game: Game | undefined }) {
  const navigate = useNavigate();
  const rematch = useRematch(session.id);
  const teamGame = (game?.teamCount ?? 0) > 0;
  const byId = new Map<string, SessionPlayer>(session.players.map((player) => [player.id, player]));
  const standings = [...session.standings].sort((a, b) => a.rank - b.rank || b.score - a.score);

  return (
    <>
      <Card tone="sun">
        <h1 className={styles.headline}>{headline(session, teamGame)}</h1>
        {teamGame && session.teamScores.length > 0 ? (
          <p className={styles.teamScores}>
            {session.teamScores
              .slice()
              .sort((a, b) => a.team - b.team)
              .map((team) => `Time ${team.team + 1}: ${team.score}`)
              .join('  ·  ')}
          </p>
        ) : null}
      </Card>

      <Card>
        <h2>Classificação</h2>
        <ol className={styles.list}>
          {standings.map((standing) => {
            const player = byId.get(standing.playerId);
            return (
              <li key={standing.playerId} className={styles.row}>
                <span className={styles.rank}>{standing.rank}º</span>
                {player ? (
                  <Avatar avatar={player.avatar} name={standing.displayName} size="md" team={standing.team} />
                ) : null}
                <span className={styles.name}>{standing.displayName}</span>
                {standing.isWinner ? <Icon name="trophy" size={26} aria-label="Vencedor" role="img" /> : null}
                <span className={styles.score}>{standing.score}</span>
              </li>
            );
          })}
        </ol>
      </Card>

      {rematch.error ? <ErrorNote error={rematch.error} /> : null}
      <div className="stack-sm">
        {session.canManage ? (
          <Button
            variant="go"
            size="lg"
            icon="refresh"
            loading={rematch.isPending}
            onClick={() =>
              rematch.mutate(undefined, { onSuccess: (next) => void navigate(`/partidas/${next.id}`) })
            }
          >
            Jogar de novo
          </Button>
        ) : (
          <Hint>Quem criou a partida pode começar a revanche: você vai para ela automaticamente.</Hint>
        )}
        <LinkButton to={`/grupos/${session.groupId}`} variant="light" icon="back">
          Voltar ao grupo
        </LinkButton>
      </div>
    </>
  );
}
