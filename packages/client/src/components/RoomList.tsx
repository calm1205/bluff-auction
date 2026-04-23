import { useEffect, useState } from "react"
import { useStore } from "../store.js"
import { connectSocket } from "../socket.js"
import * as api from "../api.js"
import type { RoomSummary } from "../api.js"

const PHASE_LABELS: Record<string, string> = {
  lobby: "ロビー",
  listing: "出品中",
  bidding: "入札中",
  transaction: "取引中",
  ended: "終了",
}

export function RoomList() {
  const setRoomId = useStore((s) => s.setRoomId)
  const [rooms, setRooms] = useState<RoomSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchRooms = async () => {
      try {
        const list = await api.listRooms()
        if (cancelled) return
        setRooms(list)
        setError(null)
      } catch (e) {
        if (cancelled) return
        setError((e as Error).message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchRooms()
    const timer = setInterval(fetchRooms, 3000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  const enterRoom = (id: string) => {
    connectSocket(id)
    setRoomId(id)
  }

  const handleCreate = async () => {
    try {
      const { id } = await api.createRoom()
      enterRoom(id)
    } catch (e) {
      alert(`作成失敗: ${(e as Error).message}`)
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Bluff Auction</h1>
      <h2>ルーム一覧</h2>

      <button onClick={handleCreate} style={{ padding: 8, marginBottom: 16 }}>
        新規ルーム作成
      </button>

      {loading && <div>読み込み中...</div>}
      {error && <div style={{ color: "red" }}>エラー: {error}</div>}
      {!loading && !error && rooms.length === 0 && <div>ルームなし。新規作成してください。</div>}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {rooms.map((r) => (
          <li
            key={r.id}
            style={{
              border: "1px solid #ccc",
              padding: 12,
              marginBottom: 8,
              borderRadius: 4,
            }}
          >
            <div style={{ fontFamily: "monospace", fontSize: 12, color: "#666" }}>{r.id}</div>
            <div style={{ marginTop: 4 }}>
              フェーズ: {PHASE_LABELS[r.phase] ?? r.phase} / 参加者: {r.playerCount}
            </div>
            <button onClick={() => enterRoom(r.id)} style={{ marginTop: 8, padding: 6 }}>
              入室
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
