import { isRouteErrorResponse, useRouteError } from 'react-router';
import { Button, LinkButton } from '@/ui/Button';
import { Card, Hint } from '@/ui/Card';

export function NotFoundPage() {
  return (
    <div
      className="stack"
      style={{ maxWidth: 'var(--column)', margin: '0 auto', padding: '24px var(--gutter)' }}
    >
      <Card>
        <h1>Página não encontrada</h1>
        <Hint>O endereço pode estar errado, ou a página não existe mais.</Hint>
        <LinkButton to="/" variant="go" icon="home">
          Ir para o início
        </LinkButton>
      </Card>
    </div>
  );
}

/** Rede de segurança: um erro inesperado numa tela não deixa a pessoa com a tela em branco. */
export function RouteError() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  if (notFound) {
    return <NotFoundPage />;
  }

  return (
    <div
      className="stack"
      style={{ maxWidth: 'var(--column)', margin: '0 auto', padding: '24px var(--gutter)' }}
    >
      <Card>
        <h1>Algo deu errado</h1>
        <Hint>
          Isso não era para acontecer. Recarregue a página; se continuar, avise quem administra o app.
        </Hint>
        <Button variant="go" icon="refresh" onClick={() => window.location.assign('/')}>
          Recarregar
        </Button>
      </Card>
    </div>
  );
}
