const USER_ID_KEY = "bluff-auction.userId"

export function getStoredUserId(): string | null {
  try {
    return localStorage.getItem(USER_ID_KEY)
  } catch {
    return null
  }
}

export function setStoredUserId(id: string): void {
  try {
    localStorage.setItem(USER_ID_KEY, id)
  } catch {
    // noop
  }
}

export function clearUserStorage(): void {
  try {
    localStorage.removeItem(USER_ID_KEY)
  } catch {
    // noop
  }
}
