import { useState } from 'react';
import { useParams } from 'react-router';
import type { Member } from '@/api/types';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Icon } from '@/ui/Icon';
import { InviteCard } from './InviteCard';
import { MemberDialog } from './MemberDialog';
import { ProfileDialog } from './ProfileDialog';
import { canManageProfiles, canRemoveMember, isOwner } from './permissions';
import { roleLabel, useGroup } from './queries';
import styles from './MembersTab.module.css';

/** A aba "Pessoas": a senha do grupo e a lista de membros (com ou sem conta). */
export function MembersTab() {
  const { groupId = '' } = useParams();
  const { data: group } = useGroup(groupId);
  const [selected, setSelected] = useState<Member | null>(null);
  const [adding, setAdding] = useState(false);

  if (!group) {
    return null;
  }

  const actionsFor = (member: Member): boolean =>
    !member.isMe &&
    ((!member.hasAccount && canManageProfiles(group.myRole)) ||
      canRemoveMember(group.myRole, member.role) ||
      (isOwner(group.myRole) && member.hasAccount));

  return (
    <>
      <InviteCard group={group} />

      <Card>
        <h2>Quem está no grupo</h2>
        <ul className={styles.list}>
          {group.members.map((member) => {
            const clickable = actionsFor(member);
            const body = (
              <>
                <Avatar avatar={member.avatar} name={member.displayName} size="md" />
                <span className={styles.who}>
                  <span className={styles.name}>
                    {member.displayName}
                    {member.isMe ? ' (você)' : ''}
                  </span>
                  <span className={styles.tags}>
                    {member.role !== 'member' ? (
                      <span className={styles.tag}>{roleLabel(member.role)}</span>
                    ) : null}
                    {!member.hasAccount ? <span className={styles.tag}>Sem celular</span> : null}
                  </span>
                </span>
                {clickable ? <Icon name="chevron" size={22} /> : null}
              </>
            );

            return (
              <li key={member.id}>
                {clickable ? (
                  <button
                    type="button"
                    className={`${styles.row} ${styles.clickable}`}
                    onClick={() => setSelected(member)}
                    aria-label={`Opções de ${member.displayName}`}
                  >
                    {body}
                  </button>
                ) : (
                  <div className={styles.row}>{body}</div>
                )}
              </li>
            );
          })}
        </ul>
        {canManageProfiles(group.myRole) ? (
          <Button variant="light" size="sm" icon="plus" onClick={() => setAdding(true)}>
            Adicionar pessoa sem celular
          </Button>
        ) : null}
      </Card>

      {selected ? <MemberDialog group={group} member={selected} onClose={() => setSelected(null)} /> : null}
      {adding ? <ProfileDialog groupId={group.id} onClose={() => setAdding(false)} /> : null}
    </>
  );
}
