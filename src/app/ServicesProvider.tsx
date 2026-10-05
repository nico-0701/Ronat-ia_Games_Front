import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, type ReactNode } from 'react';
import type { Services } from './services';
import { ServicesContext } from './servicesContext';

/** Entrega os serviços às telas e mantém a sessão sincronizada: outras abas e o fim da sessão limpam os dados em cache. */
export function ServicesProvider({ services, children }: { services: Services; children: ReactNode }) {
  useEffect(() => services.tokenStore.listenToOtherTabs(), [services]);

  useEffect(
    () =>
      services.session.subscribe(() => {
        // Quem sai (ou perde a sessão) não deixa dados para a próxima pessoa que usar o aparelho.
        if (services.session.getStatus() === 'anonymous') {
          services.queryClient.clear();
          void services.live.stop();
        }
      }),
    [services],
  );

  return (
    <ServicesContext value={services}>
      <QueryClientProvider client={services.queryClient}>{children}</QueryClientProvider>
    </ServicesContext>
  );
}
