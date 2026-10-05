import { describe, expect, it } from 'vitest';
import {
  formatInviteCode,
  inviteLink,
  inviteMessage,
  looksLikeInviteCode,
  normalizeInviteCode,
} from './invite';
import { canManageGroup, canRemoveMember, isOwner } from './permissions';

describe('senha do grupo', () => {
  it.each([
    ['', ''],
    ['k7rm', 'K7RM'],
    ['k7rm4', 'K7RM-4'],
    ['k7rm-4pxt', 'K7RM-4PXT'],
    ['  k7rm 4pxt  ', 'K7RM-4PXT'],
    ['K7RM4PXTXYZ', 'K7RM-4PXT'],
  ])('formata %j como %j', (input, expected) => {
    expect(formatInviteCode(input)).toBe(expected);
  });

  it('normaliza para os 8 caracteres do servidor', () => {
    expect(normalizeInviteCode('k7rm-4pxt')).toBe('K7RM4PXT');
  });

  it('reconhece senhas completas e que usam só o alfabeto permitido', () => {
    expect(looksLikeInviteCode('K7RM-4PXT')).toBe(true);
    expect(looksLikeInviteCode('K7RM-4PX')).toBe(false);
    expect(looksLikeInviteCode('K7RM-4PX0')).toBe(false); // 0 não existe no alfabeto
    expect(looksLikeInviteCode('K7RM-4PXI')).toBe(false); // I também não
  });

  it('monta o link com a senha no fragmento e a mensagem para compartilhar', () => {
    expect(inviteLink('https://app.exemplo', 'k7rm-4pxt')).toBe('https://app.exemplo/grupos/entrar#K7RM4PXT');
    expect(inviteMessage('Família', 'K7RM4PXT', 'https://app.exemplo')).toBe(
      'Entre no grupo "Família" do Ronat-ia Games! Senha: K7RM-4PXT\nhttps://app.exemplo/grupos/entrar#K7RM4PXT',
    );
  });
});

describe('permissões (só para a interface)', () => {
  it('dono e administrador gerenciam o grupo; membro não', () => {
    expect(canManageGroup('owner')).toBe(true);
    expect(canManageGroup('admin')).toBe(true);
    expect(canManageGroup('member')).toBe(false);
  });

  it('o dono remove qualquer um menos o dono; o admin só membros comuns', () => {
    expect(canRemoveMember('owner', 'admin')).toBe(true);
    expect(canRemoveMember('owner', 'member')).toBe(true);
    expect(canRemoveMember('owner', 'owner')).toBe(false);
    expect(canRemoveMember('admin', 'member')).toBe(true);
    expect(canRemoveMember('admin', 'admin')).toBe(false);
    expect(canRemoveMember('member', 'member')).toBe(false);
  });

  it('só o dono é dono', () => {
    expect(isOwner('owner')).toBe(true);
    expect(isOwner('admin')).toBe(false);
  });
});
