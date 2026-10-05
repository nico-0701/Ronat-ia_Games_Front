import { useState } from 'react';
import { Link, useParams } from 'react-router';
import type { HistoryEntry } from '@/api/types';
import { formatWhen } from '@/lib/format';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { ErrorNote } from '@/ui/ErrorNote';
import { Icon } from '@/ui/Icon';
import { EmptyState } from '@/ui/Page';
import { Loading } from '@/ui/Spinner';
import { useGames } from '@/features/sessions/queries';
import { GameFilter } from './GameFilter';
import { useHistory } from './queries';
import styles from './HistoryTab.module.css';

/** A aba "Histórico": as partidas encerradas, da mais recente para a mais antiga. */
export function HistoryTab() {
  const { groupId = '' } = useParams();
  const [gameId, setGameId] = useState<string | undefined>(undefined);
  const history = useHistory(groupId, gameId);
  const games = useGames();
  const nameOf = (id: string) => games.data?.find((game) => game.id === id)?.name ?? id;
  const items: HistoryEntry[] = history.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <>
      <GameFilter value={gameId} onChange={setGameId} />

      {history.isPending ? <Loading /> : null}
      {history.isError ? <ErrorNote error={history.error} onRetry={() => void history.refetch()} /> : null}

      {history.data && items.length === 0 ? (
        <EmptyState title="Nenhuma partida terminada">
          As partidas encerradas aparecem aqui, com o resultado de cada uma.
        </EmptyState>
      ) : null}

      {items.length > 0 ? (
        <ul className={styles.list} aria-label="Partidas encerradas">
          {items.map((entry) => (
            <li key={entry.sessionId}>
              <Link to={`/partidas/${entry.sessionId}`} className={styles.link}>
                <Card>
                  <div className="row">
                    <div className="spacer">
                      <h2>{nameOf(entry.gameId)}</h2>
                      <p className="muted">{formatWhen(entry.finishedAt)}</p>
                    </div>
                    <Icon name="chevron" size={28} />
                  </div>
                  <ol className={styles.standings}>
                    {entry.standings.map((standing) => (
                      <li key={standing.memberId} className={styles.standing}>
                        <Avatar
                          avatar={standing.avatar}
                          name={standing.displayName}
                          size="sm"
                          team={standing.team}
                        />
                        <span className={styles.name}>{standing.displayName}</span>
                        {standing.isWinner ? (
                          <Icon name="trophy" size={20} aria-label="Vencedor" role="img" />
                        ) : null}
                        <span className={styles.score}>{standing.score}</span>
                      </li>
                    ))}
                  </ol>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {history.hasNextPage ? (
        <Button
          variant="light"
          loading={history.isFetchingNextPage}
          onClick={() => void history.fetchNextPage()}
        >
          Carregar mais
        </Button>
      ) : null}
    </>
  );
}
