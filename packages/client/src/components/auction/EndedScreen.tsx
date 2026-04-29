import { BRANDS } from "@bluff-auction/shared"
import { useStore } from "../../store.js"
import { connectSocket, disconnectSocket } from "../../socket.js"
import * as api from "../../api.js"
import {
  ACCENT_GOLD,
  ACCENT_RED,
  CardFace,
  FONT_BODY,
  FONT_MONO,
  FONT_SERIF,
  PAPER,
  SBtn,
} from "../../sketch/index.js"

const VICTORY_BG = "#0e0a08"

export function EndedScreen() {
  const view = useStore((s) => s.view)
  const leaveRoom = useStore((s) => s.leaveRoom)
  const setRoomId = useStore((s) => s.setRoomId)

  if (!view) return null

  const allPlayers = [...view.others, ...(view.self ? [view.self] : [])]
  const winnerName = allPlayers.find((p) => p.id === view.winnerId)?.name ?? view.winnerId ?? "?"
  const isSelfWinner = view.self?.id === view.winnerId

  const handleCreateNewRoom = async () => {
    try {
      const { id } = await api.createRoom()
      disconnectSocket()
      leaveRoom()
      connectSocket(id)
      setRoomId(id)
    } catch (e) {
      alert(`作成失敗: ${(e as Error).message}`)
    }
  }

  const handleBackToList = () => {
    disconnectSocket()
    leaveRoom()
  }

  const cardOffsets = [
    { x: -120, y: 8, r: -10 },
    { x: -42, y: -4, r: -3 },
    { x: 36, y: -4, r: 4 },
    { x: 114, y: 8, r: 11 },
  ]

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        maxWidth: 480,
        margin: "0 auto",
        background: VICTORY_BG,
        color: PAPER,
        fontFamily: FONT_BODY,
        overflow: "hidden",
      }}
    >
      {/* gold radial spotlight */}
      <div
        style={{
          position: "absolute",
          top: -120,
          left: "50%",
          transform: "translateX(-50%)",
          width: 560,
          height: 560,
          background: "radial-gradient(circle, rgba(218,168,75,0.3), transparent 65%)",
          pointerEvents: "none",
        }}
      />

      {/* light rays */}
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: 350,
          opacity: 0.12,
          pointerEvents: "none",
        }}
        viewBox="0 0 420 350"
        preserveAspectRatio="xMidYMin slice"
        aria-hidden
      >
        {Array.from({ length: 10 }).map((_, i) => {
          const angle = (i / 10) * 360
          const rad = (angle * Math.PI) / 180
          return (
            <line
              key={i}
              x1="210"
              y1="100"
              x2={210 + Math.cos(rad) * 400}
              y2={100 + Math.sin(rad) * 400}
              stroke={ACCENT_GOLD}
              strokeWidth="0.8"
            />
          )
        })}
      </svg>

      {/* eyebrow */}
      <div style={{ position: "relative", textAlign: "center", paddingTop: 36 }}>
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            letterSpacing: 5,
            color: ACCENT_GOLD,
          }}
        >
          GAME OVER
        </div>
        <div
          style={{
            fontFamily: FONT_SERIF,
            fontSize: 11,
            color: "rgba(246,238,219,0.5)",
            marginTop: 2,
            letterSpacing: 3,
          }}
        >
          ──── 蒐集の完了 ────
        </div>
      </div>

      {/* winner banner */}
      <div style={{ position: "relative", textAlign: "center", marginTop: 10 }}>
        <div style={{ fontFamily: FONT_SERIF, fontSize: 13, color: "rgba(246,238,219,0.7)" }}>
          勝者
        </div>
        <div
          style={{
            fontFamily: FONT_SERIF,
            fontSize: 44,
            fontWeight: 800,
            lineHeight: 1.05,
            color: ACCENT_GOLD,
            letterSpacing: 2,
            textShadow: "0 0 20px rgba(218,168,75,0.4)",
          }}
        >
          {winnerName}
        </div>
        {isSelfWinner && (
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 10,
              letterSpacing: 3,
              color: ACCENT_GOLD,
              marginTop: 2,
            }}
          >
            YOU
          </div>
        )}
        <div
          style={{
            width: 180,
            height: 1.5,
            background: PAPER,
            opacity: 0.5,
            margin: "10px auto 0",
          }}
        />
      </div>

      {/* the 4 brand cards — fanned out */}
      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginTop: 24,
          height: 170,
        }}
      >
        {BRANDS.map((b, i) => {
          const o = cardOffsets[i]!
          return (
            <div
              key={b}
              style={{
                position: "absolute",
                left: "50%",
                transform: `translateX(${o.x - 36}px) translateY(${o.y}px) rotate(${o.r}deg)`,
                filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.6))",
              }}
            >
              <div style={{ position: "relative" }}>
                <CardFace brand={b} w={72} h={104} />
                {/* gold corner stamp */}
                <div
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    width: 20,
                    height: 20,
                    borderRadius: 999,
                    background: ACCENT_GOLD,
                    color: "#1a1715",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: FONT_SERIF,
                    fontSize: 12,
                    fontWeight: 800,
                    border: `2px solid ${VICTORY_BG}`,
                  }}
                >
                  ✓
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* "ALL 4 BRANDS" badge */}
      <div style={{ position: "relative", textAlign: "center", marginTop: 16 }}>
        <div
          style={{
            display: "inline-block",
            padding: "4px 14px",
            border: `1.5px solid ${ACCENT_GOLD}`,
            borderRadius: 2,
            fontFamily: FONT_MONO,
            fontSize: 10,
            letterSpacing: 3,
            color: ACCENT_GOLD,
            background: "rgba(218,168,75,0.06)",
          }}
        >
          4 BRANDS COLLECTED
        </div>
        <div
          style={{
            fontFamily: FONT_SERIF,
            fontSize: 12,
            color: "rgba(246,238,219,0.55)",
            marginTop: 6,
          }}
        >
          絵画・彫刻・陶器・宝飾 — 全種制覇
        </div>
      </div>

      {/* CTAs */}
      <div
        style={{
          position: "relative",
          padding: "32px 16px 24px",
          marginTop: 24,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <SBtn size="md" bg={ACCENT_RED} color={PAPER} onClick={handleCreateNewRoom}>
          新ルーム作成 →
        </SBtn>
        <SBtn size="md" bg="rgba(246,238,219,0.08)" color={PAPER} onClick={handleBackToList}>
          ルーム一覧へ戻る
        </SBtn>
      </div>
    </div>
  )
}
