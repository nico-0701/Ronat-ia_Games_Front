import { ApiError, errorMessage } from '@/api/errors';
import { Button } from './Button';
import styles from './ErrorNote.module.css';

interface ErrorNoteProps {
  error: unknown;
  /** Texto quando o erro não veio da API. */
  fallback?: string;
  /** Texto próprio, no lugar do que o servidor mandou (ex.: acrescentar nomes à mensagem). */
  message?: string;
  onRetry?: () => void;
}

/** Caixa de erro: o texto do servidor em português e, para falhas inesperadas, o código de suporte (`traceId`). */
export function ErrorNote({ error, fallback, message, onRetry }: ErrorNoteProps) {
  const support = error instanceof ApiError && error.isServerSide ? error.traceId : undefined;

  return (
    <div className={styles.note} role="alert">
      <p className={styles.text}>{message ?? errorMessage(error, fallback)}</p>
      {support ? <p className={styles.support}>Código para suporte: {support}</p> : null}
      {onRetry ? (
        <Button size="sm" icon="refresh" block={false} onClick={onRetry}>
          Tentar de novo
        </Button>
      ) : null}
    </div>
  );
}
