import { useQuery } from '@tanstack/react-query';
import { unwrap } from '@/api/client';
import type { GroupRole, GroupSummary } from '@/api/types';
import { useApi, useAuthStatus } from '@/app/servicesContext';

export const groupKeys = {
  all: ['groups'] as const,
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

const ROLE_LABELS: Record<GroupRole, string> = { owner: 'Dono', admin: 'Admin', member: 'Membro' };

export function roleLabel(role: GroupRole): string {
  return ROLE_LABELS[role];
}

export function peopleLabel(count: number): string {
  return count === 1 ? '1 pessoa' : `${count} pessoas`;
}
