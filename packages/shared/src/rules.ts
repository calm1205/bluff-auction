import type { Brand, Card, Player } from './types.js';
import { BRANDS } from './constants.js';

export function hasFullSet(player: Pick<Player, 'hand' | 'collection'>): boolean {
  const brands = new Set<Brand>();
  for (const c of player.hand) brands.add(c.brand);
  for (const c of player.collection) brands.add(c.brand);
  return brands.size === BRANDS.length;
}

export function ownedBrands(player: Pick<Player, 'hand' | 'collection'>): Set<Brand> {
  const brands = new Set<Brand>();
  for (const c of player.hand) brands.add(c.brand);
  for (const c of player.collection) brands.add(c.brand);
  return brands;
}

export function buildInitialDeck(playerBrands: Brand[], cardsPerBrand: number): Card[][] {
  return playerBrands.map((brand, i) =>
    Array.from({ length: cardsPerBrand }, (_, k) => ({
      id: `${brand}-${i}-${k}`,
      brand,
    }))
  );
}

export function nextTurnIndex(current: number, total: number): number {
  return (current + 1) % total;
}

export function distributeUnsoldPenalty(
  amount: number,
  recipientCount: number
): { share: number; remainder: number } {
  if (recipientCount <= 0) return { share: 0, remainder: amount };
  const share = Math.floor(amount / recipientCount);
  const remainder = amount - share * recipientCount;
  return { share, remainder };
}
