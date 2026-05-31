import { useNavigate } from "react-router-dom";
import { useSessionStore } from "../store/sessionStore";

export default function SessionPage() {
  const navigate = useNavigate();

  const sessionId =
    useSessionStore(
      (s) => s.sessionId
    );

  return (
    <div className="page">
      <h1>Game Session</h1>

      <p>
        Session:
        {sessionId?.slice(0, 8)}
      </p>

      <button
        onClick={() =>
          navigate("/fight")
        }
      >
        Fight
      </button>

      <button
        onClick={() =>
          navigate("/enemy-attack")
        }
      >
        Enemy Attack
      </button>

      <button
        onClick={() =>
          navigate("/history")
        }
      >
        History
      </button>
    </div>
  );
}