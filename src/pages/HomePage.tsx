import { useNavigate } from "react-router-dom";
import { useSessionStore } from "../store/sessionStore";
import { useSettingsStore } from "../store/settingsStore";

export default function HomePage() {
  const navigate = useNavigate();

  const createSession =
    useSessionStore(
      (s) => s.createSession
    );

  const handleCreate = () => {
    createSession();
    navigate("/session");
  };

  const { diceMode, setDiceMode } = useSettingsStore();

  return (
    <div className="page">
      <h1>Board Game Session</h1>

      <button onClick={handleCreate}>
        Create Session
      </button>

      <div className="card">
        <h3>Dice Mode</h3>

        <button
          onClick={() => setDiceMode("2d")}
          style={{
            border:
              diceMode === "2d"
                ? "1px solid #6ea8fe"
                : "",
          }}
        >
          2D Dice (Fast)
        </button>

        <button
          onClick={() => setDiceMode("3d")}
          style={{
            border:
              diceMode === "3d"
                ? "1px solid #6ea8fe"
                : "",
          }}
        >
          3D Dice (Immersive)
        </button>

        <p style={{ opacity: 0.7 }}>
          Current: {diceMode}
        </p>
      </div>
    </div>
  );
}