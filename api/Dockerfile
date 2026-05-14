# api/Dockerfile
# ─────────────────────────────────────────────────────────────────────────────
# Multi-stage сборка Node.js API.
#
# Зачем multi-stage:
#   Финальный образ содержит только compiled JS + prod-зависимости.
#   Инструменты сборки (TypeScript, ts-node-dev, dev-зависимости) остаются
#   во временных стадиях и не попадают в production-образ → меньше размер,
#   меньше attack surface.
#
# Стадии:
#   deps    — только production-зависимости (без devDependencies)
#   builder — все зависимости + tsc → dist/
#   runner  — финальный минимальный образ
# ─────────────────────────────────────────────────────────────────────────────


# ╔══════════════════════════════════════════════════════════════════════════
# ║  STAGE 1: deps
# ╚══════════════════════════════════════════════════════════════════════════
FROM node:22-alpine AS deps

# corepack — встроенный в Node менеджер пакет-менеджеров. Активирует shim'ы
# для команды `pnpm` без глобальной установки.
RUN corepack enable

WORKDIR /app

# Копируем только манифесты — для кэша слоёв Docker.
# Слой с `pnpm install` пересобирается только при изменении lockfile/package.json.
COPY package.json pnpm-lock.yaml* ./

# --prod=true — без devDependencies. --frozen-lockfile — детерминированная установка.
RUN pnpm install --prod --frozen-lockfile


# ╔══════════════════════════════════════════════════════════════════════════
# ║  STAGE 2: builder
# ╚══════════════════════════════════════════════════════════════════════════
FROM node:22-alpine AS builder

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./

# Без --prod — ставим всё, включая typescript для tsc.
RUN pnpm install --frozen-lockfile

# Копируем исходники ПОСЛЕ install: правка кода не инвалидирует слой с зависимостями.
# Полагаемся на .dockerignore (нужно создать), чтобы не утащить node_modules/.env.
COPY . .

# tsc компилирует TypeScript → JavaScript в папку dist/ (см. api/tsconfig.json outDir).
RUN pnpm build


# ╔══════════════════════════════════════════════════════════════════════════
# ║  STAGE 3: runner
# ╚══════════════════════════════════════════════════════════════════════════
FROM node:22-alpine AS runner

WORKDIR /app

# Непривилегированный пользователь — стандартная hardening-практика Docker.
# По умолчанию контейнер бежит от root (UID 0). Атакующий с shell внутри = root внутри.
# -S = системный аккаунт (без /home, shell /sbin/nologin). Синтаксис alpine (busybox).
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Берём prod-only node_modules из stage `deps`, НЕ из builder (у того dev-зависимости).
COPY --from=deps    /app/node_modules ./node_modules
# Скомпилированный код из builder. Исходники .ts остаются в builder.
COPY --from=builder /app/dist         ./dist
COPY package.json ./

# До USER appuser: передаём владение, иначе appuser не сможет читать root-owned файлы.
RUN chown -R appuser:appgroup /app
USER appuser

ENV NODE_ENV=production

# EXPOSE — документация. Реально порт открывает только `ports:` в docker-compose.
EXPOSE 3001

# SIGTERM — стандартный сигнал graceful shutdown.
# Если процесс не завершился за stop_timeout (default 10s) → Docker шлёт SIGKILL.
# Хук обработан в src/interface/http/index.ts.
STOPSIGNAL SIGTERM

# HEALTHCHECK — Docker дёргает команду и обновляет статус контейнера (starting/healthy/unhealthy).
# wget вместо curl: в alpine wget идёт с busybox, curl нужно ставить (+3MB).
HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -qO- http://localhost:3001/health || exit 1

# Exec form (JSON-массив) vs shell form: exec form запускает node напрямую (PID 1),
# Node получает SIGTERM от Docker напрямую. Shell form вставила бы sh между Docker
# и node → SIGTERM мог бы не дойти до node → нет graceful shutdown.
CMD ["node", "dist/interface/http/index.js"]
