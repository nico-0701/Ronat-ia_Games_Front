import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { jsonResponse, problemResponse, userFixture } from '@/test/helpers';
import { GROUP_ID, groupFixture, memberFixture, summaryOf } from '@/test/fixtures';
import { renderApp } from '@/test/renderApp';

const ME = { 'GET /api/v1/users/me': () => jsonResponse(userFixture()) };

describe('início com grupos', () => {
  it('lista os grupos e abre um deles na aba de pessoas', async () => {
    const group = groupFixture();
    const { user, router } = renderApp({
      route: '/',
      signedIn: true,
      handlers: {
        ...ME,
        'GET /api/v1/groups': () => jsonResponse([summaryOf(group)]),
        'GET /api/v1/groups/{groupId}': () => jsonResponse(group),
      },
    });

    await user.click(await screen.findByRole('link', { name: /Família Silva/ }));

    expect(await screen.findByRole('heading', { name: 'Quem está no grupo' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(`/grupos/${GROUP_ID}/membros`);
  });
});

describe('criar grupo', () => {
  it('cria o grupo e mostra a senha para convidar', async () => {
    const created = groupFixture({ name: 'Amigos da faculdade' });
    const { user, api, router } = renderApp({
      route: '/grupos/novo',
      signedIn: true,
      handlers: {
        ...ME,
        'POST /api/v1/groups': () => jsonResponse(created, 201),
        'GET /api/v1/groups': () => jsonResponse([summaryOf(created)]),
      },
    });

    const create = await screen.findByRole('button', { name: 'Criar grupo' });
    expect(create).toBeDisabled();
    await user.type(screen.getByLabelText('Nome do grupo'), '  Amigos da faculdade ');
    await user.click(create);

    expect(await screen.findByText('K7RM-4PXT')).toBeInTheDocument();
    expect(api.called('POST /api/v1/groups')[0]?.body).toEqual({ name: 'Amigos da faculdade' });
    expect(router.state.location.pathname).toBe(`/grupos/${GROUP_ID}/membros`);
  });

  it('mostra o erro de nome do servidor embaixo do campo', async () => {
    const { user } = renderApp({
      route: '/grupos/novo',
      signedIn: true,
      handlers: {
        ...ME,
        'POST /api/v1/groups': () =>
          problemResponse(400, 'group.name_invalid', 'O nome do grupo precisa ter de 2 a 40 letras.', {
            errors: { name: ['O nome do grupo precisa ter de 2 a 40 letras.'] },
          }),
      },
    });

    await user.type(await screen.findByLabelText('Nome do grupo'), 'ab');
    await user.click(screen.getByRole('button', { name: 'Criar grupo' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('de 2 a 40 letras');
  });
});

describe('entrar num grupo', () => {
  const preview = {
    name: 'Família Silva',
    memberCount: 3,
    alreadyMember: false,
    claimableMembers: [
      {
        id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        displayName: 'Vovó Lúcia',
        avatar: { kind: 'preset', preset: 'preset-4', url: null },
      },
    ],
  };

  it('confere a senha, deixa assumir um perfil e entra', async () => {
    const joined = groupFixture({ myRole: 'member' });
    const { user, api, router } = renderApp({
      route: '/grupos/entrar',
      signedIn: true,
      handlers: {
        ...ME,
        'POST /api/v1/groups/lookup': () => jsonResponse(preview),
        'POST /api/v1/groups/join': () => jsonResponse(joined),
        'GET /api/v1/groups': () => jsonResponse([summaryOf(joined)]),
      },
    });

    const field = await screen.findByLabelText('Senha do grupo');
    await user.type(field, 'k7rm4pxt');
    expect(field).toHaveValue('K7RM-4PXT');
    await user.click(screen.getByRole('button', { name: 'Conferir senha' }));

    expect(await screen.findByRole('heading', { name: 'Família Silva' })).toBeInTheDocument();
    expect(api.called('POST /api/v1/groups/lookup')[0]?.body).toEqual({ code: 'K7RM4PXT' });
    await user.click(screen.getByRole('radio', { name: /Vovó Lúcia/ }));
    await user.click(screen.getByRole('button', { name: 'Entrar no grupo' }));

    await waitFor(() => expect(router.state.location.pathname).toBe(`/grupos/${GROUP_ID}/membros`));
    expect(api.called('POST /api/v1/groups/join')[0]?.body).toEqual({
      code: 'K7RM4PXT',
      claimMemberId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    });
  });

  it('o link de convite já traz a senha e confere sozinho', async () => {
    const { api } = renderApp({
      route: '/grupos/entrar#K7RM4PXT',
      signedIn: true,
      handlers: { ...ME, 'POST /api/v1/groups/lookup': () => jsonResponse(preview) },
    });

    expect(await screen.findByRole('heading', { name: 'Família Silva' })).toBeInTheDocument();
    expect(screen.getByLabelText('Senha do grupo')).toHaveValue('K7RM-4PXT');
    expect(api.called('POST /api/v1/groups/lookup')).toHaveLength(1);
  });

  it('sem escolher perfil, entra como pessoa nova', async () => {
    const joined = groupFixture({ myRole: 'member' });
    const { user, api } = renderApp({
      route: '/grupos/entrar#K7RM4PXT',
      signedIn: true,
      handlers: {
        ...ME,
        'POST /api/v1/groups/lookup': () => jsonResponse(preview),
        'POST /api/v1/groups/join': () => jsonResponse(joined),
        'GET /api/v1/groups': () => jsonResponse([]),
      },
    });

    await user.click(await screen.findByRole('button', { name: 'Entrar no grupo' }));

    await waitFor(() => expect(api.called('POST /api/v1/groups/join')).toHaveLength(1));
    expect(api.called('POST /api/v1/groups/join')[0]?.body).toEqual({ code: 'K7RM4PXT' });
  });

  it('avisa quando a senha não vale', async () => {
    const { user } = renderApp({
      route: '/grupos/entrar',
      signedIn: true,
      handlers: {
        ...ME,
        'POST /api/v1/groups/lookup': () => problemResponse(404, 'group.invalid_code', 'Senha inválida.'),
      },
    });

    await user.type(await screen.findByLabelText('Senha do grupo'), 'K7RM4PXT');
    await user.click(screen.getByRole('button', { name: 'Conferir senha' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Senha inválida.');
  });

  it('quem já é membro vê o aviso e abre o grupo', async () => {
    const group = groupFixture({ myRole: 'member' });
    const { user, router } = renderApp({
      route: '/grupos/entrar#K7RM4PXT',
      signedIn: true,
      handlers: {
        ...ME,
        'POST /api/v1/groups/lookup': () =>
          jsonResponse({ ...preview, alreadyMember: true, claimableMembers: [] }),
        'POST /api/v1/groups/join': () => jsonResponse(group),
        'GET /api/v1/groups': () => jsonResponse([summaryOf(group)]),
      },
    });

    expect(await screen.findByText(/você já está neste grupo/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Abrir o grupo' }));

    await waitFor(() => expect(router.state.location.pathname).toBe(`/grupos/${GROUP_ID}/membros`));
  });
});

describe('aba de pessoas', () => {
  const route = `/grupos/${GROUP_ID}/membros`;

  it('o dono vê a senha e os controles de gerenciar', async () => {
    renderApp({
      route,
      signedIn: true,
      handlers: { ...ME, 'GET /api/v1/groups/{groupId}': () => jsonResponse(groupFixture()) },
    });

    expect(await screen.findByText('K7RM-4PXT')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Compartilhar convite' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gerar outra senha' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Desligar a senha' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Adicionar pessoa sem celular' })).toBeInTheDocument();
  });

  it('o membro comum vê a senha mas não gerencia nada', async () => {
    renderApp({
      route,
      signedIn: true,
      handlers: {
        ...ME,
        'GET /api/v1/groups/{groupId}': () => jsonResponse(groupFixture({ myRole: 'member' })),
      },
    });

    expect(await screen.findByText('K7RM-4PXT')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copiar a senha' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Gerar outra senha' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Desligar a senha' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Adicionar pessoa sem celular' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Opções de Beto/ })).not.toBeInTheDocument();
  });

  it('com a senha desligada, o administrador pode ligar de novo', async () => {
    let group = groupFixture({ myRole: 'admin', inviteCode: null, inviteEnabled: false });
    const { user, api } = renderApp({
      route,
      signedIn: true,
      handlers: {
        ...ME,
        'GET /api/v1/groups/{groupId}': () => jsonResponse(group),
        'PATCH /api/v1/groups/{groupId}': () => {
          group = groupFixture({ myRole: 'admin' });
          return jsonResponse(group);
        },
        'GET /api/v1/groups': () => jsonResponse([summaryOf(group)]),
      },
    });

    await user.click(await screen.findByRole('button', { name: 'Ligar a senha' }));

    expect(await screen.findByText('K7RM-4PXT')).toBeInTheDocument();
    expect(api.called('PATCH /api/v1/groups/{groupId}')[0]?.body).toEqual({ inviteEnabled: true });
  });

  it('gerar outra senha pede confirmação e mostra a nova', async () => {
    let group = groupFixture();
    const { user } = renderApp({
      route,
      signedIn: true,
      handlers: {
        ...ME,
        'GET /api/v1/groups/{groupId}': () => jsonResponse(group),
        'POST /api/v1/groups/{groupId}/invite-code': () => {
          group = groupFixture({ inviteCode: 'ZZZZ2222' });
          return jsonResponse(group);
        },
        'GET /api/v1/groups': () => jsonResponse([summaryOf(group)]),
      },
    });

    await user.click(await screen.findByRole('button', { name: 'Gerar outra senha' }));
    const dialog = await screen.findByRole('dialog', { name: 'Gerar outra senha?' });
    await user.click(within(dialog).getByRole('button', { name: 'Gerar outra senha' }));

    expect(await screen.findByText('ZZZZ-2222')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('o dono adiciona uma pessoa sem celular', async () => {
    const group = groupFixture();
    const { user, api } = renderApp({
      route,
      signedIn: true,
      handlers: {
        ...ME,
        'GET /api/v1/groups/{groupId}': () => jsonResponse(group),
        'POST /api/v1/groups/{groupId}/members': () =>
          jsonResponse(memberFixture({ displayName: 'Vovó Lúcia', hasAccount: false }), 201),
      },
    });

    await user.click(await screen.findByRole('button', { name: 'Adicionar pessoa sem celular' }));
    const dialog = await screen.findByRole('dialog', { name: 'Adicionar pessoa' });
    await user.type(within(dialog).getByLabelText('Nome'), 'Vovó Lúcia');
    await user.click(within(dialog).getByRole('radio', { name: 'Plantinha' }));
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(api.called('POST /api/v1/groups/{groupId}/members')[0]?.body).toEqual({
      displayName: 'Vovó Lúcia',
      avatarPreset: 'preset-4',
    });
  });

  it('o dono remove um membro depois de confirmar', async () => {
    const group = groupFixture();
    const beto = group.members.find((member) => member.displayName === 'Beto')!;
    const { user, api } = renderApp({
      route,
      signedIn: true,
      handlers: {
        ...ME,
        'GET /api/v1/groups/{groupId}': () => jsonResponse(group),
        'DELETE /api/v1/groups/{groupId}/members/{memberId}': () => jsonResponse(null, 204),
      },
    });

    await user.click(await screen.findByRole('button', { name: 'Opções de Beto' }));
    await user.click(await screen.findByRole('button', { name: 'Remover do grupo' }));
    const confirm = await screen.findByRole('dialog', { name: 'Remover Beto?' });
    await user.click(within(confirm).getByRole('button', { name: 'Remover do grupo' }));

    await waitFor(() =>
      expect(api.called('DELETE /api/v1/groups/{groupId}/members/{memberId}')).toHaveLength(1),
    );
    expect(api.called('DELETE /api/v1/groups/{groupId}/members/{memberId}')[0]?.key).toBe(
      `DELETE /api/v1/groups/${GROUP_ID}/members/${beto.id}`,
    );
  });

  it('o administrador não vê opções para outro administrador', async () => {
    const group = groupFixture({ myRole: 'admin' });
    group.members.push(memberFixture({ displayName: 'Carla', role: 'admin' }));
    renderApp({
      route,
      signedIn: true,
      handlers: { ...ME, 'GET /api/v1/groups/{groupId}': () => jsonResponse(group) },
    });

    await screen.findByText('Carla');
    expect(screen.queryByRole('button', { name: 'Opções de Carla' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Opções de Beto' })).toBeInTheDocument(); // membro comum: pode remover
  });

  it('o dono promove um membro a administrador', async () => {
    const group = groupFixture();
    const { user, api } = renderApp({
      route,
      signedIn: true,
      handlers: {
        ...ME,
        'GET /api/v1/groups/{groupId}': () => jsonResponse(group),
        'PATCH /api/v1/groups/{groupId}/members/{memberId}': () =>
          jsonResponse(memberFixture({ role: 'admin' })),
      },
    });

    await user.click(await screen.findByRole('button', { name: 'Opções de Beto' }));
    await user.click(await screen.findByRole('button', { name: 'Tornar administrador' }));

    await waitFor(() =>
      expect(api.called('PATCH /api/v1/groups/{groupId}/members/{memberId}')).toHaveLength(1),
    );
    expect(api.called('PATCH /api/v1/groups/{groupId}/members/{memberId}')[0]?.body).toEqual({
      role: 'admin',
    });
  });
});

describe('ajustes do grupo', () => {
  const route = `/grupos/${GROUP_ID}/ajustes`;

  it('o membro sai do grupo e volta para o início', async () => {
    const group = groupFixture({ myRole: 'member' });
    const { user, router, api } = renderApp({
      route,
      signedIn: true,
      handlers: {
        ...ME,
        'GET /api/v1/groups/{groupId}': () => jsonResponse(group),
        'DELETE /api/v1/groups/{groupId}/members/me': () => jsonResponse(null, 204),
        'GET /api/v1/groups': () => jsonResponse([]),
      },
    });

    expect(screen.queryByRole('button', { name: 'Excluir o grupo' })).not.toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'Sair do grupo' }));
    const dialog = await screen.findByRole('dialog', { name: 'Sair do grupo?' });
    await user.click(within(dialog).getByRole('button', { name: 'Sair do grupo' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(api.called('DELETE /api/v1/groups/{groupId}/members/me')).toHaveLength(1);
  });

  it('o dono não pode sair, mas pode excluir digitando a confirmação', async () => {
    const group = groupFixture();
    const { user, router, api } = renderApp({
      route,
      signedIn: true,
      handlers: {
        ...ME,
        'GET /api/v1/groups/{groupId}': () => jsonResponse(group),
        'DELETE /api/v1/groups/{groupId}': () => jsonResponse(null, 204),
        'GET /api/v1/groups': () => jsonResponse([]),
      },
    });

    expect(await screen.findByRole('button', { name: 'Sair do grupo' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Excluir o grupo' }));
    const dialog = await screen.findByRole('dialog', { name: 'Excluir o grupo?' });
    const confirm = within(dialog).getByRole('button', { name: 'Excluir para sempre' });
    expect(confirm).toBeDisabled();
    await user.type(within(dialog).getByLabelText('Confirmação'), 'excluir');
    await user.click(confirm);

    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(api.called('DELETE /api/v1/groups/{groupId}')[0]?.body).toEqual({ confirmation: 'EXCLUIR' });
  });

  it('o administrador renomeia o grupo', async () => {
    let group = groupFixture({ myRole: 'admin' });
    const { user, api } = renderApp({
      route,
      signedIn: true,
      handlers: {
        ...ME,
        'GET /api/v1/groups/{groupId}': () => jsonResponse(group),
        'PATCH /api/v1/groups/{groupId}': () => {
          group = groupFixture({ myRole: 'admin', name: 'Família Souza' });
          return jsonResponse(group);
        },
        'GET /api/v1/groups': () => jsonResponse([summaryOf(group)]),
      },
    });

    const field = await screen.findByLabelText('Nome do grupo');
    await user.clear(field);
    await user.type(field, 'Família Souza');
    await user.click(screen.getByRole('button', { name: 'Salvar nome' }));

    expect(await screen.findByText('Nome do grupo atualizado!')).toBeInTheDocument();
    expect(api.called('PATCH /api/v1/groups/{groupId}')[0]?.body).toEqual({ name: 'Família Souza' });
    expect(await screen.findByRole('heading', { name: 'Família Souza' })).toBeInTheDocument();
  });

  it('o membro comum não vê o campo de renomear', async () => {
    renderApp({
      route,
      signedIn: true,
      handlers: {
        ...ME,
        'GET /api/v1/groups/{groupId}': () => jsonResponse(groupFixture({ myRole: 'member' })),
      },
    });

    await screen.findByRole('heading', { name: 'Sair do grupo' });
    expect(screen.queryByLabelText('Nome do grupo')).not.toBeInTheDocument();
  });
});

describe('grupo inexistente', () => {
  it('mostra um aviso amigável quando o servidor responde 404', async () => {
    renderApp({
      route: `/grupos/${GROUP_ID}/membros`,
      signedIn: true,
      handlers: {
        ...ME,
        'GET /api/v1/groups/{groupId}': () =>
          problemResponse(404, 'group.not_found', 'Grupo não encontrado.'),
      },
    });

    expect(await screen.findByRole('heading', { name: 'Grupo não encontrado' })).toBeInTheDocument();
  });
});
