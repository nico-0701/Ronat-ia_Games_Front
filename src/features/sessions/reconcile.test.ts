import { describe, expect, it } from 'vitest';
import { sessionFixture } from '@/test/sessions';
import { reconcileSession } from './reconcile';

describe('reconcileSession', () => {
  it('sem partida anterior, fica com a que chegou', () => {
    const incoming = sessionFixture({ version: 3 });
    expect(reconcileSession(undefined, incoming)).toBe(incoming);
  });

  it('aceita versão maior e ignora a menor', () => {
    const current = sessionFixture({ version: 5 });
    const newer = sessionFixture({ version: 6 });
    const older = sessionFixture({ version: 4 });

    expect(reconcileSession(current, newer)).toBe(newer);
    expect(reconcileSession(current, older)).toBe(current);
  });

  it('mensagens de mesma versão não passam por cima, mas uma busca explícita sim', () => {
    const current = sessionFixture({ version: 5, allowedActions: [] });
    const sameVersion = sessionFixture({ version: 5, allowedActions: ['reportHit'] });

    expect(reconcileSession(current, sameVersion)).toBe(current);
    expect(reconcileSession(current, sameVersion, { allowEqual: true })).toBe(sameVersion);
  });

  it('outra partida sempre substitui', () => {
    const current = sessionFixture({ id: 'a', version: 9 });
    const other = sessionFixture({ id: 'b', version: 1 });

    expect(reconcileSession(current, other)).toBe(other);
  });
});
