import { useState } from 'react';
import { createBrowserRouter, RouterProvider, type DataRouter } from 'react-router';
import { ToastProvider } from '@/ui/ToastProvider';
import { ServicesProvider } from './ServicesProvider';
import { VersionGate } from './VersionGate';
import { routes } from './routes';
import type { Services } from './services';

interface AppProps {
  services: Services;
  /** Os testes passam um roteador em memória. */
  router?: DataRouter;
}

export function App({ services, router: provided }: AppProps) {
  const [router] = useState(() => provided ?? createBrowserRouter(routes));

  return (
    <ServicesProvider services={services}>
      <ToastProvider>
        <VersionGate>
          <RouterProvider router={router} />
        </VersionGate>
      </ToastProvider>
    </ServicesProvider>
  );
}
