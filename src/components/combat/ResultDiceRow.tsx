import type { DiceResult } from "../../types/DiceResult";
import { getDiceTotal } from "../../types/DiceResult";

interface Props {
  title: string;
  side: "player" | "enemy";
  values: (number | DiceResult)[];
  selectedResultDie:
    | { side: "player" | "enemy"; index: number }
    | null;
  onSelect: (selection: { side: "player" | "enemy"; index: number }) => void;
  onReroll: (side: "player" | "enemy", index: number) => void;
  onRemove: (side: "player" | "enemy", index: number) => void;
  onModify?: (side: "player" | "enemy", index: number, modifier: number) => void;
}

function isDiceResult(value: unknown): value is DiceResult {
  return typeof value === "object" && value !== null && "value" in value && "modifier" in value;
}

function getDisplayValue(value: number | DiceResult): number {
  return isDiceResult(value) ? getDiceTotal(value) : value;
}

export default function ResultDiceRow({
  title,
  side,
  values,
  selectedResultDie,
  onSelect,
  onReroll,
  onRemove,
  onModify,
}: Props) {
  return (
    <div className="dice-roll">
      <h3>{title}</h3>
      <div className="dice-row">
        {values.map((value, index) => {
          const displayValue = getDisplayValue(value);
          const isDR = isDiceResult(value);
          const modifier = isDR ? value.modifier : 0;
          
          return (
            <div key={index} className="die-container">
              <button
                type="button"
                className={`die ${side}-die ${
                  selectedResultDie?.side === side &&
                  selectedResultDie.index === index
                    ? "selected"
                    : ""
                }`}
                onClick={() => onSelect({ side, index })}
                title={modifier !== 0 ? `${value instanceof Object ? value.value : displayValue} + ${modifier} = ${displayValue}` : ""}
              >
                {displayValue}
              </button>
              {isDR && modifier !== 0 && (
                <span className="die-modifier">
                  {modifier > 0 ? "+" : ""}{modifier}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {selectedResultDie?.side === side &&
        selectedResultDie.index < values.length && (
          <div className="dice-actions">
            {onModify && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    onModify(side, selectedResultDie.index, -1)
                  }
                >
                  Modifier -1
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onModify(side, selectedResultDie.index, 1)
                  }
                >
                  Modifier +1
                </button>
              </>
            )}
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
