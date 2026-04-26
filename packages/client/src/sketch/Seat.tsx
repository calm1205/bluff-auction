import {
  ACCENT_GREEN,
  ACCENT_RED,
  FONT_BODY,
  FONT_MONO,
  INK,
  INK_SOFT,
  PAPER,
  PAPER_WARM,
  SEAT_COLORS,
} from "./tokens.js"
import { SBox } from "./SBox.js"

export type SeatData = {
  index: number
  name: string | null
  isHost: boolean
  isYou: boolean
  online: boolean
}

type Props = {
  seat: SeatData
  ready: boolean // 4 人揃った状態(緑強調)
}

// ロビー画面の 1 席ぶんカード。空席 / 参加済み / ホスト / 自分 の状態を描画
export function Seat({ seat, ready }: Props) {
  const filled = seat.name !== null
  const color = SEAT_COLORS[seat.index % SEAT_COLORS.length]!
  return (
    <SBox
      bg={filled ? PAPER_WARM : "transparent"}
      sw={filled ? 2 : 1.5}
      stroke={ready ? ACCENT_GREEN : INK}
      style={{ height: 96 }}
    >
      <div
        style={{
          padding: 10,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxSizing: "border-box",
        }}
      >
        {filled ? (
          <>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  background: color,
                  color: PAPER,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: FONT_BODY,
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                {seat.name![0]}
              </div>
              {seat.isHost && (
                <div
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 9,
                    padding: "1px 5px",
                    background: INK,
                    color: PAPER,
                    borderRadius: 2,
                  }}
                >
                  HOST
                </div>
              )}
            </div>
            <div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: 600 }}>
                {seat.name}
                {seat.isYou && (
                  <span style={{ color: ACCENT_RED, fontSize: 11, marginLeft: 4 }}>(自分)</span>
                )}
              </div>
              <div
                style={{
                  fontFamily: FONT_BODY,
                  fontSize: 12,
                  color: seat.online ? ACCENT_GREEN : INK_SOFT,
                  marginTop: 2,
                  fontWeight: seat.online ? 600 : 400,
                }}
              >
                {seat.online ? "✓ 参加中" : "… オフライン"}
              </div>
            </div>
          </>
        ) : (
          <div
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: INK_SOFT,
              fontFamily: FONT_BODY,
              fontSize: 13,
              gap: 4,
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 999,
                border: `1.5px dashed ${INK_SOFT}`,
              }}
            />
            <div>空席</div>
          </div>
        )}
      </div>
    </SBox>
  )
}
