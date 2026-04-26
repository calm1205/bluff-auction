import type { Brand } from "@bluff-auction/shared"
import { ACCENT_BLUE, ACCENT_GOLD, ACCENT_GREEN, ACCENT_RED, INK } from "./tokens.js"

const BRAND_COLOR: Record<Brand, string> = {
  painting: ACCENT_RED,
  sculpture: ACCENT_GREEN,
  pottery: ACCENT_GOLD,
  jewelry: ACCENT_BLUE,
}

type Props = {
  brand: Brand
  size?: number
  filled?: boolean
  stroke?: string
}

// 4 ブランド(絵画/彫刻/陶器/宝飾)のグリフ。プロト sketch-kit.jsx の BrandGlyph を React 化
export function BrandGlyph({ brand, size = 26, filled = false, stroke = INK }: Props) {
  const fill = filled ? BRAND_COLOR[brand] : "transparent"
  const sw = 2
  const common = { width: size, height: size, viewBox: "0 0 32 32" }

  if (brand === "painting") {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="24" height="24" fill={fill} stroke={stroke} strokeWidth={sw} />
        <path
          d="M8 22 L14 12 L20 22"
          fill="none"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="22" cy="10" r="2" fill={stroke} />
      </svg>
    )
  }
  if (brand === "sculpture") {
    return (
      <svg {...common}>
        <ellipse cx="16" cy="11" rx="5" ry="6" fill={fill} stroke={stroke} strokeWidth={sw} />
        <path
          d="M10 17 Q16 22 22 17 L22 22 L10 22 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
        <rect x="6" y="23" width="20" height="5" fill="none" stroke={stroke} strokeWidth={sw} />
      </svg>
    )
  }
  if (brand === "pottery") {
    return (
      <svg {...common}>
        <path
          d="M11 6 L21 6 L20 10 Q26 14 24 22 Q22 28 16 28 Q10 28 8 22 Q6 14 12 10 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
        <path d="M11 17 Q16 19 21 17" fill="none" stroke={stroke} strokeWidth={1.4} />
      </svg>
    )
  }
  // jewelry
  return (
    <svg {...common}>
      <path
        d="M6 12 L16 4 L26 12 L16 28 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      <path
        d="M6 12 L26 12 M11 12 L16 4 M21 12 L16 4 M11 12 L16 28 M21 12 L16 28"
        stroke={stroke}
        strokeWidth={1}
        fill="none"
      />
    </svg>
  )
}

export const BRAND_LABEL_JP: Record<Brand, string> = {
  painting: "絵画",
  sculpture: "彫刻",
  pottery: "陶器",
  jewelry: "宝飾",
}
