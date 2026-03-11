/**
 * @file lib/levels.ts
 * Shared XP level thresholds for the gamification system.
 *
 * Used by:
 *   - HomeClient (dashboard XP bar)
 *   - ProfileClient (level display)
 *   - DB trigger (handle_xp_gamification) uses the same thresholds
 *
 * Levels are defined by cumulative XP thresholds.
 * A user is at level N if their total XP >= LEVELS[N-1].xpRequired
 * but < LEVELS[N].xpRequired.
 */

export interface LevelInfo {
    level: number;
    /** i18n key for the level name */
    nameKey: string;
    /** Cumulative XP needed to reach this level */
    xpRequired: number;
}

/**
 * 10-level progression table.
 * Each entry defines the cumulative XP threshold to reach that level.
 */
export const LEVELS: LevelInfo[] = [
    { level: 1, nameKey: "levels.sedentary", xpRequired: 0 },
    { level: 2, nameKey: "levels.beginner", xpRequired: 100 },
    { level: 3, nameKey: "levels.novice", xpRequired: 250 },
    { level: 4, nameKey: "levels.intermediate", xpRequired: 450 },
    { level: 5, nameKey: "levels.dedicated", xpRequired: 750 },
    { level: 6, nameKey: "levels.advanced", xpRequired: 1150 },
    { level: 7, nameKey: "levels.athlete", xpRequired: 1650 },
    { level: 8, nameKey: "levels.elite", xpRequired: 2300 },
    { level: 9, nameKey: "levels.beast", xpRequired: 3100 },
    { level: 10, nameKey: "levels.legend", xpRequired: 4100 },
];

export const MAX_LEVEL = LEVELS[LEVELS.length - 1].level;

/**
 * Given total XP, returns the user's current level number.
 */
export function getLevelFromXp(totalXp: number): number {
    let currentLevel = 1;
    for (const lvl of LEVELS) {
        if (totalXp >= lvl.xpRequired) {
            currentLevel = lvl.level;
        } else {
            break;
        }
    }
    return currentLevel;
}

/**
 * Returns the LevelInfo for a given level number.
 */
export function getLevelInfo(level: number): LevelInfo {
    return LEVELS[Math.min(level, MAX_LEVEL) - 1];
}

/**
 * Returns the XP progress within the current level as a fraction of 0-100.
 * Also returns the raw XP within the current band and the band size.
 *
 * Example: User has 180 XP → Level 2 (starts at 100, next at 250)
 *   xpInLevel = 80, xpForNextLevel = 150, percent = 53%
 */
export function getXpProgress(totalXp: number): {
    level: number;
    xpInLevel: number;
    xpForNextLevel: number;
    percent: number;
    isMaxLevel: boolean;
} {
    const level = getLevelFromXp(totalXp);
    const currentLevelInfo = getLevelInfo(level);

    if (level >= MAX_LEVEL) {
        return {
            level,
            xpInLevel: totalXp - currentLevelInfo.xpRequired,
            xpForNextLevel: 0,
            percent: 100,
            isMaxLevel: true,
        };
    }

    const nextLevelInfo = getLevelInfo(level + 1);
    const xpInLevel = totalXp - currentLevelInfo.xpRequired;
    const xpForNextLevel = nextLevelInfo.xpRequired - currentLevelInfo.xpRequired;
    const percent = Math.round((xpInLevel / xpForNextLevel) * 100);

    return { level, xpInLevel, xpForNextLevel, percent, isMaxLevel: false };
}
