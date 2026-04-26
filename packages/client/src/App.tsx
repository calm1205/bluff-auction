import { useEffect, useState } from "react"
import { socket } from "./socket.js"
import { useStore } from "./store.js"
import { Lobby } from "./components/lobby/Lobby.js"
import { AuctionBoard } from "./components/auction/AuctionBoard.js"
import { Home } from "./components/lobby/Home.js"
import { JoinForm } from "./components/lobby/JoinForm.js"
import { NameRegister } from "./components/lobby/NameRegister.js"
import { UserBadge } from "./components/UserBadge.js"
import { EndedScreen } from "./components/auction/EndedScreen.js"
import { Rules } from "./components/rules/Rules.js"
import { RulesLauncher } from "./components/RulesLauncher.js"
import * as api from "./api.js"
import { clearPlayerStorage, getStoredPlayerId } from "./utils/playerId.js"

type AuthStatus = "loading" | "missing" | "verified" | "error"

export function App() {
  const roomId = useStore((s) => s.roomId)
  const userName = useStore((s) => s.userName)
  const lobbyMode = useStore((s) => s.lobbyMode)
  const view = useStore((s) => s.view)
  const setUserName = useStore((s) => s.setUserName)
  const setView = useStore((s) => s.setView)
  const setRevealed = useStore((s) => s.setRevealed)
  const setWinner = useStore((s) => s.setWinner)
  const setError = useStore((s) => s.setError)

  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading")
  const [authError, setAuthError] = useState<string | null>(null)
  const [retryNonce, setRetryNonce] = useState(0)
  const [showRules, setShowRules] = useState(false)

  // 起動時の整合性チェック
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const storedId = getStoredPlayerId()
      if (!storedId) {
        if (!cancelled) setAuthStatus("missing")
        return
      }
      try {
        const me = await api.getMyPlayer()
        if (cancelled) return
        setUserName(me.name)
        setAuthStatus("verified")
      } catch (e) {
        if (cancelled) return
        if (e instanceof api.HttpError && e.status === 404) {
          // RDB に該当 player なし。localStorage の playerId を削除して再登録へ
          clearPlayerStorage()
          setUserName(null)
          setAuthStatus("missing")
        } else {
          setAuthError((e as Error).message)
          setAuthStatus("error")
        }
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [retryNonce, setUserName])

  // Socket イベント購読
  useEffect(() => {
    socket.on("view-update", (v) => setView(v))
    socket.on("auction-revealed", (r) => setRevealed(r))
    socket.on("game-ended", (p) => setWinner(p.winnerId))
    socket.on("unsold-penalty", (p) => {
      console.log("[unsold-penalty]", p)
    })
    socket.on("error-event", (e) => setError(e.message))

    return () => {
      socket.off("view-update")
      socket.off("auction-revealed")
      socket.off("game-ended")
      socket.off("unsold-penalty")
      socket.off("error-event")
    }
  }, [setView, setRevealed, setWinner, setError])

  if (authStatus === "loading") {
    return <div style={{ padding: 24 }}>読み込み中...</div>
  }

  if (authStatus === "error") {
    return (
      <div style={{ padding: 24 }}>
        <h2>サーバー接続エラー</h2>
        <p>{authError}</p>
        <button
          type="button"
          onClick={() => {
            setAuthStatus("loading")
            setAuthError(null)
            setRetryNonce((n) => n + 1)
          }}
          style={{ padding: 8 }}
        >
          再試行
        </button>
      </div>
    )
  }

  if (authStatus === "missing") {
    return (
      <NameRegister
        onRegistered={(name) => {
          setUserName(name)
          setAuthStatus("verified")
        }}
      />
    )
  }

  const screen = !roomId ? (
    lobbyMode === "join" ? (
      <JoinForm />
    ) : (
      <Home />
    )
  ) : view?.phase === "ended" ? (
    <EndedScreen />
  ) : view?.phase === "lobby" || !view ? (
    <Lobby />
  ) : (
    <AuctionBoard />
  )

  return (
    <>
      <UserBadge name={userName ?? ""} />
      {showRules ? <Rules onClose={() => setShowRules(false)} /> : screen}
      {!showRules && (
        <RulesLauncher
          onShow={() => setShowRules(true)}
          variant={!roomId && lobbyMode === "idle" ? "pill" : "corner"}
          hidden={Boolean(roomId) && view?.phase !== "lobby" && view?.phase !== undefined}
        />
      )}
    </>
  )
}
