/** Alfabeto da senha do grupo (sem I, L, O, U, 0 e 1, para não confundir ao ler em voz alta). */
const ALPHABET = /[A-HJ-KM-NP-TV-Z2-9]/g;

export const INVITE_CODE_LENGTH = 8;

/**
 * Senha como a pessoa digita: maiúsculas, só letras e números, em dois blocos de 4 (`K7RM-4PXT`).
 * Maiúsculas, minúsculas, espaços e hífens são aceitos na entrada, como no servidor.
 */
export function formatInviteCode(input: string): string {
  const letters = input
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, INVITE_CODE_LENGTH);
  return letters.length > 4 ? `${letters.slice(0, 4)}-${letters.slice(4)}` : letters;
}

/** Só os 8 caracteres, sem hífen (o formato que o servidor devolve em `inviteCode`). */
export function normalizeInviteCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** A senha tem 8 caracteres e todos fazem parte do alfabeto. Quem decide se vale é o servidor. */
export function looksLikeInviteCode(input: string): boolean {
  const code = normalizeInviteCode(input);
  return code.length === INVITE_CODE_LENGTH && (code.match(ALPHABET)?.length ?? 0) === INVITE_CODE_LENGTH;
}

/** O endereço que abre a tela de entrar já com a senha (no fragmento `#`, que nunca vai para o servidor). */
export function inviteLink(origin: string, code: string): string {
  return `${origin}/grupos/entrar#${normalizeInviteCode(code)}`;
}

/** O texto para mandar por WhatsApp e afins. */
export function inviteMessage(groupName: string, code: string, origin: string): string {
  return `Entre no grupo "${groupName}" do Ronat-ia Games! Senha: ${formatInviteCode(code)}\n${inviteLink(origin, code)}`;
}
