import type { Card } from "@bluff-auction/shared"
import { BRAND_LABEL_JP, CardFace } from "../../sketch/index.js"

type Props = {
  hand: Card[]
}

export function MyHandStrip({ hand }: Props) {
  if (hand.length === 0) return null
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        overflowX: "auto",
        padding: "8px 14px",
      }}
    >
      {hand.map((c) => (
        <div key={c.id} style={{ flexShrink: 0 }} aria-label={BRAND_LABEL_JP[c.brand]}>
          <CardFace brand={c.brand} w={48} h={68} />
        </div>
      ))}
    </div>
  )
}
