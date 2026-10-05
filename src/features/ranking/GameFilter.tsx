import { Chips } from '@/ui/Chips';
import { useGames } from '@/features/sessions/queries';

const ALL = 'todos';

/** Filtro por jogo (só aparece quando há mais de um jogo instalado). `undefined` = todos. */
export function GameFilter({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (gameId: string | undefined) => void;
}) {
  const games = useGames();
  if (!games.data || games.data.length < 2) {
    return null;
  }

  return (
    <Chips
      label="Jogo"
      value={value ?? ALL}
      options={[
        { value: ALL, label: 'Todos' },
        ...games.data.map((game) => ({ value: game.id, label: game.name })),
      ]}
      onChange={(next) => onChange(next === ALL ? undefined : next)}
    />
  );
}
