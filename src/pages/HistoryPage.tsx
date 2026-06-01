import { useNavigate } from "react-router-dom";
import { useHistoryStore } from "../store/historyStore";

export default function HistoryPage() {
  const history = useHistoryStore(
    (s) => s.history
  );
  const navigate = useNavigate();

  function returnToSession() {
    navigate("/home");
  }

  return (
    <div className="page">
      <h1>History</h1>

      <button onClick={returnToSession}>
        Return Home
      </button>

      {history.length === 0 && (
        <p>No fights yet.</p>
      )}

      {history.map((h) => (
        <div
          key={h.id}
          className="card"
        >
          <h3>{h.enemyName}</h3>

          <p>
            Damage: {h.damageDealt}
          </p>

          <p>
            Killed:{" "}
            {h.enemyKilled
              ? "Yes"
              : "No"}
          </p>

          {h.rewards && h.rewards.length > 0 && (
            <p>
              Rewards:{" "}
              {h.rewards
                .map((r) => `${r.id} × ${r.quantity}`)
                .join(", ")}
            </p>
          )}

          <small>
            {new Date(
              h.timestamp
            ).toLocaleString()}
          </small>
        </div>
      ))}
    </div>
  );
}