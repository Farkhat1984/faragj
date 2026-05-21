# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

RUN npm prune --omit=dev

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

RUN apk add --no-cache su-exec

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN mkdir -p /app/data \
 && chown -R node:node /app \
 && chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/api/health >/dev/null 2>&1 || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server/dist/index.js"]
