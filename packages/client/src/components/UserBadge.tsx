type Props = {
  name: string
}

export function UserBadge({ name }: Props) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        padding: "6px 16px",
        background: "#222",
        color: "#fff",
        fontSize: 13,
        display: "flex",
        justifyContent: "flex-end",
        zIndex: 10,
      }}
    >
      ログイン中: <strong style={{ marginLeft: 6 }}>{name}</strong>
    </div>
  )
}
