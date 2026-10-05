import { apiBaseUrl } from './env';

/** Endereço completo de um caminho da API (as fotos de avatar vêm como `/api/v1/avatars/<id>`). */
export function resolveApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${apiBaseUrl()}${path}`;
}
