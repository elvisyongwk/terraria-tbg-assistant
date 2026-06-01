import type { DiceType } from "./Dice";
import type { RewardDrop } from "./RewardDrop";

export interface Enemy {
  id: string;
  name: string;

  hp: number;

  range: ("short" | "medium" | "long")[];

  attackDice: DiceType[];

  defenseDice: DiceType[];

  rewards: RewardDrop[];
}