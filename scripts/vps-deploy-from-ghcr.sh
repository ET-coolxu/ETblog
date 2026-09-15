#!/usr/bin/env bash
# 从 GHCR 拉取 app 镜像并重启容器。
# 只按 IMAGE_TAG（git SHA）更新 docker-compose.yml / Caddyfile / 本脚本，
# 禁止 git reset --hard 或整库 pull，以免覆盖 VPS 上后台写过的 content/。
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/etblog}"
GHCR_USERNAME="${GHCR_USERNAME:-ET-coolxu}"
REGISTRY="ghcr.io"

usage_missing() {
  echo "用法：IMAGE_TAG=<git sha> GHCR_PULL_TOKEN=<read:packages PAT> $0" >&2
  echo "缺少：$1" >&2
  exit 1
}

# 参数在类型上只是字符串，空值会让 pull/checkout 指错对象。
[ -n "${IMAGE_TAG:-}" ] || usage_missing "IMAGE_TAG"
[ -n "${GHCR_PULL_TOKEN:-}" ] || usage_missing "GHCR_PULL_TOKEN"

cd "$APP_DIR"

# 关闭 xtrace，避免 token 进日志；stdin 传密码，不写在 argv。
set +x
echo "$GHCR_PULL_TOKEN" | docker login "$REGISTRY" -u "$GHCR_USERNAME" --password-stdin
unset GHCR_PULL_TOKEN

echo "已登录 ${REGISTRY}，准备检出 ${IMAGE_TAG} 的 compose / Caddy。"

git fetch origin
# 浅克隆或长期停在旧分支时，再按 SHA 抓一次该提交。
if ! git cat-file -e "${IMAGE_TAG}^{commit}" 2>/dev/null; then
  git fetch origin "${IMAGE_TAG}"
fi

# 只改部署描述文件，不动 content/、uploads、.env。
git checkout "${IMAGE_TAG}" -- docker-compose.yml Caddyfile scripts/vps-deploy-from-ghcr.sh

echo "拉取 ghcr.io/et-coolxu/etblog:${IMAGE_TAG} （不在本机构建）"
IMAGE_TAG="${IMAGE_TAG}" docker compose pull app

# --no-build：即使 compose 里仍有 build，也不要在 1GB VPS 上 next build。
IMAGE_TAG="${IMAGE_TAG}" docker compose up -d --no-build

docker compose ps

if ! docker compose ps --status running --services | grep -qx app; then
  echo "app 未处于 running，部署失败。" >&2
  docker compose logs --tail=80 app
  exit 1
fi

# 3000 不对宿主机开放；能连上 Caddy 的 80 即可。失败只警告，以容器 Up 为准。
if command -v curl >/dev/null 2>&1; then
  http_code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 http://127.0.0.1/ || true)"
  echo "本机 HTTP :80 状态：${http_code:-无法连接}"
fi

echo "部署完成：IMAGE_TAG=${IMAGE_TAG}"
