import { useState } from 'react';
import { useNavigate } from 'react-router';
import { formatWhen } from '@/lib/format';
import { Button } from '@/ui/Button';
import { Card, Hint } from '@/ui/Card';
import { Dialog } from '@/ui/Dialog';
import { ErrorNote } from '@/ui/ErrorNote';
import { useToast } from '@/ui/toast';
import { useDevices, useLogoutEverywhere, useRevokeDevice } from './queries';
import styles from './DevicesCard.module.css';

/** Os aparelhos em que a conta está conectada: dá para desconectar um ou todos (qualquer um que tenha o seu número entra). */
export function DevicesCard() {
  const devices = useDevices();
  const revoke = useRevokeDevice();
  const logoutAll = useLogoutEverywhere();
  const navigate = useNavigate();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);

  return (
    <Card>
      <h2>Aparelhos conectados</h2>
      <Hint>
        Como não há senha, quem souber o seu número consegue entrar. Se algum aparelho não é seu, desconecte.
      </Hint>

      {devices.isError ? <ErrorNote error={devices.error} onRetry={() => void devices.refetch()} /> : null}

      <ul className={styles.list}>
        {devices.data?.map((device) => (
          <li key={device.id} className={styles.device}>
            <span className={styles.who}>
              <span className={styles.name}>
                {device.deviceLabel ?? 'Aparelho sem nome'}
                {device.isCurrent ? <span className={styles.tag}>Este aparelho</span> : null}
              </span>
              <span className={styles.when}>Último uso: {formatWhen(device.lastUsedAt)}</span>
            </span>
            {!device.isCurrent ? (
              <Button
                block={false}
                size="sm"
                variant="light"
                loading={revoke.isPending && revoke.variables === device.id}
                disabled={revoke.isPending}
                aria-label={`Desconectar ${device.deviceLabel ?? 'aparelho sem nome'}`}
                onClick={() =>
                  revoke.mutate(device.id, {
                    onSuccess: () => toast.show('Aparelho desconectado.', 'success'),
                  })
                }
              >
                Desconectar
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
      {revoke.error ? <ErrorNote error={revoke.error} /> : null}

      <Button variant="danger" size="sm" icon="logout" onClick={() => setConfirming(true)}>
        Sair de todos os aparelhos
      </Button>

      <Dialog
        open={confirming}
        title="Sair de todos os aparelhos?"
        onClose={() => setConfirming(false)}
        actions={
          <>
            <Button
              variant="stop"
              loading={logoutAll.isPending}
              onClick={() =>
                logoutAll.mutate(undefined, { onSuccess: () => void navigate('/entrar', { replace: true }) })
              }
            >
              Sair de todos
            </Button>
            <Button variant="light" size="sm" onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
          </>
        }
      >
        <p>
          Você será desconectado aqui e em todos os outros aparelhos. É só entrar de novo com o celular quando
          quiser.
        </p>
        {logoutAll.error ? <ErrorNote error={logoutAll.error} /> : null}
      </Dialog>
    </Card>
  );
}
