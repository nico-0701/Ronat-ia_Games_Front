# Como adicionar a tela de um jogo

O **servidor** tem as regras de cada jogo (módulo no Back, ver `docs/GAME_DEVELOPMENT.md` de lá). O **Front** só precisa saber desenhar a partida: ler a `view` que o servidor manda para quem consulta, mostrar os botões de `allowedActions` e enviar ações. Tudo o que é da plataforma (lobby, jogadores, times, tempo real, resultado, revanche, ranking) já funciona para qualquer jogo.

## O que o jogo entrega

Um `GameUi` (`src/features/games/types.ts`):

| Campo                  | Para quê                                                                                                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Play`                 | a tela da partida **em andamento**. Recebe `session` (a visão de quem está vendo: `view`, `players`, `allowedActions`, `deadlineAt`...), `game` (o catálogo) e `online` (quem está com a tela aberta). |
| `Config` (opcional)    | o formulário de opções, no lobby (só o anfitrião mexe). Recebe `onSave(config)`; o servidor valida, normaliza e devolve a partida.                                                                     |
| `summarize` (opcional) | as opções em linhas curtas, para quem não é o anfitrião ver no lobby.                                                                                                                                  |

## Passo a passo

1. Atualize o contrato (`npm run api:sync`) se o Back mudou a API.
2. Crie `src/features/games/<jogo>/` com:
   - `model.ts`: tipos e **leitura validada** de `session.view` e `session.config`, que chegam como JSON solto no contrato (o que não bate vira `null`). Teste isso (`model.test.ts`).
   - `<Jogo>Play.tsx` (e `<Jogo>ConfigForm.tsx`, se houver opções).
3. Registre em `src/features/games/registry.ts`.
4. Escreva os testes de tela com `renderApp` (`src/test/renderApp.tsx`), o `FakeHub` para empurrar mensagens do servidor e `mimicaView`-like fixtures (veja `src/features/games/mimica/mimica.test.tsx`).

## Regras de ouro

- **Não deduza regras.** Mostre o que o servidor devolve; os botões vêm de `allowedActions`.
- **Agir é `useGameAction(session.id)`**: ele gera o `clientActionId`, é idempotente e tenta de novo uma vez em conflito de concorrência. Mostre o `detail` do erro (`errorMessage`) num aviso e peça o estado de novo.
- **Prazos:** use `useCountdown(deadline)` e `useRefetchAfter(sessionId, [prazos])`. Algumas fases mudam só com o relógio, sem versão nova nem mensagem.
- **Segredo é do servidor:** o que o jogador não pode ver não vem na `view`; não "esconda" no CSS o que não devia ter chegado.
- **Quem não joga assiste** (`myPlayerId` nulo): a tela precisa funcionar só com a visão pública.
- Texto em português, botões grandes, contraste alto (veja `src/styles/tokens.css`).

## Exemplo: Mímica

`src/features/games/mimica/`: `model.ts` (leitura da `view`), `MimicaPlay.tsx` (placar, vez, cronômetro, veredito), `MimicaConfigForm.tsx` (rodadas, tempo, temas) e `mimica.test.tsx`. O regulamento está em `docs/games/MIMICA.md` do Back.
