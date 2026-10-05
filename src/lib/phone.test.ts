import { describe, expect, it } from 'vitest';
import { digitsOf, formatPhone, looksLikePhone } from './phone';

describe('formatPhone', () => {
  it.each([
    ['', ''],
    ['1', '(1'],
    ['11', '(11'],
    ['119', '(11) 9'],
    ['1198888', '(11) 9888-8'],
    ['11988887777', '(11) 98888-7777'],
    ['1133334444', '(11) 3333-4444'],
    ['(11) 98888-7777', '(11) 98888-7777'],
    ['11 98888 7777 9999', '(11) 98888-7777'],
    ['5511988887777', '(11) 98888-7777'],
  ])('mascara %j como %j', (input, expected) => {
    expect(formatPhone(input)).toBe(expected);
  });

  it('mantém o código do país de quem começa com +', () => {
    expect(formatPhone('+351912345678')).toBe('+351 912 345 678');
    expect(formatPhone('+')).toBe('+');
  });

  it('não ultrapassa 15 dígitos num número internacional', () => {
    expect(digitsOf(formatPhone('+1234567890123456789'))).toHaveLength(15);
  });
});

describe('looksLikePhone', () => {
  it('exige DDD + número para números brasileiros', () => {
    expect(looksLikePhone('(11) 98888-7777')).toBe(true);
    expect(looksLikePhone('(11) 3333-4444')).toBe(true);
    expect(looksLikePhone('98888-7777')).toBe(false);
    expect(looksLikePhone('')).toBe(false);
  });

  it('aceita números internacionais mais curtos', () => {
    expect(looksLikePhone('+351 912 345 678')).toBe(true);
    expect(looksLikePhone('+351 91')).toBe(false);
  });
});
