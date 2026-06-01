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
import DicePoolSelector from "../components/DicePoolSelector";
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
    | "enemyAttack"
    | "rollingEnemyAttack"
    | "viewingEnemyAttackResults"
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
    const [playerDefenseRolls, setPlayerDefenseRolls] = useState<number[]>([]);
    const [playerTookRetaliationDamage, setPlayerTookRetaliationDamage] = useState(false);
    const [enemyAttackRolls, setEnemyAttackRolls] = useState<number[]>([]);

    function log(event: CombatEvent) {
        setEvents((prev) => [...prev, event]);
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
        log({ type: "damage", label: "Damage Dealt", value: damage });
        setLastRollValues({ player: playerAttackRolls, enemy: enemyDefenseRolls });
        setLastRollDiceTypes({
            player: expandDicePool(playerAttackDice),
            enemy: enemy.defenseDice,
        });
        setPhase("viewingPlayerResults");
    }

    function continueFromPlayerResults() {
        if (!enemy) return;

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

        if (playerTakesDamage) {
            log({ type: "damage", label: "Player Takes Damage", value: 1 });
        } else {
            log({ type: "state", label: "Player blocks retaliation" });
        }

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

        addHistory({
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            enemyName: enemy.name,
            action: "fight",
            damageDealt: 0,
            enemyKilled: false,
            enemyRetaliated: true,
            playerDamaged: playerTookRetaliationDamage,
        });

        setPhase("reward");
    }

    /* ---------------- ENEMY ATTACK MODE ---------------- */

    function onEnemyAttackRollComplete(enemyAttackRolls: number[]) {
        if (!enemy) return;

        log({
            type: "roll",
            label: "Enemy Attack Rolls",
            values: enemyAttackRolls,
        });

        setEnemyAttackRolls(enemyAttackRolls);
        setPhase("rollingEnemyAttack");
    }

    function onEnemyAttackComplete(playerDefenseRolls: number[]) {
        if (!enemy) return;

        const playerDefense = Math.max(...playerDefenseRolls);
        const enemyAttack = Math.max(...enemyAttackRolls);
        const playerTakesDamage = enemyAttack > playerDefense;

        log({
            type: "roll",
            label: "Player Defense",
            values: playerDefenseRolls,
        });

        if (playerTakesDamage) {
            log({ type: "damage", label: "Player Takes Damage", value: 1 });
        } else {
            log({ type: "state", label: "Attack blocked" });
        }

        setPlayerDefenseRolls(playerDefenseRolls);
        setLastRollValues({ player: playerDefenseRolls, enemy: enemyAttackRolls });
        setLastRollDiceTypes({
            player: expandDicePool(playerDefenseDice),
            enemy: enemy.attackDice,
        });
        setPhase("viewingEnemyAttackResults");
    }

    function continueFromEnemyAttackResults() {
        setPhase("reward");
    }

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
            phase !== "viewingRetaliationResults" &&
            phase !== "viewingEnemyAttackResults"
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

        if (phase === "viewingEnemyAttackResults") {
            setPlayerDefenseRolls(nextValues.player);
            setEnemyAttackRolls(nextValues.enemy);
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

        if (phase === "viewingEnemyAttackResults") {
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

        if (phase === "viewingEnemyAttackResults") {
            const playerDefense = Math.max(...nextValues.player);
            const enemyAttack = Math.max(...nextValues.enemy);
            const playerTakesDamage = enemyAttack > playerDefense;

            if (playerTakesDamage) {
                log({ type: "damage", label: `Player Takes Damage (${action})`, value: 1 });
            } else {
                log({ type: "state", label: `Attack blocked (${action})` });
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

    function renderResultDiceRow(
        title: string,
        side: "player" | "enemy",
        values: number[]
    ) {
        return (
            <div className="dice-roll">
                <h3>{title}</h3>
                <div className="dice-row">
                    {values.map((value, index) => (
                        <button
                            key={index}
                            type="button"
                            className={`die ${side}-die ${
                                selectedResultDie?.side === side &&
                                selectedResultDie.index === index
                                    ? "selected"
                                    : ""
                            }`}
                            onClick={() => setSelectedResultDie({ side, index })}
                        >
                            {value}
                        </button>
                    ))}
                </div>

                {selectedResultDie?.side === side &&
                    selectedResultDie.index < values.length && (
                        <div className="dice-actions">
                            <button
                                type="button"
                                onClick={() => rerollResultDie(side, selectedResultDie.index)}
                            >
                                Reroll
                            </button>
                            <button
                                type="button"
                                onClick={() => removeResultDie(side, selectedResultDie.index)}
                            >
                                Remove
                            </button>
                        </div>
                    )}
            </div>
        );
    }

    /* ---------------- RENDER ---------------- */

    if (phase === "selectEnemy") {
        return (
            <div className="page">
                <h1>Select Enemy</h1>

                {(enemies as Enemy[]).map((e: Enemy) => (
                    <button key={e.id} className="enemy-btn" onClick={() => selectEnemy(e)}>
                        {e.name}
                    </button>
                ))}

                <button onClick={exitToSession}>
                    Return to Session
                </button>
            </div>
        );
    }

    if (phase === "setupEnemy" && enemy) {
        return (
            <div className="page">
                <h1>{enemy.name}</h1>

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

                <button onClick={exitToSession}>
                    Return to Session
                </button>
            </div>
        );
    }

    if (!enemy) return null;

    return (
        <div className="page">
            <h1>{enemy.name}</h1>

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
                    {renderResultDiceRow("Player Attack", "player", lastRollValues.player)}
                    {renderResultDiceRow("Enemy Defense", "enemy", lastRollValues.enemy)}
                    <button onClick={continueFromPlayerResults}>
                        Continue
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
                    <div className="card">
                        <h3>Defense Loadout</h3>
                        <DicePoolSelector
                            value={playerDefenseDice}
                            onChange={setPlayerDefenseDice}
                        />
                    </div>
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
                    {renderResultDiceRow("Player Defense", "player", lastRollValues.player)}
                    {renderResultDiceRow("Enemy Attack", "enemy", lastRollValues.enemy)}
                    <button onClick={continueFromRetaliationResults}>
                        Continue
                    </button>
                </>
            )}

            {/* ---------------- ENEMY ATTACK ---------------- */}
            {phase === "enemyAttack" && (
                <DiceRenderer
                    dice={enemy?.attackDice || []}
                    onComplete={onEnemyAttackRollComplete}
                    role="enemy"
                />
            )}

            {phase === "rollingEnemyAttack" && (
                <DiceRenderer
                    dice={expandDicePool(playerDefenseDice)}
                    onComplete={onEnemyAttackComplete}
                    role="player"
                />
            )}

            {phase === "viewingEnemyAttackResults" && (
                <>
                    {renderResultDiceRow("Player Defense", "player", lastRollValues.player)}
                    {renderResultDiceRow("Enemy Attack", "enemy", lastRollValues.enemy)}
                    <button onClick={continueFromEnemyAttackResults}>
                        Continue
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

            <button onClick={exitToSession}>
                Return to Session
            </button>
        </div>
    );
}