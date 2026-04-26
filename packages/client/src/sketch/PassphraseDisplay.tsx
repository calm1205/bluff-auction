import { FONT_MONO, INK, PAPER_WARM } from "./tokens.js"
import { SBox } from "./SBox.js"

type Props = {
  value: string
  size?: "sm" | "lg"
  muted?: boolean
}

// 合言葉(passphrase)を等幅・大きめに表示。共有用のコピー対象。
// 設計プロトでは 32 文字 UUID を 8 文字 × 4 ブロックで表示する想定だったが、
// 本実装では 4 文字合言葉なのでそのまま 1 ブロックで表示する。
export function PassphraseDisplay({ value, size = "lg", muted = false }: Props) {
  const isLg = size === "lg"
  return (
    <SBox
      bg={PAPER_WARM}
      style={{
        display: "inline-block",
        padding: isLg ? "10px 18px" : "6px 12px",
        opacity: muted ? 0.5 : 1,
      }}
    >
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: isLg ? 32 : 14,
          fontWeight: 700,
          letterSpacing: isLg ? 8 : 2,
          color: INK,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
    </SBox>
  )
}
