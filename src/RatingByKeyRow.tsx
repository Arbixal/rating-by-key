import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { RaiderIODungeon, RatingRange, TableData, getScoreLevels } from "./RatingByKey";
import { formatTime } from "./utils";
import { faAnglesDown, faAnglesUp } from "@fortawesome/free-solid-svg-icons";
import { useState, MouseEvent } from "react";
import { BarChart, Legend, ResponsiveContainer, YAxis, Bar, Tooltip, XAxis } from "recharts";

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

    constructor(ratingRange: RatingRange, playerScore: number) {
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
    const target = new Date(parTimer);
    const plus2 = new Date(parTimer - (parTimer * 0.2));
    const plus3 = new Date(parTimer - (parTimer * 0.4));
    const fail = new Date(parTimer + (parTimer * 0.4));

    const handleExpandClick = (e: MouseEvent<HTMLButtonElement>): void => {
        e.preventDefault();

        setExpanded(!expanded);
    }

    const tooltipFormatter = (value, name, props) => {
        if (props.dataKey === "targetDelta") {
            return [props.payload.fail.toFixed(1) + " - " + props.payload.target.toFixed(1), name];
        }

        if (props.dataKey === "plus2Delta") {
            return [props.payload.target.toFixed(1) + " - " + props.payload.plus2.toFixed(1), name];
        }

        if (props.dataKey === "plus3Delta") {
            return [props.payload.plus2.toFixed(1) + " - " + props.payload.plus3.toFixed(1), name];
        }

        return [null, ""];
    }

    const levelData: RatingRangeWithDeltas[] = [...Array(highestKey-lowestKey+1)].map(((_,lix) => {
        const mLevel = lowestKey+lix;
        const x = playerData.levels[mLevel] ?? getScoreLevels(parTimer, mLevel, playerData.bestRun.score);

        return new RatingRangeWithDeltas(x, playerData.bestRun.score)
    }))

    return (
    <>
    <tr className={index % 2 === 0 ? 'even' : 'odd'}>
        <td>{dungeon.name}</td>

        <td className="timeTarget">{formatTime(target)}</td>
        <td className="timePlus2">{formatTime(plus2)}</td>
        <td className="timePlus3">{formatTime(plus3)}</td>
        <td className="timeFail">{formatTime(fail)}</td>

        <td className="level">{playerData.bestRun?.level}</td>
        <td className="timer">{playerData.bestRun?.timer ? formatTime(new Date(playerData.bestRun.timer)) : null}</td>
        <td className="score">{playerData.bestRun?.score.toFixed(1)}</td>

        {levelData.map(((lData,lix) => (
                <td className={lix % 2 === 0 ? 'evenCol' : 'oddCol'} key={lData.level}>{lData.target === 0.0 ? "" : (lData.target).toFixed(1)}</td>
            )
        ))}

        <td><button onClick={handleExpandClick}><FontAwesomeIcon icon={expanded ? faAnglesUp : faAnglesDown}/></button></td>
    </tr>
    {expanded && (
        <tr className={index % 2 === 0 ? 'event' : 'odd'}>
            <td colSpan={7}>&nbsp;</td>
            <td colSpan={highestKey-lowestKey+2} height="300">
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