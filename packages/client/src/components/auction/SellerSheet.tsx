import { useMemo, useState } from "react"
import { BRANDS, BRAND_LABELS, MAX_FAKES_PER_PLAYER, type Brand } from "@bluff-auction/shared"
import { socket } from "../../socket.js"
import { useStore } from "../../store.js"
import {
  ACCENT_GOLD,
  ACCENT_RED,
  BRAND_LABEL_JP,
  CardFace,
  FONT_BODY,
  FONT_MONO,
  FONT_SERIF,
  INK,
  PAPER,
  SBtn,
} from "../../sketch/index.js"

// 出品者用シート(LISTING + amSeller)
// カード選択 → 宣言ブランド → 開始額 → 出品
export function SellerSheet() {
  const view = useStore((s) => s.view)!
  const self = view.self!
  const [cardId, setCardId] = useState(self.hand[0]?.id ?? "")
  const [declaredBrand, setDeclaredBrand] = useState<Brand>(self.brand)
  const [startingBid, setStartingBid] = useState(10)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fakeRemain = MAX_FAKES_PER_PLAYER - self.fakesUsed
  const isFake = declaredBrand !== self.brand
  const fakeBlocked = isFake && fakeRemain <= 0
  const overSpend = startingBid > self.cash || startingBid < 0
  const submittable = Boolean(cardId) && !fakeBlocked && !overSpend

  const selectedCard = useMemo(() => self.hand.find((c) => c.id === cardId), [self.hand, cardId])

  const submit = () => {
    if (!submittable) return
    setSubmitting(true)
    setError(null)
    socket.emit("list-card", { cardId, declaredBrand, startingBid }, (res) => {
      setSubmitting(false)
      if (!res.ok) setError(res.message)
    })
  }

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        background: "#1c1612",
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        boxShadow: "0 -10px 40px rgba(0,0,0,0.5)",
        paddingTop: 12,
        color: PAPER,
      }}
    >
      {/* drag handle */}
      <div
        style={{
          width: 42,
          height: 4,
          borderRadius: 2,
          background: "rgba(246,238,219,0.25)",
          margin: "0 auto 10px",
        }}
      />

      {/* heading */}
      <div style={{ padding: "0 18px 8px" }}>
        <div style={{ fontFamily: FONT_SERIF, fontSize: 22, fontWeight: 800, marginTop: 2 }}>
          売るカードと宣言を決める
        </div>
      </div>

      {/* hand picker */}
      <div style={{ padding: "0 14px 6px" }}>
        <div
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            paddingTop: 10,
            paddingBottom: 6,
          }}
        >
          {self.hand.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCardId(c.id)}
              style={{
                all: "unset",
                cursor: "pointer",
                position: "relative",
                flexShrink: 0,
                outline: cardId === c.id ? `3px solid ${ACCENT_RED}` : "none",
                outlineOffset: 2,
                borderRadius: 4,
              }}
              aria-label={`${BRAND_LABEL_JP[c.brand]} を選択`}
            >
              <CardFace brand={c.brand} w={56} h={78} />
              {c.brand === self.brand && (
                <div
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    background: "#3d6b46",
                    color: PAPER,
                    fontFamily: FONT_MONO,
                    fontSize: 8,
                    padding: "1px 4px",
                    borderRadius: 2,
                    border: `1px solid ${INK}`,
                  }}
                >
                  自分
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* declare brand */}
      <div style={{ padding: "10px 18px 0" }}>
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 9,
            letterSpacing: 2,
            color: "rgba(246,238,219,0.5)",
            marginBottom: 4,
          }}
        >
          宣言ブランド
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {BRANDS.map((b) => {
            const isOwn = b === self.brand
            const selected = b === declaredBrand
            return (
              <button
                key={b}
                type="button"
                onClick={() => setDeclaredBrand(b)}
                style={{
                  all: "unset",
                  cursor: "pointer",
                  flex: 1,
                  textAlign: "center",
                  padding: "6px 4px",
                  border: `1.5px solid ${selected ? ACCENT_RED : "rgba(246,238,219,0.3)"}`,
                  borderRadius: 6,
                  background: selected ? "rgba(196,62,42,0.15)" : "transparent",
                  fontFamily: FONT_BODY,
                  fontSize: 12,
                  color: PAPER,
                  fontWeight: 600,
                }}
              >
                {BRAND_LABELS[b]}
                {!isOwn && (
                  <div
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 8,
                      color: ACCENT_RED,
                      marginTop: 2,
                    }}
                  >
                    ハッタリ
                  </div>
                )}
              </button>
            )
          })}
        </div>
        {fakeBlocked && (
          <div
            style={{
              fontFamily: FONT_BODY,
              fontSize: 11,
              color: ACCENT_RED,
              marginTop: 6,
            }}
          >
            ハッタリ残数なし(自分のブランドのみ宣言可)
          </div>
        )}
        {!fakeBlocked && (
          <div
            style={{
              fontFamily: FONT_BODY,
              fontSize: 10,
              color: "rgba(246,238,219,0.5)",
              marginTop: 4,
            }}
          >
            ハッタリ残: {fakeRemain} / {MAX_FAKES_PER_PLAYER}
          </div>
        )}
      </div>

      {/* starting bid */}
      <div style={{ padding: "12px 18px 0" }}>
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 9,
            letterSpacing: 2,
            color: "rgba(246,238,219,0.5)",
            marginBottom: 4,
          }}
        >
          開始額
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={() => setStartingBid((v) => Math.max(0, v - 1))}
            style={{
              all: "unset",
              cursor: "pointer",
              width: 36,
              height: 36,
              borderRadius: 999,
              border: `1.5px solid rgba(246,238,219,0.4)`,
              textAlign: "center",
              fontSize: 18,
              fontFamily: FONT_BODY,
              color: PAPER,
            }}
          >
            −
          </button>
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "baseline",
              justifyContent: "center",
              gap: 2,
            }}
          >
            <span
              style={{
                fontFamily: FONT_SERIF,
                fontSize: 36,
                fontWeight: 800,
                color: ACCENT_GOLD,
                lineHeight: 1,
              }}
            >
              $
            </span>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              value={startingBid}
              onChange={(e) => {
                const v = Number(e.target.value)
                if (Number.isNaN(v)) return
                setStartingBid(Math.max(0, v))
              }}
              onBlur={() => setStartingBid((v) => Math.max(0, Math.min(self.cash, v)))}
              aria-label="開始額"
              style={{
                all: "unset",
                width: 100,
                textAlign: "center",
                fontFamily: FONT_SERIF,
                fontSize: 36,
                fontWeight: 800,
                color: ACCENT_GOLD,
                lineHeight: 1,
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => setStartingBid((v) => Math.min(self.cash, v + 1))}
            style={{
              all: "unset",
              cursor: "pointer",
              width: 36,
              height: 36,
              borderRadius: 999,
              border: `1.5px solid rgba(246,238,219,0.4)`,
              textAlign: "center",
              fontSize: 18,
              fontFamily: FONT_BODY,
              color: PAPER,
            }}
          >
            +
          </button>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 8 }}>
          {[5, 10, 25].map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => setStartingBid((v) => Math.min(self.cash, v + step))}
              style={{
                all: "unset",
                cursor: "pointer",
                fontFamily: FONT_MONO,
                fontSize: 10,
                padding: "4px 8px",
                border: `1px solid rgba(246,238,219,0.3)`,
                borderRadius: 999,
                color: PAPER,
              }}
            >
              +${step}
            </button>
          ))}
        </div>
        {overSpend && (
          <div
            style={{
              fontFamily: FONT_BODY,
              fontSize: 11,
              color: ACCENT_RED,
              marginTop: 6,
              textAlign: "center",
            }}
          >
            所持金 ${self.cash} を超えています
          </div>
        )}
      </div>

      {/* error */}
      {error && (
        <div
          style={{
            padding: "0 18px",
            marginTop: 8,
            fontFamily: FONT_BODY,
            fontSize: 12,
            color: ACCENT_RED,
            textAlign: "center",
          }}
        >
          {error}
        </div>
      )}

      {/* CTA */}
      <div style={{ padding: "12px 14px 16px" }}>
        <SBtn
          bg={submittable ? ACCENT_RED : "rgba(246,238,219,0.15)"}
          color={submittable ? PAPER : "rgba(246,238,219,0.55)"}
          size="lg"
          onClick={submit}
          disabled={!submittable || submitting}
        >
          {submitting
            ? "出品中..."
            : selectedCard
              ? `「${BRAND_LABEL_JP[declaredBrand]}」として $${startingBid} で出品 →`
              : "出品"}
        </SBtn>
      </div>
    </div>
  )
}
