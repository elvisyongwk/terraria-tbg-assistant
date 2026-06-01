import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import enemies from "../data/enemies.json";

import EnemyHPBar from "../components/EnemyHPBar";
import CombatTimeline from "../components/CombatTimeline";
import RewardScreen from "../components/RewardScreen";

import { useSessionStore } from "../store/sessionStore";
import {  type DiceType } from "../types/Dice";
import type { Enemy } from "../types/Enemy";
import DiceRenderer from "../components/dice/DiceRenderer";
import { useToast } from "../components/Toast";
import DicePoolSelector from "../components/DicePoolSelector";
import DiceLoadoutCard from "../components/combat/DiceLoadoutCard";
import ResultDiceRow from "../components/combat/ResultDiceRow";
import DicePoolPreset from "../components/DicePoolPresets";
import { rollDie } from "../services/diceService";

type Phase =
    | "selectEnemy"
    | "setupEnemy"
    | "playerAttack"
    | "rollingPlayer"
    | "rollingEnemyDefense"
    | "viewingPlayerResults"
    | "retaliationCheck"
    | "selectRetaliationDefense"
    | "rollingRetaliation"
    | "viewingRetaliationResults"
    | "reward";

type CombatEvent =
    | { type: "state"; label: string }
    | { type: "roll"; label: string; values: number[] }
    | { type: "damage"; label: string; value: number };

function expandDicePool(pool: Record<DiceType, number>): DiceType[] {
    const result: DiceType[] = [];

    Object.entries(pool).forEach(([type, count]) => {
        for (let i = 0; i < count; i++) {
            result.push(type as DiceType);
        }
    });

    return result;
}

