import { Link, useParams } from 'react-router';
import { LinkButton } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { ErrorNote } from '@/ui/ErrorNote';
import { Icon } from '@/ui/Icon';
import { EmptyState } from '@/ui/Page';
import { Loading } from '@/ui/Spinner';
import { formatWhen } from '@/lib/format';
import { useGroupSessionsLive } from './live/useLive';
import { useGames, useGroupSessions } from './queries';
import { isOpen, statusLabel } from './statusLabels';
import styles from './GroupSessionsTab.module.css';

/** A aba "Partidas": as partidas do grupo (as abertas primeiro) e o botão de começar uma nova. */
export function GroupSessionsTab() {
  const { groupId = '' } = useParams();
  const sessions = useGroupSessions(groupId);
  const games = useGames();
  useGroupSessionsLive(groupId);

  const nameOf = (gameId: string) => games.data?.find((game) => game.id === gameId)?.name ?? gameId;

  return (
    <>
      <LinkButton to={`/grupos/${groupId}/nova-partida`} variant="go" size="lg" icon="plus">
        Nova partida
      </LinkButton>

      {sessions.isPending ? <Loading /> : null}
      {sessions.isError ? <ErrorNote error={sessions.error} onRetry={() => void sessions.refetch()} /> : null}

      {sessions.data && sessions.data.length === 0 ? (
        <EmptyState title="Nenhuma partida ainda">
          Comece uma partida nova: todo mundo do grupo pode entrar.
        </EmptyState>
      ) : null}

      {sessions.data && sessions.data.length > 0 ? (
        <ul className={styles.list} aria-label="Partidas do grupo">
          {sessions.data.map((session) => (
            <li key={session.id}>
              <Link to={`/partidas/${session.id}`} className={styles.link}>
                <Card tone={isOpen(session.status) ? 'sun' : 'paper'}>
                  <div className="row">
                    <div className="spacer">
                      <h2>{nameOf(session.gameId)}</h2>
                      <p className={isOpen(session.status) ? undefined : 'muted'}>
                        {statusLabel(session.status)} · {session.playerCount}{' '}
                        {session.playerCount === 1 ? 'jogador' : 'jogadores'}
                      </p>
                      <p className={styles.when}>{formatWhen(session.finishedAt ?? session.createdAt)}</p>
                    </div>
                    <Icon name="chevron" size={28} />
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
