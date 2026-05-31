import { create } from "zustand";

export type DiceRenderMode = "2d" | "3d";

export const useSettingsStore = create<{
  diceMode: DiceRenderMode;
  setDiceMode: (mode: DiceRenderMode) => void;
}>((set) => ({
  diceMode: "2d",
  setDiceMode: (mode) => set({ diceMode: mode }),
}));