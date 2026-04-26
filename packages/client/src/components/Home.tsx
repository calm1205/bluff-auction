import { useState } from "react"
import { useStore } from "../store.js"
import { connectSocket } from "../socket.js"
import * as api from "../api.js"

export function Home() {
  const setRoomId = useStore((s) => s.setRoomId)
  const setLobbyMode = useStore((s) => s.setLobbyMode)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleHost = async () => {
    setCreating(true)
    setError(null)
    try {
      const { passphrase } = await api.createRoom()
      connectSocket(passphrase)
      setRoomId(passphrase)
    } catch (e) {
      setError(`ルーム作成失敗: ${(e as Error).message}`)
    } finally {
      setCreating(false)
    }
  }

  const handleJoin = () => {
    setLobbyMode("join")
  }

  return (
    <div style={{ padding: 24, textAlign: "center" }}>
      <h1>Bluff Auction</h1>
      <p style={{ color: "#666" }}>4人対戦カードオークション</p>
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 32 }}>
        <button
          type="button"
          onClick={handleHost}
          disabled={creating}
          style={{ padding: "12px 24px", fontSize: 18 }}
        >
          {creating ? "作成中..." : "主催"}
        </button>
        <button
          type="button"
          onClick={handleJoin}
          disabled={creating}
          style={{ padding: "12px 24px", fontSize: 18 }}
        >
          参加
        </button>
      </div>
      {error && <div style={{ color: "red", marginTop: 16 }}>{error}</div>}
    </div>
  )
}
