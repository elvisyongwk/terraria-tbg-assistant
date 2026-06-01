import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import { ToastProvider } from "./components/Toast";

import HomePage from "./pages/HomePage";
import SessionPage from "./pages/SessionPage";
import FightPage from "./pages/FightPage";
import EnemyAttackPage from "./pages/EnemyAttackPage";
import HistoryPage from "./pages/HistoryPage";

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
        <Route
          path="/"
          element={<HomePage />}
        />

        <Route
          path="/session"
          element={<SessionPage />}
        />

        <Route
          path="/fight"
          element={<FightPage />}
        />

        <Route
          path="/enemy-attack"
          element={
            <EnemyAttackPage />
          }
        />

        <Route
          path="/history"
          element={<HistoryPage />}
        />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;