import {
  ACCENT_BLUE,
  ACCENT_GOLD,
  ACCENT_GREEN,
  ACCENT_RED,
  FONT_BODY,
  FONT_MONO,
  FONT_SERIF,
  INK,
  INK_SOFT,
  PAPER,
  PAPER_WARM,
  SBox,
} from "../../sketch/index.js"

const OTHERS = [
  { name: "A", color: ACCENT_BLUE },
  { name: "B", color: ACCENT_GREEN },
  { name: "C", color: ACCENT_GOLD },
] as const

// R5 流札 — ペナルティ分配
export function RuleScreen5() {
  return (
    <>
      <div style={{ marginTop: 6 }}>
        <div
          style={{
            fontFamily: FONT_SERIF,
            fontSize: 26,
            fontWeight: 800,
            lineHeight: 1.2,
          }}
        >
          全員パスなら <span style={{ color: ACCENT_BLUE }}>流札</span>
        </div>
        <div
          style={{
            fontFamily: FONT_BODY,
            fontSize: 12,
            color: INK_SOFT,
            marginTop: 6,
            lineHeight: 1.6,
          }}
        >
          出品者は <b style={{ color: ACCENT_RED }}>開始額</b> を場に支払う.
          <br />
          他の3人に等分し、端数は出品者に戻る.
        </div>
      </div>

      <SBox bg={PAPER_WARM} stroke={INK} sw={1.5} style={{ marginTop: 18, padding: "16px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              background: ACCENT_RED,
              color: PAPER,
              fontFamily: FONT_SERIF,
              fontWeight: 800,
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `2px solid ${INK}`,
            }}
          >
            出
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: FONT_BODY,
                fontSize: 11,
                color: INK_SOFT,
                letterSpacing: 1,
              }}
            >
              SELLER PAYS
            </div>
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 22,
                fontWeight: 800,
                color: ACCENT_RED,
                lineHeight: 1.1,
              }}
            >
              − $10
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: INK_SOFT }}>= 開始額</div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: 10,
            marginBottom: 10,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 1.5, height: 18, background: INK }} />
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 9,
                color: INK_SOFT,
                padding: "2px 6px",
              }}
            >
              ÷ 3
            </div>
            <div style={{ width: 1.5, height: 12, background: INK }} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {OTHERS.map((p) => (
            <div
              key={p.name}
              style={{
                textAlign: "center",
                padding: "8px 4px",
                border: `1.5px solid ${ACCENT_GREEN}`,
                borderRadius: 4,
                background: "rgba(61,107,70,0.06)",
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 999,
                  background: p.color,
                  color: PAPER,
                  fontFamily: FONT_BODY,
                  fontWeight: 700,
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                }}
              >
                {p.name}
              </div>
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 16,
                  fontWeight: 800,
                  color: ACCENT_GREEN,
                  marginTop: 4,
                  lineHeight: 1,
                }}
              >
                +$3
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 12,
            padding: "8px 10px",
            background: "rgba(218,168,75,0.12)",
            border: `1.5px dashed ${ACCENT_GOLD}`,
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 9,
              letterSpacing: 1,
              padding: "2px 6px",
              background: ACCENT_GOLD,
              color: INK,
              fontWeight: 700,
              borderRadius: 2,
            }}
          >
            端数
          </div>
          <div
            style={{
              flex: 1,
              fontFamily: FONT_BODY,
              fontSize: 11,
              color: INK,
              lineHeight: 1.5,
            }}
          >
            割り切れない <b style={{ color: ACCENT_GOLD }}>$1</b> は出品者に戻る
          </div>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 14,
              fontWeight: 800,
              color: ACCENT_GOLD,
            }}
          >
            ↩ +$1
          </div>
        </div>
      </SBox>

      <div
        style={{
          marginTop: 14,
          textAlign: "center",
          fontFamily: FONT_BODY,
          fontSize: 11,
          color: INK_SOFT,
          lineHeight: 1.6,
        }}
      >
        出品カードは伏せたまま<b style={{ color: INK }}>出品者の手札に戻る</b>.
        <br />
        真贋は明かされない.
      </div>
    </>
  )
}
