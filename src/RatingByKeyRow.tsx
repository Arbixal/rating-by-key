import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { RaiderIODungeon, RatingRange, TableData, getScoreLevels } from "./RatingByKey";
import { formatTime, roundToOneDecimal } from "./utils";
import { faAnglesDown, faAnglesUp, faStar } from "@fortawesome/free-solid-svg-icons";
import { useState, MouseEvent } from "react";
import { BarChart, Legend, ResponsiveContainer, YAxis, Bar, Tooltip, Label, XAxis, CartesianGrid } from "recharts";

const SEASON_3_TIMERS: {[index: number]: number} = {
    9028: 1800999, // Atal'Dazar
    7805: 2160999, // Black Rook Hold
    1000010: 2040999, // Galakrond's Fall
    1000011: 2160999, // Murozond's Rise
    7673: 1800999, // Darkheart Thicket
    7109: 1980999, // The Everbloom
    4738: 2040999, // The Throne of the Tides
    9424: 2220999, // Warcrest Manor
};

interface RatingByKeyRowProps {
    dungeon: RaiderIODungeon,
    playerData: TableData,
    affix: string,
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

    constructor(ratingRange: RatingRange, playerScore: number, alternateScore: number) {
        this.level = ratingRange.level;

        const oldRating = calculateTotalRating(playerScore, alternateScore);

        this.fail = calculateTotalRating(playerScore + ratingRange.fail, alternateScore) - oldRating;
        this.target = calculateTotalRating(playerScore + ratingRange.target, alternateScore) - oldRating;
        this.plus2 = calculateTotalRating(playerScore + ratingRange.plus2, alternateScore) - oldRating;
        this.plus3 = calculateTotalRating(playerScore + ratingRange.plus3, alternateScore) - oldRating;
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

function calculateTotalRating(fort: number, tyran: number) {
    if (fort > tyran) {
        return (fort * 1.5) + (tyran * 0.5);
    }

    return (fort * 0.5) + (tyran * 1.5);
}

function RatingByKeyRow({dungeon, playerData, affix, highestKey, lowestKey, index}: RatingByKeyRowProps) {
    const [expanded, setExpanded] = useState<boolean>(false);

    const parTimer = SEASON_3_TIMERS[dungeon.id];
    const target = new Date(parTimer);
    const plus2 = new Date(parTimer - (parTimer * 0.2));
    const plus3 = new Date(parTimer - (parTimer * 0.4));
    const fail = new Date(parTimer + (parTimer * 0.4));

    const playerScore: number = (affix === "Fortified" ? playerData.fortified.score : playerData.tyrannical.score);
    const alternateScore: number = (affix === "Fortified" ? playerData.tyrannical.score : playerData.fortified.score);

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
        const x = playerData.levels[mLevel] ?? getScoreLevels(parTimer, mLevel, playerScore);

        return new RatingRangeWithDeltas(x, playerScore, alternateScore)
    }))

    return (
    <>
    <tr className={index % 2 === 0 ? 'even' : 'odd'}>
        <td>{dungeon.name}</td>

        <td className="timeTarget">{formatTime(target)}</td>
        <td className="timePlus2">{formatTime(plus2)}</td>
        <td className="timePlus3">{formatTime(plus3)}</td>
        <td className="timeFail">{formatTime(fail)}</td>

        <td className="fortified level">{playerData.fortified?.level} <FontAwesomeIcon size="2xs" icon={faStar} /></td>
        <td className="fortified timer">{playerData.fortified?.timer ? formatTime(new Date(playerData.fortified.timer)) : null}</td>
        <td className="fortified score">{playerData.fortified?.score.toFixed(1)}</td>
        <td className="fortified rating">{playerData.fortified?.rating.toFixed(1)}</td>

        <td className="tyrannical level">{playerData.tyrannical?.level}</td>
        <td className="tyrannical timer">{playerData.tyrannical?.timer ? formatTime(new Date(playerData.tyrannical.timer)) : null}</td>
        <td className="tyrannical score">{playerData.tyrannical?.score.toFixed(1)}</td>
        <td className="tyrannical rating">{playerData.tyrannical?.rating.toFixed(1)}</td>

        <td>{playerData.total_rating.toFixed(1)}</td>

        {levelData.map(((lData,lix) => (
                <td className={lix % 2 === 0 ? 'evenCol' : 'oddCol'} key={lData.level}>{lData.target === 0.0 ? "" : (lData.target).toFixed(1)}</td>
            )
        ))}

        <td><button onClick={handleExpandClick}><FontAwesomeIcon icon={expanded ? faAnglesUp : faAnglesDown}/></button></td>
    </tr>
    {expanded && (
        <tr className={index % 2 === 0 ? 'event' : 'odd'}>
            <td colSpan={13}>&nbsp;</td>
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
                        {/* <Bar dataKey="fail" name="Minimum" fill="#222222" legendType="none" /> */}
                        {/* <Bar dataKey="targetRange" name="Failed" fill="#AC1F39" />
                        <Bar dataKey="plus2Range" name="Timed" fill="#FFC84A" />
                        <Bar dataKey="plus3Range" name="+2" fill="#4ec04e" /> */}

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