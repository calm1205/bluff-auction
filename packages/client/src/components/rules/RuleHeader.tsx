import { FONT_BODY, FONT_MONO, FONT_SERIF, INK, INK_SOFT } from "../../sketch/index.js"
import { TOTAL_RULES } from "./constants.js"

type Props = {
  idx: number
  onClose: () => void
}

export function RuleHeader({ idx, onClose }: Props) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ fontFamily: FONT_SERIF, fontSize: 18, fontWeight: 800 }}>ルール</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 11,
            letterSpacing: 2,
            color: INK_SOFT,
          }}
        >
          {String(idx + 1).padStart(2, "0")} / {String(TOTAL_RULES).padStart(2, "0")}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="閉じる"
          style={{
            all: "unset",
            cursor: "pointer",
            width: 26,
            height: 26,
            border: `1.5px solid ${INK}`,
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT_BODY,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          ×
        </button>
      </div>
    </div>
  )
}
