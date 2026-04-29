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
} from "@bluff-auction/shared"

export type EngineEvent =
  | { type: "view-update" }
  | { type: "auction-revealed"; to: PlayerId; brand: Brand }
  | {
      type: "unsold-penalty"
      sellerId: PlayerId
      amount: number
      recipientIds: PlayerId[]
    }
  | { type: "game-ended"; winnerId: PlayerId }

export type EngineResult =
  | { ok: true; events: EngineEvent[] }
  | { ok: false; code: string; message: string }

function ok(events: EngineEvent[] = []): EngineResult {
  return { ok: true, events }
}

function err(code: string, message: string): EngineResult {
  return { ok: false, code, message }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = a[i]!
    a[i] = a[j]!
    a[j] = tmp
  }
  return a
}

export function createInitialState(): GameState {
  return {
    phase: "lobby",
    turnIndex: 0,
    players: [],
    currentAuction: null,
    winnerId: null,
    turnOrder: [],
    hostPlayerId: null,
  }
}

export function addPlayer(state: GameState, id: PlayerId, name: string): EngineResult {
  const existing = state.players.find((p) => p.id === id)

  // 既存プレイヤーの再接続
  if (existing) {
    existing.online = true
    // 名前は最新のものに更新(任意)
    if (name.trim()) existing.name = name
    return ok([{ type: "view-update" }])
  }

  // 新規参加はロビー時のみ
  if (state.phase !== "lobby") return err("not-lobby", "ゲーム進行中は新規参加不可")
  if (state.players.length >= NUM_PLAYERS) return err("full", "定員到達")

  state.players.push({
    id,
    name,
    brand: BRANDS[0]!,
    hand: [],
    cash: 0,
    fakesUsed: 0,
    passed: false,
    online: true,
    isCpu: false,
  })

  // 初参加者をホストに確定(以降不変)
  if (state.hostPlayerId === null) {
    state.hostPlayerId = id
  }

  return ok([{ type: "view-update" }])
}

// CPU プレイヤーを 1 体追加。playerId は呼び出し側で UUID を生成して渡す
export function addCpuPlayer(state: GameState, id: PlayerId, name: string): EngineResult {
  if (state.phase !== "lobby") return err("not-lobby", "ゲーム進行中は CPU 追加不可")
  if (state.players.length >= NUM_PLAYERS) return err("full", "定員到達")
  if (state.players.some((p) => p.id === id)) return err("duplicate", "ID 重複")

  state.players.push({
    id,
    name,
    brand: BRANDS[0]!,
    hand: [],
    cash: 0,
    fakesUsed: 0,
    passed: false,
    online: true,
    isCpu: true,
  })
  return ok([{ type: "view-update" }])
}

export function markOffline(state: GameState, id: PlayerId): EngineResult {
  const player = state.players.find((p) => p.id === id)
  if (!player) return ok([])
  // CPU はクライアント接続を持たないため切断対象外
  if (player.isCpu) return ok([])

  // ロビー中は即離脱(他の人が参加できるように)
  if (state.phase === "lobby") {
    state.players = state.players.filter((p) => p.id !== id)
    return ok([{ type: "view-update" }])
  }

  // ゲーム中はオフライン扱いで席を保持
  player.online = false
  return ok([{ type: "view-update" }])
}

export function removePlayer(state: GameState, id: PlayerId): EngineResult {
  if (state.phase !== "lobby") return err("not-lobby", "ゲーム進行中は離脱不可")
  state.players = state.players.filter((p) => p.id !== id)
  return ok([{ type: "view-update" }])
}

