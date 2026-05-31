import { DICE_SIDES, type DiceType } from "../types/Dice";

export function rollDie(type: DiceType): number {
  const max = DICE_SIDES[type];
  return Math.floor(Math.random() * max) + 1;
}

export function rollPool(pool: DiceType[]): number[] {
  return pool.map((d) => rollDie(d));
}

export function getHighest(
  rolls: number[]
): number {
  return Math.max(...rolls);
}

export function expandDicePool(
  pool: Record<DiceType, number>
): DiceType[] {
  const result: DiceType[] = [];

  for (const key in pool) {
    const count =
      pool[key as DiceType];

    for (let i = 0; i < count; i++) {
      result.push(key as DiceType);
    }
  }

  return result;
}