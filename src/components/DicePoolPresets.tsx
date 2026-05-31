import type { DiceType } from "../types/Dice";

export type DicePool = Record<DiceType, number>;

interface Props {
  onSelect: (preset: DicePool) => void;
}

const PRESETS: Array<{
  name: string;
  description?: string;
  value: DicePool;
}> = [
  {
    name: "Copper Sword/Bow",
    value: {
      D4: 1,
      D6: 0,
      D8: 0,
      D12: 0,
      D20: 0,
    },
  },
  {
    name: "Iron Sword/Bow",
    value: {
      D4: 1,
      D6: 1,
      D8: 0,
      D12: 0,
      D20: 0,
    },
  },
];

export default function DicePoolPreset({ onSelect }: Props) {
  return (
    <div className="card">
      <h3>Quick Loadouts</h3>

      <div className="preset-grid">
        {PRESETS.map((preset) => (
          <button
            key={preset.name}
            className="preset-btn"
            onClick={() => onSelect(preset.value)}
          >
            <div className="preset-title">
              {preset.name}
            </div>

            {preset.description && (
              <div className="preset-desc">
                {preset.description}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}