export interface RaiderIODungeon {
    id: number,
    challenge_mode_id: number,
    slug: string,
    name: string,
    short_name: string,
    keystone_timer_seconds: number,
    icon_url: string,
    background_image_url: string
}

interface AffixSummary {
    level: number | null,
    timer: number | null,
    score: number,
};

export interface RatingRange {
    level: number;
    target: number;
    plus2: number;
    plus3: number;
    fail: number;
}

export class TableData {
    bestRun: AffixSummary = { level: null, timer: null, score: 0};
    levels: {[index: number] : RatingRange} = {};
}

function getScore(par: number, timer: number, level: number) {
    /* Old way */
    /*level = level + 10;
    const bonus = Math.max(-1, Math.min(1, (par - timer) / (par * 0.4)));
    const adjustedLevel = level + bonus + (bonus < 0 ? -1 : 0);
    const levelsAbove10 = Math.max(0, level - 10);
    const numberAffixes = (level < 15 ? 1 : (level > 19 ? 3 : 2));

    return 20 + (adjustedLevel * 5) + (levelsAbove10 * 2) + (numberAffixes * 10);*/

    /* New Way */
    const runTimePercentage = Math.min((par - timer) / par, 0.4);
    const multiplier = level + getNumberOfAffixes(level);
    const baseRating = 125 + (multiplier * 15);

    return (baseRating + (runTimePercentage * 37.5));
}

function getNumberOfAffixes(level: number) {
    if (level < 4)
        return 0;

    if (level < 7)
        return 1;

    if (level < 10)
        return 2;

    return 3;
}

export function getScoreLevels(par: number, level: number, score: number) {
    const targetScore = getScore(par, par, level);
    const plus2Score = getScore(par, par - (par * 0.2), level);
    const plus3Score = getScore(par, par - (par * 0.4), level);
    const failScore = getScore(par, par + (par * 0.4), level);

    return {
        level: level,
        target: Math.max(0,targetScore - score),
        plus2: Math.max(0,plus2Score - score),
        plus3: Math.max(0,plus3Score - score),
        fail: Math.max(0,failScore - score)
    };
}

export function getDisplayedRatingRange(playerData: TableData, par: number, level: number): RatingRange {
    return playerData.levels[level] ?? getScoreLevels(par, level, playerData.bestRun.score);
}
