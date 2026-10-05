import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { unwrap } from '@/api/client';
import type { LoginDevice, UserDto } from '@/api/types';
import { useApi, useAuthStatus, useServices } from '@/app/servicesContext';
import { queryKeys } from '@/features/auth/queries';
import { photoForm } from '@/lib/imageUpload';

interface ProfileChanges {
  displayName?: string;
  avatarPreset?: string;
}

/** Muda o nome e/ou escolhe outro avatar pronto (só o que for enviado muda). */
export function useUpdateProfile() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (changes: ProfileChanges) => unwrap(api.PATCH('/api/v1/users/me', { body: changes })),
    onSuccess: (user: UserDto) => queryClient.setQueryData(queryKeys.me, user),
  });
}

/** Envia a foto de avatar (já reduzida pelo app); o servidor recorta, reduz e reencoda. */
export function useUploadPhoto() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (photo: Blob) =>
      unwrap(
        api.PUT('/api/v1/users/me/avatar', { body: { file: '' }, bodySerializer: () => photoForm(photo) }),
      ),
    onSuccess: (user: UserDto) => queryClient.setQueryData(queryKeys.me, user),
  });
}

/** Tira a foto e volta ao avatar padrão. */
export function useRemovePhoto() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => unwrap(api.DELETE('/api/v1/users/me/avatar')),
    onSuccess: (user: UserDto) => queryClient.setQueryData(queryKeys.me, user),
  });
}

const devicesKey = ['me', 'devices'] as const;

/** Os aparelhos em que a conta está conectada. */
export function useDevices() {
  const api = useApi();
  const status = useAuthStatus();

  return useQuery<LoginDevice[]>({
    queryKey: devicesKey,
    queryFn: () => unwrap(api.GET('/api/v1/auth/sessions')),
    enabled: status === 'authenticated',
  });
}

export function useRevokeDevice() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) =>
      unwrap(api.DELETE('/api/v1/auth/sessions/{sessionId}', { params: { path: { sessionId } } })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: devicesKey }),
  });
}

/** Sai de todos os aparelhos, inclusive este: a sessão local acaba junto. */
export function useLogoutEverywhere() {
  const api = useApi();
  const { session } = useServices();

  return useMutation({
    mutationFn: async () => {
      await unwrap(api.POST('/api/v1/auth/logout-all'));
      session.signOut();
    },
  });
}

/** Busca a cópia dos dados pessoais (LGPD: acesso e portabilidade). */
export function useExportData() {
  const api = useApi();

  return useMutation({
    mutationFn: () => unwrap(api.GET('/api/v1/users/me/export')),
  });
}

/** Exclui a conta de vez (anonimiza, apaga a foto, encerra os logins e libera o telefone). */
export function useDeleteAccount() {
  const api = useApi();
  const { session } = useServices();

  return useMutation({
    mutationFn: async () => {
      await unwrap(api.DELETE('/api/v1/users/me', { body: { confirmation: 'EXCLUIR' } }));
      session.signOut();
    },
  });
}
