import { focusManager } from '@tanstack/react-query';
import { isNative } from '@/lib/platform';
import type { Services } from './services';

/**
 * Ciclo de vida do app: ao voltar para o primeiro plano (aba que volta a ser vista, ou o app Android que sai do segundo plano),
 * o Android suspende WebSockets em segundo plano, então o tempo real reconecta e assina tudo de novo, e as telas buscam o estado.
 * No Android também trata o botão voltar (volta uma tela; na primeira, sai do app). Devolve a função que desfaz tudo.
 */
export function registerLifecycle(services: Services): () => void {
  const resume = () => {
    focusManager.setFocused(true);
    void services.live.resume();
  };

  const onVisibility = () => {
    if (document.visibilityState === 'visible') {
      resume();
    }
  };

  document.addEventListener('visibilitychange', onVisibility);
  const cleanups: (() => void)[] = [() => document.removeEventListener('visibilitychange', onVisibility)];

  if (isNative()) {
    let disposed = false;
    void import('@capacitor/app').then(async ({ App }) => {
      const state = await App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          resume();
        } else {
          focusManager.setFocused(false);
        }
      });
      const back = await App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
        } else {
          void App.exitApp();
        }
      });

      if (disposed) {
        void state.remove();
        void back.remove();
      } else {
        cleanups.push(
          () => void state.remove(),
          () => void back.remove(),
        );
      }
    });

    cleanups.push(() => {
      disposed = true;
    });
  }

  return () => cleanups.forEach((cleanup) => cleanup());
}
