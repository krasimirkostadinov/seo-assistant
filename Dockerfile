FROM node:22-alpine

RUN npm install -g pnpm@10

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile

COPY apps/api ./apps/api

RUN pnpm --filter api build

RUN mkdir -p /data

EXPOSE 4000

CMD ["sh", "-c", "pnpm --filter api db:push && node apps/api/dist/index.js"]
