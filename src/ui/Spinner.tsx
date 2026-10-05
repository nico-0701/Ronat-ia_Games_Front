import styles from './Spinner.module.css';

interface SpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Spinner({ label = 'Carregando', size = 'md' }: SpinnerProps) {
  return (
    <span className={`${styles.spinner} ${styles[size] ?? ''}`} role="status" aria-label={label}>
      <span className={styles.ring} />
    </span>
  );
}

/** Tela de espera centralizada, com uma mensagem opcional. */
export function Loading({ message }: { message?: string }) {
  return (
    <div className={styles.page}>
      <Spinner size="lg" label={message ?? 'Carregando'} />
      {message ? <p className={styles.message}>{message}</p> : null}
    </div>
  );
}
