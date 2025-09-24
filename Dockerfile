# ---------- builder ----------
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json yarn.lock* .yarnrc.yml ./

RUN corepack enable && yarn install --frozen-lockfile

COPY . .

RUN yarn build

# ---------- runtime ----------
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.yarnrc.yml ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/dist ./dist

USER node

EXPOSE 3000

CMD ["node", "dist/index.js"]
