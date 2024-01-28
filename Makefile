.PHONY: traefik-up
traefik-up: ## run traefik
	docker-compose -f docker-compose.traefik.yml up --build -d

.PHONY: up
up: traefik-up app-build-up ## build and run all

.PHONY: app-build-up
app-build-up: ## build and run app
	docker-compose -f docker-compose.yml up --build -d