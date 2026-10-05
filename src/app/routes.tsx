import type { ComponentType } from 'react';
import type { RouteObject } from 'react-router';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { CreateGroupPage } from '@/features/groups/CreateGroupPage';
import { GroupIndexRedirect, GroupLayout } from '@/features/groups/GroupLayout';
import { JoinGroupPage } from '@/features/groups/JoinGroupPage';
import { MembersTab } from '@/features/groups/MembersTab';
import { SettingsTab } from '@/features/groups/SettingsTab';
import { HomePage } from '@/features/home/HomePage';
import { NotFoundPage, RouteError } from './ErrorPages';
import { Loading } from '@/ui/Spinner';
import { RequireAuth } from './Shell';

/** Uma tela que só é baixada quando alguém a abre (o início e a entrada continuam leves). */
function lazyPage<T extends Record<string, unknown>>(
  load: () => Promise<T>,
  name: keyof T & string,
): NonNullable<RouteObject['lazy']> {
  return async () => ({ Component: (await load())[name] as ComponentType });
}

/** Todas as telas. Separado do roteador para os testes montarem a mesma árvore com um histórico em memória. */
export const routes: RouteObject[] = [
  {
    errorElement: <RouteError />,
    // Enquanto a tela inicial (preguiçosa) é baixada, em vez de uma tela em branco.
    HydrateFallback: () => <Loading />,
    children: [
      { path: '/entrar', element: <LoginPage /> },
      { path: '/cadastro', element: <RegisterPage /> },
      { path: '/privacidade', lazy: lazyPage(() => import('@/features/legal/LegalPages'), 'PrivacyPage') },
      { path: '/termos', lazy: lazyPage(() => import('@/features/legal/LegalPages'), 'TermsPage') },
      {
        element: <RequireAuth />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/perfil', lazy: lazyPage(() => import('@/features/profile/ProfilePage'), 'ProfilePage') },
          { path: '/grupos/novo', element: <CreateGroupPage /> },
          { path: '/grupos/entrar', element: <JoinGroupPage /> },
          {
            path: '/grupos/:groupId/nova-partida',
            lazy: lazyPage(() => import('@/features/sessions/NewSessionPage'), 'NewSessionPage'),
          },
          {
            path: '/partidas/:sessionId',
            lazy: lazyPage(() => import('@/features/sessions/SessionPage'), 'SessionPage'),
          },
          {
            path: '/grupos/:groupId',
            element: <GroupLayout />,
            children: [
              { index: true, element: <GroupIndexRedirect /> },
              {
                path: 'partidas',
                lazy: lazyPage(() => import('@/features/sessions/GroupSessionsTab'), 'GroupSessionsTab'),
              },
              {
                path: 'ranking',
                lazy: lazyPage(() => import('@/features/ranking/RankingTab'), 'RankingTab'),
              },
              {
                path: 'historico',
                lazy: lazyPage(() => import('@/features/ranking/HistoryTab'), 'HistoryTab'),
              },
              { path: 'membros', element: <MembersTab /> },
              { path: 'ajustes', element: <SettingsTab /> },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
