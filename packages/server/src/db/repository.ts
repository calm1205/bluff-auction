import { eq } from "drizzle-orm"
import type {
  Auction,
  Brand,
  Card,
  GameState,
  Phase,
  Player,
  PlayerId,
} from "@bluff-auction/shared"
import type { Tx } from "./client.js"
import { auctions, cards, players, rooms, type NewCardRow, type NewPlayerRow } from "./schema.js"

const DEFAULT_ROOM_ID = "default"

function initialState(): GameState {
  return {
    phase: "lobby",
    turnIndex: 0,
    players: [],
    currentAuction: null,
    winnerId: null,
    turnOrder: [],
  }
}

export async function loadRoomState(tx: Tx, roomId: string = DEFAULT_ROOM_ID): Promise<GameState> {
  const [roomRow] = await tx.select().from(rooms).where(eq(rooms.id, roomId)).limit(1)

  if (!roomRow) {
    await tx.insert(rooms).values({ id: roomId }).onConflictDoNothing()
    return initialState()
  }

  const playerRows = await tx.select().from(players).where(eq(players.roomId, roomId))
  const cardRows = await tx.select().from(cards).where(eq(cards.roomId, roomId))
  const [auctionRow] = await tx.select().from(auctions).where(eq(auctions.roomId, roomId)).limit(1)

  const sortedPlayers = [...playerRows].sort((a, b) => a.seatIndex - b.seatIndex)

  const playersOut: Player[] = sortedPlayers.map((p) => {
    const hand: Card[] = cardRows
      .filter((c) => c.holderId === p.userId && c.location === "hand")
      .map((c) => ({ id: c.id, brand: c.brand as Brand }))

    // lobby 時点で brand が null の場合、型上は Brand を要求されるが、
    // ゲーム開始前には参照されないためフォールバック値を入れる
    const brand = (p.brand ?? "painting") as Brand

    return {
      id: p.userId,
      name: p.name,
      brand,
      hand,
      cash: p.cash,
      fakesUsed: p.fakesUsed,
      passed: p.passed,
      online: p.online,
    }
  })

  let currentAuction: Auction | null = null
  if (auctionRow) {
    const auctionCard = cardRows.find((c) => c.id === auctionRow.cardId)
    if (!auctionCard) {
      throw new Error(`オークション対象のカードが見つからない: ${auctionRow.cardId}`)
    }
    currentAuction = {
      sellerId: auctionRow.sellerId,
      card: { id: auctionCard.id, brand: auctionCard.brand as Brand },
      declaredBrand: auctionRow.declaredBrand as Brand,
      startingBid: auctionRow.startingBid,
      currentBid: auctionRow.currentBid,
      highestBidderId: auctionRow.highestBidderId,
      passedPlayerIds: auctionRow.passedPlayerIds as PlayerId[],
    }
  }

  return {
    phase: roomRow.phase as Phase,
    turnIndex: roomRow.turnIndex,
    players: playersOut,
    currentAuction,
    winnerId: roomRow.winnerId,
    turnOrder: roomRow.turnOrder as PlayerId[],
  }
}

export async function saveRoomState(
  tx: Tx,
  state: GameState,
  roomId: string = DEFAULT_ROOM_ID,
): Promise<void> {
  // 依存順: auction → cards → players を削除してから room を upsert し、再挿入
  await tx.delete(auctions).where(eq(auctions.roomId, roomId))
  await tx.delete(cards).where(eq(cards.roomId, roomId))
  await tx.delete(players).where(eq(players.roomId, roomId))

  await tx
    .insert(rooms)
    .values({
      id: roomId,
      phase: state.phase,
      turnIndex: state.turnIndex,
      turnOrder: state.turnOrder,
      winnerId: state.winnerId,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: rooms.id,
      set: {
        phase: state.phase,
        turnIndex: state.turnIndex,
        turnOrder: state.turnOrder,
        winnerId: state.winnerId,
        updatedAt: new Date(),
      },
    })

  if (state.players.length > 0) {
    const playerRows: NewPlayerRow[] = state.players.map((p, index) => ({
      roomId,
      userId: p.id,
      name: p.name,
      brand: state.phase === "lobby" ? null : p.brand,
      cash: p.cash,
      fakesUsed: p.fakesUsed,
      passed: p.passed,
      online: p.online,
      seatIndex: index,
    }))
    await tx.insert(players).values(playerRows)
  }

  const cardRows: NewCardRow[] = []
  for (const p of state.players) {
    for (const c of p.hand) {
      cardRows.push({
        id: c.id,
        roomId,
        brand: c.brand,
        holderId: p.id,
        location: "hand",
      })
    }
  }

  if (state.currentAuction) {
    const auctionCard = state.currentAuction.card
    // オークション中のカードは holder を外して location='auction' として保存
    const alreadyIncluded = cardRows.some((c) => c.id === auctionCard.id)
    if (!alreadyIncluded) {
      cardRows.push({
        id: auctionCard.id,
        roomId,
        brand: auctionCard.brand,
        holderId: null,
        location: "auction",
      })
    }
  }

  if (cardRows.length > 0) {
    await tx.insert(cards).values(cardRows)
  }

  if (state.currentAuction) {
    await tx.insert(auctions).values({
      roomId,
      sellerId: state.currentAuction.sellerId,
      cardId: state.currentAuction.card.id,
      declaredBrand: state.currentAuction.declaredBrand,
      startingBid: state.currentAuction.startingBid,
      currentBid: state.currentAuction.currentBid,
      highestBidderId: state.currentAuction.highestBidderId,
      passedPlayerIds: state.currentAuction.passedPlayerIds,
    })
  }
}
