import type {
  GameState,
  GameView,
  PlayerId,
  PublicAuctionView,
  PublicPlayerView,
  SelfPlayerView,
} from "@bluff-auction/shared";

function toPublicPlayer(p: GameState["players"][number]): PublicPlayerView {
  return {
    id: p.id,
    name: p.name,
    cash: p.cash,
    fakesUsed: p.fakesUsed,
    handCount: p.hand.length,
    passed: p.passed,
    online: p.online,
  };
}

function toSelfPlayer(p: GameState["players"][number]): SelfPlayerView {
  return {
    ...toPublicPlayer(p),
    brand: p.brand,
    hand: p.hand,
  };
}

function toPublicAuction(a: GameState["currentAuction"]): PublicAuctionView | null {
  if (!a) return null;
  return {
    sellerId: a.sellerId,
    declaredBrand: a.declaredBrand,
    startingBid: a.startingBid,
    currentBid: a.currentBid,
    highestBidderId: a.highestBidderId,
    passedPlayerIds: a.passedPlayerIds,
  };
}

export function buildView(state: GameState, forPlayerId: PlayerId | null): GameView {
  const self = state.players.find((p) => p.id === forPlayerId);
  return {
    phase: state.phase,
    turnIndex: state.turnIndex,
    turnOrder: state.turnOrder,
    winnerId: state.winnerId,
    self: self ? toSelfPlayer(self) : null,
    others: state.players.filter((p) => p.id !== forPlayerId).map(toPublicPlayer),
    currentAuction: toPublicAuction(state.currentAuction),
  };
}
