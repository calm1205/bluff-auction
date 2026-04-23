import { create } from "zustand"
import type { Brand, GameView, PlayerId } from "@bluff-auction/shared"

type RevealedCard = { brand: Brand }

type State = {
  userName: string | null
  roomId: string | null
  view: GameView | null
  lastRevealed: RevealedCard | null
  lastError: string | null
  winnerId: PlayerId | null
  setUserName: (name: string | null) => void
  setRoomId: (id: string | null) => void
  setView: (v: GameView | null) => void
  setRevealed: (r: RevealedCard) => void
  setError: (m: string | null) => void
  setWinner: (id: PlayerId | null) => void
  leaveRoom: () => void
}

export const useStore = create<State>((set) => ({
  userName: null,
  roomId: null,
  view: null,
  lastRevealed: null,
  lastError: null,
  winnerId: null,
  setUserName: (name) => set({ userName: name }),
  setRoomId: (id) => set({ roomId: id }),
  setView: (v) => set({ view: v }),
  setRevealed: (r) => set({ lastRevealed: r }),
  setError: (m) => set({ lastError: m }),
  setWinner: (id) => set({ winnerId: id }),
  leaveRoom: () =>
    set({
      roomId: null,
      view: null,
      lastRevealed: null,
      lastError: null,
      winnerId: null,
    }),
}))
