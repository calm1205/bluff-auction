import { Server } from 'socket.io';
import type {
  AckResponse,
  ClientToServerEvents,
  ServerToClientEvents,
} from '@bluff-auction/shared';
import { RoomManager } from './roomManager.js';
import {
  addPlayer,
  bid,
  listCard,
  pass,
  removePlayer,
  startGame,
  type EngineEvent,
  type EngineResult,
} from './gameEngine.js';
import { buildView } from './viewFilter.js';

const PORT = Number(process.env.PORT ?? 4000);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(PORT, {
  cors: { origin: '*' },
});

const room = new RoomManager();

function broadcastViews(): void {
  const state = room.getState();
  for (const sock of io.of('/').sockets.values()) {
    const pid = sock.data.playerId as string | undefined;
    sock.emit('view-update', buildView(state, pid ?? null));
  }
}

function dispatchEvents(
  events: EngineEvent[],
  socketMap: Map<string, string>
): void {
  for (const ev of events) {
    if (ev.type === 'view-update') {
      broadcastViews();
    } else if (ev.type === 'auction-revealed') {
      const socketId = socketMap.get(ev.to);
      if (socketId) {
        io.to(socketId).emit('auction-revealed', { brand: ev.brand });
      }
    } else if (ev.type === 'unsold-penalty') {
      io.emit('unsold-penalty', {
        sellerId: ev.sellerId,
        amount: ev.amount,
        recipientIds: ev.recipientIds,
      });
    } else if (ev.type === 'game-ended') {
      io.emit('game-ended', { winnerId: ev.winnerId });
    }
  }
}

function buildSocketMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const sock of io.of('/').sockets.values()) {
    const pid = sock.data.playerId as string | undefined;
    if (pid) map.set(pid, sock.id);
  }
  return map;
}

function ackFromResult(result: EngineResult): AckResponse {
  return result.ok ? { ok: true } : { ok: false, code: result.code, message: result.message };
}

io.on('connection', (socket) => {
  console.log(`[server] connected: ${socket.id}`);

  socket.on('join-room', ({ name }, ack) => {
    const state = room.getState();
    const result = addPlayer(state, socket.id, name);
    if (result.ok) {
      socket.data.playerId = socket.id;
      dispatchEvents(result.events, buildSocketMap());
    }
    ack?.(ackFromResult(result));
  });

  socket.on('leave-room', () => {
    const state = room.getState();
    removePlayer(state, socket.id);
    broadcastViews();
  });

  socket.on('start-game', (ack) => {
    const state = room.getState();
    const result = startGame(state);
    if (result.ok) dispatchEvents(result.events, buildSocketMap());
    ack?.(ackFromResult(result));
  });

  socket.on('list-card', ({ cardId, declaredBrand, startingBid }, ack) => {
    const state = room.getState();
    const result = listCard(state, socket.id, cardId, declaredBrand, startingBid);
    if (result.ok) dispatchEvents(result.events, buildSocketMap());
    ack?.(ackFromResult(result));
  });

  socket.on('bid', ({ amount }, ack) => {
    const state = room.getState();
    const result = bid(state, socket.id, amount);
    if (result.ok) dispatchEvents(result.events, buildSocketMap());
    ack?.(ackFromResult(result));
  });

  socket.on('pass', (ack) => {
    const state = room.getState();
    const result = pass(state, socket.id);
    if (result.ok) dispatchEvents(result.events, buildSocketMap());
    ack?.(ackFromResult(result));
  });

  socket.on('disconnect', () => {
    console.log(`[server] disconnected: ${socket.id}`);
    const state = room.getState();
    removePlayer(state, socket.id);
    broadcastViews();
  });
});

console.log(`[server] Bluff Auction server listening on :${PORT}`);
