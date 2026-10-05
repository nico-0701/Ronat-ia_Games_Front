import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { isApiError } from '@/api/errors';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { Card, Hint } from '@/ui/Card';
import { ErrorNote } from '@/ui/ErrorNote';
import { PageHeader } from '@/ui/Page';
import { TextField } from '@/ui/TextField';
import { formatInviteCode, looksLikeInviteCode, normalizeInviteCode } from './invite';
import { peopleLabel, useJoinGroup, useLookupGroup } from './queries';
import styles from './JoinGroupPage.module.css';

const NEW_PERSON = 'new';

/** Entrar num grupo com a senha. O link de convite traz a senha no `#`, e a conferência já acontece sozinha. */
export function JoinGroupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mutate: lookupGroup, ...lookup } = useLookupGroup();
  const join = useJoinGroup();
  // A senha que veio no link (#) é conferida sozinha, uma vez; a digitada na mão só é conferida pelo botão.
  const [fromLink] = useState(() => formatInviteCode(location.hash.replace(/^#/, '')));
  const [code, setCode] = useState(fromLink);
  const [claim, setClaim] = useState<string>(NEW_PERSON);
  const autoLooked = useRef(false);

  useEffect(() => {
    if (!autoLooked.current && looksLikeInviteCode(fromLink)) {
      autoLooked.current = true;
      lookupGroup(normalizeInviteCode(fromLink));
    }
  }, [fromLink, lookupGroup]);

  const preview = lookup.data;
  const canLookup = looksLikeInviteCode(code);

  const onLookup = (event: FormEvent) => {
    event.preventDefault();
    if (canLookup && !lookup.isPending) {
      setClaim(NEW_PERSON);
      lookupGroup(normalizeInviteCode(code));
    }
  };

  const onJoin = () => {
    join.mutate(
      { code: normalizeInviteCode(code), claimMemberId: claim === NEW_PERSON ? undefined : claim },
      { onSuccess: (group) => void navigate(`/grupos/${group.id}`, { replace: true }) },
    );
  };

  return (
    <>
      <PageHeader title="Entrar num grupo" back="/" />

      <Card>
        <form onSubmit={onLookup} className="stack" noValidate>
          <TextField
            label="Senha do grupo"
            value={code}
            onChange={(event) => {
              setCode(formatInviteCode(event.target.value));
              lookup.reset();
            }}
            placeholder="K7RM-4PXT"
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            hint="São 8 letras e números, que quem criou o grupo te passou."
            autoFocus
          />
          {lookup.error ? (
            <ErrorNote
              error={lookup.error}
              fallback={
                isApiError(lookup.error, 'group.invalid_code') ? 'Senha incorreta ou desativada.' : undefined
              }
            />
          ) : null}
          {!preview ? (
            <Button type="submit" variant="go" size="lg" loading={lookup.isPending} disabled={!canLookup}>
              Conferir senha
            </Button>
          ) : null}
        </form>
      </Card>

      {preview ? (
        <Card tone="sun">
          <h2>{preview.name}</h2>
          <Hint>
            {peopleLabel(preview.memberCount)}
            {preview.alreadyMember ? ' · você já está neste grupo' : ''}
          </Hint>

          {!preview.alreadyMember && preview.claimableMembers.length > 0 ? (
            <fieldset className={styles.claim}>
              <legend>Você é uma destas pessoas?</legend>
              <p className={styles.explain}>
                Se alguém já criou o seu perfil aqui, escolha-o e o seu histórico vem junto.
              </p>
              <div className={styles.options} role="radiogroup">
                {preview.claimableMembers.map((member) => (
                  <label key={member.id} className={styles.option}>
                    <input
                      type="radio"
                      name="claim"
                      checked={claim === member.id}
                      onChange={() => setClaim(member.id)}
                    />
                    <Avatar avatar={member.avatar} name={member.displayName} size="sm" />
                    <span>{member.displayName}</span>
                  </label>
                ))}
                <label className={styles.option}>
                  <input
                    type="radio"
                    name="claim"
                    checked={claim === NEW_PERSON}
                    onChange={() => setClaim(NEW_PERSON)}
                  />
                  <span>Sou novo por aqui</span>
                </label>
              </div>
            </fieldset>
          ) : null}

          {join.error ? <ErrorNote error={join.error} /> : null}
          <Button variant="go" size="lg" loading={join.isPending} onClick={onJoin}>
            {preview.alreadyMember ? 'Abrir o grupo' : 'Entrar no grupo'}
          </Button>
        </Card>
      ) : null}
    </>
  );
}
