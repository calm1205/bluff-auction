// 合言葉(ルーム識別子)生成ユーティリティ
// 4 文字 / 大文字英字 + 数字、混同しやすい 0 O 1 I L を除外

import { randomInt } from "node:crypto"

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"
export const PASSPHRASE_LENGTH = 4
export const PASSPHRASE_REGEX = new RegExp(`^[${ALPHABET}]{${PASSPHRASE_LENGTH}}$`)

export function generatePassphrase(): string {
  let s = ""
  for (let i = 0; i < PASSPHRASE_LENGTH; i++) {
    s += ALPHABET[randomInt(0, ALPHABET.length)]
  }
  return s
}

// 入力 → uppercase 化(クライアント大小区別なし)
export function normalizePassphrase(input: string): string {
  return input.toUpperCase()
}

export function isValidPassphrase(input: string): boolean {
  return PASSPHRASE_REGEX.test(input)
}
