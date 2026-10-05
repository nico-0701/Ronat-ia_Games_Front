import { useState, type FormEvent } from 'react';
import { fieldError } from '@/api/errors';
import { useAvatarPresets, useMe } from '@/features/auth/queries';
import { useLogout } from '@/features/auth/useSignIn';
import { APP_VERSION } from '@/lib/env';
import { Avatar, AvatarPicker } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { Card, Hint } from '@/ui/Card';
import { ErrorNote } from '@/ui/ErrorNote';
import { PageHeader } from '@/ui/Page';
import { PRESET_KEYS } from '@/ui/presetCatalog';
import { Loading } from '@/ui/Spinner';
import { TextField } from '@/ui/TextField';
import { useToast } from '@/ui/toast';
import { useUpdateProfile } from './queries';

export function ProfilePage() {
  const me = useMe();
  const presets = useAvatarPresets();
  const logout = useLogout();
  const update = useUpdateProfile();
  const toast = useToast();
  const [draftName, setDraftName] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  if (me.isPending) {
    return <Loading />;
  }

  if (me.isError) {
    return <ErrorNote error={me.error} onRetry={() => void me.refetch()} />;
  }

  const user = me.data;
  const name = draftName ?? user.displayName;
  const nameChanged = name.trim() !== user.displayName && name.trim().length >= 2;
  const keys = presets.data?.keys?.length ? presets.data.keys : PRESET_KEYS;

  const saveName = (event: FormEvent) => {
    event.preventDefault();
    if (!nameChanged) {
      return;
    }

    update.mutate(
      { displayName: name.trim() },
      {
        onSuccess: () => {
          setDraftName(null);
          toast.show('Nome atualizado!', 'success');
        },
      },
    );
  };

  const chooseAvatar = (preset: string) => {
    update.mutate({ avatarPreset: preset }, { onSuccess: () => toast.show('Avatar atualizado!', 'success') });
  };

  return (
    <>
      <PageHeader title="Meu perfil" back="/" />

      <Card>
        <div className="row">
          <Avatar avatar={user.avatar} name={user.displayName} size="xl" />
          <div>
            <h2>{user.displayName}</h2>
            <p className="muted">Celular terminado em {user.phoneLast4}</p>
          </div>
        </div>
      </Card>

      <Card>
        <form onSubmit={saveName} className="stack" noValidate>
          <TextField
            label="Seu nome"
            maxLength={30}
            value={name}
            onChange={(event) => setDraftName(event.target.value)}
            error={fieldError(update.error, 'displayName')}
          />
          <Button
            type="submit"
            variant="go"
            size="sm"
            loading={update.isPending && update.variables?.displayName !== undefined}
            disabled={!nameChanged}
          >
            Salvar nome
          </Button>
        </form>
        <AvatarPicker
          keys={keys}
          value={user.avatar.kind === 'preset' ? (user.avatar.preset ?? '') : ''}
          onChange={chooseAvatar}
          legend="Trocar de avatar"
        />
        {update.error && !fieldError(update.error, 'displayName') ? <ErrorNote error={update.error} /> : null}
      </Card>

      <Card>
        <Hint>Sair apenas encerra o login neste aparelho. Seus grupos e resultados continuam guardados.</Hint>
        <Button
          variant="danger"
          size="sm"
          icon="logout"
          loading={leaving}
          onClick={() => {
            setLeaving(true);
            void logout();
          }}
        >
          Sair deste aparelho
        </Button>
      </Card>

      <p className="muted" style={{ textAlign: 'center', fontSize: '0.9rem' }}>
        Ronat-ia Games · versão {APP_VERSION}
      </p>
    </>
  );
}
