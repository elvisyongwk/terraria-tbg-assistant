import { useNavigate } from "react-router-dom";
import { useSessionStore } from "../store/sessionStore";

export default function HistoryPage() {
  const history = useSessionStore(
    (s) => s.history
  );
  const navigate = useNavigate();

  function returnToSession() {
    navigate("/session");
  }

  return (
    <div className="page">
      <h1>Session History</h1>

      <button onClick={returnToSession}>
        Return to Session
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

          {h.rewards && (
            <p>
              Rewards:{" "}
              {h.rewards.join(", ")}
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