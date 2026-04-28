import { INK } from "./tokens.js"

type Props = {
  size?: number
  color?: string
  strokeWidth?: number
}

export function BookIcon({ size = 14, color = INK, strokeWidth = 1.4 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path
        d="M2 2 L2 12 L7 11 L12 12 L12 2 L7 3 Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <path d="M7 3 L7 11" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  )
}
