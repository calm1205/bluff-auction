import type { Brand } from "@bluff-auction/shared"
import { ACCENT_GOLD, CardFace, FONT_MONO, FONT_SERIF } from "../../sketch/index.js"

type Props = {
  declaredBrand: Brand
  startingBid: number
}

// V3 Theater: 中央に大きく出品カード(宣言ブランド)+ START バッジ
export function AuctionCardArt({ declaredBrand, startingBid }: Props) {
  return (
    <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
      <div style={{ transform: "rotate(-3deg)" }}>
        <CardFace brand={declaredBrand} w={130} h={180} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 10,
          fontFamily: FONT_SERIF,
          fontSize: 14,
          color: ACCENT_GOLD,
          transform: "rotate(6deg)",
          textAlign: "center",
          lineHeight: 1.1,
        }}
      >
        START
        <br />
        <span style={{ fontFamily: FONT_MONO, fontSize: 18 }}>${startingBid}</span>
      </div>
    </div>
  )
}
