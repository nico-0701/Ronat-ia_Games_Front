import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { GameSession } from '@/api/types';
import { groupFixture } from '@/test/fixtures';
import { jsonResponse, problemResponse, userFixture } from '@/test/helpers';
import { renderApp, type Handler } from '@/test/renderApp';
import { CARD, MY_MEMBER_ID, SESSION_ID, mimicaView, playerFixture, sessionFixture } from '@/test/sessions';

const route = `/partidas/${SESSION_ID}`;

/** Ana (eu, time 1), Carla (time 1), Beto (time 2) e Davi (time 2). */
function players() {
  return [
    playerFixture({ id: 'p-ana', memberId: MY_MEMBER_ID, displayName: 'Ana', isMe: true, seat: 0, team: 0 }),
    playerFixture({ id: 'p-carla', displayName: 'Carla', seat: 1, team: 0 }),
    playerFixture({ id: 'p-beto', displayName: 'Beto', seat: 2, team: 1 }),
    playerFixture({ id: 'p-davi', displayName: 'Davi', seat: 3, team: 1, hasAccount: false }),
  ];
}

function playing(
  view: Record<string, unknown>,
  allowedActions: string[],
  overrides: Partial<GameSession> = {},
): GameSession {
  return sessionFixture({
    status: 'inProgress',
    version: 10,
    players: players(),
    allowedActions,
    view: mimicaView(view),
    ...overrides,
  });
}

function setup(initial: GameSession, handlers: Record<string, Handler> = {}) {
  let session = initial;
  const view = renderApp({
    route,
    signedIn: true,
    handlers: {
      'GET /api/v1/users/me': () => jsonResponse(userFixture()),
      'GET /api/v1/groups/{groupId}': () => jsonResponse(groupFixture()),
      'GET /api/v1/sessions/{sessionId}': () => jsonResponse(session),
      ...handlers,
    },
  });
  return { ...view, set: (next: GameSession) => (session = next) };
}

