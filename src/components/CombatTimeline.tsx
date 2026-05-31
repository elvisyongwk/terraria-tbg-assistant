import type { CombatEvent } from "../types/CombatEvent";

export default function CombatTimeline({
  events,
}: {
  events: CombatEvent[];
}) {
  return (
    <div className="timeline">
      <h3>Battle Log</h3>

      {events.map((e, i) => {
        if (e.type === "roll") {
          return (
            <div key={i}>
              🎲 {e.label}:{" "}
              {e.values.join(", ")}
            </div>
          );
        }

        if (e.type === "damage") {
          return (
            <div key={i}>
              💥 {e.label}: {e.value}
            </div>
          );
        }

        return (
          <div key={i}>
            ⚔️ {e.label}
          </div>
        );
      })}
    </div>
  );
}