# Ronat-ia Games · Front

Cliente Web (e, depois, Android via Capacitor) da plataforma de jogos **Ronat-ia Games**: jogos para a família e os amigos, cada um no seu celular. O servidor (API, regras dos jogos, banco) está no repositório [`Ronat-ia_Games_Back`](https://github.com/nico-0701/Ronat-ia_Games_Back); este repositório é só a interface.

> **Estado:** entrada por telefone (login e cadastro), início, perfil e textos de privacidade/termos. Em andamento: grupos, partidas em tempo real, Mímica, ranking. Veja [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Stack

React 19 + TypeScript (estrito) + Vite · React Router · TanStack Query · `openapi-fetch` com tipos gerados do contrato da API · SignalR (tempo real) · CSS Modules · Vitest + Testing Library. Decisões em [`docs/adr`](docs/adr).

## Rodando localmente

Precisa do Node 22+ e do Back rodando (veja o README dele: banco local com `scripts/dev-db.ps1`, depois `dotnet run --project src/RonatIa.Games.Api --launch-profile http`, que sobe em `http://localhost:5080`).

```bash
npm ci
npm run dev        # http://localhost:5173
```

Em desenvolvimento o Vite encaminha `/api` e `/hubs` para a API (`VITE_DEV_API_TARGET`, padrão `http://localhost:5080`), então não há CORS. Veja [`.env.example`](.env.example).

## Comandos

| Comando                           | O que faz                                                                               |
| --------------------------------- | --------------------------------------------------------------------------------------- |
| `npm run dev`                     | servidor de desenvolvimento com recarga a quente                                        |
| `npm run check`                   | tudo o que o CI confere: lint, tipos, testes e build                                    |
| `npm test` / `npm run test:watch` | testes (Vitest)                                                                         |
| `npm run lint` / `npm run format` | ESLint / Prettier                                                                       |
| `npm run typecheck`               | TypeScript                                                                              |
| `npm run build`                   | build de produção em `dist/` (gera também `dist/_headers` com a CSP)                    |
| `npm run api:types`               | regenera `src/api/schema.d.ts` do contrato versionado em `openapi/v1.json`              |
| `npm run api:sync`                | copia o contrato mais novo do Back (pasta irmã `../Back` ou GitHub) e regenera os tipos |

## O contrato com o Back

Os tipos de tudo o que a API devolve vêm do OpenAPI do Back (`openapi/v1.json`, copiado dele): nenhuma resposta é descrita à mão. Quando o Back mudar a API, rode `npm run api:sync`, ajuste o que o compilador apontar e faça commit do contrato e dos tipos. O CI confere que `src/api/schema.d.ts` bate com o contrato versionado.

## Publicação

Cloudflare Pages (build `npm run build`, pasta `dist`, variável `VITE_API_URL`). Passo a passo em [`docs/DEPLOY.md`](docs/DEPLOY.md).

## Privacidade e dados pessoais

Este repositório é **público**: nunca coloque nele dados reais de pessoas (nomes, telefones, fotos), segredos ou chaves. O CI roda `gitleaks`. Os textos de privacidade e termos de uso (`src/features/legal`) são rascunhos e precisam de revisão jurídica antes de abrir o site ao público (veja `docs/LGPD.md` no Back).
