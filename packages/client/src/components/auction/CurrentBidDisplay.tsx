import { ACCENT_GOLD, FONT_BODY, FONT_MONO, FONT_SERIF } from "../../sketch/index.js"

type Props = {
  startingBid: number
  currentBid: number
  highestBidderName: string | null
}

// V3 Theater: 中央下に大きく現在最高入札を表示
export function CurrentBidDisplay({ startingBid, currentBid, highestBidderName }: Props) {
  const noBids = highestBidderName === null
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 10,
          letterSpacing: 3,
          color: "rgba(246,238,219,0.5)",
        }}
      >
        {noBids ? "STARTING BID" : "CURRENT BID"}
      </div>
      <div
        style={{
          fontFamily: FONT_SERIF,
          fontSize: 46,
          fontWeight: 800,
          color: ACCENT_GOLD,
          lineHeight: 1,
        }}
      >
        ${noBids ? startingBid : currentBid}
      </div>
      <div
        style={{
          fontFamily: FONT_BODY,
          fontSize: 12,
          color: "rgba(246,238,219,0.7)",
          marginTop: 2,
        }}
      >
        {noBids ? "まだ誰も入札していない" : `by ${highestBidderName}`}
      </div>
    </div>
  )
}
