/**
 * Relógio do servidor. Os prazos dos jogos (preparo, cronômetro, chance de roubo) vêm do servidor em UTC; o celular pode estar
 * adiantado ou atrasado, então corrigimos pela diferença medida em `GET /api/v1/meta` (`serverTimeUtc`).
 */
export class ServerClock {
  private offsetMs = 0;

  constructor(private readonly localNow: () => number = () => Date.now()) {}

  /** Agora, no relógio do servidor (ms desde 1970). */
  now(): number {
    return this.localNow() + this.offsetMs;
  }

  /** A diferença atual (ms): positivo = o servidor está adiantado em relação a este aparelho. */
  get offset(): number {
    return this.offsetMs;
  }

  /**
   * Calibra com uma resposta do servidor. Assume que o servidor carimbou a hora no meio da viagem, o que cancela a latência
   * simétrica. `sentAt` e `receivedAt` são medidos no aparelho (ms).
   */
  calibrate(serverTimeUtc: string, sentAt: number, receivedAt: number): void {
    const server = Date.parse(serverTimeUtc);
    if (!Number.isFinite(server) || receivedAt < sentAt) {
      return;
    }

    this.offsetMs = server - (sentAt + receivedAt) / 2;
  }

  /** Quantos ms faltam para um instante UTC do servidor (nunca negativo). */
  msUntil(isoUtc: string | null | undefined): number {
    if (!isoUtc) {
      return 0;
    }

    const target = Date.parse(isoUtc);
    return Number.isFinite(target) ? Math.max(0, target - this.now()) : 0;
  }
}

export const serverClock = new ServerClock();
