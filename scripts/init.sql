-- scripts/init.sql
-- Postgres bootstrap. Запускается один раз при пустом volume.

-- ── Extensions ─────────────────────────────────────────────────────────────
-- btree_gist даёт GiST-индексы для типов, обычно индексируемых btree (uuid, text).
-- Нужен для составного EXCLUDE-constraint: "workspace_id WITH =" + "tstzrange WITH &&".
CREATE EXTENSION IF NOT EXISTS btree_gist;
-- pgcrypto — gen_random_uuid() для серверной генерации UUID.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── users ──────────────────────────────────────────────────────────────────
-- Зарегистрированные пользователи. password_hash — bcrypt-string (~60 chars).
-- email UNIQUE — invariant "один email = один аккаунт" защищён БД.
CREATE TABLE IF NOT EXISTS users (
    id            UUID         PRIMARY KEY,
    email         TEXT         NOT NULL UNIQUE,
    password_hash TEXT         NOT NULL,
    display_name  TEXT             NULL,
    phone         TEXT             NULL,
    avatar_url    TEXT             NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- ── workspaces ─────────────────────────────────────────────────────────────
-- price_per_hour_minor — копейки (integer). Никогда не храним деньги во float.
CREATE TABLE IF NOT EXISTS workspaces (
    id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name                  TEXT         NOT NULL,
    type                  TEXT         NOT NULL CHECK (type IN ('hot_desk', 'meeting_room')),
    capacity              INTEGER      NOT NULL CHECK (capacity >= 1),
    price_per_hour_minor  INTEGER      NOT NULL CHECK (price_per_hour_minor >= 0),
    currency              CHAR(3)      NOT NULL DEFAULT 'RUB',
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── bookings ───────────────────────────────────────────────────────────────
-- user_id FK на users (ON DELETE CASCADE — удалили юзера = снимаем его брони).
-- CHECK (starts_at < ends_at) — Defense in Depth: дублирует TimeRange.create.
CREATE TABLE IF NOT EXISTS bookings (
    id                 UUID         PRIMARY KEY,
    workspace_id       UUID         NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
    user_id            UUID         NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
    starts_at          TIMESTAMPTZ  NOT NULL,
    ends_at            TIMESTAMPTZ  NOT NULL,
    total_price_minor  INTEGER      NOT NULL CHECK (total_price_minor >= 0),
    currency           CHAR(3)      NOT NULL,
    status             TEXT         NOT NULL CHECK (status IN ('active', 'cancelled')),
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT bookings_interval_valid CHECK (starts_at < ends_at)
);

-- КЛЮЧЕВОЙ INVARIANT: нельзя забронировать пересекающийся интервал.
-- EXCLUDE USING gist: workspace_id (=) + tstzrange (&&) — race-condition-safe в одной транзакции.
-- WHERE status='active' — отменённые брони не блокируют новые.
-- Источник: https://www.postgresql.org/docs/16/sql-createtable.html#SQL-CREATETABLE-EXCLUDE
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_no_overlap;
ALTER TABLE bookings ADD CONSTRAINT bookings_no_overlap
    EXCLUDE USING gist (
        workspace_id WITH =,
        tstzrange(starts_at, ends_at, '[)') WITH &&
    ) WHERE (status = 'active');

CREATE INDEX IF NOT EXISTS idx_bookings_user_starts
    ON bookings (user_id, starts_at DESC);

-- ── Seed workspaces ────────────────────────────────────────────────────────
INSERT INTO workspaces (id, name, type, capacity, price_per_hour_minor, currency) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Hot Desk #1',     'hot_desk',     1,  20000, 'RUB'),
    ('00000000-0000-0000-0000-000000000002', 'Hot Desk #2',     'hot_desk',     1,  20000, 'RUB'),
    ('00000000-0000-0000-0000-000000000003', 'Hot Desk #3',     'hot_desk',     1,  20000, 'RUB'),
    ('00000000-0000-0000-0000-000000000004', 'Hot Desk #4',     'hot_desk',     1,  20000, 'RUB'),
    ('00000000-0000-0000-0000-000000000010', 'Meeting Room A',  'meeting_room', 6,  80000, 'RUB'),
    ('00000000-0000-0000-0000-000000000011', 'Meeting Room B',  'meeting_room', 10, 120000, 'RUB')
ON CONFLICT (id) DO NOTHING;
