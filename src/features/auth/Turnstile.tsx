import { useEffect, useRef } from 'react';

interface TurnstileApi {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      'expired-callback': () => void;
      'error-callback': () => void;
    },
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) {
    return Promise.resolve(window.turnstile);
  }

  scriptPromise ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile indisponível'));
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Não foi possível carregar o Turnstile'));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

interface TurnstileProps {
  siteKey: string;
  onToken: (token: string | null) => void;
  /** Mude este número para pedir um desafio novo (o token vale uma vez só). */
  resetNonce?: number;
}

/** Widget anti-robô do Cloudflare. Só aparece quando o servidor exige (`GET /meta` → `auth.captchaRequired`). */
export function Turnstile({ siteKey, onToken, resetNonce = 0 }: TurnstileProps) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const onTokenRef = useRef(onToken);

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    let cancelled = false;
    const element = container.current;

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !element) {
          return;
        }

        widgetId.current = turnstile.render(element, {
          sitekey: siteKey,
          callback: (token) => onTokenRef.current(token),
          'expired-callback': () => onTokenRef.current(null),
          'error-callback': () => onTokenRef.current(null),
        });
      })
      .catch(() => onTokenRef.current(null));

    return () => {
      cancelled = true;
      if (widgetId.current !== undefined) {
        window.turnstile?.remove(widgetId.current);
        widgetId.current = undefined;
      }
    };
  }, [siteKey]);

  useEffect(() => {
    if (resetNonce > 0 && widgetId.current !== undefined) {
      window.turnstile?.reset(widgetId.current);
    }
  }, [resetNonce]);

  return <div ref={container} aria-label="Verificação anti-robô" />;
}
