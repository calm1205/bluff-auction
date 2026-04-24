const PLAYER_ID_KEY = "bluff-auction.playerId"

export function getStoredPlayerId(): string | null {
  try {
    return localStorage.getItem(PLAYER_ID_KEY)
  } catch {
    return null
  }
}

export function setStoredPlayerId(id: string): void {
  try {
    localStorage.setItem(PLAYER_ID_KEY, id)
  } catch {
    // noop
  }
}

export function clearPlayerStorage(): void {
  try {
    localStorage.removeItem(PLAYER_ID_KEY)
  } catch {
    // noop
  }
}
