import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';
import { Icon, type IconName } from './Icon';
import { Spinner } from './Spinner';
import styles from './Button.module.css';

type Variant = 'go' | 'stop' | 'light' | 'sun' | 'danger';
type Size = 'lg' | 'md' | 'sm';

interface Look {
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  /** Ocupa a largura toda (padrão). */
  block?: boolean;
}

function classes({ variant = 'light', size = 'md', block = true }: Look, extra?: string): string {
  return [styles.button, styles[variant], styles[size], block ? styles.block : '', extra ?? '']
    .filter(Boolean)
    .join(' ');
}

interface ButtonProps extends Look, ComponentPropsWithoutRef<'button'> {
  /** Mostra um indicador e ignora cliques enquanto a ação roda. */
  loading?: boolean;
}

export function Button({
  variant,
  size,
  icon,
  block,
  loading = false,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={classes({ variant, size, block }, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner size="sm" label="Aguarde" /> : icon ? <Icon name={icon} /> : null}
      <span className={styles.label}>{children}</span>
    </button>
  );
}

interface LinkButtonProps extends Look, Omit<LinkProps, 'className'> {
  className?: string;
  children?: ReactNode;
}

export function LinkButton({ variant, size, icon, block, className, children, ...rest }: LinkButtonProps) {
  return (
    <Link className={classes({ variant, size, block }, className)} {...rest}>
      {icon ? <Icon name={icon} /> : null}
      <span className={styles.label}>{children}</span>
    </Link>
  );
}
