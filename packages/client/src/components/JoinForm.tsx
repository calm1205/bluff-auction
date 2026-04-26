import { useState } from "react"
import { useStore } from "../store.js"
import { connectSocket } from "../socket.js"
import {
  ACCENT_BLUE,
  ACCENT_RED,
  FONT_BODY,
  FONT_MONO,
  FONT_SERIF,
  INK,
  INK_SOFT,
  PAPER,
  PAPER_WARM,
  SBox,
  SBtn,
  ScreenFrame,
} from "../sketch/index.js"

const PASSPHRASE_LENGTH = 4

export function JoinForm() {
  const setRoomId = useStore((s) => s.setRoomId)
  const setLobbyMode = useStore((s) => s.setLobbyMode)
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)

  const normalized = value.trim().toUpperCase()
  const filled = normalized.length === PASSPHRASE_LENGTH

  const handleSubmit = () => {
    if (!filled) {
      setError("4 文字で入力")
      return
    }
    setError(null)
    try {
      connectSocket(normalized)
      setRoomId(normalized)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const handleBack = () => setLobbyMode("idle")

  const handlePaste = async () => {
    try {
      const txt = await navigator.clipboard.readText()
      setValue(txt.trim().slice(0, PASSPHRASE_LENGTH).toUpperCase())
    } catch {
      // noop (clipboard 拒否は無視)
    }
  }

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
          ← もどる
        </button>
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 11,
            letterSpacing: 2,
            color: INK_SOFT,
          }}
        >
          GUEST · 1 / 1
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <div
          style={{
            fontFamily: FONT_SERIF,
            fontSize: 28,
            fontWeight: 800,
            lineHeight: 1.15,
          }}
        >
          合言葉を入力
        </div>
        <div
          style={{
            fontFamily: FONT_BODY,
            fontSize: 12,
            color: INK_SOFT,
            marginTop: 6,
          }}
        >
          主催者から共有された 4 文字の合言葉
        </div>
      </div>

      <div style={{ marginTop: 28 }}>
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 9,
            letterSpacing: 2,
            color: INK_SOFT,
            marginBottom: 6,
          }}
        >
          ROOM ID
        </div>
        <SBox
          bg={PAPER_WARM}
          stroke={error ? ACCENT_RED : INK}
          sw={error ? 2 : 1.5}
          style={{ padding: "16px 18px" }}
        >
          <input
            type="text"
            placeholder="例: AB7K"
            value={value}
            onChange={(e) => {
              setError(null)
              setValue(e.target.value.toUpperCase().slice(0, PASSPHRASE_LENGTH))
            }}
            maxLength={PASSPHRASE_LENGTH}
            style={{
              all: "unset",
              fontFamily: FONT_MONO,
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: 12,
              color: error ? ACCENT_RED : INK,
              textAlign: "center",
              width: "100%",
              boxSizing: "border-box",
            }}
          />
        </SBox>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 6,
            fontFamily: FONT_BODY,
            fontSize: 11,
            color: INK_SOFT,
          }}
        >
          <span>
            {normalized.length} / {PASSPHRASE_LENGTH}
          </span>
          <button
            type="button"
            onClick={handlePaste}
            style={{
              all: "unset",
              cursor: "pointer",
              color: ACCENT_BLUE,
              fontWeight: 600,
            }}
          >
            ⧉ ペースト
          </button>
        </div>
      </div>

      <div style={{ minHeight: 36, marginTop: 14, display: "flex", justifyContent: "center" }}>
        {error && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 10px",
              background: "rgba(196,62,42,0.12)",
              border: `1.5px solid ${ACCENT_RED}`,
              borderRadius: 4,
            }}
          >
            <span
              style={{
                fontFamily: FONT_SERIF,
                fontSize: 14,
                fontWeight: 800,
                color: ACCENT_RED,
              }}
            >
              ×
            </span>
            <span
              style={{
                fontFamily: FONT_BODY,
                fontSize: 12,
                color: ACCENT_RED,
                fontWeight: 600,
              }}
            >
              {error}
            </span>
          </div>
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        <SBtn
          bg={filled ? INK : "rgba(26,23,21,0.15)"}
          color={filled ? PAPER : INK_SOFT}
          size="lg"
          onClick={handleSubmit}
          disabled={!filled}
        >
          部屋に入る →
        </SBtn>
      </div>
    </ScreenFrame>
  )
}
