import type { CSSProperties } from 'react';
import { resolveApiUrl } from '@/lib/url';
import type { AvatarDto } from '@/api/types';
import { DEFAULT_PRESET, hasPreset, presetLabel } from './presetCatalog';
import { PresetArt } from './presets';
import styles from './Avatar.module.css';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  avatar: AvatarDto;
  /** Nome de quem é (vai para o texto alternativo). */
  name: string;
  size?: Size;
  /** Aro colorido do time (0 ou 1). */
  team?: number | null;
  /** Bolinha verde de "está online". */
  online?: boolean;
}

export function Avatar({ avatar, name, size = 'md', team, online }: AvatarProps) {
  const photo = avatar.kind === 'photo' && avatar.url ? resolveApiUrl(avatar.url) : null;
  const preset = hasPreset(avatar.preset) ? avatar.preset : DEFAULT_PRESET;
  const ring = team === 0 ? styles.team0 : team === 1 ? styles.team1 : '';

  return (
    <span
      className={`${styles.avatar} ${styles[size] ?? ''} ${ring}`}
      role="img"
      aria-label={`Avatar de ${name}`}
    >
      {photo ? (
        <img
          className={styles.photo}
          src={photo}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
        />
      ) : (
        <PresetArt preset={preset} />
      )}
      {online ? <span className={styles.online} title="Online" /> : null}
    </span>
  );
}

interface AvatarPickerProps {
  keys: readonly string[];
  value: string;
  onChange: (key: string) => void;
  legend?: string;
}

/** Grade para escolher um avatar pronto. */
export function AvatarPicker({ keys, value, onChange, legend = 'Escolha seu avatar' }: AvatarPickerProps) {
  return (
    <fieldset className={styles.picker}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.grid} role="radiogroup" aria-label={legend}>
        {keys.map((key) => {
          const selected = key === value;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={presetLabel(key)}
              className={`${styles.option} ${selected ? styles.selected : ''}`}
              onClick={() => onChange(key)}
            >
              <span className={styles.optionArt} style={{ '--size': '100%' } as CSSProperties}>
                <PresetArt preset={key} />
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
