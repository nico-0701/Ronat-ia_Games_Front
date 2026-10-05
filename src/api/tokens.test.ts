import { describe, expect, it, vi } from 'vitest';
import { memoryStorage, authFixture } from '@/test/helpers';
import { TOKEN_STORAGE_KEY, TokenStore, tokensFrom } from './tokens';

describe('TokenStore', () => {
  it('começa vazio e guarda o que for salvo, inclusive no armazenamento', () => {
    const storage = memoryStorage();
    const store = new TokenStore(storage);
    expect(store.current).toBeNull();

    const tokens = tokensFrom(authFixture({ tag: 'x' }));
    store.save(tokens);

    expect(store.current?.accessToken).toBe('access-x');
    expect(JSON.parse(storage.dump()[TOKEN_STORAGE_KEY]!)).toMatchObject({ refreshToken: 'refresh-x' });
  });

  it('lê o que outra aba (ou a visita anterior) deixou no armazenamento', () => {
    const storage = memoryStorage();
    new TokenStore(storage).save(tokensFrom(authFixture({ tag: 'antigo' })));

    expect(new TokenStore(storage).current?.accessToken).toBe('access-antigo');
  });

  it('ignora conteúdo corrompido ou de formato desconhecido', () => {
    expect(new TokenStore(memoryStorage({ [TOKEN_STORAGE_KEY]: 'não é json' })).current).toBeNull();
    expect(new TokenStore(memoryStorage({ [TOKEN_STORAGE_KEY]: '{"accessToken":1}' })).current).toBeNull();
  });

  it('reload enxerga a mudança feita por outra aba e avisa quem escuta', () => {
    const storage = memoryStorage();
    const tabA = new TokenStore(storage);
    const tabB = new TokenStore(storage);
    const listener = vi.fn();
    tabB.subscribe(listener);

    tabA.save(tokensFrom(authFixture({ tag: 'novo' })));
    expect(tabB.current).toBeNull(); // ainda não releu

    tabB.reload();
    expect(tabB.current?.accessToken).toBe('access-novo');
    expect(listener).toHaveBeenCalledTimes(1);

    tabB.reload(); // nada mudou: não avisa de novo
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('clear apaga da memória e do armazenamento', () => {
    const storage = memoryStorage();
    const store = new TokenStore(storage);
    store.save(tokensFrom(authFixture()));

    store.clear();

    expect(store.current).toBeNull();
    expect(storage.dump()).toEqual({});
  });

  it('funciona só na memória quando não há armazenamento', () => {
    const store = new TokenStore(null);
    store.save(tokensFrom(authFixture({ tag: 'mem' })));
    expect(store.current?.accessToken).toBe('access-mem');
    expect(store.reload()?.accessToken).toBe('access-mem');
  });

  it('sobrevive a um armazenamento que lança exceção', () => {
    const broken = {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('cheio');
      },
      removeItem: () => {
        throw new Error('bloqueado');
      },
    };
    const store = new TokenStore(broken);

    expect(() => store.save(tokensFrom(authFixture()))).not.toThrow();
    expect(store.current).not.toBeNull();
    expect(() => store.clear()).not.toThrow();
  });

  it('o evento storage de outra aba dispara um reload', () => {
    const storage = memoryStorage();
    const mine = new TokenStore(storage);
    const other = new TokenStore(storage);
    const events = new EventTarget();
    mine.listenToOtherTabs(events as unknown as Window);

    other.save(tokensFrom(authFixture({ tag: 'outra-aba' })));
    events.dispatchEvent(Object.assign(new Event('storage'), { key: TOKEN_STORAGE_KEY }));

    expect(mine.current?.accessToken).toBe('access-outra-aba');
  });
});
