import { useStore } from "../../store.js"
import { BRAND_LABELS } from "@bluff-auction/shared"
import {
  ACCENT_GOLD,
  CardFace,
  FONT_BODY,
  FONT_MONO,
  FONT_SERIF,
  PAPER,
} from "../../sketch/index.js"
import { OpponentStrip } from "./OpponentStrip.js"
import { MyStatsBar } from "./MyStatsBar.js"
import { DeclarationBanner } from "./DeclarationBanner.js"
import { CurrentBidDisplay } from "./CurrentBidDisplay.js"
import { AuctionCardArt } from "./AuctionCardArt.js"
import { SellerSheet } from "./SellerSheet.js"
import { BidSheet } from "./BidSheet.js"

const THEATER_BG = "#120e0c"

// V3 Theater: ダーク背景 + spotlight + 上 OpponentStrip + 中央演出 + 下 MyStats + 文脈別 sheet
export function AuctionBoard() {
  const view = useStore((s) => s.view)
  const lastRevealed = useStore((s) => s.lastRevealed)

  if (!view || !view.self) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: THEATER_BG,
          color: PAPER,
          fontFamily: FONT_BODY,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        読み込み中...
      </div>
    )
  }

  const currentSellerId = view.turnOrder[view.turnIndex] ?? null
  const amSeller = view.self.id === currentSellerId
  const inListing = view.phase === "listing"
  const inBidding = view.phase === "bidding"
  const a = view.currentAuction
  const allPlayers = [...view.others, view.self]
  const sellerName = a ? (allPlayers.find((p) => p.id === a.sellerId)?.name ?? "?") : ""
  const leaderName =
    a && a.highestBidderId
      ? (allPlayers.find((p) => p.id === a.highestBidderId)?.name ?? "?")
      : null
  const passed = view.self.passed || (a?.passedPlayerIds.includes(view.self.id) ?? false)
  const isMyBidTurn = a?.currentBidderId === view.self.id
  const currentBidderName =
    a?.currentBidderId != null
      ? (allPlayers.find((p) => p.id === a.currentBidderId)?.name ?? "?")
      : null

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        maxWidth: 480,
        margin: "0 auto",
        background: THEATER_BG,
        color: PAPER,
        fontFamily: FONT_BODY,
        overflow: "hidden",
        paddingBottom: 360, // sheet 用余白
      }}
    >
      {/* spotlight */}
      <div
        style={{
          position: "absolute",
          top: -80,
          left: "50%",
          transform: "translateX(-50%)",
          width: 520,
          height: 520,
          borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(246,238,219,0.12), transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* top: opponents */}
      <div style={{ position: "relative", padding: "16px 14px 0" }}>
        <OpponentStrip others={view.others} currentSellerId={currentSellerId} />
      </div>

      {/* center stage */}
      <div style={{ position: "relative", padding: "12px 18px 0", textAlign: "center" }}>
        {inListing && amSeller && (
          <div style={{ marginTop: 24 }}>
            <div
              style={{
                fontFamily: FONT_SERIF,
                fontSize: 28,
                fontWeight: 800,
                color: PAPER,
              }}
            >
              あなたの出品
            </div>
            <div
              style={{
                fontFamily: FONT_BODY,
                fontSize: 13,
                color: "rgba(246,238,219,0.6)",
                marginTop: 4,
              }}
            >
              手札からカードと宣言ブランドを選ぶ
            </div>
          </div>
        )}

        {inListing && !amSeller && (
          <div style={{ marginTop: 24 }}>
            <div
              style={{
                fontFamily: FONT_SERIF,
                fontSize: 24,
                fontWeight: 800,
                color: PAPER,
              }}
            >
              {sellerName} の出品待ち
            </div>
            <div
              style={{
                fontFamily: FONT_BODY,
                fontSize: 12,
                color: "rgba(246,238,219,0.55)",
                marginTop: 6,
              }}
            >
              何が並ぶかは、まだ誰も知らない
            </div>
          </div>
        )}

        {inBidding && a && (
          <>
            <DeclarationBanner sellerName={sellerName} declaredBrand={a.declaredBrand} />
            <div style={{ marginTop: 18 }}>
              <AuctionCardArt declaredBrand={a.declaredBrand} startingBid={a.startingBid} />
            </div>
            <div style={{ marginTop: 18 }}>
              <CurrentBidDisplay
                startingBid={a.startingBid}
                currentBid={a.currentBid}
                highestBidderName={leaderName}
              />
            </div>
          </>
        )}

        {view.phase === "ended" && (
          <div style={{ marginTop: 60 }}>
            <div
              style={{
                fontFamily: FONT_SERIF,
                fontSize: 32,
                fontWeight: 800,
                color: ACCENT_GOLD,
              }}
            >
              ゲーム終了
            </div>
            {view.winnerId && (
              <div
                style={{
                  fontFamily: FONT_BODY,
                  fontSize: 14,
                  color: PAPER,
                  marginTop: 6,
                }}
              >
                勝者: {allPlayers.find((p) => p.id === view.winnerId)?.name ?? "?"}
              </div>
            )}
          </div>
        )}
      </div>

      {/* last revealed flash */}
      {lastRevealed && (
        <div
          style={{
            position: "absolute",
            top: 80,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(28,22,18,0.85)",
            border: `1px solid ${ACCENT_GOLD}`,
            borderRadius: 999,
            padding: "4px 12px",
            fontFamily: FONT_MONO,
            fontSize: 10,
            color: ACCENT_GOLD,
            letterSpacing: 1.5,
          }}
        >
          <CardFace brand={lastRevealed.brand} w={20} h={28} />
          直前の落札 · {BRAND_LABELS[lastRevealed.brand]}
        </div>
      )}

      {/* my stats bar (上部 sheet とは独立、画面下部に固定だが sheet の上にも来る) */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          maxWidth: 480,
          margin: "0 auto",
          zIndex: 20,
          pointerEvents: "none",
        }}
      >
        {/* contextual sheet */}
        <div style={{ pointerEvents: "auto", position: "relative" }}>
          {inListing && amSeller && <SellerSheet />}
          {inBidding && !amSeller && !passed && isMyBidTurn && <BidSheet />}
          {inBidding && !amSeller && !passed && !isMyBidTurn && (
            <WaitingSheet
              message={
                currentBidderName
                  ? `${currentBidderName} の入札を待機中`
                  : "他プレイヤーの入札を待機中"
              }
            />
          )}
          {inBidding && !amSeller && passed && (
            <WaitingSheet message="パス済み — 次のターンを待つ" />
          )}
          {inBidding && amSeller && (
            <WaitingSheet
              message={
                currentBidderName ? `${currentBidderName} の入札を待機中` : "入札中 — 進行を待機"
              }
            />
          )}
        </div>

        {/* always-on stats footer */}
        <div
          style={{
            pointerEvents: "auto",
            background: "#0d0a08",
            borderTop: `1px solid rgba(246,238,219,0.1)`,
            padding: "8px 14px",
          }}
        >
          <MyStatsBar self={view.self} />
        </div>
      </div>
    </div>
  )
}

function WaitingSheet({ message }: { message: string }) {
  return (
    <div
      style={{
        background: "#1c1612",
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        boxShadow: "0 -10px 40px rgba(0,0,0,0.5)",
        padding: "16px 18px 18px",
        textAlign: "center",
        color: PAPER,
      }}
    >
      <div
        style={{
          width: 42,
          height: 4,
          borderRadius: 2,
          background: "rgba(246,238,219,0.25)",
          margin: "0 auto 10px",
        }}
      />
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 10,
          letterSpacing: 2,
          color: "rgba(246,238,219,0.5)",
        }}
      >
        WAITING
      </div>
      <div
        style={{
          fontFamily: FONT_SERIF,
          fontSize: 18,
          fontWeight: 700,
          marginTop: 4,
          color: PAPER,
        }}
      >
        {message}
      </div>
    </div>
  )
}
