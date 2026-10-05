// Gera os ícones do app (PNG) a partir do desenho do favicon, sem dependências: um rasterizador pequeno com suavização
// (supersampling 4x4) e um codificador PNG feito com o zlib do Node.
//
//   node scripts/make-icons.mjs
//
// Saída em public/icons/: icon-192.png, icon-512.png (cantos arredondados), icon-maskable-512.png (quadrado cheio, rosto menor
// para caber na zona segura do Android) e apple-touch-icon.png (180, quadrado cheio; o iOS arredonda sozinho).
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { crc32, deflateSync } from 'node:zlib';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'public/icons');
mkdirSync(out, { recursive: true });

const PLUM = [0x40, 0x26, 0x60];
const SUN = [0xf7, 0xc9, 0x48];
const CREAM = [0xfb, 0xf3, 0xdf];
const INK = [0x2b, 0x1f, 0x3d];

/** Pontos de uma curva de Bézier cúbica. */
function bezier(p0, p1, p2, p3, steps = 80) {
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    points.push([
      u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0],
      u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1],
    ]);
  }
  return points;
}

function distanceToSegment(px, py, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const lengthSquared = dx * dx + dy * dy;
  const t =
    lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / lengthSquared));
  return Math.hypot(px - (a[0] + t * dx), py - (a[1] + t * dy));
}

function distanceToPolyline(px, py, points) {
  let best = Infinity;
  for (let i = 1; i < points.length; i++) {
    best = Math.min(best, distanceToSegment(px, py, points[i - 1], points[i]));
  }
  return best;
}

// O sorriso é uma curva fixa: calculada uma vez só (por amostra seria lentíssimo).
const SMILE_ROUNDED = bezier([23, 37], [26, 42], [38, 42], [41, 37]);
const SMILE_SQUARE = bezier([25, 36], [28, 41], [37, 41], [39, 36]);

/** A cor de um ponto do desenho (coordenadas 0..64) ou `null` se for transparente. */
function shade(x, y, { rounded = false, circle = false, foreground = false }) {
  if (circle && Math.hypot(x - 32, y - 32) > 32) {
    return null; // ícone redondo do Android
  }

  if (foreground) {
    // Ícone adaptativo: só o rosto, menor, no miolo (a zona segura é ~61% do quadro) e sobre fundo transparente.
    const shrink = 1.07;
    x = 32 + (x - 32) * shrink;
    y = 32 + (y - 32) * shrink;
  }

  if (rounded) {
    const rx = 14;
    const cx = Math.min(Math.max(x, rx), 64 - rx);
    const cy = Math.min(Math.max(y, rx), 64 - rx);
    if (Math.hypot(x - cx, y - cy) > rx) {
      return null;
    }
  }

  const radius = rounded ? 19 : 17;
  const eyeY = rounded ? 28 : 29;
  const eyeLeft = rounded ? 25 : 26;
  const eyeRight = rounded ? 39 : 38;
  const smile = rounded ? SMILE_ROUNDED : SMILE_SQUARE;

  if (distanceToPolyline(x, y, smile) <= 1.5) {
    return INK;
  }

  if (Math.hypot(x - eyeLeft, y - eyeY) <= 2.6 || Math.hypot(x - eyeRight, y - eyeY) <= 2.6) {
    return INK;
  }

  const distance = Math.hypot(x - 32, y - 32);
  if (distance <= radius + 1.5) {
    return distance < radius - 1.5 ? SUN : CREAM;
  }

  return foreground ? null : PLUM;
}

function render(size, options) {
  const pixels = Buffer.alloc(size * size * 4);
  const samples = 4;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let covered = 0;
      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const x = ((px + (sx + 0.5) / samples) / size) * 64;
          const y = ((py + (sy + 0.5) / samples) / size) * 64;
          const color = shade(x, y, options);
          if (color) {
            r += color[0];
            g += color[1];
            b += color[2];
            covered += 1;
          }
        }
      }

      const offset = (py * size + px) * 4;
      if (covered > 0) {
        pixels[offset] = Math.round(r / covered);
        pixels[offset + 1] = Math.round(g / covered);
        pixels[offset + 2] = Math.round(b / covered);
        pixels[offset + 3] = Math.round((covered / (samples * samples)) * 255);
      }
    }
  }

  return pixels;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, checksum]);
}

function png(size, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // 8 bits por canal
  header[9] = 6; // RGBA
  const rows = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    rows[y * (size * 4 + 1)] = 0; // filtro "nenhum"
    pixels.copy(rows, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(rows, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const icons = [
  ['icon-192.png', 192, { rounded: true }],
  ['icon-512.png', 512, { rounded: true }],
  ['icon-maskable-512.png', 512, { rounded: false }],
  ['apple-touch-icon.png', 180, { rounded: false }],
];

for (const [name, size, options] of icons) {
  const file = resolve(out, name);
  writeFileSync(file, png(size, render(size, options)));
  console.log(`${name} (${size}x${size})`);
}

// Ícones de lançador do projeto Android (Capacitor), se ele existir: quadrado arredondado, redondo e a camada do ícone adaptativo.
const androidRes = resolve(root, 'android/app/src/main/res');
if (existsSync(androidRes)) {
  const densities = [
    ['mdpi', 48, 108],
    ['hdpi', 72, 162],
    ['xhdpi', 96, 216],
    ['xxhdpi', 144, 324],
    ['xxxhdpi', 192, 432],
  ];
  for (const [density, legacy, adaptive] of densities) {
    const dir = resolve(androidRes, `mipmap-${density}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, 'ic_launcher.png'), png(legacy, render(legacy, { rounded: true })));
    writeFileSync(resolve(dir, 'ic_launcher_round.png'), png(legacy, render(legacy, { circle: true })));
    writeFileSync(
      resolve(dir, 'ic_launcher_foreground.png'),
      png(adaptive, render(adaptive, { foreground: true })),
    );
    console.log(`android mipmap-${density}`);
  }
}
