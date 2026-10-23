FROM node:22-alpine AS base

# 固定 2026-10，不按当月更换。下载失败或 SHA1 不符则本阶段失败，避免打出没有地址库的镜像。
# 不从构建上下文带入 *.mmdb。
FROM base AS geo
WORKDIR /geo
RUN set -eu \
  && apk add --no-cache curl \
  && curl -fsSL --retry 5 --retry-delay 2 \
       -o dbip-city-lite.mmdb.gz \
       "https://download.db-ip.com/free/dbip-city-lite-2026-10.mmdb.gz" \
  && gzip -t dbip-city-lite.mmdb.gz \
  && gzip -dc dbip-city-lite.mmdb.gz > dbip-city-lite.mmdb \
  && rm dbip-city-lite.mmdb.gz \
  && printf '%s  %s\n' "df17bd24390108ed1d24dcb7718dc60f6b9abd4f" "dbip-city-lite.mmdb" > dbip-city-lite.mmdb.sha1 \
  && sha1sum -c dbip-city-lite.mmdb.sha1 \
  && rm dbip-city-lite.mmdb.sha1

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
# 地区库不放 data/。./data 卷会盖住 /app/data，盖不住 /app/geo。uid 1001 需要能读。
# mmdb 来自上面的构建期下载；NOTICE 从仓库拷入。不要依赖上下文里的 mmdb。
COPY --from=geo --chown=nextjs:nodejs /geo/dbip-city-lite.mmdb ./geo/dbip-city-lite.mmdb
COPY --chown=nextjs:nodejs geo/NOTICE ./geo/NOTICE

RUN mkdir -p content public/uploads data \
  && chown -R nextjs:nodejs content public/uploads data

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
