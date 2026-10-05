import { useState } from 'react';
import { fieldError } from '@/api/errors';
import type { Member } from '@/api/types';
import { AvatarPicker } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { Dialog } from '@/ui/Dialog';
import { ErrorNote } from '@/ui/ErrorNote';
import { DEFAULT_PRESET, PRESET_KEYS } from '@/ui/presetCatalog';
import { TextField } from '@/ui/TextField';
import { useAddProfile, useUpdateMember } from './queries';

interface ProfileDialogProps {
  groupId: string;
  /** Sem `member`, cria um perfil novo; com ele, edita nome e avatar. */
  member?: Member;
  onClose: () => void;
}

/**
 * Perfil sem conta: nome e avatar de quem ainda não usa o app (ou não tem celular). Cada um joga como qualquer outro
 * membro, e a pessoa pode assumir o perfil depois, entrando com a senha do grupo.
 */
export function ProfileDialog({ groupId, member, onClose }: ProfileDialogProps) {
  const add = useAddProfile(groupId);
  const update = useUpdateMember(groupId);
  const [name, setName] = useState(member?.displayName ?? '');
  const [preset, setPreset] = useState(member?.avatar.preset ?? DEFAULT_PRESET);
  const editing = member !== undefined;
  const mutation = editing ? update : add;
  const trimmed = name.trim();
  const nameError = fieldError(mutation.error, 'displayName');

  const save = () => {
    if (trimmed.length < 2) {
      return;
    }

    if (member) {
      update.mutate(
        { memberId: member.id, changes: { displayName: trimmed, avatarPreset: preset } },
        { onSuccess: onClose },
      );
    } else {
      add.mutate({ displayName: trimmed, avatarPreset: preset }, { onSuccess: onClose });
    }
  };

  return (
    <Dialog
      open
      title={editing ? 'Editar perfil' : 'Adicionar pessoa'}
      onClose={onClose}
      actions={
        <>
          <Button variant="go" loading={mutation.isPending} disabled={trimmed.length < 2} onClick={save}>
            Salvar
          </Button>
          <Button variant="light" size="sm" onClick={onClose}>
            Cancelar
          </Button>
        </>
      }
    >
      {!editing ? (
        <p className="muted">
          Para quem ainda não tem o app: a pessoa joga normalmente e, quando entrar com a senha do grupo, pode
          assumir este perfil e ficar com o histórico.
        </p>
      ) : null}
      <TextField
        label="Nome"
        maxLength={30}
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={nameError}
        autoFocus
      />
      <AvatarPicker
        keys={PRESET_KEYS}
        value={preset ?? DEFAULT_PRESET}
        onChange={setPreset}
        legend="Avatar"
      />
      {mutation.error && !nameError ? <ErrorNote error={mutation.error} /> : null}
    </Dialog>
  );
}
