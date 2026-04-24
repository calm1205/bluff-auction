-- players.user_id → players.id(userId 概念廃止、Player 単位の識別子として統一)
ALTER TABLE "players" RENAME COLUMN "user_id" TO "id";
ALTER TABLE "players" RENAME CONSTRAINT "players_room_id_user_id_pk" TO "players_room_id_id_pk";
