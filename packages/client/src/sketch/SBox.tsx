import type { CSSProperties, ReactNode } from "react"
import { INK } from "./tokens.js"

type Props = {
  children?: ReactNode
  bg?: string
  stroke?: string
  sw?: number
  radius?: number
  style?: CSSProperties
}

// 矩形ボックス(設計プロトの SBox 相当、filter は no-op だったので border のみ)
export function SBox({
  children,
  bg = "transparent",
  stroke = INK,
  sw = 2,
  radius = 6,
  style,
}: Props) {
  return (
    <div
      style={{
        background: bg,
        border: `${sw}px solid ${stroke}`,
        borderRadius: radius,
        boxSizing: "border-box",
        ...style,
      }}
    >
      {children}
    </div>
  )
}
