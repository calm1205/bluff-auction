import {
  BRANDS,
  CARDS_PER_BRAND,
  INITIAL_CASH,
  MAX_FAKES_PER_PLAYER,
  NUM_PLAYERS,
  buildInitialDeck,
  distributeUnsoldPenalty,
  hasFullSet,
  nextTurnIndex,
  type Brand,
  type GameState,
  type Player,
  type PlayerId,
} from "@bluff-auction/shared";

export type EngineEvent =
  | { type: "view-update" }
  | { type: "auction-revealed"; to: PlayerId; brand: Brand }
  | {
      type: "unsold-penalty";
      sellerId: PlayerId;
      amount: number;
      recipientIds: PlayerId[];
    }
  | { type: "game-ended"; winnerId: PlayerId };

export type EngineResult =
  | { ok: true; events: EngineEvent[] }
  | { ok: false; code: string; message: string };

function ok(events: EngineEvent[] = []): EngineResult {
  return { ok: true, events };
}

function err(code: string, message: string): EngineResult {
  return { ok: false, code, message };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}

export function createInitialState(): GameState {
  return {
    phase: "lobby",
    turnIndex: 0,
    players: [],
    currentAuction: null,
    winnerId: null,
    turnOrder: [],
  };
}

export function addPlayer(state: GameState, id: PlayerId, name: string): EngineResult {
  const existing = state.players.find((p) => p.id === id);

  // 既存プレイヤーの再接続
  if (existing) {
    existing.online = true;
    // 名前は最新のものに更新(任意)
    if (name.trim()) existing.name = name;
    return ok([{ type: "view-update" }]);
  }

  // 新規参加はロビー時のみ
  if (state.phase !== "lobby") return err("not-lobby", "ゲーム進行中は新規参加不可");
  if (state.players.length >= NUM_PLAYERS) return err("full", "定員到達");

  state.players.push({
    id,
    name,
    brand: BRANDS[0]!,
    hand: [],
    collection: [],
    cash: 0,
    fakesUsed: 0,
    passed: false,
    online: true,
  });
  return ok([{ type: "view-update" }]);
}

export function markOffline(state: GameState, id: PlayerId): EngineResult {
  const player = state.players.find((p) => p.id === id);
  if (!player) return ok([]);

  // ロビー中は即離脱(他の人が参加できるように)
  if (state.phase === "lobby") {
    state.players = state.players.filter((p) => p.id !== id);
    return ok([{ type: "view-update" }]);
  }

  // ゲーム中はオフライン扱いで席を保持
  player.online = false;
  return ok([{ type: "view-update" }]);
}

export function removePlayer(state: GameState, id: PlayerId): EngineResult {
  if (state.phase !== "lobby") return err("not-lobby", "ゲーム進行中は離脱不可");
  state.players = state.players.filter((p) => p.id !== id);
  return ok([{ type: "view-update" }]);
}

export function startGame(state: GameState): EngineResult {
  if (state.phase !== "lobby") return err("not-lobby", "ロビー以外で開始不可");
  if (state.players.length !== NUM_PLAYERS) return err("not-ready", "4人揃っていない");

  const shuffledBrands = shuffle([...BRANDS]);
  const decks = buildInitialDeck(shuffledBrands, CARDS_PER_BRAND);

  state.players = state.players.map((p, i) => ({
    ...p,
    brand: shuffledBrands[i]!,
    hand: decks[i]!,
    collection: [],
    cash: INITIAL_CASH,
    fakesUsed: 0,
    passed: false,
    online: p.online,
  }));

  state.turnOrder = shuffle(state.players.map((p) => p.id));
  state.turnIndex = 0;
  state.phase = "listing";
  state.currentAuction = null;
  state.winnerId = null;

  return ok([{ type: "view-update" }]);
}

function currentSellerId(state: GameState): PlayerId {
  return state.turnOrder[state.turnIndex]!;
}

function getPlayer(state: GameState, id: PlayerId): Player | undefined {
  return state.players.find((p) => p.id === id);
}