describe('Mímica: abertura da vez', () => {
  it('o mímico vê o placar, a vez do time e o botão de começar', async () => {
    const { user, api } = setup(
      playing({ performerPlayerId: 'p-ana', scores: { '0': 2, '1': 5 } }, ['startTurn']),
      {
        'POST /api/v1/sessions/{sessionId}/actions': () =>
          jsonResponse({
            replayed: false,
            session: playing(
              { phase: 'prep', prepEndsAt: new Date(Date.now() + 5000).toISOString(), card: CARD },
              [],
              { version: 11 },
            ),
          }),
      },
    );

    expect(await screen.findByRole('heading', { name: 'Vez do Time 1' })).toBeInTheDocument();
    expect(screen.getByText('É a sua vez de fazer a mímica!')).toBeInTheDocument();
    expect(screen.getByText('Rodada 1 de 10')).toBeInTheDocument();
    expect(screen.getByLabelText('Placar')).toHaveTextContent('Time 12');
    expect(screen.getByLabelText('Placar')).toHaveTextContent('Time 25');

    await user.click(screen.getByRole('button', { name: 'Ver minha mímica' }));

    expect(await screen.findByText('Prepare-se!')).toBeInTheDocument();
    expect(screen.getByText('Pelé')).toBeInTheDocument(); // no preparo o mímico já enxerga a carta
    const call = api.called('POST /api/v1/sessions/{sessionId}/actions')[0]!;
    expect(call.body).toMatchObject({ type: 'startTurn' });
    expect((call.body as { clientActionId: string }).clientActionId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('quem não faz a mímica nem gerencia só espera', async () => {
    setup(playing({ performerPlayerId: 'p-carla' }, [], { canManage: false }));

    expect(await screen.findByText('Aguarde Carla começar.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Ver minha mímica|Começar a vez/ })).not.toBeInTheDocument();
  });

  it('o anfitrião pode começar a vez de quem não tem celular', async () => {
    setup(playing({ team: 1, performerPlayerId: 'p-davi' }, ['startTurn', 'skipTurn']));

    expect(await screen.findByRole('button', { name: 'Começar a vez de Davi' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Vez do Time 2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pular esta vez' })).toBeInTheDocument();
  });

  it('só mostra "Pular esta vez" quando o servidor libera a ação', async () => {
    setup(playing({ performerPlayerId: 'p-ana' }, ['startTurn']));

    await screen.findByRole('button', { name: 'Ver minha mímica' });
    expect(screen.queryByRole('button', { name: 'Pular esta vez' })).not.toBeInTheDocument();
  });

  it('revela a carta da vez anterior e o desfecho', async () => {
    setup(
      playing(
        {
          performerPlayerId: 'p-beto',
          team: 1,
          lastTurn: {
            turn: 0,
            team: 0,
            performerPlayerId: 'p-ana',
            outcome: 'stealHit',
            card: { ...CARD, text: 'Escovar os dentes' },
          },
        },
        [],
      ),
    );

    expect(await screen.findByText(/O outro time roubou o ponto!/)).toBeInTheDocument();
    expect(screen.getByText('Escovar os dentes')).toBeInTheDocument();
  });
});

describe('Mímica: valendo', () => {
  const live = () => new Date(Date.now() + 40_000).toISOString();

  it('o mímico vê a carta e dá o veredito: acertou', async () => {
    const next = playing({ performerPlayerId: 'p-beto', team: 1, scores: { '0': 1, '1': 0 } }, [], {
      canManage: true,
      version: 11,
    });
    const { user, api } = setup(
      playing({ phase: 'playing', playEndsAt: live(), card: CARD }, ['reportHit', 'reportMiss']),
      {
        'POST /api/v1/sessions/{sessionId}/actions': () => jsonResponse({ replayed: false, session: next }),
      },
    );

    expect(await screen.findByText('Pelé')).toBeInTheDocument();
    expect(screen.getByText('Famoso ou personagem:')).toBeInTheDocument();
    expect(screen.getByRole('timer', { name: 'Tempo para fazer a mímica' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Acertou!' }));

    expect(await screen.findByRole('heading', { name: 'Vez do Time 2' })).toBeInTheDocument();
    expect(api.called('POST /api/v1/sessions/{sessionId}/actions')[0]?.body).toMatchObject({
      type: 'reportHit',
    });
    expect(screen.queryByText('Pelé')).not.toBeInTheDocument();
  });

  it('depois do prazo só resta "Não acertou" (o servidor tirou o reportHit)', async () => {
    setup(
      playing({ phase: 'playing', playEndsAt: new Date(Date.now() - 10_000).toISOString(), card: CARD }, [
        'reportMiss',
      ]),
    );

    expect(await screen.findByRole('button', { name: 'Não acertou' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Acertou!' })).not.toBeInTheDocument();
  });

  it('o colega de time adivinha, sem carta e sem botões', async () => {
    setup(playing({ phase: 'playing', playEndsAt: live(), performerPlayerId: 'p-carla', card: null }, []));

    expect(await screen.findByText('Adivinhem a mímica de Carla!')).toBeInTheDocument();
    expect(screen.queryByText('Pelé')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Acertou!' })).not.toBeInTheDocument();
  });

  it('o time adversário fica de olho para roubar', async () => {
    setup(
      playing(
        { phase: 'playing', playEndsAt: live(), team: 1, performerPlayerId: 'p-beto', card: null },
        [],
        {
          canManage: false,
        },
      ),
    );

    expect(await screen.findByText(/Time 2 está jogando\. Fiquem atentos/)).toBeInTheDocument();
  });

  it('o anfitrião vê a carta para dar o veredito por quem não tem celular', async () => {
    setup(
      playing({ phase: 'playing', playEndsAt: live(), team: 1, performerPlayerId: 'p-davi', card: CARD }, [
        'reportHit',
        'reportMiss',
      ]),
    );

    expect(await screen.findByText('Pelé')).toBeInTheDocument();
    expect(screen.getByText('Fazendo a mímica:')).toBeInTheDocument();
    expect(screen.getByText('Você é o anfitrião: dê o veredito por Davi.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Acertou!' })).toBeInTheDocument();
  });

  it('mostra a mensagem do servidor quando a ação é recusada', async () => {
    const { user } = setup(
      playing({ phase: 'playing', playEndsAt: live(), card: CARD }, ['reportHit', 'reportMiss']),
      {
        'POST /api/v1/sessions/{sessionId}/actions': () =>
          problemResponse(409, 'mimica.turn_expired', 'O tempo para marcar o acerto já passou.'),
      },
    );

    await user.click(await screen.findByRole('button', { name: 'Acertou!' }));

    expect(await screen.findByText('O tempo para marcar o acerto já passou.')).toBeInTheDocument();
  });

  it('reenvia uma vez com o mesmo identificador quando há conflito de concorrência', async () => {
    let attempts = 0;
    const { user, api } = setup(
      playing({ phase: 'playing', playEndsAt: live(), card: CARD }, ['reportMiss', 'reportHit']),
      {
        'POST /api/v1/sessions/{sessionId}/actions': () => {
          attempts += 1;
          return attempts === 1
            ? problemResponse(409, 'session.concurrent_update', 'Tente de novo.')
            : jsonResponse({
                replayed: false,
                session: playing({ phase: 'steal', stealEndsAt: live(), card: CARD }, [], { version: 11 }),
              });
        },
      },
    );

    await user.click(await screen.findByRole('button', { name: 'Não acertou' }));

    expect(await screen.findByRole('heading', { name: 'Chance de roubo!' })).toBeInTheDocument();
    const [first, second] = api
      .called('POST /api/v1/sessions/{sessionId}/actions')
      .map((call) => call.body as { clientActionId: string });
    expect(first!.clientActionId).toBe(second!.clientActionId);
  });
});

describe('Mímica: chance de roubo', () => {
  it('o mímico confirma se roubaram o ponto', async () => {
    const stealEndsAt = new Date(Date.now() + 25_000).toISOString();
    const { user, api } = setup(
      playing({ phase: 'steal', stealEndsAt, card: CARD }, ['reportStealHit', 'reportStealMiss']),
      {
        'POST /api/v1/sessions/{sessionId}/actions': () =>
          jsonResponse({
            replayed: false,
            session: playing({ team: 1, scores: { '0': 0, '1': 1 } }, [], { version: 11 }),
          }),
      },
    );

    expect(await screen.findByRole('heading', { name: 'Chance de roubo!' })).toBeInTheDocument();
    expect(screen.getByText('Time 2 tem uma chance de adivinhar e ficar com o ponto.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Roubaram o ponto!' }));

    await waitFor(() => expect(api.called('POST /api/v1/sessions/{sessionId}/actions')).toHaveLength(1));
    expect(api.called('POST /api/v1/sessions/{sessionId}/actions')[0]?.body).toMatchObject({
      type: 'reportStealHit',
    });
  });

  it('o time que pode roubar é avisado', async () => {
    setup(
      playing(
        {
          phase: 'steal',
          team: 0,
          stealEndsAt: new Date(Date.now() + 25_000).toISOString(),
          performerPlayerId: 'p-carla',
        },
        [],
        {
          players: players().map((player) => ({ ...player, isMe: player.id === 'p-beto' })),
          myPlayerId: 'p-beto',
          canManage: false,
        },
      ),
    );

    expect(await screen.findByText('Vocês podem roubar: adivinhem!')).toBeInTheDocument();
  });
});

describe('Mímica: o relógio e o tempo real', () => {
  it('o preparo vira "valendo" sozinho, buscando o estado de novo depois do prazo', async () => {
    let calls = 0;
    setup(playing({ performerPlayerId: 'p-ana' }, []), {
      'GET /api/v1/sessions/{sessionId}': () => {
        calls += 1;
        const prepEndsAt = new Date(Date.now() + 500).toISOString();
        return jsonResponse(
          calls === 1
            ? playing({ phase: 'prep', prepEndsAt, card: CARD }, [], { version: 10 })
            : playing(
                {
                  phase: 'playing',
                  prepEndsAt,
                  playEndsAt: new Date(Date.now() + 60_000).toISOString(),
                  card: CARD,
                },
                ['reportHit', 'reportMiss'],
                { version: 10 }, // a versão não muda: a fase mudou só com o relógio
              ),
        );
      },
    });

    expect(await screen.findByText('Prepare-se!')).toBeInTheDocument();

    expect(await screen.findByRole('button', { name: 'Acertou!' }, { timeout: 4000 })).toBeInTheDocument();
    expect(calls).toBeGreaterThanOrEqual(2);
  });

  it('o placar acompanha as atualizações do servidor e o time da vez fica marcado', async () => {
    const { hub } = setup(playing({ team: 0, scores: { '0': 0, '1': 0 } }, []));
    await screen.findByRole('heading', { name: 'Vez do Time 1' });
    const board = screen.getByLabelText('Placar');
    expect(
      within(board)
        .getAllByText(/Time \d/)[0]
        ?.closest('[aria-current="true"]'),
    ).not.toBeNull();

    hub.update(playing({ team: 1, scores: { '0': 3, '1': 2 }, round: 2 }, [], { version: 12 }));

    expect(await screen.findByRole('heading', { name: 'Vez do Time 2' })).toBeInTheDocument();
    expect(screen.getByLabelText('Placar')).toHaveTextContent('Time 13');
    expect(screen.getByText('Rodada 2 de 10')).toBeInTheDocument();
  });

  it('o anfitrião encerra a partida em andamento depois de confirmar', async () => {
    const { user, api } = setup(playing({ performerPlayerId: 'p-ana' }, ['startTurn']), {
      'POST /api/v1/sessions/{sessionId}/finish': () =>
        jsonResponse(sessionFixture({ status: 'finished', version: 13 })),
    });

    await user.click(await screen.findByRole('button', { name: 'Opções do anfitrião' }));
    await user.click(await screen.findByRole('button', { name: 'Encerrar e ver o resultado' }));
    const dialog = await screen.findByRole('dialog', { name: 'Encerrar a partida?' });
    await user.click(within(dialog).getByRole('button', { name: 'Encerrar agora' }));

    await waitFor(() => expect(api.called('POST /api/v1/sessions/{sessionId}/finish')).toHaveLength(1));
    expect(await screen.findByRole('heading', { name: 'Classificação' })).toBeInTheDocument();
  });

  it('quem não gerencia não vê as opções do anfitrião', async () => {
    setup(playing({ performerPlayerId: 'p-carla' }, [], { canManage: false }));

    await screen.findByRole('heading', { name: 'Vez do Time 1' });
    expect(screen.queryByRole('button', { name: 'Opções do anfitrião' })).not.toBeInTheDocument();
  });
});
