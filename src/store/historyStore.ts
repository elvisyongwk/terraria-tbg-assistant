import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FightHistory } from "../types/FightHistory";

interface HistoryState {
  history: FightHistory[];

  addHistory: (record: FightHistory) => void;
}

export const useHistoryStore =
  create<HistoryState>()(
    persist(
      (set) => ({
        history: [],

        addHistory: (record) =>
          set((state) => ({
            history: [
              record,
              ...state.history,
            ],
          })),
      }),
      {
        name: "board-game-history",
      }
    )
  );