import { useState } from "react"
import { setStoredUserId } from "../utils/userId.js"

type Props = {
  initialError?: string | null
  onRegistered: (name: string) => void
}

export function NameRegister({ initialError, onRegistered }: Props) {
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(initialError ?? null)

  const handleSubmit = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError("名前を入力")
      return
    }
    const id = crypto.randomUUID()
    setStoredUserId(id)
    onRegistered(trimmed)
  }

  return (
    <div style={{ padding: 24, maxWidth: 480 }}>
      <h1>Bluff Auction</h1>
      <h2>ユーザー登録</h2>
      <p>プレイヤー名を入力してください(重複可)。</p>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          type="text"
          placeholder="名前"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: 8, fontSize: 16, flex: 1 }}
        />
        <button type="button" onClick={handleSubmit} disabled={!name.trim()} style={{ padding: 8 }}>
          開始
        </button>
      </div>
      {error && <div style={{ color: "red", marginTop: 12 }}>{error}</div>}
    </div>
  )
}
