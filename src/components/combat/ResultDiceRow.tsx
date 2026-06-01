interface Props {
  title: string;
  side: "player" | "enemy";
  values: number[];
  selectedResultDie:
    | { side: "player" | "enemy"; index: number }
    | null;
  onSelect: (selection: { side: "player" | "enemy"; index: number }) => void;
  onReroll: (side: "player" | "enemy", index: number) => void;
  onRemove: (side: "player" | "enemy", index: number) => void;
}

export default function ResultDiceRow({
  title,
  side,
  values,
  selectedResultDie,
  onSelect,
  onReroll,
  onRemove,
}: Props) {
  return (
    <div className="dice-roll">
      <h3>{title}</h3>
      <div className="dice-row">
        {values.map((value, index) => (
          <button
            key={index}
            type="button"
            className={`die ${side}-die ${
              selectedResultDie?.side === side &&
              selectedResultDie.index === index
                ? "selected"
                : ""
            }`}
            onClick={() => onSelect({ side, index })}
          >
            {value}
          </button>
        ))}
      </div>

      {selectedResultDie?.side === side &&
        selectedResultDie.index < values.length && (
          <div className="dice-actions">
            <button
              type="button"
              onClick={() => onReroll(side, selectedResultDie.index)}
            >
              Reroll
            </button>
            <button
              type="button"
              onClick={() => onRemove(side, selectedResultDie.index)}
            >
              Remove
            </button>
          </div>
        )}
    </div>
  );
}
