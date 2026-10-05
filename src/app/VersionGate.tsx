import type { ReactNode } from 'react';
import { useMeta } from '@/features/auth/queries';
import { APP_VERSION } from '@/lib/env';
import { compareVersions } from '@/lib/version';
import { Button } from '@/ui/Button';
import { Card, Hint } from '@/ui/Card';

/**
 * Se o servidor exige uma versão mais nova do app (`minClientVersion`), em vez de uma tela quebrada a pessoa vê um aviso.
 * No navegador basta recarregar; no Android é preciso instalar o APK novo.
 */
export function VersionGate({ children }: { children: ReactNode }) {
  const meta = useMeta();
  const outdated = meta.data !== undefined && compareVersions(APP_VERSION, meta.data.minClientVersion) < 0;

  if (!outdated) {
    return children;
  }

  return (
    <div
      className="stack"
      style={{ maxWidth: 'var(--column)', margin: '0 auto', padding: '24px var(--gutter)' }}
    >
      <Card>
        <h1>Hora de atualizar</h1>
        <Hint>
          Esta versão do app ficou antiga e não conversa mais com o servidor. Atualize para continuar jogando.
        </Hint>
        <Button variant="go" icon="refresh" onClick={() => window.location.reload()}>
          Atualizar agora
        </Button>
      </Card>
    </div>
  );
}
