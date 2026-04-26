import { INK } from "../../sketch/index.js"
import { TOTAL_RULES } from "./constants.js"

type Props = {
  idx: number
}

export function RuleDots({ idx }: Props) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: 6,
        marginTop: 16,
      }}
    >
      {Array.from({ length: TOTAL_RULES }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === idx ? 22 : 6,
            height: 6,
            borderRadius: 3,
            background: i === idx ? INK : "rgba(26,23,21,0.25)",
            transition: "width 0.2s",
          }}
        />
      ))}
    </div>
  )
}
