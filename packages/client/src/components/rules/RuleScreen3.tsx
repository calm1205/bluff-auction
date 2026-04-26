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
} from "../../sketch/index.js"

const STEPS = [
  {
    n: 1,
    title: "出品",
    body: "手番のプレイヤーが手札から1枚を選び、ブランドを宣言する.",
    color: ACCENT_RED,
  },
  { n: 2, title: "入札", body: "他の3人が金額を上乗せ. パスもできる.", color: ACCENT_BLUE },
  { n: 3, title: "落札", body: "全員パスで競り終了. 最高額の人が落札.", color: ACCENT_GREEN },
  {
    n: 4,
    title: "リビール",
    body: "落札者だけ実物を確認. 真贋は他には知らされない.",
    color: ACCENT_GOLD,
  },
] as const

// R3 ターンの 4 ステップ
export function RuleScreen3() {
  return (
    <>
      <div style={{ marginTop: 6 }}>
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            letterSpacing: 2,
            color: INK_SOFT,
          }}
        >
          FLOW
        </div>
        <div
          style={{
            fontFamily: FONT_SERIF,
            fontSize: 28,
            fontWeight: 800,
            lineHeight: 1.15,
            marginTop: 4,
          }}
        >
          ターンは <span style={{ color: ACCENT_RED }}>4 ステップ</span>
        </div>
      </div>
      <div
        style={{
          marginTop: 18,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {STEPS.map((s) => (
          <div key={s.n} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div
              style={{
                flexShrink: 0,
                width: 36,
                height: 36,
                borderRadius: 999,
                border: `2px solid ${s.color}`,
                color: s.color,
                background: PAPER,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: FONT_SERIF,
                fontWeight: 800,
                fontSize: 18,
              }}
            >
              {s.n}
            </div>
            <div style={{ flex: 1, paddingTop: 2 }}>
              <div
                style={{
                  fontFamily: FONT_SERIF,
                  fontSize: 19,
                  fontWeight: 800,
                  color: s.color,
                }}
              >
                {s.title}
              </div>
              <div
                style={{
                  fontFamily: FONT_BODY,
                  fontSize: 12,
                  color: INK,
                  lineHeight: 1.5,
                  marginTop: 2,
                }}
              >
                {s.body}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 14,
          fontFamily: FONT_BODY,
          fontSize: 11,
          color: INK_SOFT,
          textAlign: "center",
          fontStyle: "italic",
        }}
      >
        → 次の人が出品者になる. 時計回り.
      </div>
    </>
  )
}
