import { useState } from "react"
import { ScreenFrame } from "../../sketch/index.js"
import { RuleHeader } from "./RuleHeader.js"
import { RuleNav } from "./RuleNav.js"
import { RuleDots } from "./RuleDots.js"
import { RuleScreen1 } from "./RuleScreen1.js"
import { RuleScreen2 } from "./RuleScreen2.js"
import { RuleScreen3 } from "./RuleScreen3.js"
import { RuleScreen4 } from "./RuleScreen4.js"
import { RuleScreen5 } from "./RuleScreen5.js"
import { TOTAL_RULES } from "./constants.js"

type Props = {
  onClose: () => void
}

export function Rules({ onClose }: Props) {
  const [idx, setIdx] = useState(0)
  const next = () => {
    if (idx === TOTAL_RULES - 1) onClose()
    else setIdx(idx + 1)
  }
  const prev = () => setIdx((v) => Math.max(0, v - 1))

  return (
    <ScreenFrame>
      <RuleHeader idx={idx} onClose={onClose} />
      <div style={{ marginTop: 16 }}>
        {idx === 0 && <RuleScreen1 />}
        {idx === 1 && <RuleScreen2 />}
        {idx === 2 && <RuleScreen3 />}
        {idx === 3 && <RuleScreen4 />}
        {idx === 4 && <RuleScreen5 />}
      </div>
      <RuleNav idx={idx} onPrev={prev} onNext={next} />
      <RuleDots idx={idx} />
    </ScreenFrame>
  )
}
