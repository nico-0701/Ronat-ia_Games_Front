import type { AuthResponse } from './types';

/** Tokens guardados no aparelho. Os prazos são instantes (ms desde 1970) no relógio do servidor. */
export interface StoredTokens {
  accessToken: string;
  accessTokenExpiresAt: number;
  refreshToken: string;
  refreshTokenExpiresAt: number;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const TOKEN_STORAGE_KEY = 'ronat.auth.v1';

export function tokensFrom(auth: AuthResponse): StoredTokens {
  return {
    accessToken: auth.accessToken,
    accessTokenExpiresAt: Date.parse(auth.accessTokenExpiresAt),
    refreshToken: auth.refreshToken,
    refreshTokenExpiresAt: Date.parse(auth.refreshTokenExpiresAt),
  };
}

function isStoredTokens(value: unknown): value is StoredTokens {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<StoredTokens>;
  return (
    typeof candidate.accessToken === 'string' &&
    typeof candidate.refreshToken === 'string' &&
    Number.isFinite(candidate.accessTokenExpiresAt) &&
    Number.isFinite(candidate.refreshTokenExpiresAt)
  );
}

function same(a: StoredTokens | null, b: StoredTokens | null): boolean {
  return a?.accessToken === b?.accessToken && a?.refreshToken === b?.refreshToken;
}

/**
 * Guarda os tokens da sessão. O armazenamento é a fonte da verdade entre abas: o refresh token é de uso único, então
 * duas abas precisam enxergar sempre o par mais novo (ver `AuthSession`). Sem armazenamento (modo privado bloqueado,
 * testes), os tokens vivem só na memória desta aba.
 */
export class TokenStore {
  private tokens: StoredTokens | null;
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly storage: StorageLike | null,
    private readonly key: string = TOKEN_STORAGE_KEY,
  ) {
    this.tokens = this.readStorage();
  }

  get current(): StoredTokens | null {
    return this.tokens;
  }

  /** Relê o armazenamento (outra aba pode ter renovado ou saído) e avisa quem escuta, se mudou. */
  reload(): StoredTokens | null {
    if (this.storage) {
      const stored = this.readStorage();
      if (!same(stored, this.tokens)) {
        this.tokens = stored;
        this.emit();
      }
    }

    return this.tokens;
  }

  save(tokens: StoredTokens): void {
    this.tokens = tokens;
    try {
      this.storage?.setItem(this.key, JSON.stringify(tokens));
    } catch {
      // armazenamento cheio ou bloqueado: a sessão segue só na memória desta aba
    }

    this.emit();
  }

  clear(): void {
    this.tokens = null;
    try {
      this.storage?.removeItem(this.key);
    } catch {
      // idem
    }

    this.emit();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Acompanha mudanças feitas por outras abas (o evento `storage` só dispara nas outras). */
  listenToOtherTabs(target: Pick<Window, 'addEventListener' | 'removeEventListener'> = window): () => void {
    const onStorage = (event: Event) => {
      const changed = (event as StorageEvent).key;
      if (changed === null || changed === this.key) {
        this.reload();
      }
    };

    target.addEventListener('storage', onStorage);
    return () => target.removeEventListener('storage', onStorage);
  }

  private readStorage(): StoredTokens | null {
    try {
      const raw = this.storage?.getItem(this.key);
      if (!raw) {
        return null;
      }

      const parsed: unknown = JSON.parse(raw);
      return isStoredTokens(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  private emit(): void {
    for (const listener of [...this.listeners]) {
      listener();
    }
  }
}

/** O `localStorage` do navegador, se estiver disponível (pode lançar exceção em modos restritos). */
export function browserStorage(): StorageLike | null {
  try {
    const storage = window.localStorage;
    const probe = '__ronat_probe__';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}
