import { ACCENT_RED, BRAND_LABEL_JP, FONT_BODY, FONT_SERIF, PAPER } from "../../sketch/index.js"
import type { Brand } from "@bluff-auction/shared"

type Props = {
  sellerName: string
  declaredBrand: Brand
}

// V3 Theater: 「○○ が宣言: 「△△」」の見出し
export function DeclarationBanner({ sellerName, declaredBrand }: Props) {
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
      <div
        style={{
          fontFamily: FONT_SERIF,
          fontSize: 46,
          fontWeight: 800,
          marginTop: -4,
          color: PAPER,
        }}
      >
        「{BRAND_LABEL_JP[declaredBrand]}」
      </div>
      {/* ZigZag アクセント */}
      <div style={{ width: 200, margin: "4px auto 0" }}>
        <div style={{ height: 2, background: ACCENT_RED }} />
        <div style={{ height: 3 }} />
        <div style={{ height: 1, background: ACCENT_RED }} />
      </div>
      <div
        style={{
          fontFamily: FONT_BODY,
          fontSize: 12,
          color: "rgba(246,238,219,0.65)",
          marginTop: 6,
        }}
      >
        …本当かどうかは、誰にもわからない
      </div>
    </div>
  )
}
