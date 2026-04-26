-- ホスト識別子カラム追加(初参加者で確定、以降不変)
ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "host_player_id" text;
