import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, problemResponse, userFixture } from '@/test/helpers';
import { renderApp } from '@/test/renderApp';

const download = vi.hoisted(() => vi.fn());
vi.mock('@/lib/download', () => ({ downloadJson: download }));

const ME = { 'GET /api/v1/users/me': () => jsonResponse(userFixture()) };
const STATS = {
  'GET /api/v1/users/me/stats': () =>
    jsonResponse({
      played: 8,
      wins: 5,
      groups: 2,
      byGame: [{ gameId: 'mimica', played: 8, wins: 5, score: 31 }],
    }),
};
const DEVICES = {
  'GET /api/v1/auth/sessions': () =>
    jsonResponse([
      {
        id: 'd-1',
        deviceLabel: 'Windows · Chrome',
        isCurrent: true,
        createdAt: '2026-10-01T10:00:00Z',
        lastUsedAt: '2026-10-05T10:00:00Z',
      },
      {
        id: 'd-2',
        deviceLabel: 'Android',
        isCurrent: false,
        createdAt: '2026-09-20T10:00:00Z',
        lastUsedAt: '2026-10-02T10:00:00Z',
      },
    ]),
};
const ALL = { ...ME, ...STATS, ...DEVICES };

beforeEach(() => download.mockReset());

describe('estatísticas', () => {
  it('mostra os números e o detalhe por jogo', async () => {
    renderApp({ route: '/perfil', signedIn: true, handlers: ALL });

    const card = (await screen.findByRole('heading', { name: 'Minhas estatísticas' })).closest('section')!;
    expect(within(card).getByText('Partidas').nextSibling).toHaveTextContent('8');
    expect(within(card).getByText('Vitórias').nextSibling).toHaveTextContent('5');
    expect(within(card).getByText('Grupos').nextSibling).toHaveTextContent('2');
    expect(within(card).getByText(/8 partidas · 5 vitórias · 31 pontos/)).toBeInTheDocument();
  });

  it('sem partidas convida a jogar', async () => {
    renderApp({
      route: '/perfil',
      signedIn: true,
      handlers: {
        ...ALL,
        'GET /api/v1/users/me/stats': () => jsonResponse({ played: 0, wins: 0, groups: 0, byGame: [] }),
      },
    });

    expect(await screen.findByText(/Jogue uma partida/)).toBeInTheDocument();
  });
});

