-- players.user_id → players.id(userId 概念廃止、Player 単位の識別子として統一)
-- 既に手動 rename 済みでもエラーにならないよう冪等化
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'players' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE "players" RENAME COLUMN "user_id" TO "id";
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'players_room_id_user_id_pk'
  ) THEN
    ALTER TABLE "players" RENAME CONSTRAINT "players_room_id_user_id_pk" TO "players_room_id_id_pk";
  END IF;
END $$;
