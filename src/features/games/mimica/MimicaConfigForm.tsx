import { ErrorNote } from '@/ui/ErrorNote';
import type { GameConfigProps } from '../types';
import { MIMICA_CATEGORIES, ROUND_OPTIONS, TURN_SECONDS_OPTIONS, parseMimicaConfig } from './model';
import styles from './MimicaConfigForm.module.css';

/** As opções da Mímica. Cada toque já salva (o servidor valida e devolve a configuração normalizada). */
export function MimicaConfigForm({ session, disabled, saving, error, onSave }: GameConfigProps) {
  const config = parseMimicaConfig(session.config);
  const locked = disabled || saving;

  const toggleCategory = (id: string) => {
    const selected = config.categories.includes(id)
      ? config.categories.filter((category) => category !== id)
      : [...config.categories, id];
    if (selected.length > 0) {
      onSave({ ...config, categories: selected });
    }
  };

  return (
    <div className="stack">
      <fieldset className={styles.group} disabled={locked}>
        <legend>Rodadas por time</legend>
        <div className={styles.choices} role="radiogroup" aria-label="Rodadas por time">
          {ROUND_OPTIONS.map((rounds) => (
            <button
              key={rounds}
              type="button"
              role="radio"
              aria-checked={config.rounds === rounds}
              className={`${styles.choice} ${config.rounds === rounds ? styles.selected : ''}`}
              onClick={() => onSave({ ...config, rounds })}
            >
              {rounds}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.group} disabled={locked}>
        <legend>Tempo para fazer a mímica</legend>
        <div className={styles.choices} role="radiogroup" aria-label="Tempo para fazer a mímica">
          {TURN_SECONDS_OPTIONS.map((seconds) => (
            <button
              key={seconds}
              type="button"
              role="radio"
              aria-checked={config.turnSeconds === seconds}
              className={`${styles.choice} ${config.turnSeconds === seconds ? styles.selected : ''}`}
              onClick={() => onSave({ ...config, turnSeconds: seconds })}
            >
              {seconds}s
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.group} disabled={locked}>
        <legend>Temas das cartas</legend>
        <div className={styles.themes}>
          {MIMICA_CATEGORIES.map((category) => (
            <label key={category.id} className="check">
              <input
                type="checkbox"
                checked={config.categories.includes(category.id)}
                onChange={() => toggleCategory(category.id)}
              />
              <span>{category.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {error ? <ErrorNote error={error} /> : null}
    </div>
  );
}
