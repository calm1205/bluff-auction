import type { CSSProperties, ReactNode } from "react"
import { FONT_BODY, INK, PAPER_WARM } from "./tokens.js"

type Size = "sm" | "md" | "lg"

type Props = {
  children: ReactNode
  bg?: string
  color?: string
  size?: Size
  disabled?: boolean
  onClick?: () => void
  type?: "button" | "submit"
  style?: CSSProperties
}

const HEIGHTS: Record<Size, number> = { sm: 30, md: 42, lg: 56 }
const FONTS: Record<Size, number> = { sm: 15, md: 18, lg: 22 }

// 矩形ボタン(SBtn 相当)
export function SBtn({
  children,
  bg = PAPER_WARM,
  color = INK,
  size = "md",
  disabled = false,
  onClick,
  type = "button",
  style,
}: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        height: HEIGHTS[size],
        background: bg,
        color,
        fontFamily: FONT_BODY,
        fontSize: FONTS[size],
        fontWeight: 600,
        border: `2px solid ${INK}`,
        borderRadius: 8,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        padding: 0,
        ...style,
      }}
    >
      {children}
    </button>
  )
}
