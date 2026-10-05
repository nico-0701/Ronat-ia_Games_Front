import { useNavigate, useLocation } from 'react-router';
import { unwrap } from '@/api/client';
import type { AuthResponse } from '@/api/types';
import { useServices } from '@/app/servicesContext';
import { queryKeys } from './queries';

interface FromState {
  from?: { pathname: string; search?: string; hash?: string };
}

/** Para onde ir depois de entrar: a página que a pessoa tentou abrir antes (ex.: um link de convite), ou o início. */
export function useAfterSignInTarget(): string {
  const state = useLocation().state as FromState | null;
  const from = state?.from;
  return from ? `${from.pathname}${from.search ?? ''}${from.hash ?? ''}` : '/';
}

/** Conclui o login/cadastro: troca a sessão, descarta dados de quem usou o app antes e vai para onde a pessoa queria. */
export function useCompleteSignIn() {
  const { session, queryClient } = useServices();
  const navigate = useNavigate();
  const target = useAfterSignInTarget();

  return (auth: AuthResponse) => {
    queryClient.clear();
    session.signIn(auth);
    queryClient.setQueryData(queryKeys.me, auth.user);
    void navigate(target, { replace: true });
  };
}

/** Sai deste aparelho: avisa o servidor (se conseguir) e apaga a sessão local de qualquer jeito. */
export function useLogout() {
  const { api, session, queryClient } = useServices();
  const navigate = useNavigate();

  return async () => {
    try {
      await unwrap(api.POST('/api/v1/auth/logout'));
    } catch {
      // sem rede ou sessão já encerrada: sai mesmo assim
    }

    session.signOut();
    queryClient.clear();
    void navigate('/entrar', { replace: true });
  };
}
