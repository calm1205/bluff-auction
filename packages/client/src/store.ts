import { create } from "zustand";
import type { Brand, GameView, PlayerId } from "@bluff-auction/shared";

type RevealedCard = { brand: Brand };

type State = {
  view: GameView | null;
  lastRevealed: RevealedCard | null;
  lastError: string | null;
  winnerId: PlayerId | null;
  setView: (v: GameView) => void;
  setRevealed: (r: RevealedCard) => void;
  setError: (m: string | null) => void;
  setWinner: (id: PlayerId | null) => void;
};

export const useStore = create<State>((set) => ({
  view: null,
  lastRevealed: null,
  lastError: null,
  winnerId: null,
  setView: (v) => set({ view: v }),
  setRevealed: (r) => set({ lastRevealed: r }),
  setError: (m) => set({ lastError: m }),
  setWinner: (id) => set({ winnerId: id }),
}));
