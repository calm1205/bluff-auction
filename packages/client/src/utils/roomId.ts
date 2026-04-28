const ROOM_ID_KEY = "bluff-auction.roomId"

export function getStoredRoomId(): string | null {
  try {
    return localStorage.getItem(ROOM_ID_KEY)
  } catch {
    return null
  }
}

export function setStoredRoomId(id: string): void {
  try {
    localStorage.setItem(ROOM_ID_KEY, id)
  } catch {
    // noop
  }
}

export function clearStoredRoomId(): void {
  try {
    localStorage.removeItem(ROOM_ID_KEY)
  } catch {
    // noop
  }
}
