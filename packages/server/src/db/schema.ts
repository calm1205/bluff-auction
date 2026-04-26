import { boolean, integer, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core"

export const rooms = pgTable("rooms", {
  id: text("id").primaryKey(),
  phase: text("phase").notNull().default("lobby"),
  turnIndex: integer("turn_index").notNull().default(0),
  turnOrder: text("turn_order").array().notNull().default([]),
  winnerId: text("winner_id"),
  hostPlayerId: text("host_player_id"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

// プレイヤー身元マスター(ルーム所属とは独立)
export const players = pgTable("players", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

// ルーム所属 + ルーム単位のゲーム状態
export const roomPlayers = pgTable(
  "room_players",
  {
    roomId: text("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    playerId: text("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    brand: text("brand"),
    cash: integer("cash").notNull().default(0),
    fakesUsed: integer("fakes_used").notNull().default(0),
    passed: boolean("passed").notNull().default(false),
    online: boolean("online").notNull().default(true),
    seatIndex: integer("seat_index").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.roomId, table.playerId] }),
  }),
)

export const cards = pgTable("cards", {
  id: text("id").primaryKey(),
  roomId: text("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  brand: text("brand").notNull(),
  holderId: text("holder_id"),
  location: text("location").notNull(),
})

export const auctions = pgTable("auctions", {
  roomId: text("room_id")
    .primaryKey()
    .references(() => rooms.id, { onDelete: "cascade" }),
  sellerId: text("seller_id").notNull(),
  cardId: text("card_id")
    .notNull()
    .references(() => cards.id),
  declaredBrand: text("declared_brand").notNull(),
  startingBid: integer("starting_bid").notNull(),
  currentBid: integer("current_bid").notNull(),
  highestBidderId: text("highest_bidder_id"),
  passedPlayerIds: text("passed_player_ids").array().notNull().default([]),
})

export type RoomRow = typeof rooms.$inferSelect
export type NewRoomRow = typeof rooms.$inferInsert
export type PlayerRow = typeof players.$inferSelect
export type NewPlayerRow = typeof players.$inferInsert
export type RoomPlayerRow = typeof roomPlayers.$inferSelect
export type NewRoomPlayerRow = typeof roomPlayers.$inferInsert
export type CardRow = typeof cards.$inferSelect
export type NewCardRow = typeof cards.$inferInsert
export type AuctionRow = typeof auctions.$inferSelect
export type NewAuctionRow = typeof auctions.$inferInsert
