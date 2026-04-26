import { useState } from "react"
import { socket } from "../../socket.js"
import { useStore } from "../../store.js"

export function BiddingForm() {
  const view = useStore((s) => s.view)!
  const self = view.self!
  const a = view.currentAuction!
  const minBid = a.highestBidderId === null ? a.startingBid : a.currentBid + 1
  const [amount, setAmount] = useState(minBid)

  const submitBid = () => {
    socket.emit("bid", { amount }, (res) => {
      if (!res.ok) alert(`入札失敗: ${res.message}`)
    })
  }
  const submitPass = () => {
    socket.emit("pass", (res) => {
      if (!res.ok) alert(`パス失敗: ${res.message}`)
    })
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input
        type="number"
        min={minBid}
        max={self.cash}
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
      />
      <button type="button" onClick={submitBid}>
        入札
      </button>
      <button type="button" onClick={submitPass}>
        パス
      </button>
    </div>
  )
}
