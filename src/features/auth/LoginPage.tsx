import { useMutation } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { isApiError } from '@/api/errors';
import { unwrap } from '@/api/client';
import { useAuthStatus, useServices } from '@/app/servicesContext';
import { formatPhone, looksLikePhone } from '@/lib/phone';
import { Button } from '@/ui/Button';
import { Card, Hint } from '@/ui/Card';
import { ErrorNote } from '@/ui/ErrorNote';
import { TextField } from '@/ui/TextField';
import { useDelayedFlag } from '@/ui/useDelayedFlag';
import { AuthLayout } from './AuthLayout';
import { useMeta } from './queries';
import { useAfterSignInTarget, useCompleteSignIn } from './useSignIn';
import { useCaptcha } from './useCaptcha';

export function LoginPage() {
  const status = useAuthStatus();
  const navigate = useNavigate();
  const location = useLocation();
  const { publicApi } = useServices();
  const meta = useMeta();
  const captcha = useCaptcha(meta.data);
  const completeSignIn = useCompleteSignIn();
  const target = useAfterSignInTarget();
  const [phone, setPhone] = useState('');
  const waking = useDelayedFlag(meta.isPending, 3000);

  const login = useMutation({
    mutationFn: () =>
      unwrap(
        publicApi.POST('/api/v1/auth/login', { body: { phone, captchaToken: captcha.token ?? undefined } }),
      ),
    onSuccess: completeSignIn,
    onError: (error) => {
      captcha.reset();
      if (isApiError(error, 'auth.user_not_found') && meta.data?.auth.registrationOpen !== false) {
        void navigate('/cadastro', {
          state: { phone, from: (location.state as { from?: unknown } | null)?.from },
        });
      }
    },
  });

  if (status === 'authenticated') {
    return <Navigate to={target} replace />;
  }

  const closedForNewcomers =
    isApiError(login.error, 'auth.user_not_found') && meta.data?.auth.registrationOpen === false;
  const canSubmit = looksLikePhone(phone) && captcha.ready;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (canSubmit && !login.isPending) {
      login.mutate();
    }
  };

  return (
    <AuthLayout>
      <Card>
        <form onSubmit={onSubmit} className="stack" noValidate>
          <TextField
            label="Seu celular"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(11) 98888-7777"
            value={phone}
            onChange={(event) => setPhone(formatPhone(event.target.value))}
            hint="Só o número. Não mandamos SMS nem pedimos senha."
            autoFocus
          />
          {captcha.widget}
          {login.error && !closedForNewcomers && !isApiError(login.error, 'auth.user_not_found') ? (
            <ErrorNote error={login.error} />
          ) : null}
          {closedForNewcomers ? (
            <ErrorNote
              error={new Error('closed')}
              fallback="Os cadastros estão fechados no momento. Peça ajuda a quem te convidou."
            />
          ) : null}
          <Button type="submit" variant="go" size="lg" loading={login.isPending} disabled={!canSubmit}>
            Entrar
          </Button>
        </form>
        {waking ? (
          <Hint>Acordando o servidor… na primeira vez do dia isso pode levar até um minuto.</Hint>
        ) : null}
      </Card>
      <Hint>Se você ainda não tem conta, é só digitar o número: a gente cria a sua em seguida.</Hint>
    </AuthLayout>
  );
}
