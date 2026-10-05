import type { ReactNode } from 'react';
import { Link } from 'react-router';
import styles from './AuthLayout.module.css';

/** Moldura das telas de entrada: logo, frase e rodapé com os textos de privacidade. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.presents}>Ronat-ia</p>
        <h1 className={styles.logo}>
          Games<span>!</span>
        </h1>
        <p className={styles.tagline}>Jogos para a família e os amigos, cada um no seu celular.</p>
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <Link to="/privacidade">Privacidade</Link>
        <span aria-hidden="true">·</span>
        <Link to="/termos">Termos de uso</Link>
      </footer>
    </div>
  );
}
