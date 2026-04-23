import { useState } from "react"
import { socket } from "../socket.js"
import { useStore } from "../store.js"
import { BRANDS, BRAND_LABELS, type Brand } from "@bluff-auction/shared"

export function AuctionArea() {
  const view = useStore((s) => s.view)
  if (!view || !view.self) return null

  const currentSellerId = view.turnOrder[view.turnIndex]
  const amSeller = view.self.id === currentSellerId
  const inListing = view.phase === "listing"
  const inBidding = view.phase === "bidding"

  return (
    <section style={{ marginTop: 16, border: "2px solid #333", padding: 16 }}>
      <h3>競り場 (phase: {view.phase})</h3>

      {inListing && amSeller && <ListingForm />}
      {inListing && !amSeller && <div>他プレイヤーの出品待機中...</div>}

      {inBidding && view.currentAuction && (
        <>
          <AuctionStatus />
          {!amSeller && !view.currentAuction.passedPlayerIds.includes(view.self.id) && (
            <BiddingForm />
          )}
          {amSeller && <div>入札中、進行を待機...</div>}
        </>
      )}
    </section>
  )
}

function ListingForm() {
  const view = useStore((s) => s.view)!
  const self = view.self!
  const [cardId, setCardId] = useState(self.hand[0]?.id ?? "")
  const [declaredBrand, setDeclaredBrand] = useState<Brand>(self.brand)
  const [startingBid, setStartingBid] = useState(25)

  const fakeRemaining = 2 - self.fakesUsed
  const isFake = declaredBrand !== self.brand

  const submit = () => {
    if (isFake && fakeRemaining <= 0) {
      alert("フェイク回数の上限に到達")
      return
    }
    socket.emit("list-card", { cardId, declaredBrand, startingBid }, (res) => {
      if (!res.ok) alert(`出品失敗: ${res.message}`)
    })
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label>
        出品カード:
        <select value={cardId} onChange={(e) => setCardId(e.target.value)}>
          {self.hand.map((c) => (
            <option key={c.id} value={c.id}>
              {BRAND_LABELS[c.brand]} ({c.id})
            </option>
          ))}
        </select>
      </label>
      <label>
        宣言ブランド:
        <select value={declaredBrand} onChange={(e) => setDeclaredBrand(e.target.value as Brand)}>
          {BRANDS.map((b) => (
            <option key={b} value={b}>
              {BRAND_LABELS[b]}
              {b !== self.brand ? " (フェイク)" : ""}
            </option>
          ))}
        </select>
      </label>
      <label>
        初期落札額:
        <input
          type="number"
          min={0}
          max={self.cash}
          value={startingBid}
          onChange={(e) => setStartingBid(Number(e.target.value))}
        />
      </label>
      <div>フェイク残: {fakeRemaining}/2</div>
      <button onClick={submit} style={{ padding: 8 }}>
        出品
      </button>
    </div>
  )
}

function AuctionStatus() {
  const view = useStore((s) => s.view)!
  const a = view.currentAuction!
  const allPlayers = [...view.others, ...(view.self ? [view.self] : [])]
  const sellerName = allPlayers.find((p) => p.id === a.sellerId)?.name ?? "?"
  const leaderName = a.highestBidderId
    ? (allPlayers.find((p) => p.id === a.highestBidderId)?.name ?? "?")
    : "(なし)"

  return (
    <div style={{ marginBottom: 12 }}>
      <div>出品者: {sellerName}</div>
      <div>宣言: {BRAND_LABELS[a.declaredBrand]}</div>
      <div>開始額: ${a.startingBid}</div>
      <div>
        現在最高: ${a.currentBid}({leaderName})
      </div>
      <div>パス: {a.passedPlayerIds.length}人</div>
    </div>
  )
}

function BiddingForm() {
  const view = useStore((s) => s.view)!
  const self = view.self!
  const a = view.currentAuction!
  const minBid = a.highestBidderId === null ? a.startingBid : a.currentBid + 1
  const [amount, setAmount] = useState(minBid)

  const submitBid = () => {
    socket.emit("bid", { amount }, (res) => {
      if (!res.ok) alert(`入札失敗: ${res.message}`)
    })
  }
  const submitPass = () => {
    socket.emit("pass", (res) => {
      if (!res.ok) alert(`パス失敗: ${res.message}`)
    })
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input
        type="number"
        min={minBid}
        max={self.cash}
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
      />
      <button onClick={submitBid}>入札</button>
      <button onClick={submitPass}>パス</button>
    </div>
  )
}
