import { useNavigate } from "react-router-dom";
import { useSessionStore } from "../store/sessionStore";

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

  return (
    <div className="page">
      <h1>
        Board Game Companion
      </h1>

      <button onClick={handleCreate}>
        Create Session
      </button>
    </div>
  );
}