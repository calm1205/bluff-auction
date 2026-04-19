export const NUM_PLAYERS = 4;
export const CARDS_PER_BRAND = 4;
export const INITIAL_CASH = 100;
export const MAX_FAKES_PER_PLAYER = 2;

export const BRANDS = ['painting', 'sculpture', 'pottery', 'jewelry'] as const;

export const BRAND_LABELS: Record<(typeof BRANDS)[number], string> = {
  painting: '絵画',
  sculpture: '彫刻',
  pottery: '陶器',
  jewelry: '宝飾',
};
