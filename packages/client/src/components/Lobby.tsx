import { useEffect, useRef, useState } from "react"
import { useStore } from "../store.js"
import { NUM_PLAYERS } from "@bluff-auction/shared"
import { disconnectSocket } from "../socket.js"
import * as api from "../api.js"

export function Lobby() {
  const view = useStore((s) => s.view)
  const roomId = useStore((s) => s.roomId)
  const leaveRoom = useStore((s) => s.leaveRoom)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const attemptedRef = useRef(false)

  const alreadyJoined = view?.self != null
  const playerCount = view ? (view.self ? 1 : 0) + view.others.length : 0
  const roomFull = playerCount >= NUM_PLAYERS
  const isHost = view?.self != null && view.self.id === view.hostPlayerId

  // view 受信後、自動で参加(名前は players マスターから取得されるためボディ送信不要)
  useEffect(() => {
    if (!roomId || !view) return
    if (alreadyJoined || attemptedRef.current) return
    if (roomFull) return
    attemptedRef.current = true
    setJoining(true)
    setError(null)
    api
      .joinRoom(roomId)
      .catch((e) => {
        setError((e as Error).message)
      })
      .finally(() => setJoining(false))
  }, [roomId, view, alreadyJoined, roomFull])

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

  return (
    <div style={{ padding: 24 }}>
      <h1>Bluff Auction</h1>
      <button type="button" onClick={handleBack} style={{ marginBottom: 12, padding: 6 }}>
        ← 退出
      </button>

      <h2>ロビー</h2>

      <div
        style={{
          margin: "12px 0",
          padding: 16,
          background: "#f5f5f5",
          borderRadius: 8,
          maxWidth: 320,
        }}
      >
        <div style={{ fontSize: 12, color: "#666" }}>合言葉</div>
        <div
          style={{
            fontSize: 36,
            letterSpacing: 8,
            fontFamily: "monospace",
            textAlign: "center",
            marginTop: 4,
          }}
        >
          {roomId}
        </div>
      </div>

      {!alreadyJoined && (
        <div style={{ marginBottom: 12 }}>
          {joining && <span>参加処理中...</span>}
          {!joining && roomFull && <span style={{ color: "#c33" }}>満員のため参加できません</span>}
          {!joining && error && <span style={{ color: "#c33" }}>参加失敗: {error}</span>}
        </div>
      )}

      <h3>
        参加者 ({playerCount}/{NUM_PLAYERS})
      </h3>
      <ul>
        {view?.self && (
          <li>
            {view.self.name}(自分){isHost && " [ホスト]"}
          </li>
        )}
        {view?.others.map((p) => (
          <li key={p.id}>
            {p.name}
            {p.id === view.hostPlayerId && " [ホスト]"}
          </li>
        ))}
      </ul>

      {alreadyJoined && playerCount === NUM_PLAYERS && isHost && (
        <button type="button" onClick={handleStart} style={{ padding: 12, fontSize: 16 }}>
          ゲーム開始
        </button>
      )}
      {alreadyJoined && playerCount === NUM_PLAYERS && !isHost && (
        <div style={{ color: "#666", marginTop: 12 }}>ホストの開始を待機中...</div>
      )}
    </div>
  )
}
