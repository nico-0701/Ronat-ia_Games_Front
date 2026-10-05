import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { HistoryEntry, RankingEntry } from '@/api/types';
import { GROUP_ID, groupFixture } from '@/test/fixtures';
import { jsonResponse, problemResponse, userFixture } from '@/test/helpers';
import { renderApp } from '@/test/renderApp';
import { gameFixture } from '@/test/sessions';

const BASE = {
  'GET /api/v1/users/me': () => jsonResponse(userFixture()),
  'GET /api/v1/groups/{groupId}': () => jsonResponse(groupFixture()),
};

function entry(overrides: Partial<RankingEntry> = {}): RankingEntry {
  return {
    memberId: 'm-1',
    displayName: 'Beto',
    avatar: { kind: 'preset', preset: 'preset-2', url: null },
    hasAccount: true,
    isMe: false,
    rank: 2,
    played: 3,
    wins: 1,
    winRate: 0.3333,
    score: 9,
    ...overrides,
  };
}

function historyEntry(id: string, overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    sessionId: id,
    gameId: 'mimica',
    startedAt: '2026-10-04T20:00:00Z',
    finishedAt: '2026-10-04T20:30:00Z',
    standings: [
      {
        memberId: 'm-ana',
        displayName: 'Ana',
        avatar: { kind: 'preset', preset: 'preset-1', url: null },
        team: 0,
        rank: 1,
        score: 7,
        isWinner: true,
      },
      {
        memberId: 'm-beto',
        displayName: 'Beto',
        avatar: { kind: 'preset', preset: 'preset-2', url: null },
        team: 1,
        rank: 2,
        score: 4,
        isWinner: false,
      },
    ],
    ...overrides,
  };
}

