import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getDisplayedRatingRange, getTimerThresholds, TableData } from "./ratingData";
import type { RaiderIODungeon, RatingRange } from "./ratingData";
import { faAnglesDown, faAnglesUp } from "@fortawesome/free-solid-svg-icons";
import { useState, MouseEvent } from "react";
import { Line, LineChart, Legend, ResponsiveContainer, YAxis, Tooltip, XAxis } from "recharts";
import type { Formatter } from "recharts/types/component/DefaultTooltipContent";
import TimerRuler from "./TimerRuler";

interface RatingByKeyRowProps {
    dungeon: RaiderIODungeon,
    playerData: TableData,
    highestKey: number,
    lowestKey: number,
    index: number,
}

interface RatingThresholdLadderProps {
    ratingRange: RatingRange;
    scaleMax: number;
}

function RatingThresholdLadder({ratingRange, scaleMax}: RatingThresholdLadderProps) {
    const thresholds = [
        {label: "+3", value: ratingRange.plus3, className: "ratingThresholdBar--plus3"},
        {label: "+2", value: ratingRange.plus2, className: "ratingThresholdBar--plus2"},
        {label: "Target", value: ratingRange.target, className: "ratingThresholdBar--target"},
        {label: "Fail", value: ratingRange.fail, className: "ratingThresholdBar--fail"},
    ];
    const valueLabel = thresholds
        .map(({label, value}) => `${label}: ${value.toFixed(1)}`)
        .join(", ");

    return (
        <div
            className="ratingThresholdLadder"
            role="img"
            aria-label={`Rating gain at thresholds: ${valueLabel}`}
            title={valueLabel}
        >
            {thresholds.map(({label, value, className}) => (
                <span className="ratingThresholdBar" key={label}>
                    <span
                        className={className}
                        style={{width: `${(value / scaleMax) * 100}%`}}
                    />
                </span>
            ))}
        </div>
    );
}

function RatingByKeyRow({dungeon, playerData, highestKey, lowestKey, index}: RatingByKeyRowProps) {
    const [expanded, setExpanded] = useState<boolean>(false);

    const parTimer = (dungeon.keystone_timer_seconds * 1000) + 999; //SEASON_3_TIMERS[dungeon.id];
    const timerThresholds = getTimerThresholds(parTimer);

    const handleExpandClick = (e: MouseEvent<HTMLButtonElement>): void => {
        e.preventDefault();

        setExpanded(!expanded);
    }

    const tooltipFormatter: Formatter = (value, name) => {
        const label = name ?? "";
        const numericValue = Number(value);

        return [Number.isFinite(numericValue) ? numericValue.toFixed(1) : null, label];
    }

    const levelData: RatingRange[] = [...Array(highestKey-lowestKey+1)].map(((_,lix) => {
        const mLevel = lowestKey+lix;
        return getDisplayedRatingRange(playerData, parTimer, mLevel);
    }))
    const maximumRatingGain = Math.max(...levelData.map((ratingRange) => ratingRange.plus3), 1);

    return (
    <>
    <tr className={index % 2 === 0 ? 'even' : 'odd'}>
        <td className="dungeonCell">{dungeon.name}</td>

        <td className="level">{playerData.bestRun?.level}</td>
        <td className="score">{playerData.bestRun?.score.toFixed(1)}</td>
        <td className="runProgressCell">
            <TimerRuler clearTime={playerData.bestRun?.timer ?? null} thresholds={timerThresholds} />
        </td>

        {levelData.map(((lData,lix) => (
                <td className={"ratingKeyCell " + (lix % 2 === 0 ? 'evenCol' : 'oddCol')} key={lData.level}>
                    <div className="ratingCell">
                        <span className={lData.target === 0 ? "ratingCellValue ratingCellValue--zero" : "ratingCellValue"}>
                            {Math.round(lData.target)}
                        </span>
                        <RatingThresholdLadder ratingRange={lData} scaleMax={maximumRatingGain} />
                    </div>
                </td>
            )
        ))}

        <td><button onClick={handleExpandClick}><FontAwesomeIcon icon={expanded ? faAnglesUp : faAnglesDown}/></button></td>
    </tr>
    {expanded && (
        <tr className={index % 2 === 0 ? 'event' : 'odd'}>
            <td colSpan={2}>&nbsp;</td>
            <td colSpan={highestKey-lowestKey+3} height="300">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
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

                        <Line dataKey="plus3" name="+3" stroke="#2090c0" dot={false} strokeWidth={2} />
                        <Line dataKey="plus2" name="+2" stroke="#4ec04e" dot={false} strokeWidth={2} />
                        <Line dataKey="target" name="Target" stroke="#FFFFFF" dot={false} strokeWidth={2} />
                        <Line dataKey="fail" name="Fail" stroke="#FFC84A" dot={false} strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </td>
        </tr>
    )}
    </>
)
}

export default RatingByKeyRow;
