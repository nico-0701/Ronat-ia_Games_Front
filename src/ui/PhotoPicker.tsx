import { useId, useRef, useState, type ChangeEvent } from 'react';
import { prepareImage } from '@/lib/imageUpload';
import { Button } from './Button';
import { ErrorNote } from './ErrorNote';
import styles from './PhotoPicker.module.css';

interface PhotoPickerProps {
  hasPhoto: boolean;
  busy: boolean;
  error?: unknown;
  /** Recebe a foto já reduzida. */
  onPick: (photo: Blob) => void;
  onRemove?: () => void;
}

/** Escolher uma foto da galeria (ou tirar uma na hora, no celular). A foto é reduzida no aparelho antes de enviar. */
export function PhotoPicker({ hasPhoto, busy, error, onPick, onRemove }: PhotoPickerProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [preparing, setPreparing] = useState(false);
  const [rejected, setRejected] = useState<string | null>(null);

  const onChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // permite escolher o mesmo arquivo de novo depois
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setRejected('Escolha um arquivo de imagem (JPEG, PNG, WebP ou GIF).');
      return;
    }

    setRejected(null);
    setPreparing(true);
    try {
      onPick(await prepareImage(file));
    } finally {
      setPreparing(false);
    }
  };

  return (
    <div className="stack-sm">
      <input
        ref={input}
        id={id}
        className={styles.input}
        type="file"
        accept="image/*"
        aria-label="Escolher foto"
        onChange={(event) => void onChange(event)}
      />
      <Button
        variant="light"
        size="sm"
        icon="plus"
        loading={busy || preparing}
        onClick={() => input.current?.click()}
      >
        {hasPhoto ? 'Trocar a foto' : 'Enviar uma foto'}
      </Button>
      {hasPhoto && onRemove ? (
        <Button variant="danger" size="sm" icon="trash" disabled={busy || preparing} onClick={onRemove}>
          Tirar a foto
        </Button>
      ) : null}
      {rejected ? <ErrorNote error={new Error(rejected)} fallback={rejected} /> : null}
      {error ? <ErrorNote error={error} /> : null}
    </div>
  );
}
