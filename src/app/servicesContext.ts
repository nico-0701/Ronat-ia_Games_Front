import { createContext, useContext, useSyncExternalStore } from 'react';
import type { ApiClient } from '@/api/client';
import type { AuthStatus } from '@/api/session';
import type { Services } from './services';

export const ServicesContext = createContext<Services | null>(null);

export function useServices(): Services {
  const services = useContext(ServicesContext);
  if (!services) {
    throw new Error('useServices precisa estar dentro de <ServicesProvider>.');
  }

  return services;
}

/** Cliente autenticado da API. */
export function useApi(): ApiClient {
  return useServices().api;
}

/** `authenticated` ou `anonymous`; muda sozinho quando a sessão acaba (inclusive em outra aba). */
export function useAuthStatus(): AuthStatus {
  const { session } = useServices();
  return useSyncExternalStore(session.subscribe, session.getStatus, session.getStatus);
}
