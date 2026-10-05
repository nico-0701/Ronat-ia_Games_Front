import { useState } from 'react';
import type { GroupDetail } from '@/api/types';
import { copyText, shareText } from '@/lib/share';
import { Button } from '@/ui/Button';
import { Card, Hint } from '@/ui/Card';
import { Dialog } from '@/ui/Dialog';
import { ErrorNote } from '@/ui/ErrorNote';
import { useToast } from '@/ui/toast';
import { formatInviteCode, inviteMessage } from './invite';
import { canManageGroup } from './permissions';
import { useRegenerateInvite, useUpdateGroup } from './queries';
import styles from './InviteCard.module.css';

/** A senha do grupo: todo membro a vê para repassar; dono e administradores a desligam ou trocam. */
export function InviteCard({ group }: { group: GroupDetail }) {
  const toast = useToast();
  const manager = canManageGroup(group.myRole);
  const update = useUpdateGroup(group.id);
  const regenerate = useRegenerateInvite(group.id);
  const [confirmNew, setConfirmNew] = useState(false);
  const code = group.inviteCode;

  if (!code) {
    return (
      <Card>
        <h2>Senha do grupo</h2>
        <Hint>
          {manager
            ? 'A senha está desligada: ninguém novo consegue entrar. Ligue de novo quando quiser convidar mais gente.'
            : 'A senha está desligada. Peça a um administrador para ligar quando quiserem convidar mais gente.'}
        </Hint>
        {manager ? (
          <Button
            variant="go"
            size="sm"
            loading={update.isPending}
            onClick={() => update.mutate({ inviteEnabled: true })}
          >
            Ligar a senha
          </Button>
        ) : null}
        {update.error ? <ErrorNote error={update.error} /> : null}
      </Card>
    );
  }

  const share = async () => {
    const outcome = await shareText(inviteMessage(group.name, code, window.location.origin), group.name);
    if (outcome === 'copied') {
      toast.show('Convite copiado! Agora é só colar na conversa.', 'success');
    } else if (outcome === 'failed') {
      toast.show('Não foi possível compartilhar. Copie a senha na mão.', 'error');
    }
  };

  const copy = async () => {
    toast.show(
      (await copyText(formatInviteCode(code))) ? 'Senha copiada!' : 'Não foi possível copiar.',
      'success',
    );
  };

  return (
    <Card tone="sun">
      <h2>Senha do grupo</h2>
      <p className={styles.code} aria-label={`Senha: ${formatInviteCode(code).split('').join(' ')}`}>
        {formatInviteCode(code)}
      </p>
      <Hint>
        Passe a senha para quem vai jogar com você. Quem entrar no app e digitar a senha já está dentro.
      </Hint>
      <div className="stack-sm">
        <Button variant="go" icon="share" onClick={() => void share()}>
          Compartilhar convite
        </Button>
        <Button variant="light" size="sm" icon="copy" onClick={() => void copy()}>
          Copiar a senha
        </Button>
      </div>

      {manager ? (
        <div className="stack-sm">
          <Button variant="light" size="sm" icon="refresh" onClick={() => setConfirmNew(true)}>
            Gerar outra senha
          </Button>
          <Button
            variant="light"
            size="sm"
            loading={update.isPending}
            onClick={() => update.mutate({ inviteEnabled: false })}
          >
            Desligar a senha
          </Button>
        </div>
      ) : null}
      {update.error || regenerate.error ? <ErrorNote error={update.error ?? regenerate.error} /> : null}

      <Dialog
        open={confirmNew}
        title="Gerar outra senha?"
        onClose={() => setConfirmNew(false)}
        actions={
          <>
            <Button
              variant="go"
              loading={regenerate.isPending}
              onClick={() => regenerate.mutate(undefined, { onSuccess: () => setConfirmNew(false) })}
            >
              Gerar outra senha
            </Button>
            <Button variant="light" size="sm" onClick={() => setConfirmNew(false)}>
              Cancelar
            </Button>
          </>
        }
      >
        <p>A senha atual deixa de valer na hora. Quem já está no grupo continua nele.</p>
      </Dialog>
    </Card>
  );
}
