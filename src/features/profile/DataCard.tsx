import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { isApiError } from '@/api/errors';
import { downloadJson } from '@/lib/download';
import { Button } from '@/ui/Button';
import { Card, Hint } from '@/ui/Card';
import { Dialog } from '@/ui/Dialog';
import { ErrorNote } from '@/ui/ErrorNote';
import { TextField } from '@/ui/TextField';
import { useToast } from '@/ui/toast';
import { useDeleteAccount, useExportData } from './queries';

/** Os direitos sobre os próprios dados (LGPD): baixar uma cópia e excluir a conta. */
export function DataCard() {
  const exportData = useExportData();
  const deleteAccount = useDeleteAccount();
  const navigate = useNavigate();
  const toast = useToast();
  const [deleting, setDeleting] = useState(false);
  const [typed, setTyped] = useState('');

  const download = () =>
    exportData.mutate(undefined, {
      onSuccess: (data) => {
        const day = new Date().toISOString().slice(0, 10);
        void (async () => {
          try {
            await downloadJson(`ronat-ia-meus-dados-${day}.json`, data);
            toast.show('Pronto! O arquivo com os seus dados foi baixado.', 'success');
          } catch {
            toast.show('Não foi possível salvar o arquivo. Tente de novo.', 'error');
          }
        })();
      },
    });

  const close = () => {
    setDeleting(false);
    setTyped('');
  };

  const blockingGroups = isApiError(deleteAccount.error, 'user.owns_groups')
    ? (deleteAccount.error.fieldErrors['groups'] ?? [])
    : [];

  return (
    <>
      <Card>
        <h2>Meus dados</h2>
        <Hint>
          Você pode baixar uma cópia de tudo o que guardamos sobre você (perfil, aparelhos, grupos e
          resultados). O telefone completo não aparece: ele nem fica guardado. Veja o{' '}
          <Link to="/privacidade">aviso de privacidade</Link>.
        </Hint>
        <Button variant="light" size="sm" icon="download" loading={exportData.isPending} onClick={download}>
          Baixar meus dados
        </Button>
        {exportData.error ? <ErrorNote error={exportData.error} /> : null}
      </Card>

      <Card>
        <h2>Excluir minha conta</h2>
        <Hint>
          Seu nome some, sua foto é apagada e o seu número fica livre para um novo cadastro. O que você jogou
          continua nos históricos dos grupos como &quot;Jogador removido&quot;. Não dá para desfazer.
        </Hint>
        <Button variant="danger" size="sm" icon="trash" onClick={() => setDeleting(true)}>
          Excluir minha conta
        </Button>
      </Card>

      <Dialog
        open={deleting}
        title="Excluir a conta?"
        onClose={close}
        actions={
          <>
            <Button
              variant="stop"
              loading={deleteAccount.isPending}
              disabled={typed.trim().toUpperCase() !== 'EXCLUIR'}
              onClick={() =>
                deleteAccount.mutate(undefined, {
                  onSuccess: () => {
                    toast.show('Conta excluída. Até logo!', 'success');
                    void navigate('/entrar', { replace: true });
                  },
                })
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
          Esta ação é definitiva. Para confirmar, digite <strong>EXCLUIR</strong>.
        </p>
        <TextField
          label="Confirmação"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
        />
        {blockingGroups.length > 0 ? (
          <ErrorNote
            error={deleteAccount.error}
            message={`Você é dono de grupos que têm outras pessoas: ${blockingGroups.join(', ')}. Passe a propriedade (ou exclua os grupos) antes.`}
          />
        ) : deleteAccount.error ? (
          <ErrorNote error={deleteAccount.error} />
        ) : null}
      </Dialog>
    </>
  );
}
