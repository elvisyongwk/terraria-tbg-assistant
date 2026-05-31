import { useEffect, useState } from "react";
import { DICE_SIDES, type DiceType } from "../types/Dice";

interface Props {
  dice: DiceType[];
  onComplete: (results: number[]) => void;
}

export default function DiceRoller({
  dice,
  onComplete,
}: Props) {
  const [values, setValues] = useState<number[]>([]);
  const [rolling, setRolling] = useState(true);

  useEffect(() => {
    let interval: any;

    // fast flicker animation
    interval = setInterval(() => {
      setValues(
        dice.map(
          (d) =>
            Math.floor(
              Math.random() * DICE_SIDES[d]
            ) + 1
        )
      );
    }, 60);

    // final settle
    const timeout = setTimeout(() => {
      clearInterval(interval);

      const final = dice.map(
        (d) =>
          Math.floor(
            Math.random() * DICE_SIDES[d]
          ) + 1
      );

      setValues(final);
      setRolling(false);

      setTimeout(() => {
        onComplete(final);
      }, 400);
    }, 900);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [dice]);

  return (
    <div className="dice-roll">
      <h3>
        {rolling ? "Rolling Dice..." : "Result"}
      </h3>

      <div className="dice-row">
        {values.map((v, i) => (
          <div key={i} className="die">
            {v}
          </div>
        ))}
      </div>
    </div>
  );
}