####
# FROM node:20.2-alpine3.18 AS base
#FROM node:alpine3.18	# https://github.com/nodejs/docker-node/issues/1912
FROM node:20-bookworm-slim AS base

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci
  
COPY . .

CMD ["npm", "run", "start"]
