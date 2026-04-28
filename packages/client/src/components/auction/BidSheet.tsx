import { useEffect, useState } from "react"
import { socket } from "../../socket.js"
import { useStore } from "../../store.js"
import {
  ACCENT_GOLD,
  ACCENT_RED,
  FONT_BODY,
  FONT_MONO,
  FONT_SERIF,
  INK,
  PAPER,
  SBtn,
} from "../../sketch/index.js"

// 入札者用シート(BIDDING + 自分が入札可能なターン)
// 上乗せ stepper + プリセットチップ + 入札 / パス
export function BidSheet() {
  const view = useStore((s) => s.view)!
  const self = view.self!
  const a = view.currentAuction!
  const minBid = a.highestBidderId === null ? a.startingBid : a.currentBid + 1
  const overBudget = minBid > self.cash
  const [amount, setAmount] = useState(Math.min(minBid, self.cash))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 最低額が更新されたら追従
  useEffect(() => {
    setAmount((cur) => Math.max(cur, minBid))
  }, [minBid])

  const submitBid = () => {
    if (overBudget || amount > self.cash || amount < minBid) return
    setSubmitting(true)
    setError(null)
    socket.emit("bid", { amount }, (res) => {
      setSubmitting(false)
      if (!res.ok) setError(res.message)
    })
  }
  const submitPass = () => {
    setSubmitting(true)
    setError(null)
    socket.emit("pass", (res) => {
      setSubmitting(false)
      if (!res.ok) setError(res.message)
    })
  }

  const dec = () => setAmount((v) => Math.max(minBid, v - 1))
  const inc = (step: number) => setAmount((v) => Math.min(self.cash, v + step))
  const max = () => setAmount(self.cash)

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
          上乗せする?それとも降りる?
        </div>
        <div
          style={{
            fontFamily: FONT_BODY,
            fontSize: 11,
            color: "rgba(246,238,219,0.6)",
            marginTop: 4,
          }}
        >
          最低額 ${minBid} · 所持金 ${self.cash}
        </div>
      </div>

      {/* amount stepper */}
      <div style={{ padding: "8px 18px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={dec}
            disabled={amount <= minBid}
            style={{
              all: "unset",
              cursor: amount <= minBid ? "not-allowed" : "pointer",
              opacity: amount <= minBid ? 0.4 : 1,
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
              textAlign: "center",
              fontFamily: FONT_SERIF,
              fontSize: 42,
              fontWeight: 800,
              color: ACCENT_GOLD,
              lineHeight: 1,
            }}
          >
            ${amount}
          </div>
          <button
            type="button"
            onClick={() => inc(1)}
            disabled={amount >= self.cash}
            style={{
              all: "unset",
              cursor: amount >= self.cash ? "not-allowed" : "pointer",
              opacity: amount >= self.cash ? 0.4 : 1,
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

        {/* preset chips */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 8 }}>
          {[1, 5, 10].map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => inc(step)}
              style={{
                all: "unset",
                cursor: "pointer",
                fontFamily: FONT_MONO,
                fontSize: 10,
                padding: "4px 10px",
                border: `1px solid rgba(246,238,219,0.3)`,
                borderRadius: 999,
                color: PAPER,
              }}
            >
              +${step}
            </button>
          ))}
          <button
            type="button"
            onClick={max}
            style={{
              all: "unset",
              cursor: "pointer",
              fontFamily: FONT_MONO,
              fontSize: 10,
              padding: "4px 10px",
              border: `1px solid ${ACCENT_GOLD}`,
              borderRadius: 999,
              color: ACCENT_GOLD,
            }}
          >
            MAX
          </button>
        </div>

        {overBudget && (
          <div
            style={{
              fontFamily: FONT_BODY,
              fontSize: 11,
              color: ACCENT_RED,
              marginTop: 6,
              textAlign: "center",
            }}
          >
            最低額 ${minBid} を払う所持金がない(パス推奨)
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
      <div style={{ padding: "12px 14px 16px", display: "flex", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <SBtn
            bg="rgba(246,238,219,0.1)"
            color={PAPER}
            size="lg"
            onClick={submitPass}
            disabled={submitting}
            style={{ border: `2px solid rgba(246,238,219,0.3)` }}
          >
            パス
          </SBtn>
        </div>
        <div style={{ flex: 2 }}>
          <SBtn
            bg={overBudget ? "rgba(246,238,219,0.15)" : ACCENT_RED}
            color={overBudget ? "rgba(246,238,219,0.55)" : PAPER}
            size="lg"
            onClick={submitBid}
            disabled={submitting || overBudget}
            style={{ border: `2px solid ${INK}` }}
          >
            {submitting ? "..." : `$${amount} で入札 →`}
          </SBtn>
        </div>
      </div>
    </div>
  )
}
