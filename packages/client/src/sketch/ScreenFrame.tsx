import type { CSSProperties, ReactNode } from "react"

type Props = {
  children: ReactNode
  style?: CSSProperties
}

// モバイル想定の縦長 paper 背景フレーム。各画面はこの中で配置する。
// 上下の余白(safe area 風)とパディングを統一。
export function ScreenFrame({ children, style }: Props) {
  return (
    <div
      className="paper"
      style={{
        position: "relative",
        minHeight: "100vh",
        maxWidth: 480,
        margin: "0 auto",
        padding: "32px 20px 80px",
        boxSizing: "border-box",
        ...style,
      }}
    >
      {children}
    </div>
  )
}
