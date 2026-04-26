import { ACCENT_BLUE, FONT_BODY, FONT_SERIF, INK, INK_SOFT, PAPER } from "../sketch/index.js"

type Variant = "pill" | "corner" | "subtle"

type Props = {
  variant?: Variant
  onClick: () => void
}

// ルール参照リンク。pill = Home 画面下部、corner = ロビー画面右上
export function RulesLink({ variant = "subtle", onClick }: Props) {
  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          all: "unset",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 16px",
          border: `1.5px solid ${INK}`,
          borderRadius: 999,
          background: PAPER,
          fontFamily: FONT_SERIF,
          fontSize: 13,
          fontWeight: 700,
          color: INK,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M2 2 L2 12 L7 11 L12 12 L12 2 L7 3 Z"
            stroke={INK}
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M7 3 L7 11" stroke={INK} strokeWidth="1.4" />
        </svg>
        ルールを見る
      </button>
    )
  }
  if (variant === "corner") {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          all: "unset",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "4px 10px",
          border: `1px solid ${INK_SOFT}`,
          borderRadius: 999,
          fontFamily: FONT_BODY,
          fontSize: 11,
          fontWeight: 600,
          color: INK,
          background: PAPER,
        }}
      >
        <span style={{ fontFamily: FONT_SERIF, fontWeight: 800 }}>?</span>
        ルール
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        all: "unset",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontFamily: FONT_BODY,
        fontSize: 12,
        color: ACCENT_BLUE,
        fontWeight: 600,
        textDecoration: "underline",
        textUnderlineOffset: 3,
      }}
    >
      ルールを見る
    </button>
  )
}
