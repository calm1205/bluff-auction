import type { Brand, Card, Player } from "./types.js"
import { BRANDS } from "./constants.js"
import { generateUuid } from "./uuid.js"

export function hasFullSet(player: Pick<Player, "hand">): boolean {
  const brands = new Set<Brand>()
  for (const c of player.hand) brands.add(c.brand)
  return brands.size === BRANDS.length
}

export function ownedBrands(player: Pick<Player, "hand">): Set<Brand> {
  const brands = new Set<Brand>()
  for (const c of player.hand) brands.add(c.brand)
  return brands
}

export function buildInitialDeck(playerBrands: Brand[], cardsPerBrand: number): Card[][] {
  // カード ID は UUID(ハイフンなし 32 文字 hex)。意味的な情報(brand)は別カラムで保持
  return playerBrands.map((brand) =>
    Array.from({ length: cardsPerBrand }, () => ({
      id: generateUuid(),
      brand,
    })),
  )
}

export function nextTurnIndex(current: number, total: number): number {
  return (current + 1) % total
}

export function distributeUnsoldPenalty(
  amount: number,
  recipientCount: number,
): { share: number; remainder: number } {
  if (recipientCount <= 0) return { share: 0, remainder: amount }
  const share = Math.floor(amount / recipientCount)
  const remainder = amount - share * recipientCount
  return { share, remainder }
}
