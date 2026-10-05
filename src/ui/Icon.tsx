import type { SVGProps } from 'react';

/** Ícones simples de traço (24x24), no estilo do app: contorno grosso, cantos arredondados. */
const PATHS = {
  plus: 'M12 5v14M5 12h14',
  check: 'M5 13l4 4L19 7',
  x: 'M6 6l12 12M18 6L6 18',
  back: 'M15 5l-7 7 7 7',
  chevron: 'M9 5l7 7-7 7',
  copy: 'M9 9h11v11H9z M5 15V4h11',
  share: 'M12 3v12M8 7l4-4 4 4M5 13v7h14v-7',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8z M4 21c0-4 4-6 8-6s8 2 8 6',
  users:
    'M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7z M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5 M16 4.5a3.5 3.5 0 010 6.5 M18 14.8c2.4.6 4 2.2 4 5.2',
  trophy: 'M8 4h8v5a4 4 0 01-8 0V4z M8 6H4v1a4 4 0 004 4 M16 6h4v1a4 4 0 01-4 4 M12 13v4 M8 21h8 M10 17h4',
  play: 'M8 5l12 7-12 7z',
  clock: 'M12 21a9 9 0 100-18 9 9 0 000 18z M12 7v5l3 2',
  sliders: 'M4 7h9M17 7h3M4 17h3M11 17h9 M15 4v6 M9 14v6',
  logout: 'M10 4H5v16h5 M15 8l4 4-4 4 M19 12H9',
  key: 'M14.5 9.5a4 4 0 11-5.7 5.7 4 4 0 015.7-5.7z M13 11l7-7 M17 7l2.5 2.5',
  pencil: 'M4 20l1-5L16 4l4 4L9 19z M14 6l4 4',
  trash: 'M5 7h14 M9 7V4h6v3 M7 7l1 13h8l1-13',
  crown: 'M4 18L3 8l5 4 4-7 4 7 5-4-1 10z',
  shuffle: 'M3 7h4l10 10h4 M3 17h4l3-3 M14 10l3-3h4 M18 4l3 3-3 3 M18 14l3 3-3 3',
  refresh: 'M20 11a8 8 0 10-2 6 M20 5v6h-6',
  home: 'M4 11l8-7 8 7v9H4z',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 15a3 3 0 100-6 3 3 0 000 6z',
  flag: 'M5 21V4 M5 4h12l-2 4 2 4H5',
  download: 'M12 4v11 M7 11l5 5 5-5 M5 20h14',
  info: 'M12 21a9 9 0 100-18 9 9 0 000 18z M12 11v6 M12 7.5v.5',
  skip: 'M5 5l9 7-9 7z M18 5v14',
  stop: 'M6 6h12v12H6z',
} as const;

export type IconName = keyof typeof PATHS;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number | string;
}

/** Decorativo por padrão (`aria-hidden`): o texto do botão ou do link é quem descreve a ação. */
export function Icon({ name, size = '1.25em', ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={rest['aria-label'] === undefined && rest.role === undefined ? 'true' : undefined}
      focusable="false"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
