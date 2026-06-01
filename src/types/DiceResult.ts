/**
 * Represents a dice result with optional modifier
 */
export interface DiceResult {
  value: number;
  modifier: number;
}

export function getDiceTotal(result: DiceResult): number {
  return result.value + result.modifier;
}
