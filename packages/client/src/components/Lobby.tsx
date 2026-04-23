import { useEffect, useRef, useState } from "react"
import { useStore } from "../store.js"
import { NUM_PLAYERS } from "@bluff-auction/shared"
import { disconnectSocket } from "../socket.js"
import * as api from "../api.js"

export function Lobby() {
  const view = useStore((s) => s.view)
  const roomId = useStore((s) => s.roomId)
  const userName = useStore((s) => s.userName)
  const leaveRoom = useStore((s) => s.leaveRoom)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const attemptedRef = useRef(false)

  const alreadyJoined = view?.self != null
  const playerCount = view ? (view.self ? 1 : 0) + view.others.length : 0
  const roomFull = playerCount >= NUM_PLAYERS

  // view 受信後、自動で参加
  useEffect(() => {
    if (!roomId || !view) return
    if (alreadyJoined || attemptedRef.current) return
    if (roomFull) return
    if (!userName) return
    attemptedRef.current = true
    setJoining(true)
    setError(null)
    api
      .joinRoom(roomId, userName)
      .catch((e) => {
        setError((e as Error).message)
      })
      .finally(() => setJoining(false))
  }, [roomId, view, alreadyJoined, roomFull, userName])

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
        ← ルーム一覧へ戻る
      </button>
      <h2>ロビー</h2>
      <div style={{ fontFamily: "monospace", fontSize: 12, color: "#666", marginBottom: 8 }}>
        ルーム: {roomId}
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
        {view?.self && <li>{view.self.name}(自分)</li>}
        {view?.others.map((p) => (
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>

      {alreadyJoined && playerCount === NUM_PLAYERS && (
        <button type="button" onClick={handleStart} style={{ padding: 12, fontSize: 16 }}>
          ゲーム開始
        </button>
      )}
    </div>
  )
}
