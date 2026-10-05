import { describe, expect, it } from 'vitest';
import { MAX_SIDE, photoForm, prepareImage, scaledSize } from './imageUpload';

describe('scaledSize', () => {
  it('não mexe em fotos que já cabem', () => {
    expect(scaledSize(500, 300)).toEqual({ width: 500, height: 300 });
    expect(scaledSize(MAX_SIDE, MAX_SIDE)).toEqual({ width: MAX_SIDE, height: MAX_SIDE });
  });

  it('reduz pelo lado maior mantendo a proporção', () => {
    expect(scaledSize(4000, 3000)).toEqual({ width: 768, height: 576 });
    expect(scaledSize(3000, 4000)).toEqual({ width: 576, height: 768 });
  });

  it('nunca zera um lado em imagens muito alongadas', () => {
    expect(scaledSize(100_000, 10).height).toBeGreaterThanOrEqual(1);
  });
});

describe('prepareImage', () => {
  it('devolve o arquivo original quando o navegador não sabe decodificar', async () => {
    const original = new Blob(['não é imagem'], { type: 'image/heic' });

    // No jsdom não existe createImageBitmap: o fluxo cai no arquivo original.
    expect(await prepareImage(original)).toBe(original);
  });
});

describe('photoForm', () => {
  it('monta o campo file que a API espera', () => {
    const form = photoForm(new Blob(['x'], { type: 'image/jpeg' }));

    const file = form.get('file') as File;
    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe('foto.jpg');
  });
});
