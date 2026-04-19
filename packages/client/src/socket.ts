import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@bluff-auction/shared";
import { getOrCreateUserId } from "./utils/userId.js";

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "http://localhost:4000";

export const userId = getOrCreateUserId();

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SERVER_URL, {
  autoConnect: true,
  auth: { userId },
});
