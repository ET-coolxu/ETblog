FROM node:22-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* .npmrc* ./
RUN if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; \
  elif [ -f yarn.lock ]; then corepack enable yarn && yarn install --frozen-lockfile; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm install --frozen-lockfile; \
  else npm install --no-audit --no-fund; \
  fi

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# .dockerignore 排除 .env，预渲染页在 build 时读这些值；不要把密码做成 ARG。
ARG SITE_NAME=个人博客
ARG AUTHOR_NAME=作者
ARG SITE_URL=http://localhost:3000
ENV SITE_NAME=$SITE_NAME
ENV AUTHOR_NAME=$AUTHOR_NAME
ENV SITE_URL=$SITE_URL
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# 镜像默认与构建时一致；compose 的 env_file 会在运行时覆盖，供动态路由使用。
ARG SITE_NAME=个人博客
ARG AUTHOR_NAME=作者
ARG SITE_URL=http://localhost:3000
ENV SITE_NAME=$SITE_NAME
ENV AUTHOR_NAME=$AUTHOR_NAME
ENV SITE_URL=$SITE_URL

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
RUN mkdir .next && chown nextjs:nodejs .next
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

RUN mkdir -p content public/uploads data \
  && chown -R nextjs:nodejs content public/uploads data

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
