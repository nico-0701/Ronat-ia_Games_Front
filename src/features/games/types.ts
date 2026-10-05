import type { ComponentType } from 'react';
import type { Game, GameSession } from '@/api/types';

/** O que a tela de uma partida em andamento entrega ao componente de cada jogo. */
export interface GamePlayProps {
  session: GameSession;
  game: Game | undefined;
  /** Ids dos membros com a tela da partida aberta agora. */
  online: ReadonlySet<string>;
}

/** O formulário de opções de um jogo, no lobby (só o anfitrião mexe). */
export interface GameConfigProps {
  session: GameSession;
  game: Game | undefined;
  disabled: boolean;
  saving: boolean;
  error: unknown;
  /** Manda a configuração nova; o servidor valida, normaliza e devolve a partida. */
  onSave: (config: unknown) => void;
}

/** Tudo o que o app sabe de um jogo (além do que vem do catálogo do servidor). */
export interface GameUi {
  Play: ComponentType<GamePlayProps>;
  Config?: ComponentType<GameConfigProps>;
  /** As opções em linhas curtas, para quem não é o anfitrião ver no lobby. */
  summarize?: (session: GameSession) => string[];
}
