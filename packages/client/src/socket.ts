import { io, type Socket } from "socket.io-client"
import type { ClientToServerEvents, ServerToClientEvents } from "@bluff-auction/shared"
import { getStoredUserId } from "./utils/userId.js"

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "http://localhost:4000"

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SERVER_URL, {
  autoConnect: false,
})

export function connectSocket(roomId: string): void {
  const userId = getStoredUserId()
  if (!userId) throw new Error("userId 未登録(ユーザー登録前に Socket 接続不可)")
  if (socket.connected) socket.disconnect()
  socket.auth = { userId, roomId }
  socket.connect()
}

export function disconnectSocket(): void {
  if (socket.connected) socket.disconnect()
}
