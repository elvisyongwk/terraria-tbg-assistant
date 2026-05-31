import { DICE_LIMITS } from "../config/diceConfig";
import type { DiceType } from "../types/Dice";

interface Props {
  value: Record<DiceType, number>;
  onChange: (next: Record<DiceType, number>) => void;
}

const diceList: DiceType[] = [
  "D4",
  "D6",
  "D8",
  "D12",
  "D20",
];

export default function DiceSelector({
  value,
  onChange,
}: Props) {
  function add(d: DiceType) {
    if (value[d] >= DICE_LIMITS[d]) return;

    onChange({
      ...value,
      [d]: value[d] + 1,
    });
  }

  function remove(d: DiceType) {
    if (value[d] <= 0) return;

    onChange({
      ...value,
      [d]: value[d] - 1,
    });
  }

  return (
    <div>
      <h3>Dice Pool (Max 3 each)</h3>

      <div className="dice-grid">
        {diceList.map((d) => (
          <div key={d} className="dice-box">
            <strong>{d}</strong>

            <div>
              <button onClick={() => remove(d)}>
                -
              </button>

              <span>{value[d]}</span>

              <button onClick={() => add(d)}>
                +
              </button>
            </div>

            <small>
              Max: {DICE_LIMITS[d]}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}