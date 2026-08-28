import { useEffect, useMemo, useState } from "react";
import { RaiderIORun } from "../characters/CharacterSelector";
import "./RatingByKey.css";
import { fetchJson, isFiniteNumber, isRecord, isString } from "../../shared/api/api";
import RatingByKeyRow from "./RatingByKeyRow";
import { getDisplayedRatingRange, getScoreLevels, TableData } from "./ratingData";
import type { DungeonRunCount, RaiderIODungeon } from "./ratingData";

interface RaiderIOStaticData {
    seasons: RaiderIOSeason[];
}

interface RaiderIOSeason {
    is_main_season: boolean,
    starts: { us: string },
    ends: { us: string | null },
    dungeons: RaiderIODungeon[],
}

function isRaiderIODungeon(value: unknown): value is RaiderIODungeon {
    return isRecord(value)
        && isFiniteNumber(value.id)
        && isFiniteNumber(value.challenge_mode_id)
        && isString(value.slug)
        && isString(value.name)
        && isString(value.short_name)
        && isFiniteNumber(value.keystone_timer_seconds)
        && isString(value.icon_url)
        && isString(value.background_image_url);
}

function isRaiderIOSeason(value: unknown): value is RaiderIOSeason {
    return isRecord(value)
        && typeof value.is_main_season === "boolean"
        && isRecord(value.starts)
        && isString(value.starts.us)
        && isRecord(value.ends)
        && (value.ends.us === null || isString(value.ends.us))
        && Array.isArray(value.dungeons)
        && value.dungeons.every(isRaiderIODungeon);
}

function isRaiderIOStaticData(value: unknown): value is RaiderIOStaticData {
    return isRecord(value)
        && Array.isArray(value.seasons)
        && value.seasons.every(isRaiderIOSeason);
}

interface RatingByKeyProps {
    runData: RaiderIORun[] | null,
    characterRating: number,
    runCounts?: DungeonRunCount[],
}

const CURRENT_EXPANSION = 11;
const MINIMUM_KEY = 2;
const DEFAULT_HIGHEST_KEY = 12;
const MIN_DISPLAYED_KEY_COLUMNS = 5;
const MAX_DISPLAYED_KEY_COLUMNS = 11;

