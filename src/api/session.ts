import { isApiError } from './errors';
import { tokensFrom, type TokenStore } from './tokens';
import type { AuthResponse } from './types';

export type AuthStatus = 'anonymous' | 'authenticated';

/** Antes de o token vencer por menos disto, o próximo uso já renova (evita mandar uma requisição que vai ser recusada). */
const EXPIRY_SKEW_MS = 30_000;

/** Quanto esperar antes de repetir uma renovação que colidiu com outra (`auth.refresh_conflict`). */
const CONFLICT_RETRY_MS = 400;

export type LockRunner = <T>(name: string, task: () => Promise<T>) => Promise<T>;

/** Exclusão mútua entre abas do navegador (Web Locks). Sem suporte, cada aba só protege a si mesma. */
export const browserLock: LockRunner = async (name, task) => {
  const locks = typeof navigator === 'undefined' ? undefined : navigator.locks;
  return locks ? await locks.request(name, task) : await task();
};

export interface AuthSessionDeps {
  store: TokenStore;
  /** Chama `POST /auth/refresh` (sem passar pelo cliente autenticado). Lança `ApiError`. */
  requestRefresh: (refreshToken: string) => Promise<AuthResponse>;
  /** Relógio do servidor (ms). */
  now: () => number;
  lock?: LockRunner;
}

/**
 * Sessão de login: guarda os tokens e os renova.
 *
 * O refresh token é de **uso único**: cada renovação devolve um novo e invalida o anterior, e reapresentar um já trocado
 * derruba a sessão (sinal de roubo). Por isso:
 *  - só uma renovação por vez nesta aba (todas as chamadas esperam a mesma promessa);
 *  - só uma renovação por vez entre abas (Web Locks) e, dentro do lock, relê o armazenamento: se outra aba já renovou,
 *    usa o par novo dela em vez de gastar o token de novo;
 *  - o par novo só é usado depois de recebido e salvo.
 */
export class AuthSession {
  private refreshing: Promise<string | null> | null = null;
  private readonly lock: LockRunner;

  constructor(private readonly deps: AuthSessionDeps) {
    this.lock = deps.lock ?? browserLock;
  }

  getStatus = (): AuthStatus => (this.deps.store.current ? 'authenticated' : 'anonymous');

  subscribe = (listener: () => void): (() => void) => this.deps.store.subscribe(listener);

  accessToken(): string | null {
    return this.deps.store.current?.accessToken ?? null;
  }

  signIn(auth: AuthResponse): void {
    this.deps.store.save(tokensFrom(auth));
  }

  signOut(): void {
    this.deps.store.clear();
  }

  /**
   * Um access token com pelo menos {@link EXPIRY_SKEW_MS} de validade, renovando se preciso. `null` sem sessão.
   * Falha de rede na renovação **não** derruba a sessão: devolve o token que há (a requisição decide).
   */
  async validAccessToken(): Promise<string | null> {
    const tokens = this.deps.store.reload();
    if (!tokens) {
      return null;
    }

    if (tokens.accessTokenExpiresAt - this.deps.now() > EXPIRY_SKEW_MS) {
      return tokens.accessToken;
    }

    try {
      return await this.refresh(null);
    } catch {
      return this.deps.store.current?.accessToken ?? null;
    }
  }

  /**
   * O servidor recusou `rejected` (401). Renova uma vez, a menos que alguém já tenha renovado depois disso. Devolve o token
   * novo, ou `null` se a sessão morreu (refresh token inválido: a pessoa precisa entrar de novo).
   */
  renewAfterRejection(rejected: string): Promise<string | null> {
    return this.refresh(rejected);
  }

  private refresh(rejected: string | null): Promise<string | null> {
    this.refreshing ??= this.lock('ronat-auth-refresh', () => this.renewOnce(rejected)).finally(() => {
      this.refreshing = null;
    });

    return this.refreshing;
  }

  private async renewOnce(rejected: string | null, retried = false): Promise<string | null> {
    const stored = this.deps.store.reload();
    if (!stored) {
      return null;
    }

    const usable =
      stored.accessToken !== rejected && stored.accessTokenExpiresAt - this.deps.now() > EXPIRY_SKEW_MS;
    if (usable) {
      return stored.accessToken; // outra aba (ou outra chamada) já renovou
    }

    try {
      const auth = await this.deps.requestRefresh(stored.refreshToken);
      this.signIn(auth);
      return auth.accessToken;
    } catch (error) {
      if (isApiError(error, 'auth.invalid_refresh_token') || (isApiError(error) && error.status === 401)) {
        this.signOut();
        return null;
      }

      if (isApiError(error, 'auth.refresh_conflict') && !retried) {
        await new Promise((resolve) => setTimeout(resolve, CONFLICT_RETRY_MS));
        return this.renewOnce(rejected, true);
      }

      throw error; // rede ou servidor: a sessão continua, tente depois
    }
  }
}
