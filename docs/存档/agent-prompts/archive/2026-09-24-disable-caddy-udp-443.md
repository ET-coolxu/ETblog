---
title: 取消 Caddy 的 UDP 443 宿主发布
type: architecture
status: done
created: 2026-09-24
updated: 2026-09-24
related: []
---

# 取消 Caddy 的 UDP 443 宿主发布

请按本提示词做架构更新。先更新文档与约定，再改代码。实现前先读 `.cursor/rules/project-conventions.mdc`。

## 背景

生产 VPS 上 UDP 443 已从 Caddy（HTTP/3）腾出，给同机的 Hysteria2 绑定。TCP 443 继续提供 HTTPS。VPS 部署脚本会从本仓库检出 `docker-compose.yml`；其中 `443:443/udp` 会在下次 GHCR 部署时把 UDP 443 重新发布给 Caddy，与 Hysteria2 冲突。

## 目标

- 从 `docker-compose.yml`（以及同样发布 `443/udp` 的 compose override）去掉 Caddy 的 UDP 443 宿主端口映射。
- 保留 TCP 80 与 TCP 443。
- 若文档把 HTTP/3 或 UDP 443 写成博客所需，简短改为：本栈有意只走 HTTP/2，HTTP/3 已关闭。

## 非目标

- 不改应用代码、`Caddyfile` 站点块、无关端口。
- 不改 Caddy 镜像、证书、反代目标。
- 不在本仓库配置 Hysteria2。

## 决策

| 决策 | 选择 | 不选 |
|---|---|---|
| HTTP/3 | 不向宿主机发布 `443/udp`，浏览器回落 HTTP/2 | 继续映射 UDP 443，与同机其他服务抢端口 |
| 文档 | 防火墙与上线说明不再要求为博客放行 UDP 443 | 仍写「compose 已映射 HTTP/3」 |

## 约束

- 文章仍以 Markdown 文件为唯一信源。
- 只动 Caddy 服务的端口发布与对应说明。

## 影响面

- 目录/模块：`docker-compose.yml`；`docs/vps-go-live.md`、`docs/coolxu-com-deploy.md`
- 数据流：不变
- 部署：Caddy 不再占用宿主机 UDP 443；TCP 80/443 仍由 Caddy 提供
- 需要同步修改的规则或提示词：无产品约定变更

## 验收标准

- [x] `docker-compose.yml` 不再出现 `443:443/udp` 或等价 UDP 443 宿主发布
- [x] TCP `80:80` 与 `443:443` 仍在
- [x] 上线文档不再要求为博客放行 UDP 443，并说明 HTTP/3 有意关闭
- [x] 未改应用代码与 `Caddyfile` 站点块

## 实现顺序

1. 去掉 Caddy 的 `"443:443/udp"`，并注明为何不发布。
2. 更新 `docs/vps-go-live.md` 与 `docs/coolxu-com-deploy.md` 中的端口表和 ufw 示例。

## 验证

- 检索仓库确认无 compose 仍发布 `443/udp`。
- 对照端口表：TCP 80、TCP 443 保留。
