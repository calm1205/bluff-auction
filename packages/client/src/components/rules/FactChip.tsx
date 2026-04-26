import { FONT_MONO, FONT_SERIF, INK_SOFT, SBox } from "../../sketch/index.js"

type Props = {
  label: string
  value: string
  color: string
}

export function FactChip({ label, value, color }: Props) {
  return (
    <div style={{ flex: 1 }}>
      <SBox
        bg="transparent"
        stroke={color}
        sw={1.5}
        style={{ padding: "8px 6px", textAlign: "center" }}
      >
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 9,
            letterSpacing: 1.5,
            color: INK_SOFT,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: FONT_SERIF,
            fontSize: 16,
            fontWeight: 800,
            color,
            marginTop: 2,
          }}
        >
          {value}
        </div>
      </SBox>
    </div>
  )
}
