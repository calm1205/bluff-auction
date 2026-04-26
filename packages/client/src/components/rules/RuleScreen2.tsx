import { ACCENT_RED, CardFace, FONT_SERIF } from "../../sketch/index.js"

const OFFSETS = [
  { x: -100, y: 18, r: -8 },
  { x: -36, y: 4, r: -3 },
  { x: 28, y: 4, r: 3 },
  { x: 92, y: 18, r: 8 },
] as const

const BRANDS = ["painting", "sculpture", "pottery", "jewelry"] as const

// R2 目的
export function RuleScreen2() {
  return (
    <>
      <div style={{ marginTop: 8 }}>
        <div
          style={{
            fontFamily: FONT_SERIF,
            fontSize: 30,
            fontWeight: 800,
            lineHeight: 1.15,
          }}
        >
          <span style={{ color: ACCENT_RED }}>4 種</span>のブランドを
          <br />
          集めた者が勝ち
        </div>
      </div>
      <div style={{ position: "relative", height: 200, marginTop: 24 }}>
        {BRANDS.map((b, i) => {
          const o = OFFSETS[i]!
          return (
            <div
              key={b}
              style={{
                position: "absolute",
                left: "50%",
                top: 0,
                transform: `translateX(${o.x}px) translateY(${o.y}px) translateX(-50%) rotate(${o.r}deg)`,
                zIndex: 4 - Math.abs(i - 1.5),
              }}
            >
              <CardFace brand={b} w={78} h={108} />
            </div>
          )
        })}
      </div>
    </>
  )
}
