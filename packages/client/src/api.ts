import { getOrCreateUserId } from "./utils/userId.js";

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "http://localhost:4000";
const DEFAULT_ROOM_ID = "default";

type ApiError = { code: string; message: string };

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${SERVER_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": getOrCreateUserId(),
      ...init.headers,
    },
  });
  if (!res.ok) {
    const body: ApiError = await res.json().catch(() => ({
      code: "unknown",
      message: `HTTP ${res.status}`,
    }));
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }
  return res;
}

export async function joinRoom(name: string, roomId: string = DEFAULT_ROOM_ID): Promise<void> {
  await request(`/rooms/${encodeURIComponent(roomId)}/players`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function leaveRoom(roomId: string = DEFAULT_ROOM_ID): Promise<void> {
  await request(`/rooms/${encodeURIComponent(roomId)}/players/me`, {
    method: "DELETE",
  });
}

export async function startGame(roomId: string = DEFAULT_ROOM_ID): Promise<void> {
  await request(`/rooms/${encodeURIComponent(roomId)}/start`, {
    method: "POST",
  });
}