export default function FightPage() {
    const addHistory = useSessionStore((s) => s.addHistory);
    const navigate = useNavigate();
    const toast = useToast();

    const [phase, setPhase] = useState<Phase>("selectEnemy");

    const [enemy, setEnemy] = useState<Enemy | null>(null);
    const [enemyHp, setEnemyHp] = useState<number>(0);
    const [maxHp, setMaxHp] = useState<number>(0);

    const [playerAttackDice, setPlayerAttackDice] = useState<Record<DiceType, number>>({
        D4: 1,
        D6: 0,
        D8: 0,
        D12: 0,
        D20: 0,
    });

    const [playerDefenseDice, setPlayerDefenseDice] = useState<Record<DiceType, number>>({
        D4: 1,
        D6: 0,
        D8: 0,
        D12: 0,
        D20: 0,
    });

    const [events, setEvents] = useState<CombatEvent[]>([]);

    const [lastRollValues, setLastRollValues] = useState<{ player: number[]; enemy: number[] }>({ player: [], enemy: [] });
    const [lastRollDiceTypes, setLastRollDiceTypes] = useState<{ player: DiceType[]; enemy: DiceType[] }>({ player: [], enemy: [] });
    const [enemyHpBeforeAttack, setEnemyHpBeforeAttack] = useState<number>(0);
    const [selectedResultDie, setSelectedResultDie] = useState<
        | { side: "player" | "enemy"; index: number }
        | null
    >(null);
    const [playerAttackRolls, setPlayerAttackRolls] = useState<number[]>([]);
    const [_playerDefenseRolls, setPlayerDefenseRolls] = useState<number[]>([]);
    const [playerTookRetaliationDamage, setPlayerTookRetaliationDamage] = useState(false);

    function log(event: CombatEvent) {
        setEvents((prev) => [...prev, event]);
        try {
            if (event.type === "damage") {
                toast.show(`${event.label}: ${event.value}`, "damage");
            } else if (event.type === "roll") {
                toast.show(`${event.label}: ${event.values.join(", ")}`, "roll");
            } else if (event.type === "state") {
                toast.show(event.label, "state");
            }
        } catch (e) {
            // ignore if no provider
        }
    }

    /* ---------------- ENEMY SELECT ---------------- */

    function selectEnemy(e: Enemy) {
        setEnemy(e);
        setMaxHp(e.hp);

        // DEFAULT SHOULD BE FULL HP
        setEnemyHp(e.hp);

        setPhase("setupEnemy");
    }

    /* ---------------- PLAYER ATTACK ---------------- */

    function startPlayerAttack() {
        setPhase("rollingPlayer");
    }

    function onPlayerRollComplete(playerRolls: number[]) {
        if (!enemy) return;

        log({ type: "roll", label: "Player Rolls", values: playerRolls });
        setPlayerAttackRolls(playerRolls);
        setPhase("rollingEnemyDefense");
    }

    function onEnemyDefenseRollComplete(enemyDefenseRolls: number[]) {
        if (!enemy) return;

        setEnemyHpBeforeAttack(enemyHp);

        const threshold = Math.max(...enemyDefenseRolls);
        let damage = 0;

        for (const roll of playerAttackRolls) {
            if (roll >= threshold) {
                damage++;
            }
        }

        const newHp = Math.max(0, enemyHp - damage);
        setEnemyHp(newHp);

        log({ type: "roll", label: "Enemy Defense", values: enemyDefenseRolls });
        setLastRollValues({ player: playerAttackRolls, enemy: enemyDefenseRolls });
        setLastRollDiceTypes({
            player: expandDicePool(playerAttackDice),
            enemy: enemy.defenseDice,
        });
        setPhase("viewingPlayerResults");
    }

    function continueFromPlayerResults() {
        if (!enemy) return;

        // Recalculate damage based on reroll results
        const threshold = Math.max(...lastRollValues.enemy);
        let newDamage = 0;

        for (const roll of lastRollValues.player) {
            if (roll >= threshold) {
                newDamage++;
            }
        }

        // Calculate original damage
        const originalThreshold = Math.max(...lastRollValues.enemy);
        let originalDamage = 0;

        for (const roll of playerAttackRolls) {
            if (roll >= originalThreshold) {
                originalDamage++;
            }
        }

        // Log initial damage on resolve
        log({ type: "damage", label: "Damage Dealt", value: newDamage });

        // Adjust HP based on damage difference
        const damageDifference = newDamage - originalDamage;
        if (damageDifference !== 0) {
            const adjustedHp = Math.max(0, enemyHp - damageDifference);
            setEnemyHp(adjustedHp);
            
            if (damageDifference > 0) {
                log({ type: "damage", label: `Additional Damage (Reroll)`, value: damageDifference });
            } else if (damageDifference < 0) {
                log({ type: "state", label: `Damage Reduced (Reroll)` });
            }
        }

        if (enemyHp <= 0) {
            addHistory({
                id: crypto.randomUUID(),
                timestamp: new Date().toISOString(),
                enemyName: enemy.name,
                action: "fight",
                damageDealt: 0,
                enemyKilled: true,
                enemyRetaliated: false,
                playerDamaged: false,
                rewards: enemy.rewards,
            });

            setPhase("reward");
            return;
        }

        setPhase("retaliationCheck");
    }

    /* ---------------- RETALIATION ---------------- */

    function resolveRetaliationFlow(canSee: boolean, inRange: boolean) {
        if (!enemy) return;

        if (!canSee || !inRange) {
            log({ type: "state", label: "Enemy cannot retaliate" });
            setPhase("reward");
            return;
        }

        setPhase("selectRetaliationDefense");
    }

    function onRetaliationRollComplete(playerDefenseRolls: number[]) {
        if (!enemy) return;

        const playerDefense = Math.max(...playerDefenseRolls);
        const enemyAttack = Math.max(...lastRollValues.enemy);
        const playerTakesDamage = playerDefense <= enemyAttack;

        log({
            type: "roll",
            label: "Player Defense",
            values: playerDefenseRolls,
        });

        setPlayerDefenseRolls(playerDefenseRolls);
        setPlayerTookRetaliationDamage(playerTakesDamage);
        setLastRollValues({ player: playerDefenseRolls, enemy: lastRollValues.enemy });
        setLastRollDiceTypes({
            player: expandDicePool(playerDefenseDice),
            enemy:
                lastRollDiceTypes.enemy.length > 0
                    ? lastRollDiceTypes.enemy
                    : enemy.defenseDice,
        });
        setPhase("viewingRetaliationResults");
    }

    function continueFromRetaliationResults() {
        if (!enemy) return;

        // Recalculate defense based on reroll results
        const newPlayerDefense = Math.max(...lastRollValues.player);
        const enemyAttack = Math.max(...lastRollValues.enemy);
        const newPlayerTakesDamage = newPlayerDefense <= enemyAttack;
        const hadReroll = newPlayerTakesDamage !== playerTookRetaliationDamage;

        // Log outcome with appropriate label
        if (newPlayerTakesDamage) {
            log({ 
                type: "damage", 
                label: `Player Takes Damage${hadReroll ? " (Reroll)" : ""}`, 
                value: 1 
            });
        } else {
            log({ 
                type: "state", 
                label: `Player blocks retaliation${hadReroll ? " (Reroll)" : ""}` 
            });
        }

        addHistory({
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            enemyName: enemy.name,
            action: "fight",
            damageDealt: 0,
            enemyKilled: false,
            enemyRetaliated: true,
            playerDamaged: newPlayerTakesDamage,
        });

        setPhase("reward");
    }

    /* ---------------- ENEMY ATTACK MODE ---------------- */


    function resetFight() {
        setEnemy(null);
        setEnemyHp(0);
        setMaxHp(0);
        setEvents([]);
        setPhase("selectEnemy");
    }

    function exitToSession() {
        setEnemy(null);
        setEnemyHp(0);
        setMaxHp(0);
        setEvents([]);
        setPhase("selectEnemy");

        navigate("/session");
    }

    useEffect(() => {
        if (
            phase !== "viewingPlayerResults" &&
            phase !== "viewingRetaliationResults"
        ) {
            setSelectedResultDie(null);
        }
    }, [phase]);

    function applyResultUpdates(nextValues: {
        player: number[];
        enemy: number[];
    }) {
        setLastRollValues(nextValues);

        if (phase === "viewingPlayerResults") {
            setPlayerAttackRolls(nextValues.player);

            const threshold = Math.max(...nextValues.enemy);
            const damage = nextValues.player.filter((roll) => roll >= threshold).length;
            setEnemyHp(Math.max(0, enemyHpBeforeAttack - damage));
        }

        if (phase === "viewingRetaliationResults") {
            setPlayerDefenseRolls(nextValues.player);

            const playerDefense = Math.max(...nextValues.player);
            const enemyAttack = Math.max(...nextValues.enemy);
            setPlayerTookRetaliationDamage(playerDefense <= enemyAttack);
        }
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

    function getResultLabel(side: "player" | "enemy") {
        if (phase === "viewingPlayerResults") {
            return side === "player" ? "Player Attack" : "Enemy Defense";
        }

        if (phase === "viewingRetaliationResults") {
            return side === "player" ? "Player Defense" : "Enemy Attack";
        }

        return side === "player" ? "Player" : "Enemy";
    }

    function logResultAction(
        side: "player" | "enemy",
        action: "Reroll" | "Remove",
        nextValues: { player: number[]; enemy: number[] }
    ) {
        const label = `${getResultLabel(side)} (${action})`;
        log({ type: "roll", label, values: nextValues[side] });

        if (phase === "viewingPlayerResults") {
            const threshold = Math.max(...nextValues.enemy);
            const damage = nextValues.player.filter((roll) => roll >= threshold).length;
            log({ type: "damage", label: `Damage Dealt (${action})`, value: damage });
        }

        if (phase === "viewingRetaliationResults") {
            const playerDefense = Math.max(...nextValues.player);
            const enemyAttack = Math.max(...nextValues.enemy);
            const playerTakesDamage = playerDefense <= enemyAttack;

            if (playerTakesDamage) {
                log({ type: "damage", label: `Player Takes Damage (${action})`, value: 1 });
            } else {
                log({ type: "state", label: `Player blocks retaliation (${action})` });
            }
        }

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

    // Result display is handled by shared ResultDiceRow component.

    /* ---------------- RENDER ---------------- */

    if (phase === "selectEnemy") {
        return (
            <div className="page">
                <h1>Select Enemy</h1>

                <button onClick={exitToSession}>
                    Return to Session
                </button>

                {(enemies as Enemy[]).map((e: Enemy) => (
                    <button key={e.id} className="enemy-btn" onClick={() => selectEnemy(e)}>
                        {e.name}
                    </button>
                ))}
            </div>
        );
    }

    if (phase === "setupEnemy" && enemy) {
        return (
            <div className="page">
                <h1>{enemy.name}</h1>

                <button onClick={exitToSession}>
                    Return to Session
                </button>

                <div className="card">
                    <p className="label">Max HP</p>
                    <h3>{enemy.hp}</h3>

                    <p className="label">Enter current remaining HP</p>

                    <input
                        type="number"
                        value={enemyHp}
                        onChange={(e) =>
                            setEnemyHp(Number(e.target.value))
                        }
                        min={1}
                        max={enemy.hp}
                    />
                </div>

                <button
                    disabled={
                        enemyHp <= 0 ||
                        enemyHp > enemy.hp
                    }
                    onClick={() =>
                        setPhase("playerAttack")
                    }
                >
                    Start Fight
                </button>

                <button onClick={() => setPhase("selectEnemy")}>Choose another enemy</button>
            </div>
        );
    }

    if (!enemy) return null;

    return (
        <div className="page">
            <h1>{enemy.name}</h1>

            <button onClick={exitToSession}>
                Return to Session
            </button>

            <EnemyHPBar hp={enemyHp} maxHp={maxHp} />

            <CombatTimeline events={events} />

            {/* ---------------- PLAYER ATTACK ---------------- */}
            {phase === "playerAttack" && (
                <>
                    <div className="card">
                        <h3>Attack Loadout</h3>
                        <DicePoolPreset onSelect={setPlayerAttackDice} />
                        <DicePoolSelector
                            value={playerAttackDice}
                            onChange={setPlayerAttackDice}
                        />
                    </div>

                    <button onClick={startPlayerAttack}>
                        Attack
                    </button>
                </>
            )}

            {phase === "rollingPlayer" && (
                <DiceRenderer
                    dice={expandDicePool(playerAttackDice)}
                    onComplete={onPlayerRollComplete}
                    role="player"
                />
            )}

            {phase === "rollingEnemyDefense" && (
                <DiceRenderer
                    dice={enemy?.defenseDice || []}
                    onComplete={onEnemyDefenseRollComplete}
                    role="enemy"
                />
            )}

            {phase === "viewingPlayerResults" && (
                <>
                    <ResultDiceRow
                        title="Player Attack"
                        side="player"
                        values={lastRollValues.player}
                        selectedResultDie={selectedResultDie}
                        onSelect={setSelectedResultDie}
                        onReroll={rerollResultDie}
                        onRemove={removeResultDie}
                    />
                    <ResultDiceRow
                        title="Enemy Defense"
                        side="enemy"
                        values={lastRollValues.enemy}
                        selectedResultDie={selectedResultDie}
                        onSelect={setSelectedResultDie}
                        onReroll={rerollResultDie}
                        onRemove={removeResultDie}
                    />
                    <button onClick={continueFromPlayerResults}>
                        Resolve
                    </button>
                </>
            )}

            {/* ---------------- RETALIATION CHECK ---------------- */}
            {phase === "retaliationCheck" && (
                <>
                    <h3>Enemy Retaliation?</h3>

                    <button onClick={() => resolveRetaliationFlow(true, true)}>
                        YES (LOS + Range)
                    </button>

                    <button onClick={() => resolveRetaliationFlow(false, false)}>
                        NO
                    </button>
                </>
            )}

            {phase === "selectRetaliationDefense" && (
                <>
                    <DiceLoadoutCard
                        value={playerDefenseDice}
                        onChange={setPlayerDefenseDice}
                        title="Defense Loadout"
                    />
                    <button onClick={() => setPhase("rollingRetaliation")}>Roll Defense</button>
                </>
            )}

            {phase === "rollingRetaliation" && (
                <DiceRenderer
                    dice={expandDicePool(playerDefenseDice)}
                    onComplete={onRetaliationRollComplete}
                    role="player"
                />
            )}


            {phase === "viewingRetaliationResults" && (
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
                    <button onClick={continueFromRetaliationResults}>
                        Resolve
                    </button>
                </>
            )}

            {/* ---------------- REWARD ---------------- */}
            {phase === "reward" && enemy && enemyHp <= 0 && (
                <>
                    <RewardScreen
                        rewards={enemy.rewards}
                        onContinue={resetFight}
                    />
                </>
            )}
        </div>
    );
}