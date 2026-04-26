import {
  ACCENT_GREEN,
  ACCENT_RED,
  CardFace,
  FONT_BODY,
  FONT_SERIF,
  INK,
  INK_SOFT,
  PAPER,
  SBox,
} from "../../sketch/index.js"

// R4 ハッタリ
export function RuleScreen4() {
  return (
    <>
      <div style={{ marginTop: 6 }}>
        <div
          style={{
            fontFamily: FONT_SERIF,
            fontSize: 28,
            fontWeight: 800,
            lineHeight: 1.15,
          }}
        >
          出品は <span style={{ color: ACCENT_RED }}>フェイクでもいい</span>
        </div>
        <div
          style={{
            fontFamily: FONT_BODY,
            fontSize: 12,
            color: INK_SOFT,
            marginTop: 6,
            lineHeight: 1.5,
          }}
        >
          出品者は手札を伏せたまま「○○」と宣言する.
          <br />
          実物が違っていても咎められない.
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, marginTop: 22, justifyContent: "center" }}>
        {/* 本物 */}
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <div style={{ transform: "rotate(-3deg)" }}>
              <CardFace brand="pottery" w={88} h={122} />
            </div>
            <div
              style={{
                position: "absolute",
                top: -6,
                right: -10,
                background: ACCENT_GREEN,
                color: PAPER,
                fontFamily: FONT_SERIF,
                fontWeight: 800,
                fontSize: 13,
                padding: "2px 8px",
                borderRadius: 12,
                transform: "rotate(6deg)",
                border: `1.5px solid ${INK}`,
              }}
            >
              本物
            </div>
          </div>
          <div
            style={{
              fontFamily: FONT_BODY,
              fontSize: 11,
              color: INK_SOFT,
              marginTop: 12,
              lineHeight: 1.5,
            }}
          >
            宣言通りの
            <br />
            本物を出品
          </div>
        </div>

        {/* ハッタリ */}
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <div style={{ transform: "rotate(3deg)", filter: "grayscale(0.3)" }}>
              <CardFace brand="painting" w={88} h={122} />
            </div>
            <div
              style={{
                position: "absolute",
                top: -6,
                left: -10,
                background: ACCENT_RED,
                color: PAPER,
                fontFamily: FONT_SERIF,
                fontWeight: 800,
                fontSize: 13,
                padding: "2px 8px",
                borderRadius: 12,
                transform: "rotate(-6deg)",
                border: `1.5px solid ${INK}`,
              }}
            >
              ハッタリ
            </div>
          </div>
          <div
            style={{
              fontFamily: FONT_BODY,
              fontSize: 11,
              color: INK_SOFT,
              marginTop: 12,
              lineHeight: 1.5,
            }}
          >
            宣言と実物が
            <br />
            違う出品
          </div>
        </div>
      </div>

      <SBox
        bg="rgba(196,62,42,0.08)"
        stroke={ACCENT_RED}
        sw={1.5}
        style={{ marginTop: 18, padding: "10px 14px" }}
      >
        <div style={{ fontFamily: FONT_BODY, fontSize: 11, lineHeight: 1.6, color: INK }}>
          <b>ハッタリを出せるのは 1人 2回まで</b>. 3回目以降は本物しか出せない.
          <br />
          真贋は落札者だけが知る — 卓では絶対に明かされない.
        </div>
      </SBox>
    </>
  )
}
