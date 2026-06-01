import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastProvider } from "./components/Toast";

import HomePage from "./pages/HomePage";
import FightPage from "./pages/FightPage";
import EnemyAttackPage from "./pages/EnemyAttackPage";
import HistoryPage from "./pages/HistoryPage";

function App() {
  return (
    <ToastProvider>
      <BrowserRouter basename="/terraria-tbg-assistant">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/fight" element={<FightPage />} />

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