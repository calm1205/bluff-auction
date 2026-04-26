-- 合言葉(rooms.passphrase)を廃止し、ルーム識別子は UUID(rooms.id)のみに統一
ALTER TABLE "rooms" DROP CONSTRAINT IF EXISTS "rooms_passphrase_unique";
ALTER TABLE "rooms" DROP COLUMN IF EXISTS "passphrase";
