import { useStore } from "../store.js"

export function OpponentList() {
  const view = useStore((s) => s.view)
  if (!view) return null

  const currentSellerId = view.turnOrder[view.turnIndex]

  return (
    <section style={{ marginTop: 16 }}>
      <h3>他プレイヤー</h3>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={cellStyle}>名前</th>
            <th style={cellStyle}>手札</th>
            <th style={cellStyle}>所持金</th>
            <th style={cellStyle}>フェイク使用</th>
            <th style={cellStyle}>状態</th>
          </tr>
        </thead>
        <tbody>
          {view.others.map((p) => (
            <tr key={p.id}>
              <td style={cellStyle}>
                {p.name}
                {p.id === currentSellerId && " (出品中)"}
              </td>
              <td style={cellStyle}>{p.handCount}</td>
              <td style={cellStyle}>${p.cash}</td>
              <td style={cellStyle}>{p.fakesUsed}/2</td>
              <td style={cellStyle}>
                {!p.online && <span style={{ color: "#999" }}>オフライン</span>}
                {p.online && (p.passed ? "パス済み" : "-")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

const cellStyle: React.CSSProperties = {
  border: "1px solid #ccc",
  padding: "6px 10px",
  textAlign: "left",
}
