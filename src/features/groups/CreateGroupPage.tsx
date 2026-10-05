import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { fieldError } from '@/api/errors';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { ErrorNote } from '@/ui/ErrorNote';
import { PageHeader } from '@/ui/Page';
import { TextField } from '@/ui/TextField';
import { useCreateGroup } from './queries';

export function CreateGroupPage() {
  const navigate = useNavigate();
  const create = useCreateGroup();
  const [name, setName] = useState('');
  const trimmed = name.trim();
  const nameError = fieldError(create.error, 'name');

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (trimmed.length >= 2 && !create.isPending) {
      create.mutate(trimmed, {
        // Depois de criar, o dono cai na lista de pessoas, onde está a senha para convidar os amigos.
        onSuccess: (group) => void navigate(`/grupos/${group.id}/membros`, { replace: true }),
      });
    }
  };

  return (
    <>
      <PageHeader title="Criar um grupo" back="/" />
      <Card>
        <form onSubmit={onSubmit} className="stack" noValidate>
          <TextField
            label="Nome do grupo"
            maxLength={40}
            value={name}
            onChange={(event) => setName(event.target.value)}
            hint="Ex.: Família Silva, Turma do trabalho, Amigos da faculdade."
            error={nameError}
            autoFocus
          />
          {create.error && !nameError ? <ErrorNote error={create.error} /> : null}
          <Button
            type="submit"
            variant="go"
            size="lg"
            loading={create.isPending}
            disabled={trimmed.length < 2}
          >
            Criar grupo
          </Button>
        </form>
      </Card>
      <Card tone="cream">
        <p>
          Depois de criar, você recebe a <strong>senha do grupo</strong> para passar aos amigos. Quem entrar
          no app com o celular e digitar a senha já está dentro.
        </p>
      </Card>
    </>
  );
}
