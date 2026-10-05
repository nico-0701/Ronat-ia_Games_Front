# Publicação (Cloudflare Pages)

O site é estático (`dist/`) e fala com a API do Back por HTTPS e WebSocket. O Cloudflare Pages tem plano gratuito, com HTTPS e CDN.

## Passo a passo

1. No painel do Cloudflare: **Workers & Pages > Create > Pages > Connect to Git** e escolha este repositório (`main`).
2. Configuração de build:

   | Campo                  | Valor                          |
   | ---------------------- | ------------------------------ |
   | Framework preset       | None                           |
   | Build command          | `npm run build`                |
   | Build output directory | `dist`                         |
   | Node                   | variável `NODE_VERSION` = `24` |

3. Variáveis de ambiente (em _Settings > Variables_, tanto em Production quanto em Preview):

   | Variável       | Valor                                                                           |
   | -------------- | ------------------------------------------------------------------------------- |
   | `VITE_API_URL` | endereço da API, sem barra no fim (ex.: `https://ronat-games-api.onrender.com`) |
   | `NODE_VERSION` | `24`                                                                            |

   `VITE_API_URL` entra no código **e** na política de segurança (`dist/_headers`, gerada no build por `scripts/write-headers.mjs`), que só deixa o site falar com essa origem.

4. No **Back** (Render), coloque a origem do site em `Cors__AllowedOrigins__0` (ex.: `https://ronat-games.pages.dev`). Para os _previews_ do Pages, use `Cors__AllowedOriginPatterns__0` com uma expressão regular (veja `docs/DEPLOY.md` do Back).
5. (Opcional) Anti-robô: se o Back tiver `Turnstile__SecretKey`, o site mostra o desafio sozinho (a chave pública vem de `GET /meta`).

O arquivo `public/_redirects` faz toda rota (`/grupos/...`, `/partidas/...`) cair no `index.html`, como numa SPA.

## O que o build gera

- `dist/index.html` + `dist/assets/*` com nomes que mudam a cada versão (cache de 1 ano, imutável).
- `dist/_headers`: CSP (só a própria origem, a API e o Cloudflare Turnstile), `nosniff`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`, `Permissions-Policy` sem câmera/microfone/localização.

## Plano gratuito do Render dorme

A API fica ociosa após 15 min e leva cerca de um minuto para acordar. O Front mostra "Acordando o servidor…" na entrada e tenta de novo sozinho. O Back tem um _workflow_ de _keep-alive_ opcional (veja o `docs/DEPLOY.md` dele).

## Versão mínima

O Back informa `minClientVersion` em `GET /meta`. Se a versão deste app (`package.json`) for menor, o app mostra "Hora de atualizar". No site basta recarregar; no Android, é preciso instalar o APK novo.
