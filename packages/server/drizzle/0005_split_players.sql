-- players を「身元マスター」と「ルーム所属+ゲーム状態」に分割
-- 旧 players: (room_id, id) PK + name + ゲーム状態
-- 新 players: id PK + name + created_at(身元マスター)
-- 新 room_players: (room_id, player_id) PK + ゲーム状態

-- 1. 新マスター(一時名で作成)
CREATE TABLE IF NOT EXISTS "players_new" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- 2. ルーム所属 + ゲーム状態
CREATE TABLE IF NOT EXISTS "room_players" (
	"room_id" text NOT NULL,
	"player_id" text NOT NULL,
	"brand" text,
	"cash" integer DEFAULT 0 NOT NULL,
	"fakes_used" integer DEFAULT 0 NOT NULL,
	"passed" boolean DEFAULT false NOT NULL,
	"online" boolean DEFAULT true NOT NULL,
	"seat_index" integer NOT NULL,
	CONSTRAINT "room_players_room_id_player_id_pk" PRIMARY KEY("room_id","player_id")
);
--> statement-breakpoint

-- 3. 既存データ移行: id 一意な (id, name) を新マスターへ
INSERT INTO "players_new" ("id", "name", "created_at")
SELECT DISTINCT ON ("id") "id", "name", now() FROM "players" ORDER BY "id", "room_id";
--> statement-breakpoint

-- 4. 全行を room_players へ(ゲーム状態をそのまま移送)
INSERT INTO "room_players" ("room_id", "player_id", "brand", "cash", "fakes_used", "passed", "online", "seat_index")
SELECT "room_id", "id", "brand", "cash", "fakes_used", "passed", "online", "seat_index" FROM "players";
--> statement-breakpoint

-- 5. 旧 players を破棄
DROP TABLE "players";
--> statement-breakpoint

-- 6. 新マスターを正式名へ
ALTER TABLE "players_new" RENAME TO "players";
--> statement-breakpoint

-- 7. FK 制約付与
DO $$ BEGIN
 ALTER TABLE "room_players" ADD CONSTRAINT "room_players_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "room_players" ADD CONSTRAINT "room_players_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
