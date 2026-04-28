import { io, type Socket } from "socket.io-client"
import type { ClientToServerEvents, ServerToClientEvents } from "@bluff-auction/shared"
import { getStoredPlayerId } from "./utils/playerId.js"

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "http://localhost:4000"

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SERVER_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 500,
  reconnectionDelayMax: 5000,
})

export function connectSocket(roomId: string): void {
  const playerId = getStoredPlayerId()
  if (!playerId) throw new Error("playerId 未登録(ユーザー登録前に Socket 接続不可)")
  if (socket.connected) socket.disconnect()
  socket.auth = { playerId, roomId }
  socket.connect()
}

export function disconnectSocket(): void {
  if (socket.connected) socket.disconnect()
}
