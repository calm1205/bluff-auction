import { useEffect, useMemo, useRef, useState } from "react"
import { useStore } from "../../store.js"
import { NUM_PLAYERS } from "@bluff-auction/shared"
import { disconnectSocket } from "../../socket.js"
import * as api from "../../api.js"
import {
  ACCENT_BLUE,
  ACCENT_GREEN,
  ACCENT_RED,
  FONT_BODY,
  FONT_MONO,
  INK,
  INK_SOFT,
  PAPER,
  RoomIdDisplay,
  SBox,
  SBtn,
  ScreenFrame,
  Seat,
  type SeatData,
} from "../../sketch/index.js"

export function Lobby() {
  const view = useStore((s) => s.view)
  const roomId = useStore((s) => s.roomId)
  const leaveRoom = useStore((s) => s.leaveRoom)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const attemptedRef = useRef(false)

  const alreadyJoined = view?.self != null
  const playerCount = view ? (view.self ? 1 : 0) + view.others.length : 0
  const roomFull = playerCount >= NUM_PLAYERS
  const allReady = playerCount === NUM_PLAYERS
  const isHost = view?.self != null && view.self.id === view.hostPlayerId

  // view 受信後、自動で参加(名前は players マスターから取得)
  useEffect(() => {
    if (!roomId || !view) return
    if (alreadyJoined || attemptedRef.current) return
    if (roomFull) return
    attemptedRef.current = true
    setJoining(true)
    setError(null)
    api
      .joinRoom(roomId)
      .catch((e) => setError((e as Error).message))
      .finally(() => setJoining(false))
  }, [roomId, view, alreadyJoined, roomFull])

  // 4 席ぶんを seat_index 順で構築(view.turnOrder は ゲーム開始まで空なので、self/others の組合せで埋める)
  const seats: SeatData[] = useMemo(() => {
    const out: SeatData[] = []
    const ordered: { id: string; name: string; online: boolean; isCpu: boolean }[] = []
    if (view?.self) {
      ordered.push({
        id: view.self.id,
        name: view.self.name,
        online: view.self.online,
        isCpu: view.self.isCpu,
      })
    }
    view?.others.forEach((o) => {
      ordered.push({ id: o.id, name: o.name, online: o.online, isCpu: o.isCpu })
    })
    for (let i = 0; i < NUM_PLAYERS; i++) {
      const p = ordered[i]
      out.push({
        index: i,
        name: p?.name ?? null,
        isHost: p ? p.id === view?.hostPlayerId : false,
        isYou: p ? p.id === view?.self?.id : false,
        online: p?.online ?? true,
        isCpu: p?.isCpu ?? false,
      })
    }
    return out
  }, [view])

  if (!roomId) return null

  const handleStart = async () => {
    try {
      await api.startGame(roomId)
    } catch (e) {
      alert(`開始失敗: ${(e as Error).message}`)
    }
  }

  const handleBack = () => {
    disconnectSocket()
    leaveRoom()
  }

  const handleAddCpu = async () => {
    if (!roomId) return
    try {
      await api.addCpuPlayers(roomId, { count: 1 })
    } catch (e) {
      alert(`CPU 追加失敗: ${(e as Error).message}`)
    }
  }

  const startBtn = (() => {
    if (!isHost) {
      return (
        <SBtn bg="rgba(26,23,21,0.15)" color={INK_SOFT} size="lg" disabled>
          ホストの開始を待機中...
        </SBtn>
      )
    }
    if (allReady) {
      return (
        <SBtn bg={ACCENT_RED} color={PAPER} size="lg" onClick={handleStart}>
          開始 →
        </SBtn>
      )
    }
    return (
      <SBtn bg="rgba(26,23,21,0.15)" color={INK_SOFT} size="lg" disabled>
        開始 (あと {NUM_PLAYERS - playerCount} 人)
      </SBtn>
    )
  })()

  return (
    <ScreenFrame>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          type="button"
          onClick={handleBack}
          style={{
            all: "unset",
            cursor: "pointer",
            fontFamily: FONT_BODY,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          ← 退出
        </button>
      </div>

      <div style={{ textAlign: "center", marginTop: 22 }}>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: INK_SOFT }}>ルームID</div>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(roomId)
              setCopied(true)
              window.setTimeout(() => setCopied(false), 1500)
            } catch {
              // clipboard 拒否時はフィードバックなし(モバイル HTTP では失敗することがある)
            }
          }}
          aria-label="ルーム ID をコピー"
          style={{
            all: "unset",
            cursor: "pointer",
            display: "inline-block",
            marginTop: 8,
          }}
        >
          <RoomIdDisplay value={roomId} size="lg" muted={allReady} />
        </button>
        <div
          style={{
            fontFamily: FONT_BODY,
            fontSize: 12,
            marginTop: 8,
            fontWeight: 600,
            color: copied ? ACCENT_GREEN : isHost && !allReady ? ACCENT_RED : INK_SOFT,
            minHeight: 18,
          }}
        >
          {copied
            ? "✓ コピーしました"
            : isHost && !allReady
              ? "⧉ タップでコピーして仲間に共有"
              : null}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <div style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: 600 }}>
            席 ({NUM_PLAYERS}人)
          </div>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 12,
              color: allReady ? ACCENT_GREEN : INK_SOFT,
              fontWeight: 700,
            }}
          >
            {playerCount} / {NUM_PLAYERS}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {seats.map((s) => (
            <Seat key={s.index} seat={s} ready={allReady} />
          ))}
        </div>
      </div>

      {!alreadyJoined && (
        <div
          style={{
            fontFamily: FONT_BODY,
            fontSize: 12,
            color: error ? ACCENT_RED : INK_SOFT,
            marginTop: 14,
            textAlign: "center",
          }}
        >
          {joining && "参加処理中..."}
          {!joining && roomFull && !error && "満員のため参加できません"}
          {!joining && error && `参加失敗: ${error}`}
        </div>
      )}

      {alreadyJoined && allReady && (
        <SBox
          bg="rgba(46,85,116,0.10)"
          stroke={ACCENT_BLUE}
          sw={1.5}
          style={{ marginTop: 14, padding: "10px 12px" }}
        >
          <div
            style={{
              fontFamily: FONT_BODY,
              fontSize: 12,
              color: INK,
              lineHeight: 1.5,
              textAlign: "center",
            }}
          >
            全員、揃った。
            {!isHost && " 主催者の開始を待っています…"}
          </div>
        </SBox>
      )}

      {isHost && !allReady && alreadyJoined && (
        <div style={{ marginTop: 14 }}>
          <SBtn bg={PAPER} color={INK} size="md" onClick={handleAddCpu} style={{ width: "100%" }}>
            + CPU 1人
          </SBtn>
        </div>
      )}

      <div style={{ marginTop: 24 }}>{startBtn}</div>
    </ScreenFrame>
  )
}