export function startGame(state: GameState, requesterId: PlayerId): EngineResult {
  if (state.phase !== "lobby") return err("not-lobby", "ロビー以外で開始不可")
  if (state.hostPlayerId !== requesterId) return err("not-host", "ホストのみ開始可能")
  if (state.players.length !== NUM_PLAYERS) return err("not-ready", "4人揃っていない")

  const shuffledBrands = shuffle([...BRANDS])
  const decks = buildInitialDeck(shuffledBrands, CARDS_PER_BRAND)

  state.players = state.players.map((p, i) => ({
    ...p,
    brand: shuffledBrands[i]!,
    // cards.id は UUID(buildInitialDeck で生成)、グローバル一意のためルーム間衝突なし
    hand: decks[i]!,
    cash: INITIAL_CASH,
    fakesUsed: 0,
    passed: false,
    online: p.online,
  }))

  state.turnOrder = shuffle(state.players.map((p) => p.id))
  state.turnIndex = 0
  state.phase = "listing"
  state.currentAuction = null
  state.winnerId = null

  return ok([{ type: "view-update" }])
}

function currentSellerId(state: GameState): PlayerId {
  return state.turnOrder[state.turnIndex]!
}

function getPlayer(state: GameState, id: PlayerId): Player | undefined {
  return state.players.find((p) => p.id === id)
}

export function listCard(
  state: GameState,
  senderId: PlayerId,
  cardId: string,
  declaredBrand: Brand,
  startingBid: number,
): EngineResult {
  if (state.phase !== "listing") return err("wrong-phase", "出品フェーズではない")
  if (currentSellerId(state) !== senderId) return err("not-your-turn", "出品権がない")
  if (!BRANDS.includes(declaredBrand)) return err("bad-brand", "不明なブランド")

  const seller = getPlayer(state, senderId)
  if (!seller) return err("no-player", "プレイヤー不在")
  if (startingBid < 0 || startingBid > seller.cash) return err("bad-bid", "初期落札額が不正")

  const cardIndex = seller.hand.findIndex((c) => c.id === cardId)
  if (cardIndex < 0) return err("no-card", "手札にない")
  const card = seller.hand[cardIndex]!

  const isFake = declaredBrand !== seller.brand
  if (isFake && seller.fakesUsed >= MAX_FAKES_PER_PLAYER)
    return err("fake-limit", "フェイク回数上限")

  seller.hand.splice(cardIndex, 1)
  state.players.forEach((p) => {
    p.passed = false
  })
  state.currentAuction = {
    sellerId: senderId,
    card,
    declaredBrand,
    startingBid,
    currentBid: startingBid,
    highestBidderId: null,
    passedPlayerIds: [],
    currentBidderId: firstBidderId(state, senderId),
    revealAckedIds: [],
  }
  state.phase = "bidding"
  return ok([{ type: "view-update" }])
}

// 出品直後の最初の入札ターンを seller の次のプレイヤーに設定
function firstBidderId(state: GameState, sellerId: PlayerId): PlayerId | null {
  const total = state.turnOrder.length
  if (total === 0) return null
  const sellerIdx = state.turnOrder.indexOf(sellerId)
  if (sellerIdx < 0) return null
  for (let i = 1; i <= total; i++) {
    const cand = state.turnOrder[(sellerIdx + i) % total]
    if (cand && cand !== sellerId) return cand
  }
  return null
}

// 現在の bidder の次にアクション可能なプレイヤー (seller以外で未passed) を返す
function nextBidderId(state: GameState): PlayerId | null {
  const auction = state.currentAuction
  if (!auction) return null
  const total = state.turnOrder.length
  if (total === 0) return null
  const startIdx =
    auction.currentBidderId !== null
      ? state.turnOrder.indexOf(auction.currentBidderId)
      : state.turnOrder.indexOf(auction.sellerId)
  if (startIdx < 0) return null
  for (let i = 1; i <= total; i++) {
    const cand = state.turnOrder[(startIdx + i) % total]
    if (!cand) continue
    if (cand === auction.sellerId) continue
    if (auction.passedPlayerIds.includes(cand)) continue
    return cand
  }
  return null
}

