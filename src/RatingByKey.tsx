import { useEffect, useMemo, useState } from "react";
import { RaiderIORun } from "./CharacterSelector";
import "./RatingByKey.css";
import RatingByKeyRow from "./RatingByKeyRow";
import { getScoreLevels, TableData } from "./ratingData";
import type { RaiderIODungeon } from "./ratingData";

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
    starts: { us: string, eu: string, tw: string, kr: string, cn: string },
    ends: { us: string | null, eu: string | null, tw: string | null, kr: string | null, cn: string | null },
    dungeons: RaiderIODungeon[],
}

interface RatingByKeyProps {
    runData: RaiderIORun[] | null,
}

const CURRENT_EXPANSION = 11;
const MAX_KEY = 15;

function RatingByKey ({runData}: RatingByKeyProps) {

    const [error, setError] = useState<Error | null>(null);
    const [dungeons, setDungeons] = useState<RaiderIODungeon[] | null>(null);
    const { tableData, lowestKey, highestKey } = useMemo(() => {
        const data: {[index: number]: TableData} = {};
        let lowestKeyWithRating = 99;
        let highestKeyCompleted = 0;

        runData?.forEach((run) => {
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

        return {
            tableData: data,
            lowestKey: lowestKeyWithRating === 99 ? 2 : lowestKeyWithRating,
            highestKey: Math.min(MAX_KEY, Math.max(20, highestKeyCompleted + 10)),
        };
    }, [runData]);

    useEffect(() => {
        if (runData == null) {
            return;
        }

        const controller = new AbortController();

        fetch("https://raider.io/api/v1/mythic-plus/static-data?expansion_id=" + CURRENT_EXPANSION, {signal: controller.signal})
            .then(res => res.json())
            .then((result: RaiderIOStaticData) => {
                if (controller.signal.aborted) {
                    return;
                }

                if (result.seasons.length === 0) {
                    return;
                }

                const now: Date = new Date();

                for (let i = 0; i < result.seasons.length; ++i)
                {
                    const startDate: Date = new Date(result.seasons[i].starts.us);
                    const endDate: Date = new Date(result.seasons[i].ends.us ?? "2099-12-31T23:59:59Z");

                    if (result.seasons[i].is_main_season === true && startDate < now && endDate > now)
                    {
                        setDungeons(result.seasons[i].dungeons);
                        break;
                    }
                }
            })
            .catch((error) => {
                if (controller.signal.aborted) {
                    return;
                }

                setError(error);
            });

        return () => controller.abort();
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
                    <th colSpan={3}>Best Run</th>
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
            <tfoot>
                <tr>
                    <td colSpan={8}>&nbsp;</td>
                    {[...Array(highestKey-lowestKey+1)].map((_, ix) => {
                        return (<td key={(lowestKey+ix).toString() + "_footer"}> - </td>)
                    })}
                </tr>
            </tfoot>
        </table>
    )
}

export default RatingByKey;
