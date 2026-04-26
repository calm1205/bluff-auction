import { INK, INK_SOFT, PAPER, SBtn } from "../../sketch/index.js"
import { TOTAL_RULES } from "./constants.js"

type Props = {
  idx: number
  onPrev: () => void
  onNext: () => void
}

export function RuleNav({ idx, onPrev, onNext }: Props) {
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
      <div style={{ width: 84 }}>
        {idx > 0 ? (
          <SBtn bg="transparent" color={INK_SOFT} size="md" onClick={onPrev}>
            ← 戻る
          </SBtn>
        ) : null}
      </div>
      <div style={{ flex: 1 }}>
        <SBtn bg={INK} color={PAPER} size="md" onClick={onNext}>
          {idx === TOTAL_RULES - 1 ? "はじめる →" : "次へ →"}
        </SBtn>
      </div>
    </div>
  )
}
