import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/** Lê as variáveis de cor de um bloco do tokens.css (`--nome: #rrggbb;`). */
function variables(css: string, selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  const end = css.indexOf('}', start);
  const block = css.slice(start, end);
  return Object.fromEntries(
    [...block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map((m) => [m[1]!, m[2]!]),
  );
}

const css = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8');
const light = variables(css, ':root {');
const dark = { ...light, ...variables(css, ":root[data-theme='dark'] {") };

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high! + 0.05) / (low! + 0.05);
}

/** Pares (texto, fundo) que o app usa, nos dois temas. WCAG AA: 4,5:1 para texto comum. */
const TEXT: [string, string][] = [
  ['ink', 'bg'],
  ['ink', 'paper'],
  ['ink', 'cream'],
  ['muted', 'bg'],
  ['muted', 'paper'],
  ['muted', 'cream'],
  ['link', 'bg'],
  ['link', 'paper'],
  ['link', 'cream'],
  ['on-go', 'go'],
  ['on-stop', 'stop'],
  ['on-t1', 't1'],
  ['on-t2', 't2'],
  ['danger-soft', 'paper'],
  ['danger-soft', 'bg'],
];

describe.each([
  ['claro', light],
  ['escuro', dark],
])('contraste no tema %s', (_name, theme) => {
  it.each(TEXT.filter(([text]) => text !== 'danger-soft' || theme === dark))(
    'texto %s sobre %s tem pelo menos 4,5:1',
    (text, background) => {
      expect(contrast(theme[text]!, theme[background]!)).toBeGreaterThanOrEqual(4.5);
    },
  );

  it('os indicadores (foco, bolinha de online, contorno) têm pelo menos 3:1 sobre o fundo', () => {
    expect(contrast(theme['magenta']!, theme['bg']!)).toBeGreaterThanOrEqual(3);
    expect(contrast(theme['online']!, theme['bg']!)).toBeGreaterThanOrEqual(3);
    expect(contrast(theme['line']!, theme['paper']!)).toBeGreaterThanOrEqual(3);
  });
});

describe('contraste fixo (cores que não mudam com o tema)', () => {
  it('o texto escuro sobre o amarelo (abas, etiquetas e cartões "sun") passa de 4,5:1', () => {
    expect(contrast('#2b1f3d', light['sun']!)).toBeGreaterThanOrEqual(4.5);
  });

  it('a palavra da carta (tinta sobre papel claro fixo) passa de 7:1', () => {
    expect(contrast('#2b1f3d', '#fffbf2')).toBeGreaterThanOrEqual(7);
  });
});
