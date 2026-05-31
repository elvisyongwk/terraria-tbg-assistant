import { useEffect, useState } from "react";
import { DICE_SIDES , type DiceType} from "../../types/Dice";
import DiceScene from "./DiceScene";

interface Props {
  dice: DiceType[];
  onComplete: (results: number[]) => void;
  role?: "player" | "enemy";
}

export default function DiceRoller3D({
  dice,
  onComplete,
  role
}: Props) {
  const [rolling, setRolling] = useState(true);
  const [values, setValues] = useState<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setValues(
        dice.map(
          (d) =>
            Math.floor(
              Math.random() *
                DICE_SIDES[d]
            ) + 1
        )
      );
    }, 70);

    const timeout = setTimeout(() => {
      clearInterval(interval);

      const final = dice.map(
        (d) =>
          Math.floor(
            Math.random() *
              DICE_SIDES[d]
          ) + 1
      );

      setValues(final);
      setRolling(false);

      setTimeout(() => {
        onComplete(final);
      }, 500);
    }, 1200);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [dice]);

  return (
    <div className="dice-roll">
      <h3>
        {rolling
          ? "Rolling 3D Dice..."
          : "Result"}
      </h3>

      <DiceScene
        values={values}
        rolling={rolling}
        role={role}
      />
    </div>
  );
}