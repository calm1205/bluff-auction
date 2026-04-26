import { ACCENT_GREEN, FONT_BODY, FONT_SERIF, INK, INK_SOFT, PAPER } from "../sketch/index.js"

type Props = {
  name: string
}

// 右上に小さく名前のみ表示する控えめバッジ(プロト「ミドリ さん」相当)
export function UserBadge({ name }: Props) {
  if (!name) return null
  return (
    <div
      style={{
        position: "fixed",
        top: 18,
        right: 18,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: FONT_SERIF,
        fontSize: 12,
        color: INK_SOFT,
        zIndex: 50,
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: 999,
          background: ACCENT_GREEN,
          color: PAPER,
          fontFamily: FONT_BODY,
          fontWeight: 700,
          fontSize: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {name[0]}
      </div>
      <span>
        <span style={{ color: INK, fontWeight: 700 }}>{name}</span> さん
      </span>
    </div>
  )
}
