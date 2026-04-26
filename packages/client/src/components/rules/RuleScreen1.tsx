import {
  ACCENT_BLUE,
  ACCENT_GOLD,
  ACCENT_GREEN,
  ACCENT_RED,
  FONT_BODY,
  FONT_SERIF,
  Gavel,
  INK,
  INK_SOFT,
  PAPER_WARM,
  SBox,
} from "../../sketch/index.js"
import { FactChip } from "./FactChip.js"

// R1 概要
export function RuleScreen1() {
  return (
    <>
      <div style={{ marginTop: 12, textAlign: "center" }}>
        <Gavel size={84} />
      </div>
      <div style={{ marginTop: 14, textAlign: "center" }}>
        <div
          style={{
            fontFamily: FONT_SERIF,
            fontSize: 14,
            color: INK_SOFT,
            fontStyle: "italic",
          }}
        >
          このゲームは
        </div>
        <div
          style={{
            fontFamily: FONT_SERIF,
            fontSize: 32,
            fontWeight: 800,
            lineHeight: 1.15,
            marginTop: 4,
          }}
        >
          嘘で売る、
          <br />
          <span style={{ color: ACCENT_RED }}>真贋の</span>競り
        </div>
        <div style={{ width: 160, height: 1.5, background: INK, margin: "10px auto 0" }} />
      </div>

      <SBox bg={PAPER_WARM} style={{ marginTop: 20, padding: "14px 16px" }}>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, lineHeight: 1.7, color: INK }}>
          あなたは商人。手元のカードを
          <br />
          <b style={{ color: ACCENT_RED }}>本物のフリ</b>をして売り、
          <br />
          他の商人の出品を
          <b style={{ color: ACCENT_BLUE }}>見抜いて競り落とす</b>。
        </div>
      </SBox>

      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <FactChip label="人数" value="4 人" color={ACCENT_BLUE} />
        <FactChip label="所要" value="約 20 分" color={ACCENT_GREEN} />
        <FactChip label="所持金" value="$100" color={ACCENT_GOLD} />
      </div>
    </>
  )
}
