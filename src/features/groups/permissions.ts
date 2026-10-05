import type { GroupRole } from '@/api/types';

/**
 * O que cada papel pode fazer num grupo. É só para a interface mostrar ou esconder botões: quem decide é o servidor
 * (`docs/API.md` do Back), que responde 403 a quem tenta sem poder.
 */

/** Renomear o grupo e ligar, desligar ou trocar a senha. */
export function canManageGroup(role: GroupRole): boolean {
  return role === 'owner' || role === 'admin';
}

/** Criar, editar e remover perfis sem conta. */
export function canManageProfiles(role: GroupRole): boolean {
  return role === 'owner' || role === 'admin';
}

/** Remover um membro: o dono remove qualquer um (menos a si), o admin só membros comuns. */
export function canRemoveMember(myRole: GroupRole, targetRole: GroupRole): boolean {
  if (targetRole === 'owner') {
    return false;
  }

  return myRole === 'owner' || (myRole === 'admin' && targetRole === 'member');
}

/** Promover a admin, rebaixar a membro, transferir a propriedade e excluir o grupo. */
export function isOwner(role: GroupRole): boolean {
  return role === 'owner';
}
