import { useParams } from 'react-router';
import { isApiError } from '@/api/errors';
import type { Game, GameSession } from '@/api/types';
import { LinkButton } from '@/ui/Button';
import { Card, Hint } from '@/ui/Card';
import { ErrorNote } from '@/ui/ErrorNote';
import { PageHeader } from '@/ui/Page';
import { Loading } from '@/ui/Spinner';
import { gameUiFor } from '../games/registry';
import { HostMenu } from './HostMenu';
import { Lobby } from './Lobby';
import { Results } from './Results';
import type { LiveStatus } from './live/hub';
import { useSessionLive } from './live/useLive';
import { useGames, useSession } from './queries';
import { statusLabel } from './statusLabels';
import styles from './SessionPage.module.css';

const LIVE_TEXT: Record<LiveStatus, string> = {
  idle: 'Conectando…',
  connecting: 'Conectando…',
  live: 'Ao vivo',
  reconnecting: 'Reconectando…',
  offline: 'Sem conexão ao vivo',
};

function LiveBadge({ status }: { status: LiveStatus }) {
  return (
    <span className={`${styles.live} ${status === 'live' ? styles.on : ''}`} role="status">
      <span className={styles.dot} aria-hidden="true" />
      {LIVE_TEXT[status]}
    </span>
  );
}

/** A tela de uma partida: lobby, jogo em andamento, resultado ou aviso de cancelada, conforme o estado que o servidor manda. */
export function SessionPage() {
  const { sessionId = '' } = useParams();
  const { status: liveStatus, online } = useSessionLive(sessionId);
  const session = useSession(sessionId, { live: liveStatus === 'live' });
  const games = useGames();

  if (session.isPending) {
    return <Loading />;
  }

  if (session.isError) {
    if (isApiError(session.error, 'session.not_found')) {
      return (
        <Card>
          <h1>Partida não encontrada</h1>
          <Hint>Ela pode ter sido apagada, ou você não faz parte do grupo dela.</Hint>
          <LinkButton to="/" variant="go" icon="home">
            Ir para o início
          </LinkButton>
        </Card>
      );
    }

    return <ErrorNote error={session.error} onRetry={() => void session.refetch()} />;
  }

  const data = session.data;
  const game = games.data?.find((candidate) => candidate.id === data.gameId);

  return (
    <>
      <PageHeader
        title={game?.name ?? 'Partida'}
        back={`/grupos/${data.groupId}`}
        backLabel="Voltar ao grupo"
        actions={<LiveBadge status={liveStatus} />}
      />
      <p className="muted">{statusLabel(data.status)}</p>
      <SessionBody session={data} game={game} online={online} />
    </>
  );
}

function SessionBody({
  session,
  game,
  online,
}: {
  session: GameSession;
  game: Game | undefined;
  online: ReadonlySet<string>;
}) {
  const ui = gameUiFor(session.gameId);

  switch (session.status) {
    case 'waiting':
      return <Lobby session={session} game={game} online={online} />;

    case 'inProgress':
      if (!ui) {
        return <UnsupportedGame />;
      }

      return (
        <>
          <ui.Play session={session} game={game} online={online} />
          {session.canManage ? <HostMenu sessionId={session.id} /> : null}
        </>
      );

    case 'finished':
      return <Results session={session} game={game} />;

    case 'cancelled':
      return (
        <Card>
          <h2>Partida cancelada</h2>
          <Hint>O anfitrião cancelou esta partida. Ela não conta no ranking.</Hint>
          <LinkButton to={`/grupos/${session.groupId}`} variant="go" icon="back">
            Voltar ao grupo
          </LinkButton>
        </Card>
      );
  }
}

function UnsupportedGame() {
  return (
    <Card>
      <h2>Jogo não suportado</h2>
      <Hint>
        Esta partida é de um jogo que a sua versão do app ainda não sabe mostrar. Atualize o app para jogar.
      </Hint>
    </Card>
  );
}
