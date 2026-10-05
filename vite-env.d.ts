/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Endereço da API (vazio = mesma origem). */
  readonly VITE_API_URL?: string;
  /** Versão exibida no app. */
  readonly VITE_APP_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Versão do app, injetada pelo Vite (ver vite.config.ts). */
declare const __APP_VERSION__: string;
