import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { jsonResponse, problemResponse, userFixture } from '@/test/helpers';
import { renderApp } from '@/test/renderApp';

describe('perfil', () => {
  it('troca o nome e mostra a confirmação', async () => {
    let current = userFixture({ displayName: 'Ana' });
    const { user, api } = renderApp({
      route: '/perfil',
      signedIn: true,
      handlers: {
        'GET /api/v1/users/me': () => jsonResponse(current),
        'PATCH /api/v1/users/me': async (request) => {
          const body = (await request.json()) as { displayName: string };
          current = userFixture({ displayName: body.displayName });
          return jsonResponse(current);
        },
      },
    });

    const field = await screen.findByLabelText('Seu nome');
    await waitFor(() => expect(field).toHaveValue('Ana'));
    const save = screen.getByRole('button', { name: 'Salvar nome' });
    expect(save).toBeDisabled();

    await user.clear(field);
    await user.type(field, '  Ana Maria ');
    await user.click(save);

    expect(await screen.findByText('Nome atualizado!')).toBeInTheDocument();
    expect(api.calls.find((call) => call.key === 'PATCH /api/v1/users/me')?.body).toEqual({
      displayName: 'Ana Maria',
    });
    expect(await screen.findByRole('heading', { name: 'Ana Maria' })).toBeInTheDocument();
  });

  it('mostra o erro de validação do servidor embaixo do campo', async () => {
    const { user } = renderApp({
      route: '/perfil',
      signedIn: true,
      handlers: {
        'GET /api/v1/users/me': () => jsonResponse(userFixture()),
        'PATCH /api/v1/users/me': () =>
          problemResponse(400, 'user.display_name_invalid', 'O nome não pode ter caracteres invisíveis.', {
            errors: { displayName: ['O nome não pode ter caracteres invisíveis.'] },
          }),
      },
    });

    const field = await screen.findByLabelText('Seu nome');
    await waitFor(() => expect(field).toHaveValue('Ana'));
    await user.type(field, 'x');
    await user.click(screen.getByRole('button', { name: 'Salvar nome' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('caracteres invisíveis');
  });

  it('escolher outro avatar manda só o avatar', async () => {
    const { user, api } = renderApp({
      route: '/perfil',
      signedIn: true,
      handlers: {
        'GET /api/v1/users/me': () => jsonResponse(userFixture()),
        'PATCH /api/v1/users/me': () =>
          jsonResponse(userFixture({ avatar: { kind: 'preset', preset: 'preset-4', url: null } })),
      },
    });

    await user.click(await screen.findByRole('radio', { name: 'Plantinha' }));

    expect(await screen.findByText('Avatar atualizado!')).toBeInTheDocument();
    expect(api.calls.find((call) => call.key === 'PATCH /api/v1/users/me')?.body).toEqual({
      avatarPreset: 'preset-4',
    });
  });

  it('sair encerra a sessão, limpa os dados e volta para a entrada', async () => {
    const { user, services, router } = renderApp({
      route: '/perfil',
      signedIn: true,
      handlers: {
        'GET /api/v1/users/me': () => jsonResponse(userFixture()),
        'POST /api/v1/auth/logout': () => jsonResponse(null, 204),
      },
    });

    await user.click(await screen.findByRole('button', { name: 'Sair deste aparelho' }));

    expect(await screen.findByLabelText('Seu celular')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/entrar');
    expect(services.session.getStatus()).toBe('anonymous');
    expect(services.queryClient.getQueryData(['me'])).toBeUndefined();
  });

  it('sai mesmo quando o servidor não responde', async () => {
    const { user, services } = renderApp({
      route: '/perfil',
      signedIn: true,
      handlers: {
        'GET /api/v1/users/me': () => jsonResponse(userFixture()),
        'POST /api/v1/auth/logout': () => {
          throw new TypeError('Failed to fetch');
        },
      },
    });

    await user.click(await screen.findByRole('button', { name: 'Sair deste aparelho' }));

    await waitFor(() => expect(services.session.getStatus()).toBe('anonymous'));
  });
});
