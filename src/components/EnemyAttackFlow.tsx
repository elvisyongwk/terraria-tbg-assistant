import { useEffect, useState } from "react";
import { expandDicePool, rollDie } from "../services/diceService";
import type { DiceType } from "../types/Dice";
import type { CombatEvent } from "../types/CombatEvent";
import DiceLoadoutCard from "./combat/DiceLoadoutCard";
import ResultDiceRow from "./combat/ResultDiceRow";
import DiceRenderer from "./dice/DiceRenderer";

interface Props {
  enemyAttackDice: DiceType[];
  playerDefenseDice: Record<DiceType, number>;
  onPlayerDefenseDiceChange: (
    next: Record<DiceType, number>
  ) => void;
  onComplete: (
    enemyAttackRolls: number[],
    playerDefenseRolls: number[]
  ) => void;
  onLog?: (event: CombatEvent) => void;
  startImmediately?: boolean;
}

type Phase =
  | "idle"
  | "rollingEnemyAttack"
  | "rollingPlayerDefense"
  | "viewingResults";

export default function EnemyAttackFlow({
  enemyAttackDice,
  playerDefenseDice,
  onPlayerDefenseDiceChange,
  onComplete,
  onLog,
  startImmediately = false,
}: Props) {
  const [phase, setPhase] = useState<Phase>(
    startImmediately ? "rollingEnemyAttack" : "idle"
  );
  const [enemyAttackRolls, setEnemyAttackRolls] = useState<number[]>([]);
  const [lastRollValues, setLastRollValues] = useState<{
    player: number[];
    enemy: number[];
  }>({ player: [], enemy: [] });
  const [lastRollDiceTypes, setLastRollDiceTypes] = useState<{
    player: DiceType[];
    enemy: DiceType[];
  }>({ player: [], enemy: [] });
  const [selectedResultDie, setSelectedResultDie] = useState<
    | { side: "player" | "enemy"; index: number }
    | null
  >(null);

  useEffect(() => {
    if (phase !== "viewingResults") {
      setSelectedResultDie(null);
    }
  }, [phase]);

  function log(event: CombatEvent) {
    onLog?.(event);
  }

  function getResultLabel(side: "player" | "enemy") {
    return side === "player" ? "Player Defense" : "Enemy Attack";
  }

  function logResultAction(
    side: "player" | "enemy",
    action: "Reroll" | "Remove",
    nextValues: { player: number[]; enemy: number[] }
  ) {
    const label = `${getResultLabel(side)} (${action})`;
    log({ type: "roll", label, values: nextValues[side] });

    const playerDefense = Math.max(...nextValues.player);
    const enemyAttack = Math.max(...nextValues.enemy);
    const playerTakesDamage = enemyAttack >= playerDefense;

    if (playerTakesDamage) {
      log({
        type: "damage",
        label: `Player Takes Damage (${action})`,
        value: 1,
      });
    } else {
      log({
        type: "state",
        label: `Attack blocked (${action})`,
      });
    }
  }

  function applyResultUpdates(nextValues: {
    player: number[];
    enemy: number[];
  }) {
    setLastRollValues(nextValues);
  }

  function updateResultDie(
    side: "player" | "enemy",
    index: number,
    newValue: number,
    action: "Reroll" | "Remove"
  ) {
    const updated = [...lastRollValues[side]];
    updated[index] = newValue;

    const nextValues = {
      ...lastRollValues,
      [side]: updated,
    };

    applyResultUpdates(nextValues);
    logResultAction(side, action, nextValues);
  }

  function rerollResultDie(side: "player" | "enemy", index: number) {
    const type = lastRollDiceTypes[side][index] || "D4";
    updateResultDie(side, index, rollDie(type), "Reroll");
  }

  function removeResultDie(side: "player" | "enemy", index: number) {
    const updatedValues = lastRollValues[side].filter((_, i) => i !== index);
    const updatedTypes = lastRollDiceTypes[side].filter((_, i) => i !== index);

    const nextValues = {
      ...lastRollValues,
      [side]: updatedValues,
    };

    setLastRollDiceTypes({
      ...lastRollDiceTypes,
      [side]: updatedTypes,
    });

    applyResultUpdates(nextValues);
    setSelectedResultDie(null);
    logResultAction(side, "Remove", nextValues);
  }

  function startEnemyAttack() {
    setPhase("rollingEnemyAttack");
  }

  function onEnemyAttackRollComplete(results: number[]) {
    setEnemyAttackRolls(results);
    log({ type: "roll", label: "Enemy Attack Rolls", values: results });
    setPhase("rollingPlayerDefense");
  }

  function onPlayerDefenseRollComplete(results: number[]) {
    log({ type: "roll", label: "Player Defense", values: results });
    setLastRollValues({ player: results, enemy: enemyAttackRolls });
    setLastRollDiceTypes({
      player: expandDicePool(playerDefenseDice),
      enemy: enemyAttackDice,
    });
    setPhase("viewingResults");
  }

  function continueFromResults() {
    onComplete(lastRollValues.enemy, lastRollValues.player);
  }


  return (
    <>
      {phase === "idle" && (
        <button className="attack-button" onClick={startEnemyAttack}>Start Enemy Attack</button>
      )}

      {phase !== "viewingResults" && (
        <DiceLoadoutCard
          value={playerDefenseDice}
          onChange={onPlayerDefenseDiceChange}
          title="Defense Loadout"
        />
      )}

      {phase === "rollingEnemyAttack" && (
        <DiceRenderer
          dice={enemyAttackDice}
          onComplete={onEnemyAttackRollComplete}
          role="enemy"
        />
      )}

      {phase === "rollingPlayerDefense" && (
        <DiceRenderer
          dice={expandDicePool(playerDefenseDice)}
          onComplete={onPlayerDefenseRollComplete}
          role="player"
        />
      )}

      {phase === "viewingResults" && (
        <>
          <ResultDiceRow
            title="Player Defense"
            side="player"
            values={lastRollValues.player}
            selectedResultDie={selectedResultDie}
            onSelect={setSelectedResultDie}
            onReroll={rerollResultDie}
            onRemove={removeResultDie}
          />
          <ResultDiceRow
            title="Enemy Attack"
            side="enemy"
            values={lastRollValues.enemy}
            selectedResultDie={selectedResultDie}
            onSelect={setSelectedResultDie}
            onReroll={rerollResultDie}
            onRemove={removeResultDie}
          />
          <button onClick={continueFromResults}>Resolve</button>
        </>
      )}
    </>
  );
}
