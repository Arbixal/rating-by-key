import { useEffect, useMemo, useState } from "react";
import { RaiderIORun } from "./CharacterSelector";
import "./RatingByKey.css";
import RatingByKeyRow from "./RatingByKeyRow";

// https://raider.io/api/v1/mythic-plus/static-data?expansion_id=9
/*
{
  "seasons": [
    {
      "slug": "season-df-3",
      "name": "DF Season 3",
      "short_name": "DF3",
      "seasonal_affix": null,
      "starts": {
        "us": "2023-11-14T15:00:00Z",
        "eu": "2023-11-15T04:00:00Z",
        "tw": "2023-11-15T23:00:00Z",
        "kr": "2023-11-15T23:00:00Z",
        "cn": "2023-11-15T23:00:00Z"
      },
      "ends": {
        "us": null,
        "eu": null,
        "tw": null,
        "kr": null,
        "cn": null
      },
      "dungeons": [
        {
          "id": 9028,
          "challenge_mode_id": 244,
          "slug": "ataldazar",
          "name": "Atal'Dazar",
          "short_name": "AD"
        },
        {
          "id": 7805,
          "challenge_mode_id": 199,
          "slug": "black-rook-hold",
          "name": "Black Rook Hold",
          "short_name": "BRH"
        },
        {
          "id": 1000010,
          "challenge_mode_id": 463,
          "slug": "doti-galakronds-fall",
          "name": "DOTI: Galakrond's Fall",
          "short_name": "FALL"
        },
        {
          "id": 1000011,
          "challenge_mode_id": 464,
          "slug": "doti-murozonds-rise",
          "name": "DOTI: Murozond's Rise",
          "short_name": "RISE"
        },
        {
          "id": 7673,
          "challenge_mode_id": 198,
          "slug": "darkheart-thicket",
          "name": "Darkheart Thicket",
          "short_name": "DHT"
        },
        {
          "id": 7109,
          "challenge_mode_id": 168,
          "slug": "everbloom",
          "name": "The Everbloom",
          "short_name": "EB"
        },
        {
          "id": 4738,
          "challenge_mode_id": 456,
          "slug": "throne-of-the-tides",
          "name": "Throne of the Tides",
          "short_name": "TOTT"
        },
        {
          "id": 9424,
          "challenge_mode_id": 248,
          "slug": "waycrest-manor",
          "name": "Waycrest Manor",
          "short_name": "WM"
        }
      ]
    }
  ]
}
*/

interface RaiderIOStaticData {
    seasons: RaiderIOSeason[];
}

interface RaiderIOSeason {
    slug: string,
    name: string,
    blizzard_season_id: number,
    is_main_season: boolean,
    short_name: string,
    seasonal_affix: string | null,
    starts: { us: Date, eu: Date, tw: Date, kr: Date, cn: Date },
    ends: { us: Date | null, eu: Date | null, tw: Date | null, kr: Date | null, cn: Date | null },
    dungeons: RaiderIODungeon[],
}

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

interface RatingByKeyProps {
    runData: RaiderIORun[] | null,
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

const CURRENT_EXPANSION = 10;
const MAX_KEY = 15;

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

function RatingByKey ({runData}: RatingByKeyProps) {

    const [error, setError] = useState<Error | null>(null);
    const [dungeons, setDungeons] = useState<RaiderIODungeon[] | null>(null);
    const [lowestKey, setLowestKey] = useState<number>(2);
    const [highestKey, setHighestKey] = useState<number>(MAX_KEY);
    const tableData: {[index: number]: TableData} = useMemo(() => {
        let data: {[index: number]: TableData} = {};
        let lowestKeyWithRating = 99;
        let highestKeyCompleted = 0;

        runData?.forEach((run, ix) => {
            const zone_id = run.zone_id;

            if (!data[zone_id]) {
                data[zone_id] = { 
                    bestRun: { level: null, timer: null, score: 0},
                    levels: []
                };
            }

            const dataRow = data[run.zone_id];

            if (run.mythic_level > highestKeyCompleted) {
                highestKeyCompleted = run.mythic_level;
            }

            dataRow.bestRun.level = run.mythic_level;
            dataRow.bestRun.timer = run.clear_time_ms;
            dataRow.bestRun.score = run.score;

            for (let level = 2; level <= MAX_KEY; ++level) {
                const scoreLevels = getScoreLevels(run.par_time_ms, level, run.score);

                if (scoreLevels.target === 0)
                    continue;

                dataRow.levels[level] = scoreLevels;

                if (level < lowestKeyWithRating) {
                    lowestKeyWithRating = level;
                }
            }
        });

        setLowestKey(lowestKeyWithRating === 99 ? 2 : lowestKeyWithRating);
        setHighestKey(Math.min(MAX_KEY, Math.max(20, highestKeyCompleted + 10)))

        return data;
    }, [runData]);

    useEffect(() => {
        if (runData == null) {
            return;
        }

        fetch("https://raider.io/api/v1/mythic-plus/static-data?expansion_id=" + CURRENT_EXPANSION)
            .then(res => res.json())
            .then((result: RaiderIOStaticData) => {
                if (result.seasons.length === 0) {
                    return;
                }

                var now: Date = new Date();

                for (var i = 0; i < result.seasons.length; ++i)
                {
                    var startDate: Date = new Date(result.seasons[i].starts.us);
                    var endDate: Date = new Date(result.seasons[i].ends.us ?? "2099-12-31T23:59:59Z");

                    if (result.seasons[i].is_main_season === true && startDate < now && endDate > now)
                    {
                        setDungeons(result.seasons[i].dungeons);
                        break;
                    }
                }
            },
            (error) => {
                setError(error);
            })
    }, [runData])

    if (runData == null) {
        return <div></div>
    }

    if (error) {
        return <div>{error.message}</div>
    }

    return (
        <table>
            <thead>
                <tr>
                    <th rowSpan={2}>Dungeon</th>
                    <th colSpan={4}>Timers</th>
                    <th colSpan={4}>Best Run</th>
                    <th colSpan={highestKey-lowestKey+1}>Rating gained by running</th>
                </tr>
                <tr>
                    {/* Timers */}
                    <th>Target</th>
                    <th>+2</th>
                    <th>+3</th>
                    <th>Fail</th>

                    {/* Best Run */}
                    <th className="level">Level</th>
                    <th className="timer">Timer</th>
                    <th className="score">Score</th>

                    {/* Keys */}
                    {[...Array(highestKey-lowestKey+1)].map((_, ix) => {
                        return (<th key={(lowestKey+ix).toString() + "_header"} className={"key_rating " + (ix % 2 === 0 ? 'evenCol' : 'oddCol')}>+{(lowestKey+ix).toString()}</th>)
                    })}

                    {/* Expanda */
                    <th></th>}
                </tr>
            </thead>
            <tbody>
                {dungeons?.map((dungeon, ix) => (
                    <RatingByKeyRow 
                        key={dungeon.id}
                        index={ix} 
                        dungeon={dungeon} 
                        playerData={tableData[dungeon.id] ?? new TableData()}
                        highestKey={highestKey}
                        lowestKey={lowestKey}
                    />
                ))}
            </tbody>
        </table>
    )
}

export default RatingByKey;