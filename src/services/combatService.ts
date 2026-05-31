import type { DiceType } from "../types/Dice";
import { rollPool } from "./diceService";

/* ---------------- PLAYER ATTACK ----------------
   RULE:
   - roll player dice (provided externally or via DiceRoller)
   - roll enemy defense dice
   - highest enemy defense = threshold
   - each player die >= threshold = 1 damage
-------------------------------------------------- */

export function resolvePlayerAttack(
  playerRolls: number[],
  enemyDefenseDice: DiceType[]
) {
  const enemyRolls = rollPool(enemyDefenseDice);

  const threshold = Math.max(...enemyRolls);

  let damage = 0;

  for (const roll of playerRolls) {
    if (roll >= threshold) {
      damage++;
    }
  }

  return {
    playerRolls,
    enemyRolls,
    threshold,
    damage,
  };
}

/* ---------------- RETALIATION ----------------
   RULE:
   - enemy uses DEFENSE dice as attack source
   - player rolls defense dice (provided externally)
   - compare highest vs highest
-------------------------------------------------- */

export function resolveRetaliation(
  enemyDefenseDice: DiceType[],
  playerDefenseRolls: number[]
) {
  const enemyRolls = rollPool(enemyDefenseDice);

  const enemyAttack = Math.max(...enemyRolls);
  const playerDefense = Math.max(...playerDefenseRolls);

  const playerTakesDamage =
    enemyAttack > playerDefense;

  return {
    enemyRolls,
    enemyAttack,
    playerDefense,
    playerTakesDamage,
  };
}

/* ---------------- ENEMY ATTACK ----------------
   RULE:
   - enemy uses ATTACK dice
   - player rolls defense dice externally
   - compare highest vs highest
-------------------------------------------------- */

export function resolveEnemyAttack(
  enemyAttackDice: DiceType[],
  playerDefenseRolls: number[]
) {
  const enemyRolls = rollPool(enemyAttackDice);

  const enemyAttack = Math.max(...enemyRolls);
  const playerDefense = Math.max(...playerDefenseRolls);

  const playerTakesDamage =
    enemyAttack > playerDefense;

  return {
    enemyRolls,
    enemyAttack,
    playerDefense,
    playerTakesDamage,
  };
}