describe('aba de ranking', () => {
  const route = `/grupos/${GROUP_ID}/ranking`;
  const rankingResponse = (entries: RankingEntry[]) => () =>
    jsonResponse({ entries, gameId: null, period: 'all', since: null });

  it('mostra a classificação de cada pessoa, destacando quem está vendo', async () => {
    renderApp({
      route,
      signedIn: true,
      handlers: {
        ...BASE,
        'GET /api/v1/groups/{groupId}/ranking': rankingResponse([
          entry({
            memberId: 'm-ana',
            displayName: 'Ana',
            isMe: true,
            rank: 1,
            played: 4,
            wins: 3,
            winRate: 0.75,
            score: 21,
          }),
          entry(),
          entry({
            memberId: 'm-vovo',
            displayName: 'Vovó',
            hasAccount: false,
            rank: 3,
            played: 1,
            wins: 0,
            winRate: 0,
            score: 2,
          }),
        ]),
      },
    });

    const list = await screen.findByRole('list', { name: 'Ranking do grupo' });
    const rows = within(list).getAllByRole('listitem');
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent('1ºAna (você)3 vitórias em 4 partidas · 75%');
    expect(within(rows[0]!).getByRole('img', { name: 'Primeiro lugar' })).toBeInTheDocument();
    expect(rows[1]).toHaveTextContent('2ºBeto1 vitória em 3 partidas · 33%');
    expect(rows[2]).toHaveTextContent('3ºVovó0 vitórias em 1 partida · 0%');
  });

  it('muda o período e pede o ranking de novo com o filtro', async () => {
    const { user, api } = renderApp({
      route,
      signedIn: true,
      handlers: { ...BASE, 'GET /api/v1/groups/{groupId}/ranking': rankingResponse([entry({ rank: 1 })]) },
    });
    await screen.findByRole('list', { name: 'Ranking do grupo' });
    expect(api.called('GET /api/v1/groups/{groupId}/ranking')[0]?.search).toContain('period=all');

    await user.click(screen.getByRole('radio', { name: '7 dias' }));

    await waitFor(() => expect(api.called('GET /api/v1/groups/{groupId}/ranking')).toHaveLength(2));
    expect(api.called('GET /api/v1/groups/{groupId}/ranking')[1]?.search).toContain('period=week');
  });

  it('só oferece o filtro de jogo quando há mais de um jogo', async () => {
    const { user, api } = renderApp({
      route,
      signedIn: true,
      handlers: {
        ...BASE,
        'GET /api/v1/games': () =>
          jsonResponse([gameFixture(), gameFixture({ id: 'ano', name: 'Adivinhe o ano' })]),
        'GET /api/v1/groups/{groupId}/ranking': rankingResponse([entry({ rank: 1 })]),
      },
    });

    await user.click(await screen.findByRole('radio', { name: 'Adivinhe o ano' }));

    await waitFor(() =>
      expect(api.called('GET /api/v1/groups/{groupId}/ranking').at(-1)?.search).toContain('gameId=ano'),
    );
  });

  it('com um jogo só não há filtro de jogo', async () => {
    renderApp({
      route,
      signedIn: true,
      handlers: { ...BASE, 'GET /api/v1/groups/{groupId}/ranking': rankingResponse([entry({ rank: 1 })]) },
    });

    await screen.findByRole('list', { name: 'Ranking do grupo' });
    expect(screen.queryByRole('radiogroup', { name: 'Jogo' })).not.toBeInTheDocument();
  });

  it('sem resultados mostra o estado vazio', async () => {
    renderApp({
      route,
      signedIn: true,
      handlers: { ...BASE, 'GET /api/v1/groups/{groupId}/ranking': rankingResponse([]) },
    });

    expect(await screen.findByText('Ainda não há resultados')).toBeInTheDocument();
  });

  it('mostra o erro do servidor com a opção de tentar de novo', async () => {
    renderApp({
      route,
      signedIn: true,
      handlers: {
        ...BASE,
        'GET /api/v1/groups/{groupId}/ranking': () =>
          problemResponse(403, 'group.forbidden', 'Sem permissão.'),
      },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('Sem permissão.');
  });
});

describe('aba de histórico', () => {
  const route = `/grupos/${GROUP_ID}/historico`;

  it('lista as partidas encerradas com o placar e abre a partida', async () => {
    const { user, router } = renderApp({
      route,
      signedIn: true,
      handlers: {
        ...BASE,
        'GET /api/v1/groups/{groupId}/history': () =>
          jsonResponse({ items: [historyEntry('s-1'), historyEntry('s-2')], nextBefore: null }),
      },
    });

    const list = await screen.findByRole('list', { name: 'Partidas encerradas' });
    const links = within(list).getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveTextContent('Mímica');
    expect(links[0]).toHaveTextContent('Ana');
    expect(within(links[0]!).getAllByRole('img', { name: 'Vencedor' })).toHaveLength(1);

    await user.click(links[1]!);
    await waitFor(() => expect(router.state.location.pathname).toBe('/partidas/s-2'));
  });

  it('carrega mais usando o cursor da página anterior', async () => {
    const { user, api } = renderApp({
      route,
      signedIn: true,
      handlers: {
        ...BASE,
        'GET /api/v1/groups/{groupId}/history': (request) => {
          const before = new URL(request.url).searchParams.get('before');
          return jsonResponse(
            before
              ? { items: [historyEntry('s-3')], nextBefore: null }
              : { items: [historyEntry('s-1'), historyEntry('s-2')], nextBefore: '2026-10-03T00:00:00Z' },
          );
        },
      },
    });

    await screen.findByRole('list', { name: 'Partidas encerradas' });
    await user.click(screen.getByRole('button', { name: 'Carregar mais' }));

    await waitFor(() =>
      expect(
        within(screen.getByRole('list', { name: 'Partidas encerradas' })).getAllByRole('link'),
      ).toHaveLength(3),
    );
    expect(api.called('GET /api/v1/groups/{groupId}/history')[1]?.search).toContain(
      'before=2026-10-03T00%3A00%3A00Z',
    );
    expect(screen.queryByRole('button', { name: 'Carregar mais' })).not.toBeInTheDocument();
  });

  it('sem partidas encerradas mostra o estado vazio', async () => {
    renderApp({
      route,
      signedIn: true,
      handlers: {
        ...BASE,
        'GET /api/v1/groups/{groupId}/history': () => jsonResponse({ items: [], nextBefore: null }),
      },
    });

    expect(await screen.findByText('Nenhuma partida terminada')).toBeInTheDocument();
  });
});

describe('abas do grupo', () => {
  it('mostra todas as seções e leva ao ranking', async () => {
    const { user, router } = renderApp({
      route: `/grupos/${GROUP_ID}/partidas`,
      signedIn: true,
      handlers: {
        ...BASE,
        'GET /api/v1/groups/{groupId}/ranking': () =>
          jsonResponse({ entries: [], gameId: null, period: 'all', since: null }),
      },
    });

    const tabs = within(await screen.findByRole('navigation', { name: 'Seções do grupo' }));
    expect(tabs.getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Partidas',
      'Ranking',
      'Histórico',
      'Pessoas',
      'Ajustes',
    ]);

    await user.click(tabs.getByRole('link', { name: 'Ranking' }));
    await waitFor(() => expect(router.state.location.pathname).toBe(`/grupos/${GROUP_ID}/ranking`));
  });
});
