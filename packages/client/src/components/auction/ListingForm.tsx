import { useState } from "react"
import { socket } from "../../socket.js"
import { useStore } from "../../store.js"
import { BRANDS, BRAND_LABELS, type Brand } from "@bluff-auction/shared"

export function ListingForm() {
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
      <button type="button" onClick={submit} style={{ padding: 8 }}>
        出品
      </button>
    </div>
  )
}
