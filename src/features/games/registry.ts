import { MimicaConfigForm } from './mimica/MimicaConfigForm';
import { MimicaPlay } from './mimica/MimicaPlay';
import { categoryLabel, parseMimicaConfig } from './mimica/model';
import type { GameUi } from './types';

/**
 * Os jogos que este app sabe mostrar. O catálogo do servidor (`GET /games`) diz o que está instalado; aqui está a tela de
 * cada um. Para um jogo novo: crie a pasta do jogo, exporte o `GameUi` e registre-o abaixo.
 */
const GAMES: Record<string, GameUi> = {
  mimica: {
    Play: MimicaPlay,
    Config: MimicaConfigForm,
    summarize: (session) => {
      const config = parseMimicaConfig(session.config);
      return [
        `${config.rounds} rodadas por time`,
        `${config.turnSeconds} segundos para fazer a mímica`,
        config.categories.map(categoryLabel).join(', '),
      ];
    },
  },
};

export function gameUiFor(gameId: string): GameUi | undefined {
  return GAMES[gameId];
}
