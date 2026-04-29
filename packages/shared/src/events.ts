import type { Brand, GameView, PlayerId } from "./types.js"

export type ClientToServerEvents = {
  "list-card": (
    payload: { cardId: string; declaredBrand: Brand; startingBid: number },
    ack?: (res: AckResponse) => void,
  ) => void
  bid: (payload: { amount: number }, ack?: (res: AckResponse) => void) => void
  pass: (ack?: (res: AckResponse) => void) => void
  "ack-reveal": (ack?: (res: AckResponse) => void) => void
}

export type ServerToClientEvents = {
  "view-update": (view: GameView) => void
  "auction-revealed": (payload: { brand: Brand }) => void
  "unsold-penalty": (payload: {
    sellerId: PlayerId
    amount: number
    recipientIds: PlayerId[]
  }) => void
  "game-ended": (payload: { winnerId: PlayerId }) => void
  "error-event": (payload: { code: string; message: string }) => void
}

export type AckResponse = { ok: true } | { ok: false; code: string; message: string }
