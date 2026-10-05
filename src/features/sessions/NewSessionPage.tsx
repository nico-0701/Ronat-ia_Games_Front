import { useNavigate, useParams } from 'react-router';
import { Button } from '@/ui/Button';
import { Card, Hint } from '@/ui/Card';
import { ErrorNote } from '@/ui/ErrorNote';
import { PageHeader } from '@/ui/Page';
import { Loading } from '@/ui/Spinner';
import { gameUiFor } from '../games/registry';
import { useCreateSession, useGames } from './queries';

/** Escolher o jogo de uma partida nova. As opções (rodadas, tempo...) ficam para o lobby. */
export function NewSessionPage() {
  const { groupId = '' } = useParams();
  const navigate = useNavigate();
  const games = useGames();
  const create = useCreateSession();

  const start = (gameId: string) => {
    create.mutate(
      { groupId, gameId },
      { onSuccess: (session) => void navigate(`/partidas/${session.id}`, { replace: true }) },
    );
  };

  return (
    <>
      <PageHeader title="Nova partida" back={`/grupos/${groupId}`} />

      {games.isPending ? <Loading /> : null}
      {games.isError ? <ErrorNote error={games.error} onRetry={() => void games.refetch()} /> : null}
      {create.error ? <ErrorNote error={create.error} /> : null}

      {games.data?.map((game) => {
        const supported = gameUiFor(game.id) !== undefined;
        return (
          <Card key={game.id}>
            <h2>{game.name}</h2>
            <p>{game.description}</p>
            <Hint>
              {game.minPlayers === game.maxPlayers
                ? `${game.minPlayers} jogadores`
                : `De ${game.minPlayers} a ${game.maxPlayers} jogadores`}
              {game.teamCount > 0 ? ` · ${game.teamCount} times` : ''}
            </Hint>
            {supported ? (
              <Button
                variant="go"
                size="lg"
                icon="play"
                loading={create.isPending && create.variables?.gameId === game.id}
                disabled={create.isPending}
                onClick={() => start(game.id)}
              >
                Jogar {game.name}
              </Button>
            ) : (
              <Hint>Este jogo precisa de uma versão mais nova do app.</Hint>
            )}
          </Card>
        );
      })}
    </>
  );
}
