-- transaction (reveal) フェーズの確認 ack 管理用に auctions.reveal_acked_ids を追加
ALTER TABLE "auctions"
  ADD COLUMN IF NOT EXISTS "reveal_acked_ids" text[] NOT NULL DEFAULT '{}';
