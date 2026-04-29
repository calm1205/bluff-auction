import { useState } from "react"
import { generateUuid } from "@bluff-auction/shared"
import * as api from "../../api.js"
import { setStoredPlayerId } from "../../utils/playerId.js"
import {
  ACCENT_RED,
  FONT_BODY,
  FONT_SERIF,
  INK,
  INK_SOFT,
  PAPER,
  SBtn,
  ScreenFrame,
} from "../../sketch/index.js"

type Props = {
  initialError?: string | null
  onRegistered: (name: string) => void
}

export function NameRegister({ initialError, onRegistered }: Props) {
  const [name, setName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(initialError ?? null)

  const handleSubmit = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError("名前を入力")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const id = generateUuid()
      await api.registerPlayer(id, trimmed)
      setStoredPlayerId(id)
      onRegistered(trimmed)
    } catch (e) {
      setError(`登録失敗: ${(e as Error).message}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ScreenFrame>
      <div style={{ marginTop: 24 }}>
        <div
          style={{
            fontFamily: FONT_SERIF,
            fontSize: 30,
            fontWeight: 800,
            lineHeight: 1.15,
          }}
        >
          名前を入力
        </div>
        <div
          style={{
            fontFamily: FONT_BODY,
            fontSize: 13,
            color: INK_SOFT,
            marginTop: 8,
          }}
        >
          卓で表示される名前.
        </div>
      </div>

      <div style={{ marginTop: 32 }}>
        <div
          style={{
            position: "relative",
            borderBottom: `2px solid ${INK}`,
            paddingBottom: 6,
          }}
        >
          <input
            type="text"
            placeholder="ミドリ"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
            maxLength={16}
            style={{
              all: "unset",
              fontFamily: FONT_SERIF,
              fontSize: 28,
              fontWeight: 700,
              width: "100%",
              background: PAPER,
            }}
          />
        </div>
        <div
          style={{
            fontFamily: FONT_BODY,
            fontSize: 11,
            color: INK_SOFT,
            marginTop: 6,
          }}
        >
          1 文字以上
        </div>
      </div>

      {error && (
        <div
          style={{
            color: ACCENT_RED,
            marginTop: 18,
            fontFamily: FONT_BODY,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ marginTop: 56 }}>
        <SBtn
          bg={INK}
          color={PAPER}
          size="lg"
          disabled={submitting || !name.trim()}
          onClick={handleSubmit}
        >
          {submitting ? "登録中..." : "開始 →"}
        </SBtn>
      </div>
    </ScreenFrame>
  )
}
