import DicePoolSelector from "../DicePoolSelector";
import type { DiceType } from "../../types/Dice";

interface Props {
  value: Record<DiceType, number>;
  onChange: (next: Record<DiceType, number>) => void;
  title?: string;
}

export default function DiceLoadoutCard({
  value,
  onChange,
  title = "Defense Loadout",
}: Props) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <DicePoolSelector value={value} onChange={onChange} />
    </div>
  );
}
