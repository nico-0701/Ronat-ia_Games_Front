import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { authFixture, jsonResponse, problemResponse, userFixture } from '@/test/helpers';
import { renderApp } from '@/test/renderApp';

const GROUPS_EMPTY = { 'GET /api/v1/groups': () => jsonResponse([]) };

describe('entrada por telefone', () => {
  it('mascara o número e entra quando a conta existe', async () => {
    const { user, api, services } = renderApp({
      route: '/entrar',
      handlers: {
        ...GROUPS_EMPTY,
        'POST /api/v1/auth/login': () =>
          jsonResponse(authFixture({ user: userFixture({ displayName: 'Ana' }) })),
      },
    });

    const field = await screen.findByLabelText('Seu celular');
    await user.type(field, '11988887777');
    expect(field).toHaveValue('(11) 98888-7777');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('heading', { name: 'Olá, Ana!' })).toBeInTheDocument();
    expect(await screen.findByText('Você ainda não está em nenhum grupo')).toBeInTheDocument();
    expect(api.calls.find((call) => call.key === 'POST /api/v1/auth/login')?.body).toMatchObject({
      phone: '(11) 98888-7777',
    });
    expect(services.session.getStatus()).toBe('authenticated');
  });

  it('mantém o botão desligado até o número parecer um telefone', async () => {
    const { user } = renderApp({ route: '/entrar' });

    const button = await screen.findByRole('button', { name: 'Entrar' });
    expect(button).toBeDisabled();
    await user.type(screen.getByLabelText('Seu celular'), '1198');
    expect(button).toBeDisabled();
    await user.type(screen.getByLabelText('Seu celular'), '88887777');
    expect(button).toBeEnabled();
  });

  it('leva para o cadastro quando não existe conta e cria a conta com o termo aceito', async () => {
    const { user, api } = renderApp({
      route: '/entrar',
      handlers: {
        ...GROUPS_EMPTY,
        'POST /api/v1/auth/login': () =>
          problemResponse(404, 'auth.user_not_found', 'Não existe conta com este telefone.'),
        'POST /api/v1/auth/register': () =>
          jsonResponse(
            { ...authFixture({ user: userFixture({ displayName: 'Beto' }) }), isNewUser: true },
            201,
          ),
      },
    });

    await user.type(await screen.findByLabelText('Seu celular'), '11988887777');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('heading', { name: 'Vamos criar a sua conta' })).toBeInTheDocument();
    const create = screen.getByRole('button', { name: 'Criar conta e entrar' });
    expect(create).toBeDisabled();

    await user.type(screen.getByLabelText('Seu nome'), 'Beto');
    await user.click(screen.getByRole('radio', { name: 'Estrela' }));
    expect(create).toBeDisabled(); // falta aceitar os termos
    await user.click(screen.getByRole('checkbox'));
    await user.click(create);

    expect(await screen.findByRole('heading', { name: 'Olá, Beto!' })).toBeInTheDocument();
    const register = api.calls.find((call) => call.key === 'POST /api/v1/auth/register');
    expect(register?.body).toEqual({
      phone: '(11) 98888-7777',
      displayName: 'Beto',
      avatarPreset: 'preset-3',
      acceptTerms: true,
    });
  });

  it('avisa que os cadastros estão fechados em vez de abrir o formulário', async () => {
    const { user } = renderApp({
      route: '/entrar',
      handlers: {
        'GET /api/v1/meta': () =>
          jsonResponse({
            apiVersion: '1',
            minClientVersion: '0.0.0',
            serverTimeUtc: new Date().toISOString(),
            auth: { captchaRequired: false, captchaSiteKey: null, registrationOpen: false },
          }),
        'POST /api/v1/auth/login': () => problemResponse(404, 'auth.user_not_found'),
      },
    });

    await user.type(await screen.findByLabelText('Seu celular'), '11988887777');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText(/cadastros estão fechados/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Vamos criar a sua conta' })).not.toBeInTheDocument();
  });

  it('mostra o motivo quando o telefone é recusado pelo servidor', async () => {
    const { user } = renderApp({
      route: '/entrar',
      handlers: {
        'POST /api/v1/auth/login': () =>
          problemResponse(400, 'auth.invalid_phone', 'Esse telefone não parece válido.'),
      },
    });

    await user.type(await screen.findByLabelText('Seu celular'), '11988887777');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Esse telefone não parece válido.');
  });

  it('quem já está logado não vê a tela de entrada', async () => {
    renderApp({
      route: '/entrar',
      signedIn: true,
      handlers: { ...GROUPS_EMPTY, 'GET /api/v1/users/me': () => jsonResponse(userFixture()) },
    });

    expect(await screen.findByRole('heading', { name: 'Olá, Ana!' })).toBeInTheDocument();
  });

  it('o cadastro sem número volta para a entrada', async () => {
    renderApp({ route: '/cadastro' });

    expect(await screen.findByLabelText('Seu celular')).toBeInTheDocument();
  });
});

describe('proteção das telas', () => {
  it('manda quem não entrou para a entrada e volta para a página pedida depois do login', async () => {
    const { user, router } = renderApp({
      route: '/perfil',
      handlers: {
        ...GROUPS_EMPTY,
        'POST /api/v1/auth/login': () => jsonResponse(authFixture()),
        'GET /api/v1/users/me': () => jsonResponse(userFixture()),
      },
    });

    expect(await screen.findByLabelText('Seu celular')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/entrar');

    await user.type(screen.getByLabelText('Seu celular'), '11988887777');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('heading', { name: 'Meu perfil' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/perfil');
  });

  it('exige atualizar o app quando o servidor pede uma versão mais nova', async () => {
    renderApp({
      route: '/entrar',
      handlers: {
        'GET /api/v1/meta': () =>
          jsonResponse({
            apiVersion: '1',
            minClientVersion: '99.0.0',
            serverTimeUtc: new Date().toISOString(),
            auth: { captchaRequired: false, captchaSiteKey: null, registrationOpen: true },
          }),
      },
    });

    expect(await screen.findByRole('heading', { name: 'Hora de atualizar' })).toBeInTheDocument();
  });

  it('calibra o relógio do servidor ao carregar', async () => {
    const ahead = new Date(Date.now() + 3_600_000).toISOString();
    const { clock } = renderApp({
      route: '/entrar',
      handlers: {
        'GET /api/v1/meta': () =>
          jsonResponse({
            apiVersion: '1',
            minClientVersion: '0.0.0',
            serverTimeUtc: ahead,
            auth: { captchaRequired: false, captchaSiteKey: null, registrationOpen: true },
          }),
      },
    });

    await waitFor(() => expect(Math.abs(clock.offset - 3_600_000)).toBeLessThan(2_000));
  });

  it('páginas que não existem mostram o aviso com o caminho de volta', async () => {
    renderApp({ route: '/nao-existe' });

    expect(await screen.findByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument();
  });
});
