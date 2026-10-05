/** Só os dígitos de um texto. */
export function digitsOf(text: string): string {
  return text.replace(/\D/g, '');
}

/**
 * Máscara de telefone enquanto a pessoa digita. Números brasileiros ganham `(11) 98888-7777`; quem começa com `+` mantém o
 * código do país (`+351 912 345 678`) e o servidor faz a validação de verdade.
 */
export function formatPhone(input: string): string {
  const trimmed = input.trimStart();
  if (trimmed.startsWith('+')) {
    const digits = digitsOf(trimmed).slice(0, 15);
    return digits ? `+${digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim()}` : '+';
  }

  let digits = digitsOf(trimmed);
  if (digits.startsWith('55') && digits.length > 11) {
    digits = digits.slice(2);
  }

  digits = digits.slice(0, 11);
  if (digits.length === 0) {
    return '';
  }

  if (digits.length <= 2) {
    return `(${digits}`;
  }

  const area = digits.slice(0, 2);
  const rest = digits.slice(2);
  const split = rest.length > 8 ? 5 : 4; // celular (9 dígitos) ou fixo (8)
  if (rest.length <= split) {
    return `(${area}) ${rest}`;
  }

  return `(${area}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}

/** Confere só o óbvio (quantidade de dígitos) para liberar o botão; quem decide se vale é o servidor (`auth.invalid_phone`). */
export function looksLikePhone(input: string): boolean {
  const digits = digitsOf(input);
  return input.trim().startsWith('+') ? digits.length >= 8 : digits.length >= 10;
}
