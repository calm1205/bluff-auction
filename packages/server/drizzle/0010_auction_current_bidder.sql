-- bidding フェーズの手番管理用に auctions.current_bidder_id を追加
ALTER TABLE "auctions"
  ADD COLUMN IF NOT EXISTS "current_bidder_id" text;
