.PHONY: ox fmt lint db-gen db-migrate db-reset

# .env があれば読み込み、子プロセスへ export
-include .env
export

ox: fmt lint ## oxfmt + oxlint --fix

fmt: ## oxfmt でフォーマット
	npm run format

lint: ## oxlint --fix
	npm run lint:fix

db-gen: ## schema から新規マイグレーション SQL を生成
	npm run db:generate --workspace=@bluff-auction/server

db-migrate: ## マイグレーションを DB に適用
	npm run db:migrate --workspace=@bluff-auction/server

db-reset: ## RDB の全テーブルを TRUNCATE(スキーマは保持)
	docker compose exec -T postgres psql -U $(POSTGRES_USER) -d $(POSTGRES_DB) \
		-c "TRUNCATE TABLE auctions, cards, players, rooms, users RESTART IDENTITY CASCADE;"
