import { ACCENT_RED, FONT_SERIF } from "../../sketch/index.js"

type Props = {
  sellerName: string
}

// V3 Theater: 「○○ が宣言:」の見出し (ブランド名はカード画像で視覚提示)
export function DeclarationBanner({ sellerName }: Props) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontFamily: FONT_SERIF,
          fontSize: 18,
          color: "rgba(246,238,219,0.6)",
        }}
      >
        {sellerName} が宣言:
      </div>
      {/* ZigZag アクセント */}
      <div style={{ width: 200, margin: "4px auto 0" }}>
        <div style={{ height: 2, background: ACCENT_RED }} />
        <div style={{ height: 3 }} />
        <div style={{ height: 1, background: ACCENT_RED }} />
      </div>
    </div>
  )
}