function RatingByKey ({runData, characterRating, runCounts = []}: RatingByKeyProps) {

    const [error, setError] = useState<Error | null>(null);
    const [dungeons, setDungeons] = useState<RaiderIODungeon[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [requestVersion, setRequestVersion] = useState(0);
    const { tableData, lowestKey, highestKey } = useMemo(() => {
        const data: {[index: number]: TableData} = {};
        let lowestKeyWithRating = Number.POSITIVE_INFINITY;
        const highestKeyCompleted = runData?.reduce(
            (highest, run) => Math.max(highest, run.mythic_level),
            0,
        ) ?? 0;
        const defaultHighestKey = Math.max(DEFAULT_HIGHEST_KEY, highestKeyCompleted + 2);

        runData?.forEach((run) => {
            const zone_id = run.zone_id;

            if (!data[zone_id]) {
                data[zone_id] = { 
                    bestRun: { level: null, timer: null, score: 0},
                    levels: []
                };
            }

            const dataRow = data[run.zone_id];

            dataRow.bestRun.level = run.mythic_level;
            dataRow.bestRun.timer = run.clear_time_ms;
            dataRow.bestRun.score = run.score;

            for (let level = MINIMUM_KEY; level <= defaultHighestKey; ++level) {
                const scoreLevels = getScoreLevels(run.par_time_ms, level, run.score);

                if (scoreLevels.target === 0 && scoreLevels.plus2 === 0 && scoreLevels.plus3 === 0)
                    continue;

                dataRow.levels[level] = scoreLevels;

                if (level < lowestKeyWithRating) {
                    lowestKeyWithRating = level;
                }
            }
        });

        const firstKeyWithRating = Number.isFinite(lowestKeyWithRating)
            ? lowestKeyWithRating
            : MINIMUM_KEY;
        const highestKeyToDisplay = Math.max(
            defaultHighestKey,
            firstKeyWithRating + MIN_DISPLAYED_KEY_COLUMNS - 1,
        );
        const lowestDisplayedKey = Math.max(
            MINIMUM_KEY,
            firstKeyWithRating,
            highestKeyToDisplay - MAX_DISPLAYED_KEY_COLUMNS + 1,
        );

        return {
            tableData: data,
            lowestKey: lowestDisplayedKey,
            highestKey: highestKeyToDisplay,
        };
    }, [runData]);

    const columnTotals = useMemo(() => {
        if (dungeons == null) {
            return null;
        }

        const keyCount = highestKey - lowestKey + 1;
        const totals = Array.from({length: keyCount}, () => 0);

        dungeons.forEach((dungeon) => {
            const playerData = tableData[dungeon.id] ?? new TableData();
            const parTimer = (dungeon.keystone_timer_seconds * 1000) + 999;

            for (let ix = 0; ix < keyCount; ++ix) {
                const level = lowestKey + ix;
                totals[ix] += getDisplayedRatingRange(playerData, parTimer, level).target;
            }
        });

        return totals.map((total) => total + characterRating);
    }, [dungeons, tableData, lowestKey, highestKey, characterRating]);

    useEffect(() => {
        if (runData == null) {
            return;
        }

        const controller = new AbortController();

        fetchJson<RaiderIOStaticData>("https://raider.io/api/v1/mythic-plus/static-data?expansion_id=" + CURRENT_EXPANSION, {
            signal: controller.signal,
            validate: isRaiderIOStaticData,
        })
            .then((result: RaiderIOStaticData) => {
                if (controller.signal.aborted) {
                    return;
                }

                const now: Date = new Date();

                const currentSeason = result.seasons.find((season) => {
                    const startDate: Date = new Date(season.starts.us);
                    const endDate: Date = new Date(season.ends.us ?? "2099-12-31T23:59:59Z");

                    return season.is_main_season && startDate < now && endDate > now;
                });

                if (currentSeason === undefined) {
                    throw new Error("No current season data is available.");
                }

                setDungeons(currentSeason.dungeons);
                setIsLoading(false);
            })
            .catch((error) => {
                if (controller.signal.aborted) {
                    return;
                }

                setIsLoading(false);
                setError(error);
            });

        return () => controller.abort();
    }, [runData, requestVersion])

    const handleRetry = (): void => {
        setIsLoading(true);
        setError(null);
        setDungeons(null);
        setRequestVersion((currentVersion) => currentVersion + 1);
    };

    if (runData == null) {
        return <div></div>
    }

    if (error) {
        return (
            <section className="ratingStatus ratingStatus--error" role="alert">
                <p>{error.message}</p>
                <button className="retryButton" type="button" onClick={handleRetry}>Retry</button>
            </section>
        )
    }

    if (isLoading || dungeons === null) {
        return (
            <section className="ratingStatus" role="status" aria-live="polite">
                Loading dungeon data...
            </section>
        )
    }

    return (
        <table className="ratingTable">
            <thead>
                <tr>
                    <th className="dungeonHeader" rowSpan={2}>Dungeon</th>
                    <th className="bestRunHeader" colSpan={3}>Best Run</th>
                    <th className="runCountsHeader" rowSpan={2}>Season Runs</th>
                    <th className="ratingGroupHeader" colSpan={highestKey-lowestKey+1}>Rating gained by running</th>
                </tr>
                <tr>
                    {/* Best Run */}
                    <th className="level">Level</th>
                    <th className="score">Score</th>
                    <th className="runProgressHeader">Progress</th>

                    {/* Keys */}
                    {[...Array(highestKey-lowestKey+1)].map((_, ix) => {
                        return (<th key={(lowestKey+ix).toString() + "_header"} className={"key_rating ratingKeyHeader " + (ix % 2 === 0 ? 'evenCol' : 'oddCol')}>+{(lowestKey+ix).toString()}</th>)
                    })}

                    {/* Expanda */
                    <th className="expandHeader"></th>}
                </tr>
            </thead>
            <tbody>
                {dungeons?.map((dungeon, ix) => (
                    <RatingByKeyRow 
                        key={dungeon.id}
                        index={ix} 
                        dungeon={dungeon} 
                        playerData={tableData[dungeon.id] ?? new TableData()}
                        runCount={runCounts.find((runCount) => runCount.zone_id === dungeon.id) ?? null}
                        highestKey={highestKey}
                        lowestKey={lowestKey}
                    />
                ))}
            </tbody>
            <tfoot>
                <tr>
                    <td className="projectedTotalCell" colSpan={5}>Projected Total</td>
                    {[...Array(highestKey-lowestKey+1)].map((_, ix) => {
                        const total = columnTotals?.[ix];

                        return (
                            <td
                                key={(lowestKey+ix).toString() + "_footer"}
                                className={"ratingKeyCell " + (ix % 2 === 0 ? 'evenCol' : 'oddCol')}
                            >
                                {total === undefined ? "-" : Math.round(total)}
                            </td>
                        )
                    })}
                    <td aria-hidden="true"></td>
                </tr>
            </tfoot>
        </table>
    )
}

export default RatingByKey;
