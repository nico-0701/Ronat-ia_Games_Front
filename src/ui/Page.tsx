import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Icon } from './Icon';
import styles from './Page.module.css';

interface PageHeaderProps {
  title: string;
  /** Para onde o botão de voltar leva. Sem isso, não há botão. */
  back?: string;
  backLabel?: string;
  actions?: ReactNode;
}

/** Título da tela, com botão de voltar e ações opcionais à direita. */
export function PageHeader({ title, back, backLabel = 'Voltar', actions }: PageHeaderProps) {
  return (
    <div className={styles.header}>
      {back ? (
        <Link to={back} className={styles.back} aria-label={backLabel}>
          <Icon name="back" size={26} />
        </Link>
      ) : null}
      <h1 className={styles.title}>{title}</h1>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
}

/** Estado vazio: um aviso simpático com uma ação. */
export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className={styles.empty}>
      <h2>{title}</h2>
      {children ? <p>{children}</p> : null}
    </div>
  );
}
