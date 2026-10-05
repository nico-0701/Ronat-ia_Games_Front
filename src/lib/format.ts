const dateTime = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});
const dateOnly = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

/** "05/10 20:15": quando algo aconteceu, curto para caber na lista. */
export function formatWhen(iso: string | null | undefined): string {
  const time = iso ? Date.parse(iso) : Number.NaN;
  return Number.isFinite(time) ? dateTime.format(time) : '';
}

/** "5 de outubro de 2026". */
export function formatDay(iso: string | null | undefined): string {
  const time = iso ? Date.parse(iso) : Number.NaN;
  return Number.isFinite(time) ? dateOnly.format(time) : '';
}
