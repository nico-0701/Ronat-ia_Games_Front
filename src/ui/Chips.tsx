import { useId } from 'react';
import styles from './Chips.module.css';

interface ChipsProps<T extends string> {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** Uma linha de opções para escolher uma (filtros): rola de lado em telas estreitas. */
export function Chips<T extends string>({ label, options, value, onChange }: ChipsProps<T>) {
  const id = useId();
  return (
    <div className={styles.wrap}>
      <span className={styles.label} id={id}>
        {label}
      </span>
      <div className={styles.row} role="radiogroup" aria-labelledby={id}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={option.value === value}
            className={`${styles.chip} ${option.value === value ? styles.selected : ''}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
