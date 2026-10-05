import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { a11yViolations } from '@/test/a11y';
import { GROUP_ID, groupFixture, memberFixture, summaryOf } from '@/test/fixtures';
import { jsonResponse, userFixture } from '@/test/helpers';
import { renderApp } from '@/test/renderApp';
import { CARD, MY_MEMBER_ID, SESSION_ID, mimicaView, playerFixture, sessionFixture } from '@/test/sessions';

/** Verificação automática de acessibilidade (axe) das telas principais: rótulos, papéis ARIA, nomes de botões, listas, títulos. */

const ME = { 'GET /api/v1/users/me': () => jsonResponse(userFixture()) };
const GROUP = { 'GET /api/v1/groups/{groupId}': () => jsonResponse(groupFixture()) };

async function expectAccessible(container: HTMLElement) {
  expect(await a11yViolations(container)).toEqual([]);
}

describe('acessibilidade (axe)', () => {
  it('o verificador de fato pega problemas (botão sem nome, imagem sem texto alternativo, campo sem rótulo)', async () => {
    const broken = document.createElement('div');
    broken.innerHTML = '<button></button><img src="x.png"><input type="text">';
    document.body.appendChild(broken);

    const violations = await a11yViolations(broken);
    broken.remove();

    expect(violations.join('\n')).toMatch(/button-name/);
    expect(violations.join('\n')).toMatch(/image-alt/);
    expect(violations.join('\n')).toMatch(/label/);
  });

  it('entrada', async () => {
    const { container } = renderApp({ route: '/entrar' });
    await screen.findByLabelText('Seu celular');
    await expectAccessible(container);
  });

  it('cadastro', async () => {
    const { container } = renderApp({ route: '/cadastro' });
    await screen.findByLabelText('Seu celular'); // sem telefone cai na entrada
    await expectAccessible(container);
  });

  it('início com grupos', async () => {
    const group = groupFixture();
    const { container } = renderApp({
      route: '/',
      signedIn: true,
      handlers: { ...ME, 'GET /api/v1/groups': () => jsonResponse([summaryOf(group)]) },
    });
    await screen.findByRole('link', { name: /Família Silva/ });
    await expectAccessible(container);
  });

  it('textos de privacidade e termos', async () => {
    const privacy = renderApp({ route: '/privacidade' });
    await screen.findByRole('heading', { name: 'Aviso de privacidade' });
    await expectAccessible(privacy.container);
    privacy.unmount();

    const terms = renderApp({ route: '/termos' });
    await screen.findByRole('heading', { name: 'Termos de uso' });
    await expectAccessible(terms.container);
  });

  it('abas do grupo: partidas, pessoas, ranking, histórico e ajustes', async () => {
    for (const tab of ['partidas', 'membros', 'ranking', 'historico', 'ajustes']) {
      const { container, unmount } = renderApp({
        route: `/grupos/${GROUP_ID}/${tab}`,
        signedIn: true,
        handlers: {
          ...ME,
          ...GROUP,
          'GET /api/v1/groups/{groupId}/ranking': () =>
            jsonResponse({
              entries: [
                {
                  memberId: 'm1',
                  displayName: 'Ana',
                  avatar: { kind: 'preset', preset: 'preset-1', url: null },
                  hasAccount: true,
                  isMe: true,
                  rank: 1,
                  played: 2,
                  wins: 1,
                  winRate: 0.5,
                  score: 4,
                },
              ],
              gameId: null,
              period: 'all',
              since: null,
            }),
          'GET /api/v1/groups/{groupId}/history': () => jsonResponse({ items: [], nextBefore: null }),
        },
      });
      await screen.findByRole('navigation', { name: 'Seções do grupo' });
      await screen.findByRole('link', { name: 'Ajustes' });
      await new Promise((resolve) => setTimeout(resolve, 100)); // deixa a aba carregar os dados
      expect(await a11yViolations(container), `aba ${tab}`).toEqual([]);
      unmount();
    }
  });

  it('janelas (adicionar pessoa, opções de um membro)', async () => {
    const group = groupFixture();
    group.members.push(memberFixture({ displayName: 'Vovó', hasAccount: false }));
    const { user } = renderApp({
      route: `/grupos/${GROUP_ID}/membros`,
      signedIn: true,
      handlers: { ...ME, 'GET /api/v1/groups/{groupId}': () => jsonResponse(group) },
    });

    await user.click(await screen.findByRole('button', { name: 'Adicionar pessoa sem celular' }));
    const dialog = await screen.findByRole('dialog', { name: 'Adicionar pessoa' });
    expect(await a11yViolations(dialog)).toEqual([]);
  });

  it('lobby do anfitrião', async () => {
    const { container } = renderApp({
      route: `/partidas/${SESSION_ID}`,
      signedIn: true,
      handlers: {
        ...ME,
        ...GROUP,
        'GET /api/v1/sessions/{sessionId}': () => jsonResponse(sessionFixture()),
      },
    });
    await screen.findByRole('heading', { name: 'Quem vai jogar' });
    await expectAccessible(container);
  });

  it('Mímica: abertura da vez, valendo e chance de roubo', async () => {
    const players = [
      playerFixture({
        id: 'p-ana',
        memberId: MY_MEMBER_ID,
        displayName: 'Ana',
        isMe: true,
        seat: 0,
        team: 0,
      }),
      playerFixture({ id: 'p-beto', displayName: 'Beto', seat: 1, team: 1 }),
    ];
    const live = new Date(Date.now() + 40_000).toISOString();
    const phases: [string, Record<string, unknown>, string[], string][] = [
      ['abertura', { performerPlayerId: 'p-ana' }, ['startTurn'], 'Ver minha mímica'],
      [
        'valendo',
        { phase: 'playing', playEndsAt: live, card: CARD },
        ['reportHit', 'reportMiss'],
        'Acertou!',
      ],
      [
        'roubo',
        { phase: 'steal', stealEndsAt: live, card: CARD },
        ['reportStealHit', 'reportStealMiss'],
        'Roubaram o ponto!',
      ],
    ];

    for (const [name, view, allowed, marker] of phases) {
      const { container, unmount } = renderApp({
        route: `/partidas/${SESSION_ID}`,
        signedIn: true,
        handlers: {
          ...ME,
          ...GROUP,
          'GET /api/v1/sessions/{sessionId}': () =>
            jsonResponse(
              sessionFixture({
                status: 'inProgress',
                version: 5,
                players,
                allowedActions: allowed,
                view: mimicaView(view),
              }),
            ),
        },
      });
      await screen.findByRole('button', { name: marker });
      expect(await a11yViolations(container), `fase ${name}`).toEqual([]);
      unmount();
    }
  });

  it('resultado da partida', async () => {
    const base = sessionFixture();
    const { container } = renderApp({
      route: `/partidas/${SESSION_ID}`,
      signedIn: true,
      handlers: {
        ...ME,
        ...GROUP,
        'GET /api/v1/sessions/{sessionId}': () =>
          jsonResponse(
            sessionFixture({
              status: 'finished',
              version: 9,
              teamScores: [
                { team: 0, score: 3 },
                { team: 1, score: 1 },
              ],
              standings: [
                {
                  playerId: 'p-ana',
                  memberId: MY_MEMBER_ID,
                  displayName: 'Ana',
                  team: 0,
                  rank: 1,
                  score: 3,
                  isWinner: true,
                },
                {
                  playerId: 'p-beto',
                  memberId: base.players[1]!.memberId,
                  displayName: 'Beto',
                  team: 1,
                  rank: 2,
                  score: 1,
                  isWinner: false,
                },
              ],
            }),
          ),
      },
    });
    await screen.findByRole('heading', { name: 'Classificação' });
    await expectAccessible(container);
  });

  it('perfil', async () => {
    const { container } = renderApp({ route: '/perfil', signedIn: true, handlers: ME });
    await screen.findByRole('heading', { name: 'Meus dados' });
    await expectAccessible(container);
  });

  it('janela de excluir a conta', async () => {
    const { user } = renderApp({ route: '/perfil', signedIn: true, handlers: ME });
    await user.click(await screen.findByRole('button', { name: 'Excluir minha conta' }));
    const dialog = await screen.findByRole('dialog', { name: 'Excluir a conta?' });
    expect(within(dialog).getByLabelText('Confirmação')).toBeInTheDocument();
    expect(await a11yViolations(dialog)).toEqual([]);
  });
});
