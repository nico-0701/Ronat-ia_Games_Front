import { useMutation, useQueryClient } from '@tanstack/react-query';
import { unwrap } from '@/api/client';
import type { UserDto } from '@/api/types';
import { useApi } from '@/app/servicesContext';
import { queryKeys } from '@/features/auth/queries';

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
