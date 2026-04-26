import { ACCENT_RED, INK } from "./tokens.js"

type Props = {
  size?: number
  color?: string
  accent?: string
  strike?: boolean
}

// Bluff Auction の木槌アイコン(プロト sketch-kit.jsx の Gavel を React 化、アニメーション無しの strike pose)
export function Gavel({ size = 104, color = INK, accent = ACCENT_RED, strike = true }: Props) {
  const WOOD_DARK = "#5c2f1a"
  const WOOD = "#7a3f22"
  const GOLD = "#e8a63a"
  const GOLD_HI = "#f5cf6a"
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 100"
      style={{ display: "block", overflow: "visible" }}
    >
      {/* impact burst lines */}
      {strike && (
        <g stroke={accent} strokeOpacity={0.45} strokeWidth={2.5} strokeLinecap="round" fill="none">
          <line x1="30" y1="60" x2="18" y2="54" />
          <line x1="26" y1="68" x2="10" y2="68" />
          <line x1="30" y1="78" x2="18" y2="86" />
          <line x1="36" y1="54" x2="32" y2="42" />
        </g>
      )}

      {/* drop shadow */}
      <ellipse cx="56" cy="94" rx="44" ry="3" fill={color} opacity="0.18" />

      {/* stepped round plinth */}
      <g>
        <rect x="18" y="84" width="76" height="10" fill={WOOD_DARK} rx="2" />
        <rect x="18" y="92" width="76" height="2" fill="#3e1e0f" rx="1" />
        <rect x="24" y="76" width="64" height="9" fill={WOOD} rx="2" />
        <rect x="26" y="82" width="60" height="1.5" fill={WOOD_DARK} opacity="0.7" />
        <rect x="30" y="68" width="52" height="9" fill={WOOD_DARK} rx="2" />
        <rect x="32" y="73" width="48" height="1.5" fill={WOOD} opacity="0.8" />
      </g>

      {/* gavel — T-shape, tilted -22° around (44, 68) */}
      <g transform="translate(17, -8)">
        <g transform="rotate(-22 44 68)">
          {/* head */}
          <rect x="26" y="58" width="36" height="10" fill={WOOD_DARK} rx="1.5" />
          <rect x="28" y="52" width="32" height="7" fill={WOOD} />
          <rect x="28" y="28" width="32" height="25" fill={GOLD} />
          <rect x="36" y="28" width="3" height="25" fill={GOLD_HI} />
          <rect x="41" y="28" width="1.5" height="25" fill={GOLD_HI} opacity="0.8" />
          <rect x="28" y="22" width="32" height="7" fill={WOOD} />
          <rect x="26" y="12" width="36" height="10" fill={WOOD_DARK} rx="1.5" />
          <rect x="28" y="14" width="32" height="1.5" fill={WOOD} opacity="0.6" />
          {/* handle */}
          <rect x="60" y="37" width="60" height="7" fill={WOOD} rx="3.5" />
          <rect x="60" y="42" width="60" height="1.5" fill={WOOD_DARK} opacity="0.6" />
          <rect x="64" y="38" width="52" height="1" fill={GOLD_HI} opacity="0.2" />
          {/* ball grip */}
          <circle cx="120" cy="40.5" r="5" fill={WOOD_DARK} />
          <circle cx="119" cy="39" r="1.2" fill={WOOD} opacity="0.7" />
        </g>
      </g>
    </svg>
  )
}
