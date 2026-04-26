import { useState } from "react"
import { useStore } from "../store.js"
import { connectSocket } from "../socket.js"

export function JoinForm() {
  const setRoomId = useStore((s) => s.setRoomId)
  const setLobbyMode = useStore((s) => s.setLobbyMode)
  const [passphrase, setPassphrase] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = () => {
    const trimmed = passphrase.trim().toUpperCase()
    if (trimmed.length !== 4) {
      setError("4 文字で入力")
      return
    }
    setError(null)
    // ルーム参加リクエスト自体は Lobby 画面の自動参加フローに任せる(view-update 受信後に POST)
    // ここでは roomId を設定して socket 接続するだけ
    try {
      connectSocket(trimmed)
      setRoomId(trimmed)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const handleBack = () => {
    setLobbyMode("idle")
  }

  return (
    <div style={{ padding: 24, maxWidth: 480 }}>
      <h1>Bluff Auction</h1>
      <h2>合言葉を入力</h2>
      <input
        type="text"
        placeholder="例: AB7K"
        value={passphrase}
        onChange={(e) => setPassphrase(e.target.value)}
        maxLength={4}
        style={{
          padding: 12,
          fontSize: 24,
          textTransform: "uppercase",
          letterSpacing: 8,
          width: 160,
          textAlign: "center",
        }}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button type="button" onClick={handleBack} style={{ padding: 8 }}>
          戻る
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={passphrase.trim().length !== 4}
          style={{ padding: 8 }}
        >
          参加
        </button>
      </div>
      {error && <div style={{ color: "red", marginTop: 12 }}>{error}</div>}
    </div>
  )
}
