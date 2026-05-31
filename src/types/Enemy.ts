import type { DiceType } from "./Dice";

export interface Enemy {
  id: string;
  name: string;

  hp: number;

  range: "short" | "medium" | "long";

  attackDice: DiceType[];

  defenseDice: DiceType[];

  rewards: string[];
}