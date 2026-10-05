import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { unwrap } from '@/api/client';
import type { GroupDetail, GroupPreview, GroupRole, GroupSummary, Member } from '@/api/types';
import { useApi, useAuthStatus } from '@/app/servicesContext';
import { photoForm } from '@/lib/imageUpload';

export const groupKeys = {
  all: ['groups'] as const,
  detail: (groupId: string) => ['groups', groupId] as const,
};

/** Os grupos de que a pessoa participa. */
export function useGroups() {
  const api = useApi();
  const status = useAuthStatus();

  return useQuery<GroupSummary[]>({
    queryKey: groupKeys.all,
    queryFn: () => unwrap(api.GET('/api/v1/groups')),
    enabled: status === 'authenticated',
  });
}

/** Um grupo, com a senha (para quem pode vê-la) e os membros. Quem não é membro recebe 404. */
export function useGroup(groupId: string) {
  const api = useApi();

  return useQuery<GroupDetail>({
    queryKey: groupKeys.detail(groupId),
    queryFn: () => unwrap(api.GET('/api/v1/groups/{groupId}', { params: { path: { groupId } } })),
  });
}

const ROLE_LABELS: Record<GroupRole, string> = { owner: 'Dono', admin: 'Admin', member: 'Membro' };

export function roleLabel(role: GroupRole): string {
  return ROLE_LABELS[role];
}

export function peopleLabel(count: number): string {
  return count === 1 ? '1 pessoa' : `${count} pessoas`;
}

/** Guarda o grupo devolvido pelo servidor e avisa a lista de que mudou. */
function useStoreGroup() {
  const queryClient = useQueryClient();
  return (group: GroupDetail) => {
    queryClient.setQueryData(groupKeys.detail(group.id), group);
    void queryClient.invalidateQueries({ queryKey: groupKeys.all, exact: true });
  };
}

export function useCreateGroup() {
  const api = useApi();
  const store = useStoreGroup();

  return useMutation({
    mutationFn: (name: string) => unwrap(api.POST('/api/v1/groups', { body: { name } })),
    onSuccess: store,
  });
}

/** Confere a senha sem entrar no grupo. */
export function useLookupGroup() {
  const api = useApi();

  return useMutation<GroupPreview, Error, string>({
    mutationFn: (code) => unwrap(api.POST('/api/v1/groups/lookup', { body: { code } })),
  });
}

export function useJoinGroup() {
  const api = useApi();
  const store = useStoreGroup();

  return useMutation({
    mutationFn: (input: { code: string; claimMemberId?: string }) =>
      unwrap(api.POST('/api/v1/groups/join', { body: input })),
    onSuccess: store,
  });
}

interface GroupChanges {
  name?: string;
  inviteEnabled?: boolean;
}

export function useUpdateGroup(groupId: string) {
  const api = useApi();
  const store = useStoreGroup();

  return useMutation({
    mutationFn: (changes: GroupChanges) =>
      unwrap(api.PATCH('/api/v1/groups/{groupId}', { params: { path: { groupId } }, body: changes })),
    onSuccess: store,
  });
}

/** Gera outra senha; a antiga deixa de valer na hora. */
export function useRegenerateInvite(groupId: string) {
  const api = useApi();
  const store = useStoreGroup();

  return useMutation({
    mutationFn: () =>
      unwrap(api.POST('/api/v1/groups/{groupId}/invite-code', { params: { path: { groupId } } })),
    onSuccess: store,
  });
}

export function useTransferOwnership(groupId: string) {
  const api = useApi();
  const store = useStoreGroup();

  return useMutation({
    mutationFn: (memberId: string) =>
      unwrap(
        api.POST('/api/v1/groups/{groupId}/transfer-ownership', {
          params: { path: { groupId } },
          body: { memberId },
        }),
      ),
    onSuccess: store,
  });
}

/** Sai do grupo e tira o grupo do cache (a pessoa não é mais membro: o servidor responderia 404). */
export function useLeaveGroup(groupId: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      unwrap(api.DELETE('/api/v1/groups/{groupId}/members/me', { params: { path: { groupId } } })),
    onSuccess: () => forgetGroup(queryClient, groupId),
  });
}

export function useDeleteGroup(groupId: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      unwrap(
        api.DELETE('/api/v1/groups/{groupId}', {
          params: { path: { groupId } },
          body: { confirmation: 'EXCLUIR' },
        }),
      ),
    onSuccess: () => forgetGroup(queryClient, groupId),
  });
}

function forgetGroup(queryClient: ReturnType<typeof useQueryClient>, groupId: string) {
  queryClient.removeQueries({ queryKey: groupKeys.detail(groupId) });
  void queryClient.invalidateQueries({ queryKey: groupKeys.all, exact: true });
}

/** Cria um perfil sem conta (quem ainda não usa o app). */
export function useAddProfile(groupId: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation<Member, Error, { displayName: string; avatarPreset?: string }>({
    mutationFn: (profile) =>
      unwrap(api.POST('/api/v1/groups/{groupId}/members', { params: { path: { groupId } }, body: profile })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) }),
  });
}

interface MemberChanges {
  displayName?: string;
  avatarPreset?: string;
  role?: Exclude<GroupRole, 'owner'>;
}

/** Nome e avatar de um perfil sem conta (admin) ou papel de um membro (dono). */
export function useUpdateMember(groupId: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation<Member, Error, { memberId: string; changes: MemberChanges }>({
    mutationFn: ({ memberId, changes }) =>
      unwrap(
        api.PATCH('/api/v1/groups/{groupId}/members/{memberId}', {
          params: { path: { groupId, memberId } },
          body: changes,
        }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) }),
  });
}

export function useRemoveMember(groupId: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) =>
      unwrap(
        api.DELETE('/api/v1/groups/{groupId}/members/{memberId}', {
          params: { path: { groupId, memberId } },
        }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) }),
  });
}

/** Foto de um perfil sem conta (a de quem tem conta é a da própria conta). */
export function useUploadMemberPhoto(groupId: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation<Member, Error, { memberId: string; photo: Blob }>({
    mutationFn: ({ memberId, photo }) =>
      unwrap(
        api.PUT('/api/v1/groups/{groupId}/members/{memberId}/avatar', {
          params: { path: { groupId, memberId } },
          body: { file: '' },
          bodySerializer: () => photoForm(photo),
        }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) }),
  });
}

export function useRemoveMemberPhoto(groupId: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation<Member, Error, string>({
    mutationFn: (memberId) =>
      unwrap(
        api.DELETE('/api/v1/groups/{groupId}/members/{memberId}/avatar', {
          params: { path: { groupId, memberId } },
        }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) }),
  });
}
