# ---------- builder ----------
FROM node:20-alpine AS builder
WORKDIR /app

# 패키지 매니저 설정 파일 우선 복사 (캐시 최적화)
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* .npmrc* .yarnrc.yml ./

# 의존성 설치 (npm 우선, 다른 잠금 파일은 무시)
RUN if [ -f package-lock.json ]; then npm ci; \
    elif [ -f yarn.lock ]; then corepack enable && yarn install --frozen-lockfile; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable && pnpm install --frozen-lockfile; \
    else npm install; fi

# 소스 복사
COPY . .

# ---------- runtime ----------
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# 실행에 필요한 파일만 복사
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.yarnrc.yml ./
COPY --from=builder /app/ .

# 데이터 디렉토리 준비
RUN mkdir -p /app/data && chown -R node:node /app/data

# 비루트 사용자로 실행
USER node

# 기본 포트 (Fastify 서버)
EXPOSE 3000

# 애플리케이션 시작
CMD ["node", "index.js"]
