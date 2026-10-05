import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import { fieldError } from '@/api/errors';
import { Button } from '@/ui/Button';
import { Card, Hint } from '@/ui/Card';
import { Dialog } from '@/ui/Dialog';
import { ErrorNote } from '@/ui/ErrorNote';
import { TextField } from '@/ui/TextField';
import { useToast } from '@/ui/toast';
import { canManageGroup, isOwner } from './permissions';
import { useDeleteGroup, useGroup, useLeaveGroup, useUpdateGroup } from './queries';

/** A aba "Ajustes": renomear, sair do grupo e, para o dono, excluir. */
export function SettingsTab() {
  const { groupId = '' } = useParams();
  const { data: group } = useGroup(groupId);
  const navigate = useNavigate();
  const toast = useToast();
  const update = useUpdateGroup(groupId);
  const leave = useLeaveGroup(groupId);
  const remove = useDeleteGroup(groupId);
  const [draftName, setDraftName] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<'leave' | 'delete' | null>(null);
  const [typed, setTyped] = useState('');

  if (!group) {
    return null;
  }

  const name = draftName ?? group.name;
  const nameChanged = name.trim() !== group.name && name.trim().length >= 2;
  const owner = isOwner(group.myRole);

  const saveName = (event: FormEvent) => {
    event.preventDefault();
    if (nameChanged) {
      update.mutate(
        { name: name.trim() },
        {
          onSuccess: () => {
            setDraftName(null);
            toast.show('Nome do grupo atualizado!', 'success');
          },
        },
      );
    }
  };

  const close = () => {
    setConfirm(null);
    setTyped('');
  };

  return (
    <>
      {canManageGroup(group.myRole) ? (
        <Card>
          <form onSubmit={saveName} className="stack" noValidate>
            <TextField
              label="Nome do grupo"
              maxLength={40}
              value={name}
              onChange={(event) => setDraftName(event.target.value)}
              error={fieldError(update.error, 'name')}
            />
            <Button type="submit" variant="go" size="sm" loading={update.isPending} disabled={!nameChanged}>
              Salvar nome
            </Button>
          </form>
        </Card>
      ) : null}

      <Card>
        <h2>Sair do grupo</h2>
        {owner ? (
          <Hint>
            O dono não pode sair. Passe a propriedade para outra pessoa (toque no nome dela na aba Pessoas) ou
            exclua o grupo.
          </Hint>
        ) : (
          <Hint>
            Você deixa de ver o grupo, mas o que jogou continua no histórico. Para voltar, precisa da senha.
          </Hint>
        )}
        <Button variant="danger" size="sm" icon="logout" disabled={owner} onClick={() => setConfirm('leave')}>
          Sair do grupo
        </Button>
      </Card>

      {owner ? (
        <Card>
          <h2>Excluir o grupo</h2>
          <Hint>
            O grupo some para todo mundo. O histórico fica guardado, mas ninguém mais consegue abrir o grupo.
          </Hint>
          <Button variant="danger" size="sm" icon="trash" onClick={() => setConfirm('delete')}>
            Excluir o grupo
          </Button>
        </Card>
      ) : null}

      <Dialog
        open={confirm === 'leave'}
        title="Sair do grupo?"
        onClose={close}
        actions={
          <>
            <Button
              variant="stop"
              loading={leave.isPending}
              onClick={() =>
                leave.mutate(undefined, { onSuccess: () => void navigate('/', { replace: true }) })
              }
            >
              Sair do grupo
            </Button>
            <Button variant="light" size="sm" onClick={close}>
              Ficar
            </Button>
          </>
        }
      >
        <p>Você sai de &quot;{group.name}&quot;. Para voltar, vai precisar da senha do grupo.</p>
        {leave.error ? <ErrorNote error={leave.error} /> : null}
      </Dialog>

      <Dialog
        open={confirm === 'delete'}
        title="Excluir o grupo?"
        onClose={close}
        actions={
          <>
            <Button
              variant="stop"
              loading={remove.isPending}
              disabled={typed.trim().toUpperCase() !== 'EXCLUIR'}
              onClick={() =>
                remove.mutate(undefined, { onSuccess: () => void navigate('/', { replace: true }) })
              }
            >
              Excluir para sempre
            </Button>
            <Button variant="light" size="sm" onClick={close}>
              Cancelar
            </Button>
          </>
        }
      >
        <p>
          Todos perdem o acesso a &quot;{group.name}&quot;. Para confirmar, digite <strong>EXCLUIR</strong>.
        </p>
        <TextField
          label="Confirmação"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
        />
        {remove.error ? <ErrorNote error={remove.error} /> : null}
      </Dialog>
    </>
  );
}
