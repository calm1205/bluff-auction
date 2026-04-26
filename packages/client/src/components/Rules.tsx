import { useState } from "react"
import {
  ACCENT_BLUE,
  ACCENT_GOLD,
  ACCENT_GREEN,
  ACCENT_RED,
  CardFace,
  FONT_BODY,
  FONT_MONO,
  FONT_SERIF,
  Gavel,
  INK,
  INK_SOFT,
  PAPER,
  PAPER_WARM,
  SBox,
  SBtn,
  ScreenFrame,
} from "../sketch/index.js"

const TOTAL = 5

type Props = {
  onClose: () => void
}

export function Rules({ onClose }: Props) {
  const [idx, setIdx] = useState(0)
  const next = () => {
    if (idx === TOTAL - 1) onClose()
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

function RuleHeader({ idx, onClose }: { idx: number; onClose: () => void }) {
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
          {String(idx + 1).padStart(2, "0")} / {String(TOTAL).padStart(2, "0")}
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

function RuleNav({ idx, onPrev, onNext }: { idx: number; onPrev: () => void; onNext: () => void }) {
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
          {idx === TOTAL - 1 ? "はじめる →" : "次へ →"}
        </SBtn>
      </div>
    </div>
  )
}

function RuleDots({ idx }: { idx: number }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: 6,
        marginTop: 16,
      }}
    >
      {Array.from({ length: TOTAL }).map((_, i) => (
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

// ── R1 概要 ────────────────────────────────────────────────────
function RuleScreen1() {
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

function FactChip({ label, value, color }: { label: string; value: string; color: string }) {
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

// ── R2 目的 ────────────────────────────────────────────────────
function RuleScreen2() {
  const offsets = [
    { x: -100, y: 18, r: -8 },
    { x: -36, y: 4, r: -3 },
    { x: 28, y: 4, r: 3 },
    { x: 92, y: 18, r: 8 },
  ]
  const brands = ["painting", "sculpture", "pottery", "jewelry"] as const
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
        {brands.map((b, i) => {
          const o = offsets[i]!
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

// ── R3 ターン ─────────────────────────────────────────────────
function RuleScreen3() {
  const steps = [
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
  ]
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
        {steps.map((s) => (
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

// ── R4 ハッタリ ─────────────────────────────────────────────────
function RuleScreen4() {
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

// ── R5 流札 ─────────────────────────────────────────────────────
function RuleScreen5() {
  const others = [
    { name: "A", color: ACCENT_BLUE },
    { name: "B", color: ACCENT_GREEN },
    { name: "C", color: ACCENT_GOLD },
  ]
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
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
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
          {others.map((p) => (
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
