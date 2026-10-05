import { useQuery } from '@tanstack/react-query';
import { unwrap } from '@/api/client';
import type { AvatarPresets, MetaResponse, UserDto } from '@/api/types';
import { useApi, useAuthStatus, useServices } from '@/app/servicesContext';

export const queryKeys = {
  meta: ['meta'] as const,
  me: ['me'] as const,
  presets: ['avatar-presets'] as const,
};

/**
 * Informações do servidor (versão, cadastro aberto, captcha) e calibragem do relógio: os prazos dos jogos vêm em UTC do
 * servidor. O plano gratuito dorme depois de 15 min e leva cerca de um minuto para acordar, então a busca insiste um pouco.
 */
export function useMeta() {
  const { publicApi, clock } = useServices();

  return useQuery<MetaResponse>({
    queryKey: queryKeys.meta,
    queryFn: async () => {
      const sentAt = Date.now();
      const meta = await unwrap(publicApi.GET('/api/v1/meta'));
      clock.calibrate(meta.serverTimeUtc, sentAt, Date.now());
      return meta;
    },
    staleTime: 10 * 60_000,
    refetchInterval: 10 * 60_000,
    retry: 6,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });
}

/** A própria pessoa. Só busca com a sessão ativa. */
export function useMe() {
  const api = useApi();
  const status = useAuthStatus();

  return useQuery<UserDto>({
    queryKey: queryKeys.me,
    queryFn: () => unwrap(api.GET('/api/v1/users/me')),
    enabled: status === 'authenticated',
    staleTime: 60_000,
  });
}

/** As chaves dos avatares prontos (a arte vive no app). */
export function useAvatarPresets() {
  const { publicApi } = useServices();

  return useQuery<AvatarPresets>({
    queryKey: queryKeys.presets,
    queryFn: () => unwrap(publicApi.GET('/api/v1/avatars/presets')),
    staleTime: Infinity,
  });
}
