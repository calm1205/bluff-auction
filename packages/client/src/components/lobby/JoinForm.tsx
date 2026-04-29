import { useState } from "react"
import { useStore } from "../../store.js"
import { connectSocket } from "../../socket.js"
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
} from "../../sketch/index.js"

const UUID_LENGTH = 32
const UUID_REGEX = /^[0-9a-f]{32}$/

export function JoinForm() {
  const setRoomId = useStore((s) => s.setRoomId)
  const setLobbyMode = useStore((s) => s.setLobbyMode)
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/-/g, "") // ハイフン入りで貼られた場合に備えて除去
    .slice(0, UUID_LENGTH)
  const filled = normalized.length === UUID_LENGTH
  const valid = filled && UUID_REGEX.test(normalized)

  const handleSubmit = () => {
    if (!valid) {
      setError("32 文字の hex で入力")
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
      setValue(txt)
    } catch {
      // noop
    }
  }

  // 8 文字 × 4 ブロック表示用
  const chunks = normalized.length > 0 ? (normalized.match(/.{1,8}/g) ?? []) : []

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
          ルームID を入力
        </div>
        <div
          style={{
            fontFamily: FONT_BODY,
            fontSize: 12,
            color: INK_SOFT,
            marginTop: 6,
          }}
        >
          主催者から共有された 32 文字の ID
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        <SBox
          bg={PAPER_WARM}
          stroke={error ? ACCENT_RED : INK}
          sw={error ? 2 : 1.5}
          style={{ padding: "10px 12px", minHeight: 64 }}
        >
          <textarea
            placeholder="a3f7b2c14e8d4f99b2018c5e6f3d92a7"
            value={value}
            onChange={(e) => {
              setError(null)
              setValue(e.target.value)
            }}
            rows={2}
            style={{
              all: "unset",
              fontFamily: FONT_MONO,
              fontSize: 16, // iOS の自動ズーム回避(>=16px)
              fontWeight: 600,
              letterSpacing: 0.5,
              color: error ? ACCENT_RED : INK,
              width: "100%",
              boxSizing: "border-box",
              wordBreak: "break-all",
              lineHeight: 1.5,
              resize: "none",
            }}
          />
          {chunks.length > 0 && !error && (
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 11,
                color: INK_SOFT,
                marginTop: 6,
                lineHeight: 1.4,
                wordBreak: "break-all",
              }}
            >
              {chunks.map((c, i) => (
                <span key={i} style={{ marginRight: 6 }}>
                  {c}
                </span>
              ))}
            </div>
          )}
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
            {normalized.length} / {UUID_LENGTH}
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
          bg={valid ? INK : "rgba(26,23,21,0.15)"}
          color={valid ? PAPER : INK_SOFT}
          size="lg"
          onClick={handleSubmit}
          disabled={!valid}
        >
          部屋に入る →
        </SBtn>
      </div>
    </ScreenFrame>
  )
}
