import { useState } from "react";
import enemies from "../data/enemies.json";

import EnemyHPBar from "../components/EnemyHPBar";
import CombatTimeline from "../components/CombatTimeline";
import RewardScreen from "../components/RewardScreen";

import { useSessionStore } from "../store/sessionStore";
import type { DiceType } from "../types/Dice";
import type { Enemy } from "../types/Enemy";
import DiceRenderer from "../components/dice/DiceRenderer";
import DicePoolSelector from "../components/DicePoolSelector";
import DicePoolPreset from "../components/DicePoolPresets";

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

        // if you use router, you can navigate here
        // navigate("/session");
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
                    <div className="dice-roll">
                        <h3>Player Attack</h3>
                        <div className="dice-row">
                            {lastRollValues.player.map((v, i) => (
                                <div key={i} className="die player-die">
                                    {v}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="dice-roll">
                        <h3>Enemy Defense</h3>
                        <div className="dice-row">
                            {lastRollValues.enemy.map((v, i) => (
                                <div key={i} className="die enemy-die">
                                    {v}
                                </div>
                            ))}
                        </div>
                    </div>
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
                    <div className="dice-roll">
                        <h3>Player Defense</h3>
                        <div className="dice-row">
                            {lastRollValues.player.map((v, i) => (
                                <div key={i} className="die player-die">
                                    {v}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="dice-roll">
                        <h3>Enemy Attack</h3>
                        <div className="dice-row">
                            {lastRollValues.enemy.map((v, i) => (
                                <div key={i} className="die enemy-die">
                                    {v}
                                </div>
                            ))}
                        </div>
                    </div>
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
                    <div className="dice-roll">
                        <h3>Player Defense</h3>
                        <div className="dice-row">
                            {lastRollValues.player.map((v, i) => (
                                <div key={i} className="die player-die">
                                    {v}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="dice-roll">
                        <h3>Enemy Attack</h3>
                        <div className="dice-row">
                            {lastRollValues.enemy.map((v, i) => (
                                <div key={i} className="die enemy-die">
                                    {v}
                                </div>
                            ))}
                        </div>
                    </div>
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