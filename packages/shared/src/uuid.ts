// このシステムで使う UUID はハイフンなしの 32 文字 16 進文字列(小文字)で統一する
// 標準 v4 形式の "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx" からハイフンを除去したもの
//
// 用途:
// - PlayerId(`players.id` / localStorage)
// - ルーム ID(`rooms.id`)
//
// `crypto.randomUUID()` は secure context(HTTPS / localhost)限定なので、
// LAN IP 経由 HTTP でも動くよう `crypto.getRandomValues()` ベースで v4 を構築。
// クライアント・サーバー(Node 19+)両方で同じ生成器を使う。

export function generateUuid(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  // RFC 4122 v4 の version / variant ビットを設定
  bytes[6] = (bytes[6]! & 0x0f) | 0x40 // version 4
  bytes[8] = (bytes[8]! & 0x3f) | 0x80 // variant 10
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
}
