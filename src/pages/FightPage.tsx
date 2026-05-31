import { useState } from "react";
import enemies from "../data/enemies.json";

import DiceSelector from "../components/DiceSelector";
import EnemyHPBar from "../components/EnemyHPBar";
import CombatTimeline from "../components/CombatTimeline";
import RewardScreen from "../components/RewardScreen";

import {
    resolvePlayerAttack,
    resolveRetaliation,
    resolveEnemyAttack,
} from "../services/combatService";

import { useSessionStore } from "../store/sessionStore";
import type { DiceType } from "../types/Dice";
import type { Enemy } from "../types/Enemy";
import DiceRenderer from "../components/dice/DiceRenderer";

type Phase =
    | "selectEnemy"
    | "setupEnemy"
    | "playerAttack"
    | "rollingPlayer"
    | "retaliationCheck"
    | "rollingRetaliation"
    | "enemyAttack"
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

    const [playerDice, setPlayerDice] = useState<Record<DiceType, number>>({
        D4: 1,
        D6: 0,
        D8: 0,
        D12: 0,
        D20: 0,
    });

    const [events, setEvents] = useState<CombatEvent[]>([]);

    const [pending, setPending] = useState<"player" | "retaliation" | "enemy" | null>(null);

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
        setPending("player");
        setPhase("rollingPlayer");
    }

    function onPlayerRollComplete(playerRolls: number[]) {
        if (!enemy) return;

        const res = resolvePlayerAttack(
            playerRolls,
            enemy.defenseDice
        );

        const newHp = enemyHp - res.damage;
        setEnemyHp(newHp);

        log({ type: "roll", label: "Player Rolls", values: playerRolls });
        log({ type: "roll", label: "Enemy Defense", values: res.enemyRolls });
        log({ type: "damage", label: "Damage Dealt", value: res.damage });

        if (newHp <= 0) {
            addHistory({
                id: crypto.randomUUID(),
                timestamp: new Date().toISOString(),
                enemyName: enemy.name,
                action: "fight",
                damageDealt: res.damage,
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

        setPending("retaliation");
        setPhase("rollingRetaliation");
    }

    function onRetaliationRollComplete(playerDefenseRolls: number[]) {
        if (!enemy) return;

        const res = resolveRetaliation(
            enemy.defenseDice,
            playerDefenseRolls
        );

        log({
            type: "roll",
            label: "Enemy Retaliation Rolls",
            values: res.enemyRolls,
        });

        if (res.playerTakesDamage) {
            log({ type: "damage", label: "Player Takes Damage", value: 1 });
        } else {
            log({ type: "state", label: "Player blocks retaliation" });
        }

        addHistory({
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            enemyName: enemy.name,
            action: "fight",
            damageDealt: 0,
            enemyKilled: false,
            enemyRetaliated: true,
            playerDamaged: res.playerTakesDamage,
        });

        setPhase("reward");
    }

    /* ---------------- ENEMY ATTACK MODE ---------------- */

    function onEnemyAttackComplete(playerDefenseRolls: number[]) {
        if (!enemy) return;

        const res = resolveEnemyAttack(
            enemy.attackDice,
            playerDefenseRolls
        );

        log({
            type: "roll",
            label: "Enemy Attack Rolls",
            values: res.enemyRolls,
        });

        if (res.playerTakesDamage) {
            log({ type: "damage", label: "Player Takes Damage", value: 1 });
        } else {
            log({ type: "state", label: "Attack blocked" });
        }

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
                    <DiceSelector
                        value={playerDice}
                        onChange={setPlayerDice}
                    />

                    <button onClick={startPlayerAttack}>
                        Attack
                    </button>
                </>
            )}

            {phase === "rollingPlayer" && (
                <DiceRenderer
                    dice={expandDicePool(playerDice)}
                    onComplete={onPlayerRollComplete}
                    role="player"
                />
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

            {phase === "rollingRetaliation" && (
                <DiceRenderer
                    dice={expandDicePool(playerDice)}
                    onComplete={onRetaliationRollComplete}
                    role="player"
                />
            )}

            {/* ---------------- ENEMY ATTACK ---------------- */}
            {phase === "enemyAttack" && (
                <DiceRenderer
                    dice={expandDicePool(playerDice)}
                    onComplete={onEnemyAttackComplete}
                    role="enemy"
                />
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