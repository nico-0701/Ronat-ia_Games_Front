import { Link, Navigate, Outlet, useLocation } from 'react-router';
import { useMe } from '@/features/auth/queries';
import { Avatar } from '@/ui/Avatar';
import { Icon } from '@/ui/Icon';
import { useAuthStatus } from './servicesContext';
import styles from './Shell.module.css';

/** Só deixa passar quem está com a sessão ativa; os demais vão para a entrada e voltam para cá depois de entrar. */
export function RequireAuth() {
  const status = useAuthStatus();
  const location = useLocation();

  if (status !== 'authenticated') {
    return <Navigate to="/entrar" replace state={{ from: location }} />;
  }

  return <Shell />;
}

/** Moldura das telas de dentro: barra de cima com a marca e o atalho do perfil. */
function Shell() {
  const me = useMe();

  return (
    <div className={styles.app}>
      <header className={styles.top}>
        <Link to="/" className={styles.brand}>
          Ronat-ia <span>Games</span>
        </Link>
        <Link to="/perfil" className={styles.profile} aria-label="Meu perfil">
          {me.data ? (
            <Avatar avatar={me.data.avatar} name={me.data.displayName} size="sm" />
          ) : (
            <Icon name="user" size={28} />
          )}
        </Link>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
