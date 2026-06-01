import { useState } from "react";
import { useNavigate } from "react-router-dom";
import EnemyAttackFlow from "../components/EnemyAttackFlow";
import CombatTimeline from "../components/CombatTimeline";
import type { CombatEvent } from "../types/CombatEvent";
import type { DiceType } from "../types/Dice";
import { useToast } from "../components/Toast";
import enemies from "../data/enemies.json";
import type { Enemy } from "../types/Enemy";

const defaultDefenseDice: Record<DiceType, number> = {
  D4: 1,
  D6: 0,
  D8: 0,
  D12: 0,
  D20: 0,
};

export default function EnemyAttackPage() {
  const [playerDefenseDice, setPlayerDefenseDice] = useState(defaultDefenseDice);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [events, setEvents] = useState<CombatEvent[]>([]);
  const [selectedEnemy, setSelectedEnemy] = useState<Enemy | null>(null);
  const navigate = useNavigate();
  const toast = useToast();

  function getSourceFromLabel(label: string, type?: CombatEvent["type"]): "player" | "enemy" | "system" {
    const lower = label.toLowerCase();
    if (lower.includes("player")) return "player";
    if (lower.includes("enemy")) return "enemy";
    if (type === "damage") return "player";
    return "system";
  }

  function handleComplete(
    enemyAttackRolls: number[],
    playerDefenseRolls: number[]
  ) {
    const playerDefense = Math.max(...playerDefenseRolls);

    // Damage = number of enemy attack dice equal-or-greater than player's highest defense
    const damage = enemyAttackRolls.filter((r) => r >= playerDefense).length;

    if (damage > 0) {
      setResultMessage(`Enemy attack hits the player for ${damage} damage.`);
      setEvents((prev) => [
        ...prev,
        { type: "damage", label: "Enemy Attack Damage", value: damage },
      ]);
      toast.show(`Enemy hits player for ${damage} damage.`, "damage", "enemy");
    } else {
      setResultMessage("Player blocks the enemy attack.");
      toast.show("Player blocks the enemy attack.", "state", "player");
    }
  }

  function handleLog(event: CombatEvent) {
    setEvents((prev) => [...prev, event]);
    const source = getSourceFromLabel(event.label, event.type);
    if (event.type === "damage") {
      toast.show(event.label + ": " + event.value, "damage", source);
    } else if (event.type === "roll") {
      toast.show(event.label + ": " + event.values.join(", "), "roll", source);
    } else if (event.type === "state") {
      toast.show(event.label, "state", source);
    }
  }

  return (
    <div className="page">

      <h1>Enemy Attack</h1>

      <button onClick={() => {
        setResultMessage(null);
        navigate("/home");
      }}>
        Return Home
      </button>

      {selectedEnemy && <CombatTimeline events={events} />}

      {!selectedEnemy && (
        <div>
          <h3>Select Enemy</h3>
          {(enemies as Enemy[]).map((e) => (
            <button key={e.id} onClick={() => setSelectedEnemy(e)}>
              {e.name}
            </button>
          ))}
        </div>
      )}

      {selectedEnemy && (
        <div>
          <h2>{selectedEnemy.name}</h2>
          <EnemyAttackFlow
            enemyAttackDice={selectedEnemy.attackDice}
            playerDefenseDice={playerDefenseDice}
            onPlayerDefenseDiceChange={setPlayerDefenseDice}
            onComplete={handleComplete}
            onLog={handleLog}
          />

          <button onClick={() => {
            setSelectedEnemy(null);
            setEvents([]);
            setResultMessage(null);
          }}>Choose another enemy</button>
        </div>
      )}

      {resultMessage && <p>{resultMessage}</p>}
    </div>
  );
}