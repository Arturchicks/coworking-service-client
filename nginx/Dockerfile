# nginx/Dockerfile
# ─────────────────────────────────────────────────────────────────────────────
# Multi-stage build: собирает Vite-bundle фронта и складывает его внутрь
# nginx:alpine. Финальный образ — один процесс nginx, отдающий статику
# + проксирующий /api/* на сервис `api`.
#
# Зачем multi-stage:
#   Stage `builder` содержит node + полный node_modules + dev-зависимости (>200MB).
#   Stage `runner` — только nginx:alpine + готовый dist/ (~25MB). dev-инструменты
#   не попадают в production-образ → меньше размер, меньше surface атаки.
# ─────────────────────────────────────────────────────────────────────────────


# ╔══════════════════════════════════════════════════════════════════════════
# ║  STAGE 1: builder
# ║  Node + pnpm + сборка фронта (vite build → frontend/dist).
# ╚══════════════════════════════════════════════════════════════════════════
FROM node:22-alpine AS builder

# corepack — встроенный в Node менеджер пакет-менеджеров (npm/pnpm/yarn).
# `corepack enable` активирует shim'ы, чтобы команда `pnpm` была доступна
# без глобальной установки. Версия pnpm берётся из packageManager в package.json,
# либо последняя стабильная.
RUN corepack enable

WORKDIR /app

# Копируем сначала только манифесты — намеренно, без остального кода.
# Цель: кэш слоёв Docker. Слой с `pnpm install` пересобирается ТОЛЬКО при изменении
# lock/манифестов; правки исходников не инвалидируют этот слой.
# Ускорение повторных сборок с минут до секунд.
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY frontend/package.json ./frontend/

# --frozen-lockfile = детерминированная установка строго по lockfile, падение при
# рассинхроне с package.json. Аналог `npm ci`. В CI/прод обязателен — гарантирует
# воспроизводимость сборки.
RUN pnpm install --frozen-lockfile --filter frontend...

# Копируем исходники ПОСЛЕ install — изменение кода не инвалидирует слой install.
COPY frontend ./frontend

# vite build → frontend/dist/ — статический бандл (index.html + JS/CSS чанки с хешами в именах).
# Хеши включают cache-busting: при изменении содержимого имя файла меняется,
# браузер не отдаёт старый кэш.
RUN pnpm --filter frontend build


# ╔══════════════════════════════════════════════════════════════════════════
# ║  STAGE 2: runner
# ║  Минимальный nginx + собранный dist.
# ╚══════════════════════════════════════════════════════════════════════════
FROM nginx:1.27-alpine AS runner

# Удаляем дефолтный конфиг nginx (default.conf — welcome-страница).
# Без этого наш server-блок будет конфликтовать с default'ным на 80 порту.
RUN rm -f /etc/nginx/conf.d/default.conf

# Копируем наш конфиг. Один файл, без split на active.conf —
# blue/green больше нет, переключать нечего.
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Копируем артефакт сборки из builder-стадии.
# COPY --from=<stage> — единственный способ перенести файлы между стадиями
# multi-stage build (между стадиями файловые системы изолированы).
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# EXPOSE — документация для читателя (какой порт слушает образ).
# Не открывает порт наружу — это делает `ports:` в docker-compose.yml.
EXPOSE 80

# nginx:alpine уже имеет ENTRYPOINT/CMD на запуск nginx в foreground.
# Явно не переопределяем — оставляем стандартный.
