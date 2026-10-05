import { useSyncExternalStore } from 'react';
import styles from './OfflineBanner.module.css';

function subscribe(listener: () => void): () => void {
  window.addEventListener('online', listener);
  window.addEventListener('offline', listener);
  return () => {
    window.removeEventListener('online', listener);
    window.removeEventListener('offline', listener);
  };
}

const isOnline = () => navigator.onLine;

/** Avisa, no topo, quando o aparelho fica sem internet (o jogo precisa dela o tempo todo). Some sozinho ao voltar. */
export function OfflineBanner() {
  const online = useSyncExternalStore(subscribe, isOnline, () => true);

  if (online) {
    return null;
  }

  return (
    <p className={styles.banner} role="status">
      Sem internet. Assim que ela voltar, o app volta a funcionar sozinho.
    </p>
  );
}
