import { describe, expect, it } from 'vitest';
import { ApiError, errorMessage, fieldError, isApiError, networkError, problemFrom } from './errors';

function responseWith(status: number, headers: Record<string, string> = {}): Response {
  return new Response(null, { status, headers });
}

describe('problemFrom', () => {
  it('usa o code estável, o detalhe em português e os erros por campo do problem+json', () => {
    const error = problemFrom(responseWith(400), {
      code: 'validation.failed',
      detail: 'Dados inválidos.',
      traceId: 'abc',
      errors: { displayName: ['Muito curto.'] },
    });

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.code).toBe('validation.failed');
    expect(error.detail).toBe('Dados inválidos.');
    expect(error.traceId).toBe('abc');
    expect(fieldError(error, 'displayName')).toBe('Muito curto.');
    expect(fieldError(error, 'DisplayName')).toBe('Muito curto.');
    expect(fieldError(error, 'phone')).toBeUndefined();
  });

  it('lê o Retry-After do limite de requisições', () => {
    const error = problemFrom(responseWith(429, { 'Retry-After': '12' }), {
      code: 'rate_limit.exceeded',
      detail: '',
    });
    expect(error.retryAfterSeconds).toBe(12);
    expect(error.detail).toContain('Muitas tentativas');
  });

  it('transforma respostas que não são problem+json (proxy, HTML) em http.<status>', () => {
    const error = problemFrom(responseWith(502, { 'X-Trace-Id': 't1' }), '<html>Bad gateway</html>');
    expect(error.code).toBe('http.502');
    expect(error.detail).toContain('acordando');
    expect(error.traceId).toBe('t1');
    expect(error.isServerSide).toBe(true);
  });
});

describe('networkError', () => {
  it('tem status 0 e é reconhecido como falha de rede', () => {
    const error = networkError(new TypeError('Failed to fetch'));
    expect(error.status).toBe(0);
    expect(error.isNetwork).toBe(true);
    expect(error.code).toBe('network.unreachable');
    expect(error.cause).toBeInstanceOf(TypeError);
  });
});

describe('isApiError / errorMessage', () => {
  it('confere o code quando informado', () => {
    const error = new ApiError({ status: 404, code: 'auth.user_not_found', detail: 'Sem conta.' });
    expect(isApiError(error)).toBe(true);
    expect(isApiError(error, 'auth.user_not_found')).toBe(true);
    expect(isApiError(error, 'outro')).toBe(false);
    expect(isApiError(new Error('x'))).toBe(false);
  });

  it('mostra o detalhe do servidor, mas nunca o texto de erros desconhecidos', () => {
    expect(errorMessage(new ApiError({ status: 409, code: 'x', detail: 'Já existe.' }))).toBe('Já existe.');
    expect(errorMessage(new Error('stack trace interno'))).toBe('Algo deu errado. Tente de novo.');
    expect(errorMessage(undefined, 'Falhou.')).toBe('Falhou.');
  });
});
