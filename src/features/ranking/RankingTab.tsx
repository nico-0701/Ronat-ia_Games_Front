import { useState } from 'react';
import { useParams } from 'react-router';
import type { RankingPeriod } from '@/api/types';
import { Avatar } from '@/ui/Avatar';
import { Card } from '@/ui/Card';
import { Chips } from '@/ui/Chips';
import { ErrorNote } from '@/ui/ErrorNote';
import { Icon } from '@/ui/Icon';
import { EmptyState } from '@/ui/Page';
import { Loading } from '@/ui/Spinner';
import { GameFilter } from './GameFilter';
import { PERIOD_OPTIONS, useRanking } from './queries';
import styles from './RankingTab.module.css';

function percent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

/** A aba "Ranking": vitórias, aproveitamento e pontos de cada pessoa do grupo (perfis sem celular também). */
export function RankingTab() {
  const { groupId = '' } = useParams();
  const [gameId, setGameId] = useState<string | undefined>(undefined);
  const [period, setPeriod] = useState<RankingPeriod>('all');
  const ranking = useRanking(groupId, gameId, period);

  return (
    <>
      <Card>
        <GameFilter value={gameId} onChange={setGameId} />
        <Chips label="Período" value={period} options={PERIOD_OPTIONS} onChange={setPeriod} />
      </Card>

      {ranking.isPending ? <Loading /> : null}
      {ranking.isError ? <ErrorNote error={ranking.error} onRetry={() => void ranking.refetch()} /> : null}

      {ranking.data && ranking.data.entries.length === 0 ? (
        <EmptyState title="Ainda não há resultados">
          O ranking aparece quando as partidas terminam. Partidas em andamento e canceladas não contam.
        </EmptyState>
      ) : null}

      {ranking.data && ranking.data.entries.length > 0 ? (
        <Card>
          <ol className={styles.list} aria-label="Ranking do grupo">
            {ranking.data.entries.map((entry) => (
              <li key={entry.memberId} className={`${styles.row} ${entry.isMe ? styles.me : ''}`}>
                <span className={styles.rank}>{entry.rank}º</span>
                <Avatar avatar={entry.avatar} name={entry.displayName} size="md" />
                <span className={styles.who}>
                  <span className={styles.name}>
                    {entry.displayName}
                    {entry.isMe ? ' (você)' : ''}
                  </span>
                  <span className={styles.detail}>
                    {entry.wins} {entry.wins === 1 ? 'vitória' : 'vitórias'} em {entry.played}{' '}
                    {entry.played === 1 ? 'partida' : 'partidas'} · {percent(entry.winRate)}
                  </span>
                </span>
                {entry.rank === 1 ? (
                  <Icon name="trophy" size={24} aria-label="Primeiro lugar" role="img" />
                ) : null}
                <span className={styles.score} aria-label={`${entry.score} pontos`}>
                  {entry.score}
                </span>
              </li>
            ))}
          </ol>
        </Card>
      ) : null}
    </>
  );
}
