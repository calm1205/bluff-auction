import { useStore } from "../store.js"
import { ListingForm } from "./auction/ListingForm.js"
import { AuctionStatus } from "./auction/AuctionStatus.js"
import { BiddingForm } from "./auction/BiddingForm.js"

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