export function bid(state: GameState, senderId: PlayerId, amount: number): EngineResult {
  if (state.phase !== "bidding") return err("wrong-phase", "入札フェーズではない")
  const auction = state.currentAuction
  if (!auction) return err("no-auction", "競り情報なし")
  if (auction.sellerId === senderId) return err("seller-cant-bid", "出品者は入札不可")
  if (auction.passedPlayerIds.includes(senderId)) return err("already-passed", "パス済み")
  if (auction.currentBidderId !== senderId) return err("not-your-turn", "入札の手番ではない")
  const bidder = getPlayer(state, senderId)
  if (!bidder) return err("no-player", "プレイヤー不在")

  const minAmount = auction.highestBidderId === null ? auction.startingBid : auction.currentBid + 1
  if (amount < minAmount) return err("too-low", "最低落札額未満")
  if (amount > bidder.cash) return err("no-cash", "所持金不足")

  auction.currentBid = amount
  auction.highestBidderId = senderId

  return advanceBidder(state)
}

export function pass(state: GameState, senderId: PlayerId): EngineResult {
  if (state.phase !== "bidding") return err("wrong-phase", "入札フェーズではない")
  const auction = state.currentAuction
  if (!auction) return err("no-auction", "競り情報なし")
  if (auction.sellerId === senderId) return err("seller-cant-pass", "出品者はパス不可")
  if (auction.passedPlayerIds.includes(senderId)) return err("already-passed", "パス済み")
  if (auction.currentBidderId !== senderId) return err("not-your-turn", "入札の手番ではない")

  auction.passedPlayerIds.push(senderId)

  return advanceBidder(state)
}

// bid/pass 後の手番進行 + settle 判定
function advanceBidder(state: GameState): EngineResult {
  const auction = state.currentAuction!
  const nonSellerIds = state.turnOrder.filter((id) => id !== auction.sellerId)
  const remainingBidders = nonSellerIds.filter((id) => !auction.passedPlayerIds.includes(id))

  // 入札可能者ゼロ = 全員 pass で終了
  if (remainingBidders.length === 0) return settleAuction(state)
  // 残りが最高入札者 1 人 = 競り落とし確定
  if (
    remainingBidders.length === 1 &&
    auction.highestBidderId !== null &&
    remainingBidders[0] === auction.highestBidderId
  ) {
    return settleAuction(state)
  }

  const next = nextBidderId(state)
  if (!next) return settleAuction(state)
  auction.currentBidderId = next
  return ok([{ type: "view-update" }])
}

function settleAuction(state: GameState): EngineResult {
  const auction = state.currentAuction!
  const events: EngineEvent[] = []

  const seller = getPlayer(state, auction.sellerId)!

  if (auction.highestBidderId === null) {
    // unsold: reveal は不要、即 listing へ
    const recipients = state.players.filter((p) => p.id !== seller.id)
    const { share } = distributeUnsoldPenalty(auction.startingBid, recipients.length)
    const totalPaid = share * recipients.length
    seller.cash -= totalPaid
    for (const r of recipients) r.cash += share

    // card returns to seller hand (fake count not consumed)
    seller.hand.push(auction.card)

    events.push({
      type: "unsold-penalty",
      sellerId: seller.id,
      amount: totalPaid,
      recipientIds: recipients.map((r) => r.id),
    })

    state.currentAuction = null
    state.turnIndex = nextTurnIndex(state.turnIndex, state.turnOrder.length)
    state.phase = "listing"
    events.push({ type: "view-update" })
    return ok(events)
  }

  // sold: 落札処理 → reveal フェーズで停止し、全員 ack を待つ
  const winner = getPlayer(state, auction.highestBidderId)!
  winner.cash -= auction.currentBid
  seller.cash += auction.currentBid
  winner.hand.push(auction.card)

  // fake consumption
  if (auction.declaredBrand !== seller.brand) {
    seller.fakesUsed += 1
  }

  // 勝利成立 (4 ブランド揃え) の場合は reveal を挟まず即終了
  if (hasFullSet(winner)) {
    state.winnerId = winner.id
    state.phase = "ended"
    state.currentAuction = null
    events.push({ type: "view-update" })
    events.push({ type: "game-ended", winnerId: winner.id })
    return ok(events)
  }

  // reveal フェーズへ。bidding 用の手番情報はクリアし、ack 集計を初期化
  auction.currentBidderId = null
  auction.revealAckedIds = []
  state.phase = "transaction"
  events.push({ type: "view-update" })
  return ok(events)
}

