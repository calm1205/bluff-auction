-- rooms.id を UUID(ハイフンなし 32 文字 hex)に統一し、合言葉は別カラム passphrase に分離
-- 既存ルーム / 関連ゲーム状態は破棄(プロトタイプ前提、cascade)

TRUNCATE TABLE "rooms" CASCADE;
--> statement-breakpoint
ALTER TABLE "rooms" ALTER COLUMN "id" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "passphrase" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_passphrase_unique" UNIQUE ("passphrase");
