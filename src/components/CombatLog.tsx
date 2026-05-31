interface LogEntry {
  text: string;
}

export default function CombatLog({
  logs,
}: {
  logs: LogEntry[];
}) {
  return (
    <div className="log">
      <h3>Combat Log</h3>

      {logs.map((l, i) => (
        <p key={i}>• {l.text}</p>
      ))}
    </div>
  );
}