/** Endereço da API sem a barra final. Vazio = mesma origem (em desenvolvimento o Vite faz proxy). */
export function apiBaseUrl(): string {
  return (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');
}

/** Versão do app (package.json, injetada no build); o servidor compara com `minClientVersion`. */
export const APP_VERSION: string = __APP_VERSION__;
