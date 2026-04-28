import type { PublicPlayerView } from "@bluff-auction/shared"
import {
  ACCENT_GOLD,
  ACCENT_RED,
  FONT_BODY,
  FONT_MONO,
  PAPER,
  SEAT_COLORS,
} from "../../sketch/index.js"

type Props = {
  others: PublicPlayerView[]
  currentSellerId: string | null
  currentBidderId?: string | null
}

// V3 Theater: 上部に他プレイヤーを横並び chip で表示。出品中 / 入札手番のプレイヤーは赤枠で強調
export function OpponentStrip({ others, currentSellerId, currentBidderId = null }: Props) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        justifyContent: "space-between",
        gap: 6,
      }}
    >
      {others.map((p, i) => {
        const isActive = p.id === currentSellerId || p.id === currentBidderId
        const color = SEAT_COLORS[i % SEAT_COLORS.length]!
        return (
          <div
            key={p.id}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 6px",
              border: `1.5px solid ${isActive ? ACCENT_RED : "rgba(246,238,219,0.25)"}`,
              borderRadius: 999,
              opacity: p.online ? 1 : 0.45,
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 999,
                background: color,
                color: PAPER,
                fontFamily: FONT_BODY,
                fontSize: 11,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {p.name[0]}
            </div>
            <div style={{ flex: 1, fontFamily: FONT_BODY, fontSize: 11, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 600,
                  color: PAPER,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {p.name}
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: ACCENT_GOLD }}>
                ${p.cash} · {p.handCount}枚
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
