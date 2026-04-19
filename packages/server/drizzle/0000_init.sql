CREATE TABLE IF NOT EXISTS "rooms" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"phase" text DEFAULT 'lobby' NOT NULL,
	"turn_index" integer DEFAULT 0 NOT NULL,
	"turn_order" text[] DEFAULT '{}' NOT NULL,
	"winner_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "players" (
	"room_id" text NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"brand" text,
	"cash" integer DEFAULT 0 NOT NULL,
	"fakes_used" integer DEFAULT 0 NOT NULL,
	"passed" boolean DEFAULT false NOT NULL,
	"online" boolean DEFAULT true NOT NULL,
	"seat_index" integer NOT NULL,
	CONSTRAINT "players_room_id_user_id_pk" PRIMARY KEY("room_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cards" (
	"id" text PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"brand" text NOT NULL,
	"holder_id" text,
	"location" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auctions" (
	"room_id" text PRIMARY KEY NOT NULL,
	"seller_id" text NOT NULL,
	"card_id" text NOT NULL,
	"declared_brand" text NOT NULL,
	"starting_bid" integer NOT NULL,
	"current_bid" integer NOT NULL,
	"highest_bidder_id" text,
	"passed_player_ids" text[] DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "players" ADD CONSTRAINT "players_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cards" ADD CONSTRAINT "cards_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "auctions" ADD CONSTRAINT "auctions_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "auctions" ADD CONSTRAINT "auctions_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
