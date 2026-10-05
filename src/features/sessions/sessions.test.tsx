import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { GameSession, GameSessionSummary } from '@/api/types';
import { GROUP_ID, groupFixture, memberFixture } from '@/test/fixtures';
import { jsonResponse, problemResponse, userFixture } from '@/test/helpers';
import { renderApp } from '@/test/renderApp';
import {
  BETO_MEMBER_ID,
  MY_MEMBER_ID,
  SESSION_ID,
  gameFixture,
  playerFixture,
  sessionFixture,
} from '@/test/sessions';

const BASE = {
  'GET /api/v1/users/me': () => jsonResponse(userFixture()),
  'GET /api/v1/groups/{groupId}': () => jsonResponse(groupFixture()),
};

function summary(overrides: Partial<GameSessionSummary> = {}): GameSessionSummary {
  return {
    id: SESSION_ID,
    gameId: 'mimica',
    status: 'waiting',
    hostMemberId: MY_MEMBER_ID,
    playerCount: 2,
    createdAt: '2026-10-05T12:00:00Z',
    startedAt: null,
    finishedAt: null,
    ...overrides,
  };
}

describe('aba de partidas do grupo', () => {
  const route = `/grupos/${GROUP_ID}/partidas`;

  it('lista as partidas com o nome do jogo e o estado, e abre uma', async () => {
    const { user, router } = renderApp({
      route,
      signedIn: true,
      handlers: {
        ...BASE,
        'GET /api/v1/groups/{groupId}/sessions': () =>
          jsonResponse([
            summary(),
            summary({ id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', status: 'finished', playerCount: 4 }),
          ]),
      },
    });

    const list = await screen.findByRole('list', { name: 'Partidas do grupo' });
    expect(within(list).getAllByRole('link')).toHaveLength(2);
    expect(within(list).getByText(/No lobby · 2 jogadores/)).toBeInTheDocument();
    expect(within(list).getByText(/Terminada · 4 jogadores/)).toBeInTheDocument();

    await user.click(within(list).getAllByRole('link')[0]!);
    expect(router.state.location.pathname).toBe(`/partidas/${SESSION_ID}`);
  });

  it('sem partidas mostra o estado vazio e o botão de nova partida', async () => {
    const { user, router } = renderApp({ route, signedIn: true, handlers: BASE });

    expect(await screen.findByText('Nenhuma partida ainda')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Nova partida' }));

    expect(router.state.location.pathname).toBe(`/grupos/${GROUP_ID}/nova-partida`);
  });

  it('recarrega a lista quando o servidor avisa que mudou', async () => {
    let items: GameSessionSummary[] = [];
    const { hub } = renderApp({
      route,
      signedIn: true,
      handlers: { ...BASE, 'GET /api/v1/groups/{groupId}/sessions': () => jsonResponse(items) },
    });
    await screen.findByText('Nenhuma partida ainda');
    expect(hub.watchedGroups).toContain(GROUP_ID);

    items = [summary()];
    hub.groupChanged(GROUP_ID);

    expect(await screen.findByRole('list', { name: 'Partidas do grupo' })).toBeInTheDocument();
  });
});

describe('nova partida', () => {
  const route = `/grupos/${GROUP_ID}/nova-partida`;

  it('cria a partida do jogo escolhido e abre o lobby', async () => {
    const created = sessionFixture();
    const { user, api, router } = renderApp({
      route,
      signedIn: true,
      handlers: {
        ...BASE,
        'POST /api/v1/sessions': () => jsonResponse(created, 201),
        'GET /api/v1/sessions/{sessionId}': () => jsonResponse(created),
      },
    });

    await user.click(await screen.findByRole('button', { name: 'Jogar Mímica' }));

    await waitFor(() => expect(router.state.location.pathname).toBe(`/partidas/${SESSION_ID}`));
    expect(api.called('POST /api/v1/sessions')[0]?.body).toEqual({ groupId: GROUP_ID, gameId: 'mimica' });
  });

  it('mostra o motivo quando o servidor recusa', async () => {
    const { user } = renderApp({
      route,
      signedIn: true,
      handlers: {
        ...BASE,
        'POST /api/v1/sessions': () =>
          problemResponse(409, 'session.limit_reached', 'O grupo já tem 5 partidas abertas.'),
      },
    });

    await user.click(await screen.findByRole('button', { name: 'Jogar Mímica' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('5 partidas abertas');
  });

  it('um jogo que o app não conhece fica sem botão de jogar', async () => {
    renderApp({
      route,
      signedIn: true,
      handlers: {
        ...BASE,
        'GET /api/v1/games': () => jsonResponse([gameFixture({ id: 'xadrez', name: 'Xadrez' })]),
      },
    });

    expect(await screen.findByRole('heading', { name: 'Xadrez' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Jogar Xadrez' })).not.toBeInTheDocument();
    expect(screen.getByText(/versão mais nova do app/)).toBeInTheDocument();
  });
});

describe('lobby', () => {
  const route = `/partidas/${SESSION_ID}`;

  function withSession(initial: GameSession, extra: Parameters<typeof renderApp>[0] = {}) {
    let session = initial;
    const set = (next: GameSession) => (session = next);
    const view = renderApp({
      route,
      signedIn: true,
      ...extra,
      handlers: {
        ...BASE,
        'GET /api/v1/sessions/{sessionId}': () => jsonResponse(session),
        ...extra.handlers,
      },
    });
    return { ...view, set, current: () => session };
  }

  it('o anfitrião vê os jogadores, as opções e o botão de começar', async () => {
    withSession(sessionFixture());

    expect(await screen.findByRole('heading', { name: 'Quem vai jogar' })).toBeInTheDocument();
    expect(screen.getByText('Ana (você)')).toBeInTheDocument();
    expect(screen.getByText('Beto')).toBeInTheDocument();
    expect(screen.getByText('Anfitrião')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Opções da partida' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Começar a partida' })).toBeEnabled();
  });

  it('avisa o que falta e segura o botão de começar', async () => {
    const lonely = sessionFixture({ players: [playerFixture({ id: 'p-ana', isMe: true, team: 0 })] });
    withSession(lonely);

    expect(await screen.findByText(/Faltam 1 jogador para começar/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Começar a partida' })).toBeDisabled();
  });

  it('pede o time de quem ainda não tem', async () => {
    const base = sessionFixture();
    withSession({
      ...base,
      players: base.players.map((player, i) => (i === 1 ? { ...player, team: null } : player)),
    });

    expect(await screen.findByText(/Escolha o time de 1 jogador/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Começar a partida' })).toBeDisabled();
  });

  it('muda o time de um jogador mandando só quem mudou', async () => {
    const { user, api, set } = withSession(sessionFixture(), {
      handlers: {
        'PUT /api/v1/sessions/{sessionId}/teams': () => {
          const next = sessionFixture({ version: 2 });
          next.players = next.players.map((player) =>
            player.id === 'p-beto' ? { ...player, team: 0 } : player,
          );
          set(next);
          return jsonResponse(next);
        },
      },
    });

    const betoTeams = within(await screen.findByRole('radiogroup', { name: 'Time de Beto' }));
    expect(betoTeams.getByRole('radio', { name: 'Time 2' })).toBeChecked();
    await user.click(betoTeams.getByRole('radio', { name: 'Time 1' }));

    await waitFor(() => expect(betoTeams.getByRole('radio', { name: 'Time 1' })).toBeChecked());
    expect(api.called('PUT /api/v1/sessions/{sessionId}/teams')[0]?.body).toEqual({
      assignments: [{ playerId: 'p-beto', team: 0 }],
    });
  });

  it('sorteia os times', async () => {
    const { user, api } = withSession(sessionFixture(), {
      handlers: {
        'POST /api/v1/sessions/{sessionId}/teams/shuffle': () => jsonResponse(sessionFixture({ version: 2 })),
      },
    });

    await user.click(await screen.findByRole('button', { name: 'Sortear os times' }));

    await waitFor(() =>
      expect(api.called('POST /api/v1/sessions/{sessionId}/teams/shuffle')).toHaveLength(1),
    );
  });

  it('adiciona alguém do grupo, inclusive quem não tem celular', async () => {
    const group = groupFixture();
    group.members.push(
      memberFixture({
        id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
        displayName: 'Vovó Lúcia',
        hasAccount: false,
      }),
    );
    const { user, api } = withSession(sessionFixture(), {
      handlers: {
        'GET /api/v1/groups/{groupId}': () => jsonResponse(group),
        'POST /api/v1/sessions/{sessionId}/players': () => jsonResponse(sessionFixture({ version: 2 })),
      },
    });

    await user.click(await screen.findByRole('button', { name: 'Adicionar alguém do grupo' }));
    const dialog = await screen.findByRole('dialog', { name: 'Adicionar à partida' });
    expect(within(dialog).getByText(/Vovó Lúcia · sem celular/)).toBeInTheDocument();
    await user.click(within(dialog).getAllByRole('button', { name: 'Adicionar' })[0]!);

    await waitFor(() => expect(api.called('POST /api/v1/sessions/{sessionId}/players')).toHaveLength(1));
  });

  it('tira um jogador da partida', async () => {
    const { user, api } = withSession(sessionFixture(), {
      handlers: {
        'DELETE /api/v1/sessions/{sessionId}/players/{playerId}': () =>
          jsonResponse(sessionFixture({ version: 2 })),
      },
    });

    await user.click(await screen.findByRole('button', { name: 'Tirar Beto da partida' }));

    await waitFor(() =>
      expect(api.called('DELETE /api/v1/sessions/{sessionId}/players/{playerId}')).toHaveLength(1),
    );
    expect(api.calls.at(-1)?.key).toBe(`DELETE /api/v1/sessions/${SESSION_ID}/players/p-beto`);
    expect(screen.queryByRole('button', { name: 'Tirar Ana (você) da partida' })).not.toBeInTheDocument();
  });

  it('muda as opções do jogo (cada toque salva a configuração inteira)', async () => {
    const { user, api } = withSession(sessionFixture(), {
      handlers: {
        'PATCH /api/v1/sessions/{sessionId}/config': () => jsonResponse(sessionFixture({ version: 2 })),
      },
    });

    await user.click(await screen.findByRole('radio', { name: '20' }));

    await waitFor(() => expect(api.called('PATCH /api/v1/sessions/{sessionId}/config')).toHaveLength(1));
    expect(api.called('PATCH /api/v1/sessions/{sessionId}/config')[0]?.body).toEqual({
      config: {
        rounds: 20,
        turnSeconds: 60,
        categories: ['expressoes', 'famosos', 'cotidiano'],
        lateGraceSeconds: 3,
      },
    });
  });

  it('não deixa desmarcar o último tema', async () => {
    const only = sessionFixture();
    only.config = { rounds: 10, turnSeconds: 60, categories: ['famosos'], lateGraceSeconds: 3 };
    const { user, api } = withSession(only);

    await user.click(await screen.findByRole('checkbox', { name: 'Famosos e personagens' }));

    expect(api.called('PATCH /api/v1/sessions/{sessionId}/config')).toHaveLength(0);
  });

  it('começa a partida e mostra a tela do jogo com a atualização do servidor', async () => {
    const started = sessionFixture({
      status: 'inProgress',
      version: 3,
      allowedActions: ['startTurn'],
      view: {
        phase: 'turnIntro',
        round: 1,
        totalRounds: 10,
        turn: 0,
        totalTurns: 20,
        team: 0,
        performerPlayerId: 'p-ana',
        scores: { '0': 0, '1': 0 },
      },
    });
    const { user } = withSession(sessionFixture(), {
      handlers: { 'POST /api/v1/sessions/{sessionId}/start': () => jsonResponse(started) },
    });

    await user.click(await screen.findByRole('button', { name: 'Começar a partida' }));

    expect(await screen.findByRole('button', { name: 'Ver minha mímica' })).toBeInTheDocument();
  });

  it('o servidor recusa o início e o motivo aparece', async () => {
    const { user } = withSession(sessionFixture(), {
      handlers: {
        'POST /api/v1/sessions/{sessionId}/start': () =>
          problemResponse(409, 'session.teams_incomplete', 'Cada time precisa de pelo menos 1 jogador.'),
      },
    });

    await user.click(await screen.findByRole('button', { name: 'Começar a partida' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Cada time precisa');
  });

  it('cancelar pede confirmação', async () => {
    const { user, api } = withSession(sessionFixture(), {
      handlers: {
        'POST /api/v1/sessions/{sessionId}/cancel': () =>
          jsonResponse(sessionFixture({ status: 'cancelled', version: 2 })),
      },
    });

    await user.click(await screen.findByRole('button', { name: 'Cancelar a partida' }));
    const dialog = await screen.findByRole('dialog', { name: 'Cancelar a partida?' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar a partida' }));

    expect(await screen.findByRole('heading', { name: 'Partida cancelada' })).toBeInTheDocument();
    expect(api.called('POST /api/v1/sessions/{sessionId}/cancel')).toHaveLength(1);
  });

  describe('quem não é o anfitrião', () => {
    const asGuest = (overrides: Partial<GameSession> = {}) =>
      sessionFixture({ canManage: false, hostMemberId: 'outro-membro', myPlayerId: null, ...overrides });

    it('entra na partida e não vê os controles de gerenciar', async () => {
      const guest = asGuest();
      guest.players = guest.players.map((player) => ({ ...player, isMe: false }));
      const { user, api } = withSession(guest, {
        handlers: {
          'POST /api/v1/sessions/{sessionId}/join': () =>
            jsonResponse(sessionFixture({ canManage: false, version: 2 })),
        },
      });

      await user.click(await screen.findByRole('button', { name: 'Entrar na partida' }));

      await waitFor(() => expect(api.called('POST /api/v1/sessions/{sessionId}/join')).toHaveLength(1));
      expect(screen.queryByRole('button', { name: 'Começar a partida' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Sortear os times' })).not.toBeInTheDocument();
      expect(screen.queryByRole('radiogroup', { name: 'Time de Beto' })).not.toBeInTheDocument();
    });

    it('vê o resumo das opções em vez do formulário e pode sair da partida', async () => {
      const { user, api } = withSession(asGuest({ myPlayerId: 'p-ana' }), {
        handlers: { 'POST /api/v1/sessions/{sessionId}/leave': () => jsonResponse(asGuest({ version: 2 })) },
      });

      expect(await screen.findByText('10 rodadas por time')).toBeInTheDocument();
      expect(screen.getByText('60 segundos para fazer a mímica')).toBeInTheDocument();
      expect(screen.queryByRole('radio', { name: '20' })).not.toBeInTheDocument();
      expect(screen.getByText(/Aguarde: quem criou a partida/)).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Sair da partida' }));
      await waitFor(() => expect(api.called('POST /api/v1/sessions/{sessionId}/leave')).toHaveLength(1));
    });
  });
});

describe('a página da partida', () => {
  const route = `/partidas/${SESSION_ID}`;

  it('mostra "Ao vivo" quando o tempo real conecta e avisa quando não há conexão', async () => {
    const { hub } = renderApp({
      route,
      signedIn: true,
      handlers: { ...BASE, 'GET /api/v1/sessions/{sessionId}': () => jsonResponse(sessionFixture()) },
    });

    expect(await screen.findByText('Ao vivo')).toBeInTheDocument();
    expect(hub.watchedSessions).toContain(SESSION_ID);

    hub.setStatus('offline');
    expect(await screen.findByText('Sem conexão ao vivo')).toBeInTheDocument();
  });

  it('uma atualização do servidor muda a tela; uma atrasada é ignorada', async () => {
    const { hub } = renderApp({
      route,
      signedIn: true,
      handlers: {
        ...BASE,
        'GET /api/v1/sessions/{sessionId}': () => jsonResponse(sessionFixture({ version: 5 })),
      },
    });
    await screen.findByRole('heading', { name: 'Quem vai jogar' });

    hub.update(sessionFixture({ version: 4, status: 'cancelled' })); // velha: ignora
    expect(screen.getByRole('heading', { name: 'Quem vai jogar' })).toBeInTheDocument();

    hub.update(sessionFixture({ version: 6, status: 'cancelled' }));
    expect(await screen.findByRole('heading', { name: 'Partida cancelada' })).toBeInTheDocument();
  });

  it('mostra quem está online', async () => {
    const { hub } = renderApp({
      route,
      signedIn: true,
      handlers: { ...BASE, 'GET /api/v1/sessions/{sessionId}': () => jsonResponse(sessionFixture()) },
    });
    await screen.findByRole('heading', { name: 'Quem vai jogar' });

    hub.presence(SESSION_ID, BETO_MEMBER_ID, true);

    expect(await screen.findAllByTitle('Online')).toHaveLength(1);
  });

  it('leva para a revanche quando o anfitrião cria', async () => {
    const next = sessionFixture({ id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' });
    const { hub, router } = renderApp({
      route,
      signedIn: true,
      handlers: {
        ...BASE,
        'GET /api/v1/sessions/{sessionId}': (request) =>
          jsonResponse(
            new URL(request.url).pathname.endsWith(next.id) ? next : sessionFixture({ status: 'finished' }),
          ),
      },
    });
    await screen.findByRole('heading', { name: 'Classificação' });

    hub.rematch(SESSION_ID, next.id);

    await waitFor(() => expect(router.state.location.pathname).toBe(`/partidas/${next.id}`));
    expect(await screen.findByText('Nova partida criada!')).toBeInTheDocument();
  });

  it('volta para o início se a pessoa perde o acesso', async () => {
    const { hub, router } = renderApp({
      route,
      signedIn: true,
      handlers: {
        ...BASE,
        'GET /api/v1/sessions/{sessionId}': () => jsonResponse(sessionFixture()),
        'GET /api/v1/groups': () => jsonResponse([]),
      },
    });
    await screen.findByRole('heading', { name: 'Quem vai jogar' });

    hub.revoke(SESSION_ID);

    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(await screen.findByText('Você não tem mais acesso a esta partida.')).toBeInTheDocument();
  });

  it('partida inexistente mostra um aviso amigável', async () => {
    renderApp({
      route,
      signedIn: true,
      handlers: {
        ...BASE,
        'GET /api/v1/sessions/{sessionId}': () =>
          problemResponse(404, 'session.not_found', 'Partida não encontrada.'),
      },
    });

    expect(await screen.findByRole('heading', { name: 'Partida não encontrada' })).toBeInTheDocument();
  });

  it('jogo desconhecido em andamento pede para atualizar o app', async () => {
    renderApp({
      route,
      signedIn: true,
      handlers: {
        ...BASE,
        'GET /api/v1/sessions/{sessionId}': () =>
          jsonResponse(sessionFixture({ gameId: 'xadrez', status: 'inProgress' })),
        'GET /api/v1/games': () => jsonResponse([gameFixture({ id: 'xadrez', name: 'Xadrez' })]),
      },
    });

    expect(await screen.findByRole('heading', { name: 'Jogo não suportado' })).toBeInTheDocument();
  });
});

describe('resultado', () => {
  const route = `/partidas/${SESSION_ID}`;

  function finished(overrides: Partial<GameSession> = {}): GameSession {
    const base = sessionFixture();
    return sessionFixture({
      status: 'finished',
      version: 9,
      players: base.players.map((player) => ({ ...player, score: player.id === 'p-ana' ? 7 : 4 })),
      teamScores: [
        { team: 0, score: 7 },
        { team: 1, score: 4 },
      ],
      standings: [
        {
          playerId: 'p-ana',
          memberId: MY_MEMBER_ID,
          displayName: 'Ana',
          team: 0,
          rank: 1,
          score: 7,
          isWinner: true,
        },
        {
          playerId: 'p-beto',
          memberId: base.players[1]!.memberId,
          displayName: 'Beto',
          team: 1,
          rank: 2,
          score: 4,
          isWinner: false,
        },
      ],
      ...overrides,
    });
  }

  it('mostra o time vencedor, os placares e a classificação', async () => {
    renderApp({
      route,
      signedIn: true,
      handlers: { ...BASE, 'GET /api/v1/sessions/{sessionId}': () => jsonResponse(finished()) },
    });

    expect(await screen.findByRole('heading', { name: 'O Time 1 venceu!' })).toBeInTheDocument();
    expect(screen.getByText('Time 1: 7 · Time 2: 4')).toBeInTheDocument();
    const rows = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('1ºAna7');
    expect(rows[1]).toHaveTextContent('2ºBeto4');
  });

  it('empate: todo mundo venceu', async () => {
    const tied = finished();
    tied.standings = tied.standings.map((standing) => ({ ...standing, rank: 1, isWinner: true }));
    renderApp({
      route,
      signedIn: true,
      handlers: { ...BASE, 'GET /api/v1/sessions/{sessionId}': () => jsonResponse(tied) },
    });

    expect(await screen.findByRole('heading', { name: 'Empate! Todo mundo venceu.' })).toBeInTheDocument();
  });

  it('o anfitrião começa a revanche e vai para a partida nova', async () => {
    const next = sessionFixture({ id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', version: 1 });
    const { user, router } = renderApp({
      route,
      signedIn: true,
      handlers: {
        ...BASE,
        'GET /api/v1/sessions/{sessionId}': (request) =>
          jsonResponse(new URL(request.url).pathname.endsWith(next.id) ? next : finished()),
        'POST /api/v1/sessions/{sessionId}/rematch': () => jsonResponse(next, 201),
      },
    });

    await user.click(await screen.findByRole('button', { name: 'Jogar de novo' }));

    await waitFor(() => expect(router.state.location.pathname).toBe(`/partidas/${next.id}`));
  });

  it('quem não é anfitrião só vê o aviso da revanche', async () => {
    renderApp({
      route,
      signedIn: true,
      handlers: {
        ...BASE,
        'GET /api/v1/sessions/{sessionId}': () => jsonResponse(finished({ canManage: false })),
      },
    });

    await screen.findByRole('heading', { name: 'O Time 1 venceu!' });
    expect(screen.queryByRole('button', { name: 'Jogar de novo' })).not.toBeInTheDocument();
    // O botão de voltar do cabeçalho e o do fim do resultado levam ao mesmo lugar.
    for (const link of screen.getAllByRole('link', { name: 'Voltar ao grupo' })) {
      expect(link).toHaveAttribute('href', `/grupos/${GROUP_ID}`);
    }
  });
});
