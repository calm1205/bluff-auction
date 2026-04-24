import { getStoredPlayerId } from "./utils/playerId.js"

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "http://localhost:4000"

export type ApiError = { code: string; message: string }

export class HttpError extends Error {
  readonly status: number
  readonly code: string
  constructor(status: number, body: ApiError) {
    super(body.message)
    this.status = status
    this.code = body.code
  }
}

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  const playerId = getStoredPlayerId()
  const headers: Record<string, string> = {
    ...((init.headers as Record<string, string> | undefined) ?? {}),
  }
  // body がある場合のみ JSON content-type を付与(空 body + application/json は Fastify が拒否)
  if (init.body != null) headers["Content-Type"] = "application/json"
  // 登録済みの場合のみ X-Player-Id を送信(未登録時に localStorage を汚染しない)
  if (playerId) headers["X-Player-Id"] = playerId

  const res = await fetch(`${SERVER_URL}${path}`, {
    ...init,
    headers,
  })
  if (!res.ok) {
    const body: ApiError = await res.json().catch(() => ({
      code: "unknown",
      message: `HTTP ${res.status}`,
    }))
    throw new HttpError(res.status, body)
  }
  return res
}

export type MyPlayer = { playerId: string; name: string }

export async function getMyPlayer(): Promise<MyPlayer> {
  const res = await request("/players/me")
  return res.json()
}

export type RoomSummary = { id: string; phase: string; playerCount: number }

export async function listRooms(): Promise<RoomSummary[]> {
  const res = await request("/rooms")
  return res.json()
}

export async function createRoom(): Promise<{ id: string }> {
  const res = await request("/rooms", { method: "POST" })
  return res.json()
}

export async function joinRoom(roomId: string, name: string): Promise<void> {
  await request(`/rooms/${encodeURIComponent(roomId)}/players`, {
    method: "POST",
    body: JSON.stringify({ name }),
  })
}

export async function leaveRoom(roomId: string): Promise<void> {
  await request(`/rooms/${encodeURIComponent(roomId)}/players/me`, {
    method: "DELETE",
  })
}

export async function startGame(roomId: string): Promise<void> {
  await request(`/rooms/${encodeURIComponent(roomId)}/start`, {
    method: "POST",
  })
}
