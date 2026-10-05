import type { components } from './schema';

type Problem = Partial<components['schemas']['ApiProblem']>;

interface ApiErrorInit {
  status: number;
  code: string;
  detail: string;
  fieldErrors?: Record<string, string[]>;
  traceId?: string;
  retryAfterSeconds?: number;
  cause?: unknown;
}

/**
 * Erro devolvido pela API (`application/problem+json`) ou falha de rede (`status` 0).
 * Decida o que fazer pelo `code` (estável); `detail` é o texto em português para mostrar à pessoa.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly detail: string;
  readonly fieldErrors: Readonly<Record<string, readonly string[]>>;
  readonly traceId: string | undefined;
  readonly retryAfterSeconds: number | undefined;

  constructor(init: ApiErrorInit) {
    super(init.detail, init.cause === undefined ? undefined : { cause: init.cause });
    this.name = 'ApiError';
    this.status = init.status;
    this.code = init.code;
    this.detail = init.detail;
    this.fieldErrors = init.fieldErrors ?? {};
    this.traceId = init.traceId;
    this.retryAfterSeconds = init.retryAfterSeconds;
  }

  /** Sem resposta do servidor: sem internet, servidor dormindo, bloqueio de CORS... */
  get isNetwork(): boolean {
    return this.status === 0;
  }

  /** Falha de servidor ou de proxy (5xx): vale tentar de novo daqui a pouco. */
  get isServerSide(): boolean {
    return this.status >= 500;
  }
}

export const NETWORK_ERROR_CODE = 'network.unreachable';

export function networkError(cause?: unknown): ApiError {
  return new ApiError({
    status: 0,
    code: NETWORK_ERROR_CODE,
    detail: 'Não foi possível falar com o servidor. Confira sua internet e tente de novo.',
    cause,
  });
}

const GENERIC_DETAIL: Record<number, string> = {
  502: 'O servidor está acordando ou fora do ar. Espere alguns segundos e tente de novo.',
  503: 'O servidor está acordando ou fora do ar. Espere alguns segundos e tente de novo.',
  504: 'O servidor demorou demais para responder. Tente de novo.',
  413: 'O envio é grande demais.',
  429: 'Muitas tentativas em pouco tempo. Aguarde um instante e tente de novo.',
};

function isProblem(body: unknown): body is Problem {
  return typeof body === 'object' && body !== null && typeof (body as Problem).code === 'string';
}

/** Monta o erro a partir da resposta HTTP e do corpo (já lido). Respostas que não são `problem+json` (proxy, HTML) viram `http.<status>`. */
export function problemFrom(response: Response, body: unknown): ApiError {
  const retryAfter = Number(response.headers.get('Retry-After'));
  const retryAfterSeconds = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined;

  if (isProblem(body)) {
    return new ApiError({
      status: response.status,
      code: body.code ?? `http.${response.status}`,
      detail: body.detail || GENERIC_DETAIL[response.status] || 'Algo deu errado. Tente de novo.',
      fieldErrors: body.errors ?? undefined,
      traceId: body.traceId,
      retryAfterSeconds,
    });
  }

  return new ApiError({
    status: response.status,
    code: `http.${response.status}`,
    detail: GENERIC_DETAIL[response.status] ?? 'Algo deu errado. Tente de novo.',
    traceId: response.headers.get('X-Trace-Id') ?? undefined,
    retryAfterSeconds,
  });
}

export function isApiError(error: unknown, code?: string): error is ApiError {
  return error instanceof ApiError && (code === undefined || error.code === code);
}

/** Texto para mostrar à pessoa (nunca vaza detalhes técnicos de erros inesperados). */
export function errorMessage(error: unknown, fallback = 'Algo deu errado. Tente de novo.'): string {
  return error instanceof ApiError ? error.detail : fallback;
}

/** Primeira mensagem de validação de um campo (`errors.displayName[0]`), se houver. */
export function fieldError(error: unknown, field: string): string | undefined {
  if (!(error instanceof ApiError)) {
    return undefined;
  }

  const wanted = field.toLowerCase();
  const key = Object.keys(error.fieldErrors).find((name) => name.toLowerCase() === wanted);
  return key ? error.fieldErrors[key]?.[0] : undefined;
}
