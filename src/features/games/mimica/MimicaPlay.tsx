import { useQueryClient } from '@tanstack/react-query';
import { errorMessage } from '@/api/errors';
import type { GameSession, SessionPlayer } from '@/api/types';
import { sessionKeys, useGameAction } from '@/features/sessions/queries';
import { secondsLeft, useCountdown, useRefetchAfter } from '@/features/sessions/useCountdown';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { Card, Hint } from '@/ui/Card';
import { useToast } from '@/ui/toast';
import type { GamePlayProps } from '../types';
import {
  outcomeText,
  parseMimicaConfig,
  parseMimicaView,
  scoreOf,
  teamName,
  type MimicaCard,
  type MimicaView,
} from './model';
import styles from './MimicaPlay.module.css';

function plusSeconds(iso: string | null, seconds: number): string | null {
  return iso ? new Date(Date.parse(iso) + seconds * 1000).toISOString() : null;
}

/** A Mímica em andamento: placar, vez do time, cronômetro e os botões que o servidor libera (`allowedActions`). */
export function MimicaPlay({ session, online }: GamePlayProps) {
  const view = parseMimicaView(session.view);
  const config = parseMimicaConfig(session.config);
  const queryClient = useQueryClient();
  const toast = useToast();
  const action = useGameAction(session.id);

  // O preparo vira "valendo" e o tempo de acertar acaba só com o relógio: pede o estado de novo depois de cada prazo.
  useRefetchAfter(session.id, [
    view?.prepEndsAt,
    view?.playEndsAt,
    plusSeconds(view?.playEndsAt ?? null, config.lateGraceSeconds),
    view?.stealEndsAt,
    plusSeconds(view?.stealEndsAt ?? null, config.lateGraceSeconds),
  ]);

  if (!view || view.phase === 'finished') {
    return <Hint>Carregando a partida…</Hint>;
  }

  const send = (type: string) =>
    action.mutate(
      { type },
      {
        onError: (error) => {
          toast.show(errorMessage(error), 'error');
          void queryClient.invalidateQueries({ queryKey: sessionKeys.detail(session.id), exact: true });
        },
      },
    );

  const allowed = new Set(session.allowedActions);
  const performer = session.players.find((player) => player.id === view.performerPlayerId);
  const me = session.players.find((player) => player.id === session.myPlayerId);
  const isPerformer = performer !== undefined && performer.id === me?.id;
  const myTeam = me?.team ?? null;

  return (
    <div className="stack">
      <Scoreboard view={view} players={session.players} online={online} />

      <p className={styles.round}>
        Rodada {view.round} de {view.totalRounds}
      </p>

      {view.phase === 'turnIntro' ? (
        <TurnIntro
          view={view}
          performer={performer}
          isPerformer={isPerformer}
          canStart={allowed.has('startTurn')}
          busy={action.isPending}
          onStart={() => send('startTurn')}
        />
      ) : null}

      {view.phase === 'prep' ? <Prep view={view} /> : null}

      {view.phase === 'playing' ? (
        <Playing
          view={view}
          performer={performer}
          isPerformer={isPerformer}
          myTeam={myTeam}
          allowed={allowed}
          busy={action.isPending}
          onSend={send}
        />
      ) : null}

      {view.phase === 'steal' ? (
        <Steal
          view={view}
          performer={performer}
          isPerformer={isPerformer}
          myTeam={myTeam}
          allowed={allowed}
          busy={action.isPending}
          onSend={send}
        />
      ) : null}

      {view.lastTurn ? (
        <Card tone="cream">
          <p>
            <strong>{teamName(view.lastTurn.team)}:</strong> {outcomeText(view.lastTurn.outcome)}
          </p>
          {view.lastTurn.card ? (
            <p className="muted">
              A mímica era: <strong>{view.lastTurn.card.text}</strong>
            </p>
          ) : null}
        </Card>
      ) : null}

      {allowed.has('skipTurn') ? (
        <Button
          variant="light"
          size="sm"
          icon="skip"
          loading={action.isPending}
          onClick={() => send('skipTurn')}
        >
          Pular esta vez
        </Button>
      ) : null}
    </div>
  );
}

function Scoreboard({
  view,
  players,
  online,
}: {
  view: MimicaView;
  players: GameSession['players'];
  online: ReadonlySet<string>;
}) {
  return (
    <div className={styles.scoreboard} aria-label="Placar">
      {[0, 1].map((team) => (
        <div
          key={team}
          className={`${styles.team} ${team === 0 ? styles.team0 : styles.team1} ${view.team === team ? styles.active : ''}`}
          aria-current={view.team === team ? 'true' : undefined}
        >
          <span className={styles.teamName}>{teamName(team)}</span>
          <span className={styles.points} aria-label={`${scoreOf(view, team)} pontos`}>
            {scoreOf(view, team)}
          </span>
          <span className={styles.members}>
            {players
              .filter((player) => player.team === team)
              .map((player) => (
                <Avatar
                  key={player.id}
                  avatar={player.avatar}
                  name={player.displayName}
                  size="xs"
                  online={online.has(player.memberId)}
                />
              ))}
          </span>
        </div>
      ))}
    </div>
  );
}

function PerformerChip({ performer, label }: { performer: SessionPlayer | undefined; label: string }) {
  if (!performer) {
    return null;
  }

  return (
    <div className="row">
      <Avatar avatar={performer.avatar} name={performer.displayName} size="md" team={performer.team} />
      <p>
        {label} <strong>{performer.displayName}</strong>
      </p>
    </div>
  );
}

