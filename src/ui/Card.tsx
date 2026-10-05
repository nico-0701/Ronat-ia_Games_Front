import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import styles from './Card.module.css';

interface CardProps extends ComponentPropsWithoutRef<'section'> {
  tone?: 'paper' | 'cream' | 'sun';
}

/** Cartão com contorno grosso e sombra dura, o bloco básico das telas. */
export function Card({ tone = 'paper', className, children, ...rest }: CardProps) {
  return (
    <section className={`${styles.card} ${styles[tone] ?? ''} ${className ?? ''}`} {...rest}>
      {children}
    </section>
  );
}

/** Texto de apoio (cinza-arroxeado). */
export function Hint({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={`${styles.hint} ${className ?? ''}`}>{children}</p>;
}
