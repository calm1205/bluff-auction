import { useStore } from "../store.js"
import { BRAND_LABELS } from "@bluff-auction/shared"
import { OpponentList } from "./OpponentList.js"
import { AuctionArea } from "./AuctionArea.js"

export function GameBoard() {
  const view = useStore((s) => s.view)
  const lastRevealed = useStore((s) => s.lastRevealed)

  if (!view || !view.self) return <div>読み込み中...</div>

  return (
    <div style={{ padding: 24 }}>
      <h1>Bluff Auction</h1>

      <OpponentList />

      <AuctionArea />

      <section style={{ marginTop: 24, border: "1px solid #ccc", padding: 16 }}>
        <h3>
          自分: {view.self.name} (ブランド: {BRAND_LABELS[view.self.brand]})
        </h3>
        <div>
          所持金: ${view.self.cash} / フェイク使用: {view.self.fakesUsed}/2
        </div>
        <div>
          <strong>手札:</strong>
          <ul>
            {view.self.hand.map((c) => (
              <li key={c.id}>
                {BRAND_LABELS[c.brand]} ({c.id})
              </li>
            ))}
          </ul>
        </div>
      </section>

      {lastRevealed && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: "#fffae0",
            border: "1px solid #d4c500",
          }}
        >
          最新落札カードの実種別: <strong>{BRAND_LABELS[lastRevealed.brand]}</strong>
        </div>
      )}
    </div>
  )
}
