.PHONY: traefik-up
traefik-up: ## run traefik
	docker-compose -f docker-compose.traefik.yml up --build -d

.PHONY: up
up: traefik-up app-build-up ## build and run all

.PHONY: app-build-up
app-build-up: ## build and run app
	docker-compose -f docker-compose.yml up --build -d


.PHONY: traefik-down
traefik-down: ## down traefik
	docker-compose -f docker-compose.traefik.yml down

.PHONY: app-down
app-down: ## down app
	docker-compose -f docker-compose.yml down

.PHONY: down
down: traefik-down app-down ## down all

.PHONY: pull
pull: ## git  pull
	git pull

.PHONY: reload
reload: pull down up ## pull & build & run all