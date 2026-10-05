# ADR-0001: Stack do Front e guarda da sessão

- **Status:** aceita (05/10/2026)

## Contexto

O Front precisa funcionar como site (Cloudflare Pages) e, depois, como app Android (Capacitor) a partir do mesmo código. O servidor (Back) já está pronto, com contrato OpenAPI, tokens de uso único e SignalR. O Front é mantido por poucas pessoas; o que importa é pouca dependência, tipos fortes e telas legíveis para qualquer idade.

## Decisões

1. **React 19 + TypeScript estrito + Vite.** Padrão do mercado, suportado pelo Capacitor, rápido para desenvolver.
2. **Tipos gerados do OpenAPI (`openapi-typescript`) e `openapi-fetch`.** O contrato do Back é a fonte da verdade; nenhuma resposta é descrita à mão, e uma mudança de API quebra a compilação em vez de quebrar em produção. Cópia do contrato versionada no repositório (`openapi/v1.json`), com `npm run api:sync` para atualizar.
3. **TanStack Query** para o estado vindo do servidor (cache, recarga, tentativas) e estado local simples para o resto. Sem Redux.
4. **React Router** (modo de dados) com as rotas num arquivo (`routes.tsx`), para os testes montarem a mesma árvore.
5. **CSS Modules**, sem biblioteca de componentes: o visual do app original (contorno grosso, sombra dura) é pequeno e próprio. Tokens em variáveis CSS, com modo escuro.
6. **Vitest + Testing Library**, com um servidor de mentira que implementa só as rotas usadas em cada teste.

## Sessão

- Tokens no `localStorage`, não em cookies: o Back usa `Authorization: Bearer` (sem cookies, logo sem CSRF) e o Capacitor também usa `localStorage` no WebView. **Risco aceito:** um XSS poderia ler os tokens. Mitigações: CSP restritiva (`dist/_headers`), nenhum HTML vindo do servidor é injetado (React escapa tudo), nenhuma biblioteca de terceiros em tempo de execução além das listadas, e `Referrer-Policy: no-referrer`. No Android, a evolução prevista é guardar o refresh token no Keystore.
- O refresh token é de **uso único** e reapresentar um já trocado derruba a sessão. Duas abas abertas poderiam disputá-lo, então a renovação é serializada entre abas com Web Locks e relê o armazenamento dentro do lock (`AuthSession`; há teste de duas abas).
- Falha de rede ou 5xx na renovação **não** desloga; só um refresh token inválido encerra a sessão.

## Consequências

- Uma única fonte de tipos reduz erros de contrato; em troca, é preciso rodar `api:sync` quando o Back muda.
- Guardar tokens em `localStorage` é simples e funciona igual na Web e no Android, ao custo do risco de XSS descrito acima.
