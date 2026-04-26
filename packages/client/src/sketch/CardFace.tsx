import type { Brand } from "@bluff-auction/shared"
import { BRAND_LABEL_JP, BrandGlyph } from "./BrandGlyph.js"
import { FONT_SERIF, INK, PAPER_WARM } from "./tokens.js"

type Props = {
  brand: Brand
  w?: number
  h?: number
}

// 表向きカード(ブランドが分かる状態)
export function CardFace({ brand, w = 78, h = 108 }: Props) {
  return (
    <div style={{ position: "relative", width: w, height: h, flexShrink: 0 }}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width={w}
        height={h}
        style={{ position: "absolute", inset: 0 }}
      >
        <rect
          x="1.5"
          y="1.5"
          width={w - 3}
          height={h - 3}
          rx="4"
          fill={PAPER_WARM}
          stroke={INK}
          strokeWidth="2"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
        }}
      >
        <BrandGlyph brand={brand} size={w * 0.5} filled />
        <div
          style={{
            fontFamily: FONT_SERIF,
            fontSize: w * 0.22,
            color: INK,
            fontWeight: 700,
          }}
        >
          {BRAND_LABEL_JP[brand]}
        </div>
      </div>
    </div>
  )
}
