import type { BRANDS } from "./constants.js";

export type Brand = (typeof BRANDS)[number];

// UUID として生成され localStorage に保存される永続識別子
export type UserId = string;

// PlayerId は UserId のエイリアス(ゲーム文脈での呼び名)
export type PlayerId = UserId;

export type Card = {
  id: string;
  brand: Brand;
};

export type Phase = "lobby" | "listing" | "bidding" | "transaction" | "ended";

export type Player = {
  id: PlayerId;
  name: string;
  brand: Brand;
  hand: Card[];
  cash: number;
  fakesUsed: number;
  passed: boolean;
  online: boolean;
};

export type Auction = {
  sellerId: PlayerId;
  card: Card;
  declaredBrand: Brand;
  startingBid: number;
  currentBid: number;
  highestBidderId: PlayerId | null;
  passedPlayerIds: PlayerId[];
};

export type GameState = {
  phase: Phase;
  turnIndex: number;
  players: Player[];
  currentAuction: Auction | null;
  winnerId: PlayerId | null;
  turnOrder: PlayerId[];
};

export type PublicPlayerView = {
  id: PlayerId;
  name: string;
  cash: number;
  fakesUsed: number;
  handCount: number;
  passed: boolean;
  online: boolean;
};

export type SelfPlayerView = PublicPlayerView & {
  brand: Brand;
  hand: Card[];
};

export type PublicAuctionView = {
  sellerId: PlayerId;
  declaredBrand: Brand;
  startingBid: number;
  currentBid: number;
  highestBidderId: PlayerId | null;
  passedPlayerIds: PlayerId[];
};

export type GameView = {
  phase: Phase;
  turnIndex: number;
  turnOrder: PlayerId[];
  winnerId: PlayerId | null;
  self: SelfPlayerView | null;
  others: PublicPlayerView[];
  currentAuction: PublicAuctionView | null;
};
