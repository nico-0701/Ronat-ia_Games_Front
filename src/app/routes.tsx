import type { RouteObject } from 'react-router';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { HomePage } from '@/features/home/HomePage';
import { PrivacyPage, TermsPage } from '@/features/legal/LegalPages';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { NotFoundPage, RouteError } from './ErrorPages';
import { RequireAuth } from './Shell';

/** Todas as telas. Separado do roteador para os testes montarem a mesma árvore com um histórico em memória. */
export const routes: RouteObject[] = [
  {
    errorElement: <RouteError />,
    children: [
      { path: '/entrar', element: <LoginPage /> },
      { path: '/cadastro', element: <RegisterPage /> },
      { path: '/privacidade', element: <PrivacyPage /> },
      { path: '/termos', element: <TermsPage /> },
      {
        element: <RequireAuth />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/perfil', element: <ProfilePage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
