import { useSettingsStore } from "../../store/settingsStore";
import DiceRoller2D from "../DiceRoller2D";
import DiceRoller3D from "../dice3d/DiceRoller3D";

interface Props {
  dice: any[];
  onComplete: (results: number[]) => void;
}

export default function DiceRenderer({
  dice,
  onComplete,
}: Props) {
  const diceMode = useSettingsStore(
    (s) => s.diceMode
  );

  console.log("Dice Mode:", diceMode); // DEBUG

  if (diceMode === "3d") {
    return (
      <DiceRoller3D
        dice={dice}
        onComplete={onComplete}
      />
    );
  }

  return (
    <DiceRoller2D
      dice={dice}
      onComplete={onComplete}
    />
  );
}