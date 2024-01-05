####
FROM node:20.2-alpine3.18 AS base
#FROM node:alpine3.18	# https://github.com/nodejs/docker-node/issues/1912

WORKDIR /app

COPY . .
RUN npm ci


CMD ["npm", "run", "start"]
