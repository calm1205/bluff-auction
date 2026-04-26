import { FONT_MONO, INK, INK_SOFT, PAPER_WARM } from "./tokens.js"
import { SBox } from "./SBox.js"

type Props = {
  value: string // 32 文字 UUID(ハイフンなし hex)
  size?: "sm" | "lg"
  muted?: boolean
}

// ルーム ID(UUID 32 文字)を 8 文字 × 4 ブロックで等幅表示
export function RoomIdDisplay({ value, size = "lg", muted = false }: Props) {
  const isLg = size === "lg"
  const chunks = [value.slice(0, 8), value.slice(8, 16), value.slice(16, 24), value.slice(24, 32)]
  return (
    <SBox
      bg={PAPER_WARM}
      style={{
        display: "inline-block",
        padding: isLg ? "10px 14px" : "6px 10px",
        opacity: muted ? 0.5 : 1,
      }}
    >
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: isLg ? 13 : 10,
          fontWeight: 600,
          letterSpacing: isLg ? 1 : 0.5,
          color: INK,
          lineHeight: 1.4,
          wordBreak: "break-all",
        }}
      >
        {chunks.map((c, i) => (
          <span key={i} style={{ marginRight: isLg ? 6 : 3 }}>
            {c}
          </span>
        ))}
      </div>
    </SBox>
  )
}

// インライン表記用(先頭 8 文字 + 省略)
export function RoomIdShort({ value }: { value: string }) {
  return (
    <span style={{ fontFamily: FONT_MONO, fontWeight: 700, letterSpacing: 0.5 }}>
      {value.slice(0, 8)}
      <span style={{ color: INK_SOFT }}>…</span>
    </span>
  )
}
