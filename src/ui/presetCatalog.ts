/** As chaves dos avatares prontos que a API conhece (`GET /avatars/presets`) e o nome de cada um. A arte está em `presets.tsx`. */
const LABELS: Record<string, string> = {
  'preset-1': 'Sol',
  'preset-2': 'Gato',
  'preset-3': 'Estrela',
  'preset-4': 'Plantinha',
  'preset-5': 'Nuvem',
  'preset-6': 'Coração',
};

export const PRESET_KEYS: readonly string[] = Object.keys(LABELS);

export const DEFAULT_PRESET = 'preset-1';

export function presetLabel(key: string): string {
  return LABELS[key] ?? 'Avatar';
}

export function hasPreset(key: string | null | undefined): key is string {
  return key != null && key in LABELS;
}
