import { Link } from 'react-router';
import { Avatar } from '@/ui/Avatar';
import { LinkButton } from '@/ui/Button';
import { Card, Hint } from '@/ui/Card';
import { ErrorNote } from '@/ui/ErrorNote';
import { Icon } from '@/ui/Icon';
import { EmptyState } from '@/ui/Page';
import { Loading } from '@/ui/Spinner';
import { useMe } from '@/features/auth/queries';
import { peopleLabel, roleLabel, useGroups } from '@/features/groups/queries';
import styles from './HomePage.module.css';

export function HomePage() {
  const me = useMe();
  const groups = useGroups();

  return (
    <>
      <div className="row">
        {me.data ? <Avatar avatar={me.data.avatar} name={me.data.displayName} size="lg" /> : null}
        <div>
          <h1>Olá{me.data ? `, ${me.data.displayName}` : ''}!</h1>
          <Hint>Escolha um grupo para jogar, ou crie o seu.</Hint>
        </div>
      </div>

      {groups.isPending ? <Loading /> : null}
      {groups.isError ? <ErrorNote error={groups.error} onRetry={() => void groups.refetch()} /> : null}

      {groups.data && groups.data.length === 0 ? (
        <EmptyState title="Você ainda não está em nenhum grupo">
          Crie um grupo e passe a senha para os amigos, ou entre num grupo com a senha que alguém te deu.
        </EmptyState>
      ) : null}

      {groups.data && groups.data.length > 0 ? (
        <ul className={styles.list} aria-label="Meus grupos">
          {groups.data.map((group) => (
            <li key={group.id}>
              <Link to={`/grupos/${group.id}`} className={styles.group}>
                <Card className={styles.card}>
                  <div className="row">
                    <div className="spacer">
                      <h2>{group.name}</h2>
                      <p className="muted">
                        {peopleLabel(group.memberCount)} · {roleLabel(group.myRole)}
                      </p>
                    </div>
                    <Icon name="chevron" size={28} />
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="stack-sm">
        <LinkButton to="/grupos/novo" variant="go" size="lg" icon="plus">
          Criar um grupo
        </LinkButton>
        <LinkButton to="/grupos/entrar" variant="light" icon="key">
          Entrar com a senha de um grupo
        </LinkButton>
      </div>
    </>
  );
}
