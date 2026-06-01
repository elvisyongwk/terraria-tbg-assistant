import { useNavigate } from "react-router-dom";
import { useSettingsStore } from "../store/settingsStore";

export default function HomePage() {
  const navigate = useNavigate();
  const { diceMode, setDiceMode } = useSettingsStore();

  return (
    <div className="page">
      <h1>Terraria</h1>
      <h2>The Board Game Assistant</h2>

      <div className="button-row main-menu">
        <button className="main-menu-button" onClick={() => navigate("/fight")}>Fight</button>
        <button className="main-menu-button" onClick={() => navigate("/enemy-attack")}>Enemy Attack</button>
        <button className="main-menu-button" onClick={() => navigate("/history")}>History</button>
      </div>

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