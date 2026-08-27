import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getDisplayedRatingRange, getTimerThresholds, TableData } from "./ratingData";
import type { RaiderIODungeon, RatingRange } from "./ratingData";
import { faAnglesDown, faAnglesUp } from "@fortawesome/free-solid-svg-icons";
import { useState, MouseEvent } from "react";
import { BarChart, Legend, ResponsiveContainer, YAxis, Bar, Tooltip, XAxis } from "recharts";
import type { Formatter } from "recharts/types/component/DefaultTooltipContent";
import TimerRuler from "./TimerRuler";

interface RatingByKeyRowProps {
    dungeon: RaiderIODungeon,
    playerData: TableData,
    highestKey: number,
    lowestKey: number,
    index: number,
}

class RatingRangeWithDeltas implements RatingRange {
    level: number;
    target: number;
    plus2: number;
    plus3: number;
    fail: number;

    constructor(ratingRange: RatingRange) {
        this.level = ratingRange.level;

        //const oldRating = calculateTotalRating(playerScore, alternateScore);

        this.fail = ratingRange.fail;
        this.target = ratingRange.target;
        this.plus2 = ratingRange.plus2;
        this.plus3 = ratingRange.plus3;
    }

    get targetRange(): number[] {
        return [this.fail, this.target];
    }

    get targetDelta(): number {
        return (this.target - this.fail);
    }

    get plus2Range(): number[] {
        return [this.target, this.plus2];
    }

    get plus2Delta(): number {
        return (this.plus2 - this.target);
    }

    get plus3Range(): number[] {
        return [this.plus2, this.plus3];
    }

    get plus3Delta(): number {
        return (this.plus3 - this.plus2);
    }
}

function RatingByKeyRow({dungeon, playerData, highestKey, lowestKey, index}: RatingByKeyRowProps) {
    const [expanded, setExpanded] = useState<boolean>(false);

    const parTimer = (dungeon.keystone_timer_seconds * 1000) + 999; //SEASON_3_TIMERS[dungeon.id];
    const timerThresholds = getTimerThresholds(parTimer);

    const handleExpandClick = (e: MouseEvent<HTMLButtonElement>): void => {
        e.preventDefault();

        setExpanded(!expanded);
    }

    const tooltipFormatter: Formatter = (_value, name, item) => {
        const payload = item.payload as RatingRangeWithDeltas | undefined;
        const label = name ?? "";

        if (payload === undefined) {
            return [null, label];
        }

        if (item.dataKey === "targetDelta") {
            return [payload.fail.toFixed(1) + " - " + payload.target.toFixed(1), label];
        }

        if (item.dataKey === "plus2Delta") {
            return [payload.target.toFixed(1) + " - " + payload.plus2.toFixed(1), label];
        }

        if (item.dataKey === "plus3Delta") {
            return [payload.plus2.toFixed(1) + " - " + payload.plus3.toFixed(1), label];
        }

        return [null, label];
    }

    const levelData: RatingRangeWithDeltas[] = [...Array(highestKey-lowestKey+1)].map(((_,lix) => {
        const mLevel = lowestKey+lix;
        const x = getDisplayedRatingRange(playerData, parTimer, mLevel);

        return new RatingRangeWithDeltas(x)
    }))

    return (
    <>
    <tr className={index % 2 === 0 ? 'even' : 'odd'}>
        <td>{dungeon.name}</td>

        <td className="level">{playerData.bestRun?.level}</td>
        <td className="score">{playerData.bestRun?.score.toFixed(1)}</td>
        <td className="runProgressCell">
            <TimerRuler clearTime={playerData.bestRun?.timer ?? null} thresholds={timerThresholds} />
        </td>

        {levelData.map(((lData,lix) => (
                <td className={lix % 2 === 0 ? 'evenCol' : 'oddCol'} key={lData.level}>{lData.target === 0.0 ? "" : Math.round(lData.target)}</td>
            )
        ))}

        <td><button onClick={handleExpandClick}><FontAwesomeIcon icon={expanded ? faAnglesUp : faAnglesDown}/></button></td>
    </tr>
    {expanded && (
        <tr className={index % 2 === 0 ? 'event' : 'odd'}>
            <td colSpan={2}>&nbsp;</td>
            <td colSpan={highestKey-lowestKey+3} height="300">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                        data={levelData}
                        margin={{top: 0, right: 0, left: 0, bottom: 0}}>
                        <XAxis dataKey="level" />
                        <YAxis width={53} />
                        <Tooltip formatter={tooltipFormatter} 
                            filterNull={true} 
                            contentStyle={{backgroundColor: "#333333", borderRadius: "10px"}}
                            cursor={{stroke:"#555555", fill: "#222222"}}
                         />
                        <Legend align="center" />

                        <Bar dataKey="fail" name="Minimum" stackId="1" fill="#222222" legendType="none" activeBar={false} />
                        <Bar dataKey="targetDelta" name="Failed" stackId="1" fill="#AC1F39" activeBar={false} />
                        <Bar dataKey="plus2Delta" name="Timed" stackId="1" fill="#FFC84A" activeBar={false} />
                        <Bar dataKey="plus3Delta" name="+2" stackId="1" fill="#4ec04e" activeBar={false} />
                    </BarChart>
                </ResponsiveContainer>
            </td>
        </tr>
    )}
    </>
)
}

export default RatingByKeyRow;
