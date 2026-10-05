/** O maior lado da foto enviada. O servidor reduz para 256x256; 768 sobra para o recorte e mantém o envio pequeno. */
export const MAX_SIDE = 768;

/** As dimensões depois de reduzir (mantém a proporção; fotos pequenas ficam como estão). */
export function scaledSize(
  width: number,
  height: number,
  maxSide: number = MAX_SIDE,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxSide) {
    return { width, height };
  }

  const ratio = maxSide / longest;
  return { width: Math.max(1, Math.round(width * ratio)), height: Math.max(1, Math.round(height * ratio)) };
}

/**
 * Prepara a foto no próprio aparelho antes de enviar: respeita a rotação da câmera, reduz e reencoda em JPEG. Fotos de celular
 * passam fácil de 3 MB (o limite do servidor), e reencodar também descarta os metadados (como a localização) antes de a foto sair
 * do aparelho. Se o navegador não consegue decodificar (ex.: HEIC), devolve o arquivo como está e o servidor decide.
 */
export async function prepareImage(file: Blob): Promise<Blob> {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const { width, height } = scaledSize(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      return file;
    }

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88));
    return blob ?? file;
  } catch {
    return file;
  }
}

/** O corpo `multipart/form-data` que a API espera (campo `file`). */
export function photoForm(photo: Blob): FormData {
  const form = new FormData();
  form.append('file', photo, 'foto.jpg');
  return form;
}
