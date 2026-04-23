import { useStore } from "../store.js"
import { connectSocket, disconnectSocket } from "../socket.js"
import * as api from "../api.js"

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

  return (
    <div style={{ padding: 24 }}>
      <h1>Bluff Auction</h1>
      <h2>ゲーム終了</h2>
      <div
        style={{
          padding: 24,
          border: "2px solid #2a8",
          background: "#effff4",
          borderRadius: 8,
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 22 }}>
          勝者: <strong>{winnerName}</strong>
          {isSelfWinner && " 🎉"}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={handleCreateNewRoom} style={{ padding: 10 }}>
          新ルーム作成(再戦)
        </button>
        <button type="button" onClick={handleBackToList} style={{ padding: 10 }}>
          ルーム一覧へ戻る
        </button>
      </div>
    </div>
  )
}
