import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FightHistory } from "../types/FightHistory";

interface SessionState {
  sessionId: string | null;

  history: FightHistory[];

  currentEnemy: any | null;
  enemyHp: number;

  createSession: () => void;
  endSession: () => void;

  setEnemy: (enemy: any, hp: number) => void;

  addHistory: (record: FightHistory) => void;
}

export const useSessionStore =
  create<SessionState>()(
    persist(
      (set) => ({
        sessionId: null,
        history: [],

        currentEnemy: null,
        enemyHp: 0,

        createSession: () =>
          set({
            sessionId: crypto.randomUUID(),
            history: [],
            currentEnemy: null,
            enemyHp: 0,
          }),

        endSession: () =>
          set({
            sessionId: null,
            history: [],
            currentEnemy: null,
            enemyHp: 0,
          }),

        setEnemy: (enemy, hp) =>
          set({
            currentEnemy: enemy,
            enemyHp: hp,
          }),

        addHistory: (record) =>
          set((state) => ({
            history: [
              record,
              ...state.history,
            ],
          })),
      }),
      {
        name: "board-game-session",
      }
    )
  );