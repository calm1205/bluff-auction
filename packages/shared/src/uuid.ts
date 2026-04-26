// このシステムで使う UUID はハイフンなしの 32 文字 16 進文字列(小文字)で統一する
// 標準 v4 形式の "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx" からハイフンを除去したもの
//
// 用途:
// - PlayerId(`players.id` / localStorage)
//
// crypto.randomUUID() は Web Crypto / Node 19+ の両方で利用可能なため、
// shared から呼び出してクライアント・サーバー双方で同じ生成器を使う。

export function generateUuid(): string {
  return crypto.randomUUID().replace(/-/g, "").toLowerCase()
}
