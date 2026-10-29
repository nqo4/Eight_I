# 빌드는 이미지 안에서 끝내고, 컨테이너 시작 명령은 서버 실행만 한다.
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:24-alpine AS builder
WORKDIR /app
ARG RELEASE_ID=dev
ENV RELEASE_ID=$RELEASE_ID
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ARG RELEASE_ID=dev
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    RELEASE_ID=$RELEASE_ID \
    HOSTNAME=0.0.0.0 \
    PORT=3000
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder /app/public ./public
COPY --from=builder /app/data ./data
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
USER app
EXPOSE 3000
CMD ["node", "server.js"]
