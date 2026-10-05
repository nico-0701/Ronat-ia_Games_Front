import { isNative } from './platform';

/**
 * Oferece um objeto como arquivo JSON para a pessoa salvar. No navegador é um download; no app Android o WebView não baixa
 * `blob:`, então o arquivo é gravado no cache do app e entregue ao menu de compartilhar (salvar no Drive, mandar por e-mail...).
 */
export async function downloadJson(filename: string, data: unknown): Promise<void> {
  const text = JSON.stringify(data, null, 2);

  if (isNative()) {
    const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([
      import('@capacitor/filesystem'),
      import('@capacitor/share'),
    ]);
    const saved = await Filesystem.writeFile({
      path: filename,
      data: text,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    await Share.share({ title: filename, url: saved.uri, dialogTitle: 'Salvar meus dados' });
    return;
  }

  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
