import { RulesLink } from "./RulesLink.js"

type Props = {
  onShow: () => void
  variant: "pill" | "corner"
  hidden: boolean
}

// Home 画面では下部 pill、ロビー画面では右下 corner として配置する固定ランチャー
export function RulesLauncher({ onShow, variant, hidden }: Props) {
  if (hidden) return null
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        zIndex: 40,
        pointerEvents: "none",
      }}
    >
      <div style={{ pointerEvents: "auto" }}>
        <RulesLink variant={variant} onClick={onShow} />
      </div>
    </div>
  )
}
