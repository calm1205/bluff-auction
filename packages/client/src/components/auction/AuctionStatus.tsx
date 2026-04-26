import { useStore } from "../../store.js"
import { BRAND_LABELS } from "@bluff-auction/shared"

export function AuctionStatus() {
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
