export type DiceType =
  | "D4"
  | "D6"
  | "D8"
  | "D12"
  | "D20";

export const DICE_SIDES: Record<DiceType, number> = {
  D4: 4,
  D6: 6,
  D8: 8,
  D12: 12,
  D20: 20,
};