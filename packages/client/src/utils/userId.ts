const STORAGE_KEY = "bluff-auction.userId";

export function getOrCreateUserId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const created = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, created);
    return created;
  } catch {
    // localStorage 不使用環境(プライベートブラウズ等)ではセッション内のみのID
    return crypto.randomUUID();
  }
}

export function clearUserId(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}
