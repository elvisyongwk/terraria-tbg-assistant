export interface FightHistory {
  id: string;

  timestamp: string;

  enemyName: string;

  action: "fight" | "enemyAttack";

  damageDealt: number;

  enemyKilled: boolean;

  enemyRetaliated: boolean;

  playerDamaged: boolean;

  rewards?: string[];
}