function TurnIntro({
  view,
  performer,
  isPerformer,
  canStart,
  busy,
  onStart,
}: {
  view: MimicaView;
  performer: SessionPlayer | undefined;
  isPerformer: boolean;
  canStart: boolean;
  busy: boolean;
  onStart: () => void;
}) {
  const team = view.team ?? 0;

  return (
    <Card>
      <h2 className={`${styles.turnTitle} ${team === 0 ? styles.team0 : styles.team1}`}>
        Vez do {teamName(team)}
      </h2>
      <PerformerChip performer={performer} label="Quem faz a mímica:" />
      {isPerformer ? <p>É a sua vez de fazer a mímica!</p> : null}
      {canStart ? (
        <Button variant="go" size="lg" icon="play" loading={busy} onClick={onStart}>
          {isPerformer
            ? 'Ver minha mímica'
            : `Começar a vez de ${performer?.displayName ?? 'quem vai fazer'}`}
        </Button>
      ) : (
        <Hint>Aguarde {performer?.displayName ?? 'quem vai fazer a mímica'} começar.</Hint>
      )}
    </Card>
  );
}

function Prep({ view }: { view: MimicaView }) {
  const left = useCountdown(view.prepEndsAt);

  return (
    <Card tone="sun">
      <p className={styles.prepLabel}>Prepare-se!</p>
      <p className={styles.bigNumber} role="timer" aria-live="off">
        {Math.max(1, secondsLeft(left))}
      </p>
      {view.card ? <WordCard card={view.card} /> : null}
    </Card>
  );
}

function Clock({ deadline, label }: { deadline: string | null; label: string }) {
  const left = useCountdown(deadline);
  const seconds = secondsLeft(left);

  return (
    <div className={`${styles.clock} ${seconds <= 10 ? styles.urgent : ''}`} role="timer" aria-label={label}>
      <span className={styles.clockNumber}>{seconds}</span>
      <span className={styles.clockUnit}>s</span>
    </div>
  );
}

function WordCard({ card }: { card: MimicaCard }) {
  return (
    <div className={styles.word}>
      <p className={styles.kicker}>{card.kicker}</p>
      <p className={styles.text}>{card.text}</p>
    </div>
  );
}

interface TurnProps {
  view: MimicaView;
  performer: SessionPlayer | undefined;
  isPerformer: boolean;
  myTeam: number | null;
  allowed: ReadonlySet<string>;
  busy: boolean;
  onSend: (type: string) => void;
}

function whoIsWatching(view: MimicaView, myTeam: number | null, performerName: string): string {
  const turnTeam = view.team ?? 0;
  if (myTeam === turnTeam) {
    return `Adivinhem a mímica de ${performerName}!`;
  }

  if (myTeam === null) {
    return `${teamName(turnTeam)} está tentando adivinhar.`;
  }

  return `${teamName(turnTeam)} está jogando. Fiquem atentos: se errarem, vocês podem roubar o ponto!`;
}

function Playing({ view, performer, isPerformer, myTeam, allowed, busy, onSend }: TurnProps) {
  const performerName = performer?.displayName ?? 'o mímico';
  const canJudge = allowed.has('reportHit') || allowed.has('reportMiss');

  return (
    <Card>
      <Clock deadline={view.playEndsAt} label="Tempo para fazer a mímica" />
      {view.card ? <WordCard card={view.card} /> : null}
      {isPerformer ? (
        <p>Faça a mímica! Quando o seu time acertar, toque em &quot;Acertou!&quot;.</p>
      ) : (
        <>
          <PerformerChip performer={performer} label="Fazendo a mímica:" />
          {canJudge ? <p>Você é o anfitrião: dê o veredito por {performerName}.</p> : null}
          <p>{whoIsWatching(view, myTeam, performerName)}</p>
        </>
      )}
      {canJudge ? (
        <div className="stack-sm">
          {allowed.has('reportHit') ? (
            <Button variant="go" size="lg" icon="check" disabled={busy} onClick={() => onSend('reportHit')}>
              Acertou!
            </Button>
          ) : null}
          {allowed.has('reportMiss') ? (
            <Button variant="stop" size="lg" icon="x" disabled={busy} onClick={() => onSend('reportMiss')}>
              Não acertou
            </Button>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}

function Steal({ view, performer, isPerformer, myTeam, allowed, busy, onSend }: TurnProps) {
  const turnTeam = view.team ?? 0;
  const stealers = 1 - turnTeam;
  const canJudge = allowed.has('reportStealHit') || allowed.has('reportStealMiss');

  return (
    <Card tone="sun">
      <h2>Chance de roubo!</h2>
      <p>{teamName(stealers)} tem uma chance de adivinhar e ficar com o ponto.</p>
      <Clock deadline={view.stealEndsAt} label="Tempo da chance de roubo" />
      {view.card ? <WordCard card={view.card} /> : null}
      {!isPerformer ? <PerformerChip performer={performer} label="Mímica de" /> : null}
      {canJudge && !isPerformer ? (
        <p>
          Você é o anfitrião: confirme se roubaram o ponto de {performer?.displayName ?? 'quem fez a mímica'}.
        </p>
      ) : null}
      {myTeam === stealers ? <p>Vocês podem roubar: adivinhem!</p> : null}
      {canJudge ? (
        <div className="stack-sm">
          {allowed.has('reportStealHit') ? (
            <Button
              variant="go"
              size="lg"
              icon="check"
              disabled={busy}
              onClick={() => onSend('reportStealHit')}
            >
              Roubaram o ponto!
            </Button>
          ) : null}
          {allowed.has('reportStealMiss') ? (
            <Button
              variant="stop"
              size="lg"
              icon="x"
              disabled={busy}
              onClick={() => onSend('reportStealMiss')}
            >
              Ninguém acertou
            </Button>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
