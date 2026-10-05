import { useState, type ReactNode } from 'react';
import type { MetaResponse } from '@/api/types';
import { Turnstile } from './Turnstile';

interface Captcha {
  /** O servidor exige o desafio. */
  required: boolean;
  /** Token do desafio resolvido (vale para uma única chamada). */
  token: string | null;
  /** Pronto para enviar: não exigido, ou já resolvido. */
  ready: boolean;
  widget: ReactNode;
  /** Pede um desafio novo (depois de usar o token, certo ou errado). */
  reset: () => void;
}

export function useCaptcha(meta: MetaResponse | undefined): Captcha {
  const [token, setToken] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const siteKey = meta?.auth.captchaRequired ? meta.auth.captchaSiteKey : null;
  const required = Boolean(siteKey);

  return {
    required,
    token,
    ready: !required || token !== null,
    widget: siteKey ? <Turnstile siteKey={siteKey} onToken={setToken} resetNonce={nonce} /> : null,
    reset: () => {
      setToken(null);
      setNonce((value) => value + 1);
    },
  };
}
