import { DICE_LIMITS } from "../config/diceConfig";
import type { DiceType } from "../types/Dice";

interface Props {
  value: Record<DiceType, number>;
  onChange: (next: Record<DiceType, number>) => void;
}

const DICE = ["D4", "D6", "D8", "D12", "D20"] as DiceType[];

export default function DicePoolSelector({
  value,
  onChange,
}: Props) {
  function update(type: DiceType, delta: number) {
    const current = value[type] || 0;
    const next = Math.max(
      0,
      Math.min(DICE_LIMITS[type], current + delta)
    );

    onChange({
      ...value,
      [type]: next,
    });
  }

  return (
    <div className="dice-pool">
      <h3>Dice Loadout</h3>

      <div className="dice-grid">
        {DICE.map((type) => (
          <div key={type} className="dice-box">
            <h4>{type}</h4>

            <p>
              {value[type] || 0} / {DICE_LIMITS[type]}
            </p>

            <div className="dice-controls">
              <button onClick={() => update(type, -1)}>
                -
              </button>

              <button onClick={() => update(type, 1)}>
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="dice-summary">
        Total Dice:{" "}
        {Object.values(value).reduce(
          (a, b) => a + b,
          0
        )}
      </div>
    </div>
  );
}