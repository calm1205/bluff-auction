import { useState } from "react"
import { useStore } from "../../store.js"
import { connectSocket } from "../../socket.js"
import * as api from "../../api.js"
import {
  ACCENT_RED,
  FONT_BODY,
  FONT_SERIF,
  INK,
  INK_SOFT,
  PAPER,
  PAPER_WARM,
  SBox,
  ScreenFrame,
  Gavel,
} from "../../sketch/index.js"

export function Home() {
  const setRoomId = useStore((s) => s.setRoomId)
  const setLobbyMode = useStore((s) => s.setLobbyMode)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleHost = async () => {
    setCreating(true)
    setError(null)
    try {
      const { id } = await api.createRoom()
      connectSocket(id)
      setRoomId(id)
    } catch (e) {
      setError(`ルーム作成失敗: ${(e as Error).message}`)
    } finally {
      setCreating(false)
    }
  }

  const handleJoin = () => setLobbyMode("join")

  return (
    <ScreenFrame>
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Gavel size={104} />
        </div>
        <div
          style={{
            fontFamily: FONT_SERIF,
            fontSize: 15,
            color: INK_SOFT,
            fontStyle: "italic",
            marginTop: 4,
          }}
        >
          welcome to
        </div>
        <div
          style={{
            fontFamily: FONT_SERIF,
            fontSize: 34,
            fontWeight: 800,
            marginTop: 2,
            letterSpacing: 1,
          }}
        >
          BLUFF <span style={{ color: ACCENT_RED }}>AUCTION</span>
        </div>
        <div
          style={{
            width: 200,
            height: 1.5,
            background: INK,
            margin: "8px auto 0",
          }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 32 }}>
        <button
          type="button"
          onClick={handleHost}
          disabled={creating}
          style={{
            all: "unset",
            cursor: creating ? "wait" : "pointer",
            display: "block",
            opacity: creating ? 0.7 : 1,
          }}
        >
          <SBox bg={PAPER_WARM} stroke={INK} sw={2} style={{ height: 116 }}>
            <div
              style={{
                padding: "14px 16px",
                height: "100%",
                display: "flex",
                gap: 12,
                alignItems: "center",
                boxSizing: "border-box",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONT_SERIF, fontSize: 24, fontWeight: 800 }}>主催</div>
                <div
                  style={{
                    fontFamily: FONT_BODY,
                    fontSize: 12,
                    color: INK_SOFT,
                    marginTop: 4,
                    lineHeight: 1.4,
                  }}
                >
                  {creating ? "作成中..." : "新しい卓を開いて\nルームID を仲間に配る"}
                </div>
              </div>
              <div style={{ fontFamily: FONT_SERIF, fontSize: 22, color: ACCENT_RED }}>→</div>
            </div>
          </SBox>
        </button>

        <button
          type="button"
          onClick={handleJoin}
          disabled={creating}
          style={{ all: "unset", cursor: "pointer", display: "block" }}
        >
          <SBox bg="#2b2320" stroke={INK} sw={2} style={{ height: 116 }}>
            <div
              style={{
                padding: "14px 16px",
                height: "100%",
                display: "flex",
                gap: 12,
                alignItems: "center",
                color: PAPER,
                boxSizing: "border-box",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONT_SERIF, fontSize: 24, fontWeight: 800 }}>参加</div>
                <div
                  style={{
                    fontFamily: FONT_BODY,
                    fontSize: 12,
                    color: "rgba(246,238,219,0.7)",
                    marginTop: 4,
                    lineHeight: 1.4,
                  }}
                >
                  仲間から聞いた{"\n"}ルームID を入れる
                </div>
              </div>
              <div style={{ fontFamily: FONT_SERIF, fontSize: 22 }}>→</div>
            </div>
          </SBox>
        </button>
      </div>

      {error && (
        <div
          style={{
            color: ACCENT_RED,
            marginTop: 16,
            textAlign: "center",
            fontFamily: FONT_BODY,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          textAlign: "center",
          fontFamily: FONT_BODY,
          fontSize: 11,
          color: INK_SOFT,
          marginTop: 40,
        }}
      >
        v1.0 · 4人で遊ぶ · 約20分
      </div>
    </ScreenFrame>
  )
}
