-- =============================================================================
-- DATABASE STATUS CHECK — GYM-AI
-- =============================================================================
-- Run these queries in the Supabase SQL Editor to inspect the current state
-- of every table and detect potential issues before deploying.
-- =============================================================================


-- ─── 1. TABLE ROW COUNTS ──────────────────────────────────────────────────────
SELECT
    'exercises'           AS table_name, COUNT(*) AS rows FROM exercises
UNION ALL SELECT
    'profiles',                          COUNT(*) FROM profiles
UNION ALL SELECT
    'workouts',                          COUNT(*) FROM workouts
UNION ALL SELECT
    'workout_sets',                      COUNT(*) FROM workout_sets
UNION ALL SELECT
    'user_recommendations',              COUNT(*) FROM user_recommendations
ORDER BY table_name;


-- ─── 2. EXERCISE COVERAGE ─────────────────────────────────────────────────────

-- 2a. Count by equipment type
SELECT
    equipment,
    COUNT(*) AS total
FROM exercises
GROUP BY equipment
ORDER BY total DESC;

-- 2b. Count by primary muscle group
SELECT
    primary_muscle,
    COUNT(*) AS total
FROM exercises
GROUP BY primary_muscle
ORDER BY total DESC;

-- 2c. Count by difficulty level
SELECT
    difficulty,
    COUNT(*) AS total
FROM exercises
GROUP BY difficulty
ORDER BY difficulty;

-- 2d. Exercises missing embeddings (need to run /api/setup-ai for these)
SELECT
    id,
    name,
    primary_muscle,
    equipment,
    difficulty
FROM exercises
WHERE embedding IS NULL
ORDER BY primary_muscle, name;

-- 2e. Embedding coverage summary
SELECT
    COUNT(*) FILTER (WHERE embedding IS NOT NULL) AS with_embedding,
    COUNT(*) FILTER (WHERE embedding IS NULL)     AS without_embedding,
    COUNT(*)                                       AS total,
    ROUND(
        COUNT(*) FILTER (WHERE embedding IS NOT NULL)::numeric / NULLIF(COUNT(*), 0) * 100, 1
    ) AS coverage_pct
FROM exercises;

-- 2f. Exercises with Spanish translations
SELECT
    COUNT(*) FILTER (WHERE name_es IS NOT NULL)        AS with_name_es,
    COUNT(*) FILTER (WHERE description_es IS NOT NULL) AS with_desc_es,
    COUNT(*)                                            AS total
FROM exercises;


-- ─── 3. PROFILE STATUS ────────────────────────────────────────────────────────

-- 3a. Profiles with completed onboarding (goal + level + weight all set)
SELECT
    COUNT(*) FILTER (
        WHERE goal IS NOT NULL AND level IS NOT NULL AND weight_kg IS NOT NULL
    ) AS onboarding_complete,
    COUNT(*) FILTER (
        WHERE goal IS NULL OR level IS NULL OR weight_kg IS NULL
    ) AS onboarding_incomplete,
    COUNT(*) AS total_profiles
FROM profiles;

-- 3b. Goal distribution among completed profiles
SELECT
    goal,
    COUNT(*) AS users
FROM profiles
WHERE goal IS NOT NULL
GROUP BY goal
ORDER BY users DESC;

-- 3c. Experience level distribution
SELECT
    level,
    COUNT(*) AS users
FROM profiles
WHERE level IS NOT NULL
GROUP BY level
ORDER BY users DESC;

-- 3d. Equipment access distribution
SELECT
    equipment,
    COUNT(*) AS users
FROM profiles
WHERE equipment IS NOT NULL
GROUP BY equipment
ORDER BY users DESC;


-- ─── 4. WORKOUT STATS ─────────────────────────────────────────────────────────

-- 4a. Workouts by status
SELECT
    status,
    COUNT(*) AS total
FROM workouts
GROUP BY status
ORDER BY status;

-- 4b. Most recent 10 workouts (any status)
SELECT
    w.id,
    w.name,
    w.status,
    w.started_at,
    w.duration_seconds,
    p.full_name AS user_name
FROM workouts w
LEFT JOIN profiles p ON p.id = w.user_id
ORDER BY w.started_at DESC NULLS LAST
LIMIT 10;

-- 4c. Average sets per completed workout
SELECT
    ROUND(AVG(set_count), 1) AS avg_sets_per_workout
FROM (
    SELECT workout_id, COUNT(*) AS set_count
    FROM workout_sets
    GROUP BY workout_id
) sub;


-- ─── 5. AI RECOMMENDATIONS CACHE ─────────────────────────────────────────────

-- 5a. Cache overview
SELECT
    locale,
    COUNT(*) AS cached_entries,
    MIN(date) AS oldest_entry,
    MAX(date) AS newest_entry
FROM user_recommendations
GROUP BY locale
ORDER BY locale;

-- 5b. Users who have cached recommendations
SELECT
    ur.user_id,
    p.full_name,
    ur.locale,
    ur.date,
    jsonb_array_length(ur.modules::jsonb) AS module_count
FROM user_recommendations ur
LEFT JOIN profiles p ON p.id = ur.user_id
ORDER BY ur.date DESC
LIMIT 20;

-- 5c. Stale recommendations older than 60 days (safe to delete)
SELECT
    id,
    user_id,
    date,
    locale
FROM user_recommendations
WHERE date < CURRENT_DATE - INTERVAL '60 days'
ORDER BY date ASC;


-- ─── 6. DATA INTEGRITY CHECKS ────────────────────────────────────────────────

-- 6a. workout_sets referencing non-existent exercises
SELECT
    ws.id AS set_id,
    ws.exercise_id
FROM workout_sets ws
LEFT JOIN exercises e ON e.id = ws.exercise_id
WHERE e.id IS NULL;

-- 6b. workouts referencing non-existent profiles
SELECT
    w.id AS workout_id,
    w.user_id
FROM workouts w
LEFT JOIN profiles p ON p.id = w.user_id
WHERE p.id IS NULL;

-- 6c. Active workouts that have been running for more than 4 hours (stuck sessions)
SELECT
    id,
    name,
    user_id,
    started_at,
    EXTRACT(EPOCH FROM (NOW() - started_at)) / 3600 AS hours_elapsed
FROM workouts
WHERE status = 'active'
  AND started_at < NOW() - INTERVAL '4 hours'
ORDER BY started_at ASC;


-- ─── 7. QUICK HEALTH SUMMARY ─────────────────────────────────────────────────
-- Run this for a single-row dashboard view of the DB state.

SELECT
    (SELECT COUNT(*) FROM exercises)                                         AS total_exercises,
    (SELECT COUNT(*) FROM exercises WHERE embedding IS NOT NULL)             AS exercises_with_embeddings,
    (SELECT COUNT(*) FROM profiles)                                          AS total_users,
    (SELECT COUNT(*) FROM profiles WHERE goal IS NOT NULL AND level IS NOT NULL AND weight_kg IS NOT NULL)
                                                                             AS users_onboarded,
    (SELECT COUNT(*) FROM workouts)                                          AS total_workouts,
    (SELECT COUNT(*) FROM workouts WHERE status = 'completed')              AS completed_workouts,
    (SELECT COUNT(*) FROM user_recommendations)                              AS cached_recommendations;
