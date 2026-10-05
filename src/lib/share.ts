import { isNative } from './platform';

/** Copia um texto para a área de transferência. Devolve `false` se o navegador não deixou. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // sem permissão ou contexto inseguro: tenta o jeito antigo
  }

  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand('copy');
    area.remove();
    return copied;
  } catch {
    return false;
  }
}

export type ShareOutcome = 'shared' | 'copied' | 'failed' | 'cancelled';

/** Abre o menu de compartilhar do aparelho (WhatsApp etc.); sem ele, copia o texto. */
export async function shareText(text: string, title?: string): Promise<ShareOutcome> {
  if (isNative()) {
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share({ title, text, dialogTitle: title });
      return 'shared';
    } catch {
      return 'cancelled'; // a pessoa fechou o menu (o plugin recusa a promessa nesse caso)
    }
  }

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'cancelled'; // a pessoa fechou o menu
      }
    }
  }

  return (await copyText(text)) ? 'copied' : 'failed';
}
