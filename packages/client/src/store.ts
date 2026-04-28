import { create } from "zustand"
import type { Brand, GameView, PlayerId } from "@bluff-auction/shared"
import { clearStoredRoomId, setStoredRoomId } from "./utils/roomId.js"

type RevealedCard = { brand: Brand }

type LobbyMode = "idle" | "join"

type State = {
  userName: string | null
  roomId: string | null
  lobbyMode: LobbyMode
  view: GameView | null
  lastRevealed: RevealedCard | null
  lastError: string | null
  winnerId: PlayerId | null
  setUserName: (name: string | null) => void
  setRoomId: (id: string | null) => void
  setLobbyMode: (mode: LobbyMode) => void
  setView: (v: GameView | null) => void
  setRevealed: (r: RevealedCard) => void
  setError: (m: string | null) => void
  setWinner: (id: PlayerId | null) => void
  leaveRoom: () => void
}

export const useStore = create<State>((set) => ({
  userName: null,
  roomId: null,
  lobbyMode: "idle",
  view: null,
  lastRevealed: null,
  lastError: null,
  winnerId: null,
  setUserName: (name) => set({ userName: name }),
  setRoomId: (id) => {
    if (id) setStoredRoomId(id)
    else clearStoredRoomId()
    set({ roomId: id })
  },
  setLobbyMode: (mode) => set({ lobbyMode: mode }),
  setView: (v) => set({ view: v }),
  setRevealed: (r) => set({ lastRevealed: r }),
  setError: (m) => set({ lastError: m }),
  setWinner: (id) => set({ winnerId: id }),
  leaveRoom: () => {
    clearStoredRoomId()
    set({
      roomId: null,
      lobbyMode: "idle",
      view: null,
      lastRevealed: null,
      lastError: null,
      winnerId: null,
    })
  },
}))