export function listCard(
  state: GameState,
  senderId: PlayerId,
  cardId: string,
  declaredBrand: Brand,
  startingBid: number,
): EngineResult {
  if (state.phase !== "listing") return err("wrong-phase", "出品フェーズではない");
  if (currentSellerId(state) !== senderId) return err("not-your-turn", "出品権がない");
  if (!BRANDS.includes(declaredBrand)) return err("bad-brand", "不明なブランド");

  const seller = getPlayer(state, senderId);
  if (!seller) return err("no-player", "プレイヤー不在");
  if (startingBid < 0 || startingBid > seller.cash) return err("bad-bid", "初期落札額が不正");

  const cardIndex = seller.hand.findIndex((c) => c.id === cardId);
  if (cardIndex < 0) return err("no-card", "手札にない");
  const card = seller.hand[cardIndex]!;

  const isFake = declaredBrand !== seller.brand;
  if (isFake && seller.fakesUsed >= MAX_FAKES_PER_PLAYER)
    return err("fake-limit", "フェイク回数上限");

  seller.hand.splice(cardIndex, 1);
  state.players.forEach((p) => {
    p.passed = false;
  });
  state.currentAuction = {
    sellerId: senderId,
    card,
    declaredBrand,
    startingBid,
    currentBid: startingBid,
    highestBidderId: null,
    passedPlayerIds: [],
  };
  state.phase = "bidding";
  return ok([{ type: "view-update" }]);
}

export function bid(state: GameState, senderId: PlayerId, amount: number): EngineResult {
  if (state.phase !== "bidding") return err("wrong-phase", "入札フェーズではない");
  const auction = state.currentAuction;
  if (!auction) return err("no-auction", "競り情報なし");
  if (auction.sellerId === senderId) return err("seller-cant-bid", "出品者は入札不可");
  if (auction.passedPlayerIds.includes(senderId)) return err("already-passed", "パス済み");
  const bidder = getPlayer(state, senderId);
  if (!bidder) return err("no-player", "プレイヤー不在");

  const minAmount = auction.highestBidderId === null ? auction.startingBid : auction.currentBid + 1;
  if (amount < minAmount) return err("too-low", "最低落札額未満");
  if (amount > bidder.cash) return err("no-cash", "所持金不足");

  auction.currentBid = amount;
  auction.highestBidderId = senderId;
  return ok([{ type: "view-update" }]);
}

export function pass(state: GameState, senderId: PlayerId): EngineResult {
  if (state.phase !== "bidding") return err("wrong-phase", "入札フェーズではない");
  const auction = state.currentAuction;
  if (!auction) return err("no-auction", "競り情報なし");
  if (auction.sellerId === senderId) return err("seller-cant-pass", "出品者はパス不可");
  if (auction.passedPlayerIds.includes(senderId)) return err("already-passed", "パス済み");

  auction.passedPlayerIds.push(senderId);

  const nonSellerIds = state.players.map((p) => p.id).filter((id) => id !== auction.sellerId);
  const remainingBidders = nonSellerIds.filter((id) => !auction.passedPlayerIds.includes(id));

  const shouldEnd =
    remainingBidders.length === 0 ||
    (auction.highestBidderId !== null && remainingBidders.length === 0);

  if (!shouldEnd) return ok([{ type: "view-update" }]);

  return settleAuction(state);
}

function settleAuction(state: GameState): EngineResult {
  const auction = state.currentAuction!;
  const events: EngineEvent[] = [];

  const seller = getPlayer(state, auction.sellerId)!;

  if (auction.highestBidderId === null) {
    // unsold
    const recipients = state.players.filter((p) => p.id !== seller.id);
    const { share } = distributeUnsoldPenalty(auction.startingBid, recipients.length);
    const totalPaid = share * recipients.length;
    seller.cash -= totalPaid;
    for (const r of recipients) r.cash += share;

    // card returns to seller hand (fake count not consumed)
    seller.hand.push(auction.card);

    events.push({
      type: "unsold-penalty",
      sellerId: seller.id,
      amount: totalPaid,
      recipientIds: recipients.map((r) => r.id),
    });
  } else {
    const winner = getPlayer(state, auction.highestBidderId)!;
    winner.cash -= auction.currentBid;
    seller.cash += auction.currentBid;
    winner.collection.push(auction.card);

    // fake consumption
    if (auction.declaredBrand !== seller.brand) {
      seller.fakesUsed += 1;
    }

    events.push({
      type: "auction-revealed",
      to: winner.id,
      brand: auction.card.brand,
    });

    // victory check
    if (hasFullSet(winner)) {
      state.winnerId = winner.id;
      state.phase = "ended";
      state.currentAuction = null;
      events.push({ type: "view-update" });
      events.push({ type: "game-ended", winnerId: winner.id });
      return ok(events);
    }
  }

  state.currentAuction = null;
  state.turnIndex = nextTurnIndex(state.turnIndex, state.turnOrder.length);
  state.phase = "listing";
  events.push({ type: "view-update" });
  return ok(events);
}
