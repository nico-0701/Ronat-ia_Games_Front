import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';

// As telas são carregadas sob demanda (import dinâmico): na primeira vez o vite-node precisa transformar o módulo, e com a
// máquina ocupada isso passa de 1 s (o padrão do findBy). 5 s só atrasa o teste quando algo está de fato quebrado.
configure({ asyncUtilTimeout: 5000 });

afterEach(() => {
  cleanup();
  try {
    window.localStorage.clear();
    window.sessionStorage.clear();
  } catch {
    // o jsdom sempre tem storage; o try só protege contra ambientes sem ele
  }
});
