import type { GroupDetail, GroupSummary, Member } from '@/api/types';

export const ME_ID = '11111111-1111-4111-8111-111111111111';
export const GROUP_ID = '22222222-2222-4222-8222-222222222222';

let counter = 0;
/** Um UUID válido e único por chamada (para pessoas e partidas dos testes). */
export function uuid(): string {
  counter += 1;
  return `00000000-0000-4000-8000-${String(counter).padStart(12, '0')}`;
}

export function memberFixture(overrides: Partial<Member> = {}): Member {
  return {
    id: uuid(),
    displayName: 'Beto',
    hasAccount: true,
    isMe: false,
    role: 'member',
    avatar: { kind: 'preset', preset: 'preset-2', url: null },
    joinedAt: '2026-10-01T12:00:00Z',
    ...overrides,
  };
}

/** Um grupo em que quem consulta ("Ana") tem o papel `myRole`. */
export function groupFixture(overrides: Partial<GroupDetail> & { members?: Member[] } = {}): GroupDetail {
  const myRole = overrides.myRole ?? 'owner';
  const me = memberFixture({
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    displayName: 'Ana',
    isMe: true,
    role: myRole,
  });
  return {
    id: GROUP_ID,
    name: 'Família Silva',
    myRole,
    myMemberId: me.id,
    inviteCode: 'K7RM4PXT',
    inviteEnabled: true,
    members: [me, memberFixture({ displayName: 'Beto' })],
    createdAt: '2026-10-01T12:00:00Z',
    ...overrides,
  };
}

export function summaryOf(group: GroupDetail): GroupSummary {
  return {
    id: group.id,
    name: group.name,
    myRole: group.myRole,
    memberCount: group.members.length,
    createdAt: group.createdAt,
  };
}
