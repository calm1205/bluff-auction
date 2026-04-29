import { useState } from "react"
import type { Brand, PlayerId, PublicAuctionView, PublicPlayerView } from "@bluff-auction/shared"
import { socket } from "../../socket.js"
import {
  ACCENT_GOLD,
  ACCENT_RED,
  BRAND_LABEL_JP,
  CardFace,
  FONT_BODY,
  FONT_MONO,
  FONT_SERIF,
  PAPER,
  SBtn,
} from "../../sketch/index.js"

type Props = {
  auction: PublicAuctionView
  selfId: PlayerId | null
  players: PublicPlayerView[]
}

export function RevealDialog({ auction, selfId, players }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const winner = auction.highestBidderId
    ? players.find((p) => p.id === auction.highestBidderId)
    : null
  const seller = players.find((p) => p.id === auction.sellerId)
  const declared: Brand = auction.declaredBrand
  const actual: Brand | null = auction.actualBrand
  const isFake = actual !== null && actual !== declared

  const acked = selfId != null && auction.revealAckedIds.includes(selfId)
  const ackedCount = auction.revealAckedIds.length
  const totalCount = players.length
  const waitingNames = players
    .filter((p) => !auction.revealAckedIds.includes(p.id))
    .map((p) => p.name)

  const handleAck = () => {
    if (acked || submitting) return
    setSubmitting(true)
    setError(null)
    socket.emit("ack-reveal", (res) => {
      setSubmitting(false)
      if (!res.ok) setError(res.message)
    })
  }

  return (
    <div
      role="dialog"
      aria-modal
      aria-label="落札結果の確認"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 30,
        background: "rgba(8,6,5,0.92)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#1c1612",
          color: PAPER,
          borderRadius: 12,
          padding: "20px 18px 18px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          fontFamily: FONT_BODY,
        }}
      >
        {/* eyebrow */}
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            letterSpacing: 4,
            color: isFake ? ACCENT_RED : ACCENT_GOLD,
            textAlign: "center",
          }}
        >
          REVEAL
        </div>
        <div
          style={{
            fontFamily: FONT_SERIF,
            fontSize: 22,
            fontWeight: 800,
            textAlign: "center",
            marginTop: 4,
          }}
        >
          {isFake ? "ハッタリでした" : "本物でした"}
        </div>

        {/* card display */}
        {actual && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 14,
              marginTop: 18,
            }}
          >
            <BrandPair label="宣言" brand={declared} muted={isFake} />
            <div style={{ fontFamily: FONT_MONO, fontSize: 18, color: "rgba(246,238,219,0.4)" }}>
              →
            </div>
            <BrandPair label="実態" brand={actual} highlight />
          </div>
        )}

        {/* meta */}
        <div
          style={{
            marginTop: 18,
            padding: "10px 12px",
            borderTop: "1px solid rgba(246,238,219,0.12)",
            borderBottom: "1px solid rgba(246,238,219,0.12)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: FONT_BODY,
            fontSize: 12,
          }}
        >
          <div>
            <div style={{ color: "rgba(246,238,219,0.55)", fontSize: 10 }}>出品</div>
            <div style={{ fontWeight: 600 }}>{seller?.name ?? "?"}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "rgba(246,238,219,0.55)", fontSize: 10 }}>落札</div>
            <div style={{ fontWeight: 600 }}>
              {winner?.name ?? "?"}{" "}
              <span style={{ fontFamily: FONT_MONO, color: ACCENT_GOLD }}>
                ${auction.currentBid}
              </span>
            </div>
          </div>
        </div>

        {/* ack status */}
        <div
          style={{
            marginTop: 12,
            fontFamily: FONT_MONO,
            fontSize: 10,
            letterSpacing: 1.5,
            color: "rgba(246,238,219,0.55)",
            textAlign: "center",
          }}
        >
          確認 {ackedCount} / {totalCount}
          {waitingNames.length > 0 && ` · 待ち: ${waitingNames.join(", ")}`}
        </div>

        {error && (
          <div
            style={{
              marginTop: 8,
              fontFamily: FONT_BODY,
              fontSize: 11,
              color: ACCENT_RED,
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ marginTop: 14 }}>
          {acked ? (
            <SBtn size="md" bg="rgba(246,238,219,0.1)" color={PAPER} disabled>
              確認済み — 他プレイヤー待機中...
            </SBtn>
          ) : (
            <SBtn size="md" bg={ACCENT_RED} color={PAPER} onClick={handleAck} disabled={submitting}>
              {submitting ? "送信中..." : "確認 →"}
            </SBtn>
          )}
        </div>
      </div>
    </div>
  )
}

function BrandPair({
  label,
  brand,
  muted = false,
  highlight = false,
}: {
  label: string
  brand: Brand
  muted?: boolean
  highlight?: boolean
}) {
  return (
    <div
      style={{
        textAlign: "center",
        opacity: muted ? 0.7 : 1,
      }}
    >
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 9,
          letterSpacing: 2,
          color: highlight ? ACCENT_GOLD : "rgba(246,238,219,0.5)",
          marginBottom: 4,
        }}
      >
        {label.toUpperCase()}
      </div>
      <div
        style={{
          filter: highlight ? "drop-shadow(0 0 12px rgba(218,168,75,0.4))" : "none",
        }}
      >
        <CardFace brand={brand} w={70} h={100} />
      </div>
      <div
        style={{
          fontFamily: FONT_SERIF,
          fontSize: 14,
          fontWeight: 700,
          marginTop: 6,
          color: highlight ? ACCENT_GOLD : muted ? "rgba(246,238,219,0.65)" : PAPER,
        }}
      >
        {BRAND_LABEL_JP[brand]}
      </div>
    </div>
  )
}
