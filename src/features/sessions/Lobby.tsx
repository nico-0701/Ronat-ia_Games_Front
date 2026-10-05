import { useState } from 'react';
import type { Game, GameSession, SessionPlayer } from '@/api/types';
import { useGroup } from '@/features/groups/queries';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { Card, Hint } from '@/ui/Card';
import { Dialog } from '@/ui/Dialog';
import { ErrorNote } from '@/ui/ErrorNote';
import { gameUiFor } from '../games/registry';
import {
  useAddSessionPlayer,
  useAssignTeams,
  useCancelSession,
  useJoinSession,
  useLeaveSession,
  useRemoveSessionPlayer,
  useShuffleTeams,
  useStartSession,
  useUpdateSessionConfig,
} from './queries';
import { readiness } from './readiness';
import styles from './Lobby.module.css';

interface LobbyProps {
  session: GameSession;
  game: Game | undefined;
  online: ReadonlySet<string>;
}

/** O lobby: quem vai jogar, os times, as opções do jogo e o botão de começar (só o anfitrião mexe no que não é dele). */
export function Lobby({ session, game, online }: LobbyProps) {
  const ui = gameUiFor(session.gameId);
  const manage = session.canManage;
  const isPlayer = session.myPlayerId !== null;
  const teamCount = game?.teamCount ?? 0;
  const [adding, setAdding] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const join = useJoinSession(session.id);
  const leave = useLeaveSession(session.id);
  const remove = useRemoveSessionPlayer(session.id);
  const assign = useAssignTeams(session.id);
  const shuffle = useShuffleTeams(session.id);
  const config = useUpdateSessionConfig(session.id);
  const start = useStartSession(session.id);
  const cancel = useCancelSession(session.id);

  const blocker = readiness(session, game);
  const error = join.error ?? leave.error ?? remove.error ?? assign.error ?? shuffle.error ?? start.error;
  const summary = ui?.summarize?.(session) ?? [];
  const Config = ui?.Config;

  return (
    <>
      <Card>
        <h2>Quem vai jogar</h2>
        <ul className={styles.players}>
          {session.players.map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
              isHost={player.memberId === session.hostMemberId}
              online={online.has(player.memberId)}
              teamCount={teamCount}
              manage={manage}
              canRemove={manage && player.id !== session.myPlayerId}
              busy={assign.isPending || remove.isPending}
              onTeam={(team) => assign.mutate([{ playerId: player.id, team }])}
              onRemove={() => remove.mutate(player.id)}
            />
          ))}
        </ul>

        {manage ? (
          <div className="stack-sm">
            <Button variant="light" size="sm" icon="plus" onClick={() => setAdding(true)}>
              Adicionar alguém do grupo
            </Button>
            {teamCount > 0 ? (
              <Button
                variant="light"
                size="sm"
                icon="shuffle"
                loading={shuffle.isPending}
                onClick={() => shuffle.mutate()}
              >
                Sortear os times
              </Button>
            ) : null}
          </div>
        ) : null}

        {!isPlayer ? (
          <Button variant="go" icon="play" loading={join.isPending} onClick={() => join.mutate()}>
            Entrar na partida
          </Button>
        ) : null}
        {isPlayer && !manage ? (
          <Button variant="light" size="sm" loading={leave.isPending} onClick={() => leave.mutate()}>
            Sair da partida
          </Button>
        ) : null}
      </Card>

      {Config && manage ? (
        <Card>
          <h2>Opções da partida</h2>
          <Config
            session={session}
            game={game}
            disabled={false}
            saving={config.isPending}
            error={config.error}
            onSave={(next) => config.mutate(next)}
          />
        </Card>
      ) : null}

      {!manage && summary.length > 0 ? (
        <Card tone="cream">
          <h2>Opções da partida</h2>
          <ul className={styles.summary}>
            {summary.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      {error ? <ErrorNote error={error} /> : null}

      {manage ? (
        <div className="stack-sm">
          {blocker ? <Hint className={styles.blocker}>{blocker}</Hint> : null}
          <Button
            variant="go"
            size="lg"
            icon="play"
            loading={start.isPending}
            disabled={blocker !== null}
            onClick={() => start.mutate()}
          >
            Começar a partida
          </Button>
          <Button variant="danger" size="sm" icon="x" onClick={() => setConfirmCancel(true)}>
            Cancelar a partida
          </Button>
        </div>
      ) : (
        <Hint>Aguarde: quem criou a partida vai começar quando todo mundo estiver pronto.</Hint>
      )}

      {adding ? <AddPlayersDialog session={session} onClose={() => setAdding(false)} /> : null}

      <Dialog
        open={confirmCancel}
        title="Cancelar a partida?"
        onClose={() => setConfirmCancel(false)}
        actions={
          <>
            <Button variant="stop" loading={cancel.isPending} onClick={() => cancel.mutate()}>
              Cancelar a partida
            </Button>
            <Button variant="light" size="sm" onClick={() => setConfirmCancel(false)}>
              Voltar
            </Button>
          </>
        }
      >
        <p>Ninguém mais consegue entrar, e a partida some das abertas do grupo.</p>
        {cancel.error ? <ErrorNote error={cancel.error} /> : null}
      </Dialog>
    </>
  );
}

interface PlayerRowProps {
  player: SessionPlayer;
  isHost: boolean;
  online: boolean;
  teamCount: number;
  manage: boolean;
  canRemove: boolean;
  busy: boolean;
  onTeam: (team: number) => void;
  onRemove: () => void;
}

function PlayerRow({
  player,
  isHost,
  online,
  teamCount,
  manage,
  canRemove,
  busy,
  onTeam,
  onRemove,
}: PlayerRowProps) {
  return (
    <li className={styles.player}>
      <Avatar avatar={player.avatar} name={player.displayName} size="md" team={player.team} online={online} />
      <span className={styles.who}>
        <span className={styles.name}>
          {player.displayName}
          {player.isMe ? ' (você)' : ''}
        </span>
        <span className={styles.tags}>
          {isHost ? <span className={styles.tag}>Anfitrião</span> : null}
          {!player.hasAccount ? <span className={styles.tag}>Sem celular</span> : null}
        </span>
      </span>
      {teamCount > 0 && manage ? (
        <span className={styles.teams} role="radiogroup" aria-label={`Time de ${player.displayName}`}>
          {Array.from({ length: teamCount }, (_, team) => (
            <button
              key={team}
              type="button"
              role="radio"
              aria-checked={player.team === team}
              aria-label={`Time ${team + 1}`}
              disabled={busy}
              className={`${styles.team} ${team === 0 ? styles.team0 : styles.team1} ${player.team === team ? styles.picked : ''}`}
              onClick={() => onTeam(team)}
            >
              {team + 1}
            </button>
          ))}
        </span>
      ) : null}
      {teamCount > 0 && !manage && player.team !== null ? (
        <span className={`${styles.badge} ${player.team === 0 ? styles.team0 : styles.team1}`}>
          Time {player.team + 1}
        </span>
      ) : null}
      {canRemove ? (
        <button
          type="button"
          className={styles.remove}
          aria-label={`Tirar ${player.displayName} da partida`}
          disabled={busy}
          onClick={onRemove}
        >
          ×
        </button>
      ) : null}
    </li>
  );
}

function AddPlayersDialog({ session, onClose }: { session: GameSession; onClose: () => void }) {
  const group = useGroup(session.groupId);
  const add = useAddSessionPlayer(session.id);
  const taken = new Set(session.players.map((player) => player.memberId));
  const candidates = (group.data?.members ?? []).filter((member) => !taken.has(member.id));

  return (
    <Dialog
      open
      title="Adicionar à partida"
      onClose={onClose}
      actions={
        <Button variant="go" onClick={onClose}>
          Pronto
        </Button>
      }
    >
      {group.isPending ? <Hint>Carregando o grupo…</Hint> : null}
      {group.data && candidates.length === 0 ? <Hint>Todo mundo do grupo já está na partida.</Hint> : null}
      <ul className={styles.candidates}>
        {candidates.map((member) => (
          <li key={member.id} className={styles.candidate}>
            <Avatar avatar={member.avatar} name={member.displayName} size="sm" />
            <span className={styles.name}>
              {member.displayName}
              {!member.hasAccount ? ' · sem celular' : ''}
            </span>
            <Button
              block={false}
              size="sm"
              variant="light"
              loading={add.isPending && add.variables === member.id}
              disabled={add.isPending}
              onClick={() => add.mutate(member.id)}
            >
              Adicionar
            </Button>
          </li>
        ))}
      </ul>
      {add.error ? <ErrorNote error={add.error} /> : null}
    </Dialog>
  );
}
