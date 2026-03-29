FROM node:22-alpine AS builder

RUN npm install -g pnpm@10

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile --filter api...

COPY apps/api ./apps/api

RUN pnpm --filter api build

RUN pnpm install --frozen-lockfile --filter api... --prod

FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules

RUN mkdir -p /data

EXPOSE 4000

CMD ["sh", "-c", "mkdir -p /data && node apps/api/dist/index.js"]
