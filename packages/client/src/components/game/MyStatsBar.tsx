import type { SelfPlayerView } from "@bluff-auction/shared"
import { ACCENT_GOLD, ACCENT_RED, FONT_BODY, FONT_MONO, PAPER } from "../../sketch/index.js"

type Props = {
  self: SelfPlayerView
}

const MAX_FAKES = 2

// V3 Theater: 下部の自分情報行(所持金 / フェイク残 / 手札枚数)
export function MyStatsBar({ self }: Props) {
  const fakeRemain = MAX_FAKES - self.fakesUsed
  const fakeDots = Array.from({ length: MAX_FAKES }, (_, i) => i < fakeRemain)

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontFamily: FONT_BODY,
        fontSize: 12,
        color: PAPER,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontWeight: 600 }}>{self.name}</span>
        <span style={{ color: "rgba(246,238,219,0.4)" }}>·</span>
        <span style={{ fontFamily: FONT_MONO, color: ACCENT_GOLD, fontWeight: 700 }}>
          ${self.cash}
        </span>
        <span style={{ color: "rgba(246,238,219,0.4)" }}>·</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
          フェイク
          {fakeDots.map((on, i) => (
            <span
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: on ? ACCENT_RED : "rgba(246,238,219,0.25)",
                display: "inline-block",
              }}
            />
          ))}
        </span>
      </div>
      <div style={{ fontSize: 11, color: "rgba(246,238,219,0.6)" }}>手札 {self.hand.length}枚</div>
    </div>
  )
}
