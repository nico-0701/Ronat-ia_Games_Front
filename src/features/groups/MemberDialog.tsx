import { useState } from 'react';
import type { GroupDetail, Member } from '@/api/types';
import { Button } from '@/ui/Button';
import { Dialog } from '@/ui/Dialog';
import { ErrorNote } from '@/ui/ErrorNote';
import { canManageProfiles, canRemoveMember, isOwner } from './permissions';
import { useRemoveMember, useTransferOwnership, useUpdateMember } from './queries';
import { ProfileDialog } from './ProfileDialog';

type Step = 'menu' | 'edit' | 'confirm-remove' | 'confirm-transfer';

interface MemberDialogProps {
  group: GroupDetail;
  member: Member;
  onClose: () => void;
}

/** O que dá para fazer com um membro, conforme o papel de quem está vendo. Confirma antes de tudo o que não se desfaz. */
export function MemberDialog({ group, member, onClose }: MemberDialogProps) {
  const [step, setStep] = useState<Step>('menu');
  const remove = useRemoveMember(group.id);
  const update = useUpdateMember(group.id);
  const transfer = useTransferOwnership(group.id);

  const mine = group.myRole;
  const canEditProfile = !member.hasAccount && canManageProfiles(mine);
  const canRemove = canRemoveMember(mine, member.role);
  const canChangeRole = isOwner(mine) && member.hasAccount && member.role !== 'owner';
  const canTransfer = isOwner(mine) && member.hasAccount && member.role !== 'owner';

  if (step === 'edit') {
    return <ProfileDialog groupId={group.id} member={member} onClose={onClose} />;
  }

  if (step === 'confirm-remove') {
    return (
      <Dialog
        open
        title={`Remover ${member.displayName}?`}
        onClose={onClose}
        actions={
          <>
            <Button
              variant="stop"
              loading={remove.isPending}
              onClick={() => remove.mutate(member.id, { onSuccess: onClose })}
            >
              Remover do grupo
            </Button>
            <Button variant="light" size="sm" onClick={() => setStep('menu')}>
              Voltar
            </Button>
          </>
        }
      >
        <p>
          {member.hasAccount
            ? 'A pessoa sai do grupo, mas o que ela jogou continua no histórico. Ela pode voltar com a senha.'
            : 'O perfil sai do grupo, mas o que ele jogou continua no histórico.'}
        </p>
        {remove.error ? <ErrorNote error={remove.error} /> : null}
      </Dialog>
    );
  }

  if (step === 'confirm-transfer') {
    return (
      <Dialog
        open
        title="Passar a propriedade?"
        onClose={onClose}
        actions={
          <>
            <Button
              variant="go"
              loading={transfer.isPending}
              onClick={() => transfer.mutate(member.id, { onSuccess: onClose })}
            >
              Passar para {member.displayName}
            </Button>
            <Button variant="light" size="sm" onClick={() => setStep('menu')}>
              Voltar
            </Button>
          </>
        }
      >
        <p>
          {member.displayName} passa a ser o dono do grupo, e você vira administrador. Só o novo dono poderá
          desfazer isso.
        </p>
        {transfer.error ? <ErrorNote error={transfer.error} /> : null}
      </Dialog>
    );
  }

  const nextRole = member.role === 'admin' ? 'member' : 'admin';

  return (
    <Dialog
      open
      title={member.displayName}
      onClose={onClose}
      actions={
        <Button variant="light" size="sm" onClick={onClose}>
          Fechar
        </Button>
      }
    >
      {canEditProfile ? (
        <Button variant="light" icon="pencil" onClick={() => setStep('edit')}>
          Editar nome e avatar
        </Button>
      ) : null}
      {canChangeRole ? (
        <Button
          variant="light"
          icon="crown"
          loading={update.isPending}
          onClick={() =>
            update.mutate({ memberId: member.id, changes: { role: nextRole } }, { onSuccess: onClose })
          }
        >
          {nextRole === 'admin' ? 'Tornar administrador' : 'Voltar a membro comum'}
        </Button>
      ) : null}
      {canTransfer ? (
        <Button variant="light" icon="key" onClick={() => setStep('confirm-transfer')}>
          Passar a propriedade do grupo
        </Button>
      ) : null}
      {canRemove ? (
        <Button variant="danger" icon="trash" onClick={() => setStep('confirm-remove')}>
          Remover do grupo
        </Button>
      ) : null}
      {!canEditProfile && !canChangeRole && !canTransfer && !canRemove ? (
        <p className="muted">Você não pode fazer nada com este membro.</p>
      ) : null}
      {update.error ? <ErrorNote error={update.error} /> : null}
    </Dialog>
  );
}
