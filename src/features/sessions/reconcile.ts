import type { GameSession } from '@/api/types';

interface ReconcileOptions {
  /**
   * Aceita uma resposta de mesma versão. Uma busca explícita (`GET`) vale, porque algumas fases do jogo mudam só com o relógio
   * (ex.: o preparo da Mímica vira "valendo" depois de 3 s sem gravar nada, então a versão não sobe); já uma mensagem
   * atrasada do tempo real não deve passar por cima.
   */
  allowEqual?: boolean;
}

/**
 * Escolhe a partida mais nova entre a que o app já tem e a que acabou de chegar (resposta de uma ação, busca ou mensagem do
 * tempo real). A `version` só sobe; qualquer coisa com versão menor é velha e é ignorada. Só vale para a mesma partida.
 */
export function reconcileSession(
  current: GameSession | undefined,
  incoming: GameSession,
  { allowEqual = false }: ReconcileOptions = {},
): GameSession {
  if (!current || current.id !== incoming.id) {
    return incoming;
  }

  if (incoming.version > current.version) {
    return incoming;
  }

  return allowEqual && incoming.version === current.version ? incoming : current;
}
