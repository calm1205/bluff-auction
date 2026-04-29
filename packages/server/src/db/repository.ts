import { eq, inArray } from "drizzle-orm"
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
import {
  auctions,
  cards,
  players,
  roomPlayers,
  rooms,
  type NewCardRow,
  type NewRoomPlayerRow,
} from "./schema.js"

export async function loadRoomState(tx: Tx, roomId: string): Promise<GameState | null> {
  const [roomRow] = await tx.select().from(rooms).where(eq(rooms.id, roomId)).limit(1)
  if (!roomRow) return null

  const roomPlayerRows = await tx.select().from(roomPlayers).where(eq(roomPlayers.roomId, roomId))
  const cardRows = await tx.select().from(cards).where(eq(cards.roomId, roomId))
  const [auctionRow] = await tx.select().from(auctions).where(eq(auctions.roomId, roomId)).limit(1)

  // players マスターから name を引く
  const playerIds = roomPlayerRows.map((rp) => rp.playerId)
  const playerRows =
    playerIds.length > 0
      ? await tx.select().from(players).where(inArray(players.id, playerIds))
      : []
  const nameById = new Map(playerRows.map((p) => [p.id, p.name]))

  const sortedRoomPlayers = [...roomPlayerRows].sort((a, b) => a.seatIndex - b.seatIndex)

  const playersOut: Player[] = sortedRoomPlayers.map((rp) => {
    const hand: Card[] = cardRows
      .filter((c) => c.holderId === rp.playerId && c.location === "hand")
      .map((c) => ({ id: c.id, brand: c.brand as Brand }))

    // lobby 時点で brand が null の場合、ゲーム開始前は参照されないためフォールバック
    const brand = (rp.brand ?? "painting") as Brand

    return {
      id: rp.playerId,
      name: nameById.get(rp.playerId) ?? "(unknown)",
      brand,
      hand,
      cash: rp.cash,
      fakesUsed: rp.fakesUsed,
      passed: rp.passed,
      online: rp.online,
      isCpu: rp.isCpu,
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
      currentBidderId: auctionRow.currentBidderId,
      revealAckedIds: auctionRow.revealAckedIds as PlayerId[],
    }
  }

  return {
    phase: roomRow.phase as Phase,
    turnIndex: roomRow.turnIndex,
    players: playersOut,
    currentAuction,
    winnerId: roomRow.winnerId,
    turnOrder: roomRow.turnOrder as PlayerId[],
    hostPlayerId: roomRow.hostPlayerId,
  }
}

export async function saveRoomState(tx: Tx, state: GameState, roomId: string): Promise<void> {
  // ルームは POST /rooms で事前作成済み前提。ここでは関連行をクリアしてから再構築 + rooms.* を更新
  await tx.delete(auctions).where(eq(auctions.roomId, roomId))
  await tx.delete(cards).where(eq(cards.roomId, roomId))
  await tx.delete(roomPlayers).where(eq(roomPlayers.roomId, roomId))

  await tx
    .update(rooms)
    .set({
      phase: state.phase,
      turnIndex: state.turnIndex,
      turnOrder: state.turnOrder,
      winnerId: state.winnerId,
      hostPlayerId: state.hostPlayerId,
      updatedAt: new Date(),
    })
    .where(eq(rooms.id, roomId))

  if (state.players.length > 0) {
    // 既存プレイヤーが未登録の場合に備えて upsert(name は最新で上書き)
    for (const p of state.players) {
      await tx
        .insert(players)
        .values({ id: p.id, name: p.name })
        .onConflictDoUpdate({ target: players.id, set: { name: p.name } })
    }

    const roomPlayerRows: NewRoomPlayerRow[] = state.players.map((p, index) => ({
      roomId,
      playerId: p.id,
      brand: state.phase === "lobby" ? null : p.brand,
      cash: p.cash,
      fakesUsed: p.fakesUsed,
      passed: p.passed,
      online: p.online,
      isCpu: p.isCpu,
      seatIndex: index,
    }))
    await tx.insert(roomPlayers).values(roomPlayerRows)
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
      currentBidderId: state.currentAuction.currentBidderId,
      revealAckedIds: state.currentAuction.revealAckedIds,
    })
  }
}