// reveal 確認 ack。全員揃ったら listing に進む
export function ackReveal(state: GameState, senderId: PlayerId): EngineResult {
  if (state.phase !== "transaction") return err("wrong-phase", "reveal フェーズではない")
  const auction = state.currentAuction
  if (!auction) return err("no-auction", "競り情報なし")
  if (!state.players.some((p) => p.id === senderId)) return err("no-player", "プレイヤー不在")
  if (auction.revealAckedIds.includes(senderId)) return err("already-acked", "確認済み")

  auction.revealAckedIds.push(senderId)

  const allAcked = state.players.every((p) => auction.revealAckedIds.includes(p.id))
  if (!allAcked) return ok([{ type: "view-update" }])

  // 全員 ack 揃った → listing に進行
  state.currentAuction = null
  state.turnIndex = nextTurnIndex(state.turnIndex, state.turnOrder.length)
  state.phase = "listing"
  return ok([{ type: "view-update" }])
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

// 現在のターン担当の CPU が存在すれば、その CPU の playerId を返す
export function findActiveCpu(state: GameState): Player | null {
  if (state.turnOrder.length === 0) return null
  if (state.phase === "listing") {
    const sellerId = state.turnOrder[state.turnIndex]
    if (!sellerId) return null
    const seller = getPlayer(state, sellerId)
    return seller && seller.isCpu ? seller : null
  }
  if (state.phase === "bidding") {
    // 現在の手番が CPU の場合のみ自動進行対象
    const auction = state.currentAuction
    if (!auction) return null
    if (!auction.currentBidderId) return null
    const bidder = getPlayer(state, auction.currentBidderId)
    return bidder && bidder.isCpu ? bidder : null
  }
  if (state.phase === "transaction") {
    // reveal フェーズ: まだ ack していない CPU を順に処理
    const auction = state.currentAuction
    if (!auction) return null
    for (const p of state.players) {
      if (!p.isCpu) continue
      if (auction.revealAckedIds.includes(p.id)) continue
      return p
    }
    return null
  }
  return null
}

// CPU が現在のフェーズに対して取るべき 1 アクションを実行する。
// state を直接更新し、発生した EngineEvent を返す。
// 呼び出し側はループで findActiveCpu と組み合わせて使う想定。
export function cpuActOnce(state: GameState): EngineResult {
  const cpu = findActiveCpu(state)
  if (!cpu) return ok([])

  if (state.phase === "listing") {
    if (cpu.hand.length === 0) return err("cpu-no-hand", "CPU 手札が空")
    const card = pickRandom(cpu.hand)
    const fakeRemaining = MAX_FAKES_PER_PLAYER - cpu.fakesUsed
    const allowedBrands = fakeRemaining > 0 ? BRANDS : ([cpu.brand] as readonly Brand[])
    const declaredBrand = pickRandom(allowedBrands)
    // 開始額: 0..min(10, cash) の小さめのランダム値
    const cap = Math.min(10, cpu.cash)
    const startingBid = cap > 0 ? Math.floor(Math.random() * (cap + 1)) : 0
    return listCard(state, cpu.id, card.id, declaredBrand, startingBid)
  }

  if (state.phase === "bidding") {
    const auction = state.currentAuction!
    const minAmount =
      auction.highestBidderId === null ? auction.startingBid : auction.currentBid + 1
    // 所持金不足は必ず pass
    if (minAmount > cpu.cash) return pass(state, cpu.id)
    // 60% で最低額に上乗せ、40% で pass
    const willBid = Math.random() < 0.6
    if (!willBid) return pass(state, cpu.id)
    return bid(state, cpu.id, minAmount)
  }

  if (state.phase === "transaction") {
    return ackReveal(state, cpu.id)
  }

  return ok([])
}
