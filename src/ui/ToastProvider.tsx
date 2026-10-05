import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { ToastContext, type ToastTone } from './toast';
import styles from './ToastProvider.module.css';

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

const VISIBLE_MS = 4000;

/** Avisos curtos no pé da tela (leitores de tela anunciam cada um, por causa do `aria-live`). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const show = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = nextId.current++;
    setToasts((current) => [...current.slice(-2), { id, message, tone }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), VISIBLE_MS);
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext value={api}>
      {children}
      <div className={styles.region} role="status" aria-live="polite">
        {toasts.map((toast) => (
          <p key={toast.id} className={`${styles.toast} ${styles[toast.tone] ?? ''}`}>
            {toast.message}
          </p>
        ))}
      </div>
    </ToastContext>
  );
}
