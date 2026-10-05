import { useMutation } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { unwrap } from '@/api/client';
import { fieldError } from '@/api/errors';
import { useAuthStatus, useServices } from '@/app/servicesContext';
import { Avatar, AvatarPicker } from '@/ui/Avatar';
import { Button, LinkButton } from '@/ui/Button';
import { Card, Hint } from '@/ui/Card';
import { ErrorNote } from '@/ui/ErrorNote';
import { DEFAULT_PRESET, PRESET_KEYS } from '@/ui/presetCatalog';
import { TextField } from '@/ui/TextField';
import { AuthLayout } from './AuthLayout';
import { useAvatarPresets, useMeta } from './queries';
import { useCaptcha } from './useCaptcha';
import { useAfterSignInTarget, useCompleteSignIn } from './useSignIn';

const NAME_MIN = 2;
const NAME_MAX = 30;

export function RegisterPage() {
  const status = useAuthStatus();
  const location = useLocation();
  const phone = (location.state as { phone?: string } | null)?.phone;
  const { publicApi } = useServices();
  const meta = useMeta();
  const presets = useAvatarPresets();
  const captcha = useCaptcha(meta.data);
  const completeSignIn = useCompleteSignIn();
  const target = useAfterSignInTarget();
  const [displayName, setDisplayName] = useState('');
  const [avatarPreset, setAvatarPreset] = useState(DEFAULT_PRESET);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const register = useMutation({
    mutationFn: () =>
      unwrap(
        publicApi.POST('/api/v1/auth/register', {
          body: {
            phone: phone ?? '',
            displayName: displayName.trim(),
            avatarPreset,
            acceptTerms,
            captchaToken: captcha.token ?? undefined,
          },
        }),
      ),
    onSuccess: completeSignIn,
    onError: () => captcha.reset(),
  });

  if (status === 'authenticated') {
    return <Navigate to={target} replace />;
  }

  if (!phone) {
    return <Navigate to="/entrar" replace />;
  }

  if (meta.data?.auth.registrationOpen === false) {
    return (
      <AuthLayout>
        <Card>
          <h2>Cadastros fechados</h2>
          <Hint>No momento não estamos aceitando contas novas. Peça ajuda a quem te convidou.</Hint>
          <LinkButton to="/entrar" icon="back">
            Voltar
          </LinkButton>
        </Card>
      </AuthLayout>
    );
  }

  const keys = presets.data?.keys?.length ? presets.data.keys : PRESET_KEYS;
  const trimmed = displayName.trim();
  const canSubmit = trimmed.length >= NAME_MIN && acceptTerms && captcha.ready;
  const nameError = fieldError(register.error, 'displayName');

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (canSubmit && !register.isPending) {
      register.mutate();
    }
  };

  return (
    <AuthLayout>
      <Card>
        <h2>Vamos criar a sua conta</h2>
        <Hint>Não encontramos uma conta com o número {phone}. É rapidinho: nome e um avatar.</Hint>
        <form onSubmit={onSubmit} className="stack" noValidate>
          <TextField
            label="Seu nome"
            autoComplete="given-name"
            maxLength={NAME_MAX}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            hint="É o nome que seus amigos vão ver (de 2 a 30 letras)."
            error={nameError}
            autoFocus
          />
          <AvatarPicker keys={keys} value={avatarPreset} onChange={setAvatarPreset} />
          {trimmed ? (
            <div className="row">
              <Avatar avatar={{ kind: 'preset', preset: avatarPreset, url: null }} name={trimmed} size="lg" />
              <p>
                <strong>{trimmed}</strong>
              </p>
            </div>
          ) : null}
          <label className="check">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(event) => setAcceptTerms(event.target.checked)}
            />
            <span>
              Li e aceito os <Link to="/termos">termos de uso</Link> e o{' '}
              <Link to="/privacidade">aviso de privacidade</Link>.
            </span>
          </label>
          {captcha.widget}
          {register.error && !nameError ? <ErrorNote error={register.error} /> : null}
          <Button type="submit" variant="go" size="lg" loading={register.isPending} disabled={!canSubmit}>
            Criar conta e entrar
          </Button>
        </form>
      </Card>
      <LinkButton to="/entrar" variant="light" size="sm" icon="back">
        Usar outro número
      </LinkButton>
    </AuthLayout>
  );
}
