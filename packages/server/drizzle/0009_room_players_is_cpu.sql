-- CPU プレイヤー識別用に room_players.is_cpu を追加
ALTER TABLE "room_players"
  ADD COLUMN IF NOT EXISTS "is_cpu" boolean NOT NULL DEFAULT false;
