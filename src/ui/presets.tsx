import type { ReactElement } from 'react';
import { DEFAULT_PRESET } from './presetCatalog';

/**
 * A arte dos avatares prontos (as chaves e os nomes estão em `presetCatalog.ts`).
 * Cada desenho preenche um quadrado 64x64 e é recortado em círculo por quem o usa.
 */
const INK = '#2b1f3d';
const LINE = { stroke: INK, strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

function Face({ x = 32, y = 33, spread = 6 }: { x?: number; y?: number; spread?: number }) {
  return (
    <g>
      <circle cx={x - spread} cy={y} r={2.5} fill={INK} />
      <circle cx={x + spread} cy={y} r={2.5} fill={INK} />
      <path d={`M${x - 4.5} ${y + 6.5}Q${x} ${y + 11} ${x + 4.5} ${y + 6.5}`} fill="none" {...LINE} />
    </g>
  );
}

const ART: Record<string, ReactElement> = {
  'preset-1': (
    <>
      <rect width="64" height="64" fill="#93e1ff" />
      <g {...LINE}>
        <path d="M53 32h6M46.8 46.8l4.3 4.3M32 53v6M17.2 46.8l-4.3 4.3M11 32H5M17.2 17.2l-4.3-4.3M32 11V5M46.8 17.2l4.3-4.3" />
      </g>
      <circle cx="32" cy="32" r="16" fill="#f7c948" {...LINE} />
      <Face />
    </>
  ),
  'preset-2': (
    <>
      <rect width="64" height="64" fill="#68bfab" />
      <path d="M14 30L16 8l15 11z" fill="#fbf3df" {...LINE} />
      <path d="M50 30L48 8 33 19z" fill="#fbf3df" {...LINE} />
      <ellipse cx="32" cy="37" rx="20" ry="17" fill="#fbf3df" {...LINE} />
      <circle cx="25" cy="34" r="2.6" fill={INK} />
      <circle cx="39" cy="34" r="2.6" fill={INK} />
      <path d="M29.5 40h5l-2.5 3z" fill="#d0378d" {...LINE} strokeWidth={1.5} />
      <path d="M32 43q-3 4-7 2M32 43q3 4 7 2" fill="none" {...LINE} strokeWidth={2} />
      <path d="M12 39l8 1M12 45l8-2M52 39l-8 1M52 45l-8-2" fill="none" {...LINE} strokeWidth={1.8} />
    </>
  ),
  'preset-3': (
    <>
      <rect width="64" height="64" fill="#402660" />
      <polygon
        points="32,10 39.6,22.5 53.9,26.2 44.4,37.5 45.4,52.5 32,47 18.6,52.5 19.6,37.5 10.1,26.2 24.4,22.5"
        fill="#f7c948"
        {...LINE}
      />
      <Face y={31} spread={5.5} />
    </>
  ),
  'preset-4': (
    <>
      <rect width="64" height="64" fill="#f7c948" />
      <path d="M32 40V26" fill="none" {...LINE} />
      <path d="M32 30C22 30 18 22 20 15 28 15 33 22 32 30z" fill="#53ae52" {...LINE} />
      <path d="M32 27C42 27 46 19 44 12 36 12 31 19 32 27z" fill="#53ae52" {...LINE} />
      <path d="M18 40h28l-3.5 17h-21z" fill="#d0378d" {...LINE} />
      <circle cx="28" cy="48" r="2.2" fill="#fbf3df" />
      <circle cx="36" cy="48" r="2.2" fill="#fbf3df" />
      <path d="M29 52.5q3 2.5 6 0" fill="none" stroke="#fbf3df" strokeWidth={2.2} strokeLinecap="round" />
    </>
  ),
  'preset-5': (
    <>
      <rect width="64" height="64" fill="#d0378d" />
      <path d="M15 46A9 9 0 0 1 15 28A13 13 0 0 1 40 24A10 10 0 0 1 47 46Z" fill="#fbf3df" {...LINE} />
      <Face x={31} y={35} spread={6} />
    </>
  ),
  'preset-6': (
    <>
      <rect width="64" height="64" fill="#fbf3df" />
      <path d="M32 54C8 37 13 15 26 16c4 0 6 3 6 6 0-3 2-6 6-6 13-1 18 21-6 38z" fill="#d0378d" {...LINE} />
      <Face y={30} spread={5.5} />
    </>
  ),
};

export function PresetArt({ preset }: { preset: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width="100%"
      height="100%"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid slice"
    >
      {ART[preset] ?? ART[DEFAULT_PRESET]}
    </svg>
  );
}
