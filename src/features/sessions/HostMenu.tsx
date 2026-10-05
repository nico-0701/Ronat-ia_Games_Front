import { useState } from 'react';
import { Button } from '@/ui/Button';
import { Dialog } from '@/ui/Dialog';
import { ErrorNote } from '@/ui/ErrorNote';
import { useCancelSession, useFinishSession } from './queries';

/** Encerrar ou cancelar a partida em andamento (anfitrião e administradores do grupo), sempre depois de confirmar. */
export function HostMenu({ sessionId }: { sessionId: string }) {
  const [step, setStep] = useState<'closed' | 'menu' | 'finish' | 'cancel'>('closed');
  const finish = useFinishSession(sessionId);
  const cancel = useCancelSession(sessionId);
  const close = () => setStep('closed');

  return (
    <>
      <Button variant="light" size="sm" icon="sliders" onClick={() => setStep('menu')}>
        Opções do anfitrião
      </Button>

      <Dialog
        open={step === 'menu'}
        title="Opções do anfitrião"
        onClose={close}
        actions={
          <Button variant="light" size="sm" onClick={close}>
            Fechar
          </Button>
        }
      >
        <Button variant="light" icon="flag" onClick={() => setStep('finish')}>
          Encerrar e ver o resultado
        </Button>
        <Button variant="danger" icon="x" onClick={() => setStep('cancel')}>
          Cancelar a partida
        </Button>
      </Dialog>

      <Dialog
        open={step === 'finish'}
        title="Encerrar a partida?"
        onClose={() => setStep('menu')}
        actions={
          <>
            <Button
              variant="go"
              loading={finish.isPending}
              onClick={() => finish.mutate(undefined, { onSuccess: close })}
            >
              Encerrar agora
            </Button>
            <Button variant="light" size="sm" onClick={() => setStep('menu')}>
              Voltar
            </Button>
          </>
        }
      >
        <p>A partida termina agora e vale o placar do momento.</p>
        {finish.error ? <ErrorNote error={finish.error} /> : null}
      </Dialog>

      <Dialog
        open={step === 'cancel'}
        title="Cancelar a partida?"
        onClose={() => setStep('menu')}
        actions={
          <>
            <Button
              variant="stop"
              loading={cancel.isPending}
              onClick={() => cancel.mutate(undefined, { onSuccess: close })}
            >
              Cancelar a partida
            </Button>
            <Button variant="light" size="sm" onClick={() => setStep('menu')}>
              Voltar
            </Button>
          </>
        }
      >
        <p>A partida é abandonada sem resultado e não entra no ranking.</p>
        {cancel.error ? <ErrorNote error={cancel.error} /> : null}
      </Dialog>
    </>
  );
}