describe('aparelhos conectados', () => {
  it('lista os aparelhos e marca o atual', async () => {
    renderApp({ route: '/perfil', signedIn: true, handlers: ALL });

    expect(await screen.findByText('Windows · Chrome')).toBeInTheDocument();
    expect(screen.getByText('Este aparelho')).toBeInTheDocument();
    expect(screen.getByText('Android')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Desconectar / })).toHaveLength(1); // o atual não tem
  });

  it('desconecta outro aparelho', async () => {
    const { user, api } = renderApp({
      route: '/perfil',
      signedIn: true,
      handlers: { ...ALL, 'DELETE /api/v1/auth/sessions/{sessionId}': () => jsonResponse(null, 204) },
    });

    await user.click(await screen.findByRole('button', { name: 'Desconectar Android' }));

    expect(await screen.findByText('Aparelho desconectado.')).toBeInTheDocument();
    expect(api.calls.find((call) => call.key.startsWith('DELETE'))?.key).toBe(
      'DELETE /api/v1/auth/sessions/d-2',
    );
  });

  it('sair de todos os aparelhos encerra também esta sessão', async () => {
    const { user, router, services } = renderApp({
      route: '/perfil',
      signedIn: true,
      handlers: { ...ALL, 'POST /api/v1/auth/logout-all': () => jsonResponse(null, 204) },
    });

    await user.click(await screen.findByRole('button', { name: 'Sair de todos os aparelhos' }));
    const dialog = await screen.findByRole('dialog', { name: 'Sair de todos os aparelhos?' });
    await user.click(within(dialog).getByRole('button', { name: 'Sair de todos' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/entrar'));
    expect(services.session.getStatus()).toBe('anonymous');
  });
});

describe('meus dados (LGPD)', () => {
  it('baixa a cópia dos dados como arquivo', async () => {
    const data = {
      exportedAt: '2026-10-05T12:00:00Z',
      profile: { id: 'x', displayName: 'Ana' },
      logins: [],
      memberships: [],
      results: [],
    };
    const { user } = renderApp({
      route: '/perfil',
      signedIn: true,
      handlers: { ...ALL, 'GET /api/v1/users/me/export': () => jsonResponse(data) },
    });

    await user.click(await screen.findByRole('button', { name: 'Baixar meus dados' }));

    expect(await screen.findByText(/arquivo com os seus dados foi baixado/)).toBeInTheDocument();
    expect(download).toHaveBeenCalledTimes(1);
    expect(download.mock.calls[0]![0]).toMatch(/^ronat-ia-meus-dados-\d{4}-\d{2}-\d{2}\.json$/);
    expect(download.mock.calls[0]![1]).toEqual(data);
  });

  it('mostra o erro quando o limite de baixar foi atingido', async () => {
    const { user } = renderApp({
      route: '/perfil',
      signedIn: true,
      handlers: {
        ...ALL,
        'GET /api/v1/users/me/export': () =>
          problemResponse(429, 'rate_limit.exceeded', 'Muitas tentativas. Aguarde.'),
      },
    });

    await user.click(await screen.findByRole('button', { name: 'Baixar meus dados' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Muitas tentativas');
    expect(download).not.toHaveBeenCalled();
  });
});

describe('excluir a conta', () => {
  async function openDialog(user: ReturnType<typeof userEvent.setup>) {
    await user.click(await screen.findByRole('button', { name: 'Excluir minha conta' }));
    return screen.findByRole('dialog', { name: 'Excluir a conta?' });
  }

  it('só libera depois de digitar EXCLUIR e leva para a entrada', async () => {
    const { user, api, router, services } = renderApp({
      route: '/perfil',
      signedIn: true,
      handlers: { ...ALL, 'DELETE /api/v1/users/me': () => jsonResponse(null, 204) },
    });

    const dialog = await openDialog(user);
    const confirm = within(dialog).getByRole('button', { name: 'Excluir para sempre' });
    expect(confirm).toBeDisabled();
    await user.type(within(dialog).getByLabelText('Confirmação'), 'excluir');
    await user.click(confirm);

    await waitFor(() => expect(router.state.location.pathname).toBe('/entrar'));
    expect(api.called('DELETE /api/v1/users/me')[0]?.body).toEqual({ confirmation: 'EXCLUIR' });
    expect(services.session.getStatus()).toBe('anonymous');
  });

  it('quem é dono de grupo com outras pessoas vê quais grupos impedem', async () => {
    const { user, services } = renderApp({
      route: '/perfil',
      signedIn: true,
      handlers: {
        ...ALL,
        'DELETE /api/v1/users/me': () =>
          problemResponse(409, 'user.owns_groups', 'Transfira a propriedade antes.', {
            errors: { groups: ['Família Silva', 'Turma do trabalho'] },
          }),
      },
    });

    const dialog = await openDialog(user);
    await user.type(within(dialog).getByLabelText('Confirmação'), 'EXCLUIR');
    await user.click(within(dialog).getByRole('button', { name: 'Excluir para sempre' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Família Silva, Turma do trabalho');
    expect(services.session.getStatus()).toBe('authenticated');
  });
});

describe('foto do perfil', () => {
  it('envia a foto escolhida e mostra a confirmação', async () => {
    let user = userFixture();
    const { api } = renderApp({
      route: '/perfil',
      signedIn: true,
      handlers: {
        ...ALL,
        'GET /api/v1/users/me': () => jsonResponse(user),
        'PUT /api/v1/users/me/avatar': () => {
          user = userFixture({ avatar: { kind: 'photo', preset: null, url: '/api/v1/avatars/abc' } });
          return jsonResponse(user);
        },
      },
    });
    const picker = userEvent.setup();

    await picker.upload(
      await screen.findByLabelText('Escolher foto'),
      new File(['jpg'], 'eu.jpg', { type: 'image/jpeg' }),
    );

    expect(await screen.findByText('Foto atualizada!')).toBeInTheDocument();
    expect(api.called('PUT /api/v1/users/me/avatar')).toHaveLength(1);
    expect(await screen.findByRole('button', { name: 'Tirar a foto' })).toBeInTheDocument();
  });

  it('recusa arquivos que não são imagem sem falar com o servidor', async () => {
    const { api } = renderApp({ route: '/perfil', signedIn: true, handlers: ALL });
    const picker = userEvent.setup({ applyAccept: false });

    await picker.upload(
      await screen.findByLabelText('Escolher foto'),
      new File(['texto'], 'nota.txt', { type: 'text/plain' }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Escolha um arquivo de imagem');
    expect(api.called('PUT /api/v1/users/me/avatar')).toHaveLength(0);
  });

  it('mostra o motivo quando o servidor recusa a imagem', async () => {
    renderApp({
      route: '/perfil',
      signedIn: true,
      handlers: {
        ...ALL,
        'PUT /api/v1/users/me/avatar': () =>
          problemResponse(400, 'avatar.invalid_image', 'Esse arquivo não é uma imagem válida.'),
      },
    });
    const picker = userEvent.setup();

    await picker.upload(
      await screen.findByLabelText('Escolher foto'),
      new File(['x'], 'quebrada.jpg', { type: 'image/jpeg' }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('não é uma imagem válida');
  });

  it('tira a foto e volta ao avatar padrão', async () => {
    const withPhoto = userFixture({ avatar: { kind: 'photo', preset: null, url: '/api/v1/avatars/abc' } });
    const { user, api } = renderApp({
      route: '/perfil',
      signedIn: true,
      handlers: {
        ...ALL,
        'GET /api/v1/users/me': () => jsonResponse(withPhoto),
        'DELETE /api/v1/users/me/avatar': () => jsonResponse(userFixture()),
      },
    });

    await user.click(await screen.findByRole('button', { name: 'Tirar a foto' }));

    expect(await screen.findByText('Foto removida.')).toBeInTheDocument();
    expect(api.called('DELETE /api/v1/users/me/avatar')).toHaveLength(1);
  });
});
