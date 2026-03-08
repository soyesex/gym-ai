-- Migration: add exercise_categories table
-- Run this in the Supabase SQL Editor (or via supabase db push).
--
-- Design decisions:
--   - `id` is a human-readable slug ("all", "chest", "back", …) so the client
--     never needs to join on UUIDs and it works as a stable React key.
--   - `filter_field` drives client-side filtering:
--       "all"            → no filter applied
--       "force"          → match exercise.force IN filter_values
--       "primary_muscle" → match exercise.primary_muscle IN filter_values
--   - `filter_values` holds the exact DB enum values to match.
--   - `name_en` / `name_es` are the display labels per locale.
--   - `sort_order` controls pill order in the UI (ascending).
--   - RLS: public read-only — static catalog data, no auth needed.
--
-- Coverage — every muscle_group enum value maps to exactly one category:
--   chest          → Chest / Pecho
--   lats           → Back  / Espalda
--   traps          → Back  / Espalda
--   lower_back     → Back  / Espalda
--   shoulders      → Shoulders / Hombros
--   biceps         → Arms  / Brazos
--   triceps        → Arms  / Brazos
--   forearms       → Arms  / Brazos
--   quads          → Legs  / Piernas
--   hamstrings     → Legs  / Piernas
--   glutes         → Legs  / Piernas
--   calves         → Legs  / Piernas
--   abs            → Core  / Core
--   obliques       → Core  / Core
--   cardio_system  → Cardio / Cardio

-- ── Table ──────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS exercise_categories (
    id            text     PRIMARY KEY,
    name_en       text     NOT NULL,
    name_es       text     NOT NULL,
    sort_order    smallint NOT NULL DEFAULT 0,
    -- 'all' | 'force' | 'primary_muscle'
    filter_field  text     NOT NULL DEFAULT 'all',
    -- Exact DB enum values to match; empty array = match everything
    filter_values text[]   NOT NULL DEFAULT '{}'
);

COMMENT ON TABLE  exercise_categories               IS 'Static catalog of exercise filter categories shown in the Exercise Library.';
COMMENT ON COLUMN exercise_categories.filter_field  IS 'Which exercise field to filter on: ''all'', ''force'', or ''primary_muscle''.';
COMMENT ON COLUMN exercise_categories.filter_values IS 'DB enum values that qualify an exercise for this category. Empty = no filter.';

-- ── RLS ────────────────────────────────────────────────────────────────────────

ALTER TABLE exercise_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exercise_categories_public_read"
    ON exercise_categories
    FOR SELECT
    USING (true);

-- ── Seed data ─────────────────────────────────────────────────────────────────
-- Upsert so this script is safe to re-run after changes.

INSERT INTO exercise_categories (id, name_en, name_es, sort_order, filter_field, filter_values)
VALUES
    -- 0 · All — no filter, shows every exercise
    ('all',       'All',       'Todo',      0, 'all',            '{}'),

    -- 1 · Chest — pectoralis major
    ('chest',     'Chest',     'Pecho',     1, 'primary_muscle', '{chest}'),

    -- 2 · Back — lats + upper traps + lower back (posterior chain)
    ('back',      'Back',      'Espalda',   2, 'primary_muscle', '{lats,traps,lower_back}'),

    -- 3 · Shoulders — deltoids (anterior, lateral, posterior)
    ('shoulders', 'Shoulders', 'Hombros',   3, 'primary_muscle', '{shoulders}'),

    -- 4 · Arms — biceps, triceps, forearms / grip
    ('arms',      'Arms',      'Brazos',    4, 'primary_muscle', '{biceps,triceps,forearms}'),

    -- 5 · Legs — quads, hamstrings, glutes, calves
    ('legs',      'Legs',      'Piernas',   5, 'primary_muscle', '{quads,hamstrings,glutes,calves}'),

    -- 6 · Core — abs and obliques
    ('core',      'Core',      'Core',      6, 'primary_muscle', '{abs,obliques}'),

    -- 7 · Cardio — full-body metabolic / cardiovascular exercises
    ('cardio',    'Cardio',    'Cardio',    7, 'primary_muscle', '{cardio_system}')

ON CONFLICT (id) DO UPDATE
    SET name_en       = EXCLUDED.name_en,
        name_es       = EXCLUDED.name_es,
        sort_order    = EXCLUDED.sort_order,
        filter_field  = EXCLUDED.filter_field,
        filter_values = EXCLUDED.filter_values;
