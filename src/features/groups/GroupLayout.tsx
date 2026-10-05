import { NavLink, Navigate, Outlet, useParams } from 'react-router';
import { isApiError } from '@/api/errors';
import { LinkButton } from '@/ui/Button';
import { Card, Hint } from '@/ui/Card';
import { ErrorNote } from '@/ui/ErrorNote';
import { PageHeader } from '@/ui/Page';
import { Loading } from '@/ui/Spinner';
import { peopleLabel, roleLabel, useGroup } from './queries';
import styles from './GroupLayout.module.css';

/** Moldura de um grupo: título, papel da pessoa e as abas (cada aba é uma rota filha). */
export function GroupLayout() {
  const { groupId = '' } = useParams();
  const group = useGroup(groupId);

  if (group.isPending) {
    return <Loading />;
  }

  if (group.isError) {
    if (isApiError(group.error, 'group.not_found')) {
      return (
        <Card>
          <h1>Grupo não encontrado</h1>
          <Hint>Ele pode ter sido excluído, ou você não faz mais parte dele.</Hint>
          <LinkButton to="/" variant="go" icon="home">
            Ir para o início
          </LinkButton>
        </Card>
      );
    }

    return <ErrorNote error={group.error} onRetry={() => void group.refetch()} />;
  }

  const data = group.data;
  const tabs = [
    { to: `/grupos/${groupId}/membros`, label: 'Pessoas' },
    { to: `/grupos/${groupId}/ajustes`, label: 'Ajustes' },
  ];

  return (
    <>
      <PageHeader title={data.name} back="/" />
      <p className="muted">
        {peopleLabel(data.members.length)} · você é {roleLabel(data.myRole).toLowerCase()}
      </p>
      <nav className={styles.tabs} aria-label="Seções do grupo">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </>
  );
}

/** Por enquanto a porta de entrada do grupo é a lista de pessoas. */
export function GroupIndexRedirect() {
  return <Navigate to="membros" replace />;
}
