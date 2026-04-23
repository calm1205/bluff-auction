-- コレクション領域を廃止し、手札に統合
UPDATE "cards" SET "location" = 'hand' WHERE "location" = 'collection';
