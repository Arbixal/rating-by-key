import { formatTime } from "./utils";
import type { TimerThresholds } from "./ratingData";

interface TimerRulerProps {
    clearTime: number | null;
    thresholds: TimerThresholds;
}

type TimingStatus = "no-run" | "plus3" | "plus2" | "timed" | "overtime" | "no-score";

const STATUS_LABELS: Record<TimingStatus, string> = {
    "no-run": "No run",
    plus3: "+3",
    plus2: "+2",
    timed: "Timed",
    overtime: "Overtime",
    "no-score": "No score",
};

function formatDuration(milliseconds: number): string {
    return formatTime(new Date(Math.max(0, milliseconds)));
}

function getTimingStatus(clearTime: number | null, thresholds: TimerThresholds): TimingStatus {
    if (clearTime === null) {
        return "no-run";
    }

    if (clearTime <= thresholds.plus3) {
        return "plus3";
    }

    if (clearTime <= thresholds.plus2) {
        return "plus2";
    }

    if (clearTime <= thresholds.target) {
        return "timed";
    }

    if (clearTime <= thresholds.fail) {
        return "overtime";
    }

    return "no-score";
}

function getStatusDetail(status: TimingStatus, clearTime: number | null, thresholds: TimerThresholds): string {
    if (clearTime === null) {
        return "No recorded best run";
    }

    switch (status) {
        case "plus3":
            return "Maximum score";
        case "plus2":
            return `${formatDuration(clearTime - thresholds.plus3)} to +3`;
        case "timed":
            return `${formatDuration(clearTime - thresholds.plus2)} to +2`;
        case "overtime":
            return `${formatDuration(thresholds.fail - clearTime)} to no score`;
        case "no-score":
            return `${formatDuration(clearTime - thresholds.fail)} past final timer`;
        case "no-run":
            return "No recorded best run";
    }
}

function TimerRuler({clearTime, thresholds}: TimerRulerProps) {
    const status = getTimingStatus(clearTime, thresholds);
    const statusLabel = STATUS_LABELS[status];
    const runTimeLabel = clearTime === null ? "No run" : formatDuration(clearTime);
    const markerPosition = clearTime === null
        ? null
        : Math.min(100, Math.max(0, (clearTime / thresholds.fail) * 100));
    const ariaLabel = clearTime === null
        ? `No best run recorded. +3 at ${formatDuration(thresholds.plus3)}, +2 at ${formatDuration(thresholds.plus2)}, target at ${formatDuration(thresholds.target)}, final timer at ${formatDuration(thresholds.fail)}.`
        : `Best run ${runTimeLabel}, ${statusLabel}. +3 at ${formatDuration(thresholds.plus3)}, +2 at ${formatDuration(thresholds.plus2)}, target at ${formatDuration(thresholds.target)}, final timer at ${formatDuration(thresholds.fail)}.`;

    const plus3Position = (thresholds.plus3 / thresholds.fail) * 100;
    const plus2Position = (thresholds.plus2 / thresholds.fail) * 100;
    const targetPosition = (thresholds.target / thresholds.fail) * 100;

    return (
        <div className="runProgress" data-status={status}>
            <div className="runProgressSummary">
                <span className={`runProgressStatus runProgressStatus--${status}`}>{statusLabel}</span>
                <span className="runProgressTime">{runTimeLabel}</span>
            </div>
            <div className="timerRuler" role="img" aria-label={ariaLabel}>
                <div className="timerRulerTrack" aria-hidden="true">
                    <span
                        className="timerRulerSegment timerRulerSegment--plus3"
                        style={{width: `${plus3Position}%`}}
                        title={`+3 through ${formatDuration(thresholds.plus3)}`}
                    >{formatDuration(thresholds.plus3)}</span>
                    <span
                        className="timerRulerSegment timerRulerSegment--plus2"
                        style={{width: `${plus2Position - plus3Position}%`}}
                        title={`+2 through ${formatDuration(thresholds.plus2)}`}
                    >{formatDuration(thresholds.plus2)}</span>
                    <span
                        className="timerRulerSegment timerRulerSegment--timed"
                        style={{width: `${targetPosition - plus2Position}%`}}
                        title={`Timed through ${formatDuration(thresholds.target)}`}
                    >{formatDuration(thresholds.target)}</span>
                    <span
                        className="timerRulerSegment timerRulerSegment--overtime"
                        style={{width: `${100 - targetPosition}%`}}
                        title={`Overtime through ${formatDuration(thresholds.fail)}`}
                    >{formatDuration(thresholds.fail)}</span>
                    {[plus3Position, plus2Position, targetPosition].map((position) => (
                        <span
                            className="timerRulerTick"
                            key={position}
                            style={{left: `${position}%`}}
                        />
                    ))}
                    {markerPosition !== null && (
                        <span
                            className={`timerRulerMarker ${status === "no-score" ? "timerRulerMarker--overflow" : ""}`}
                            style={{left: `${markerPosition}%`}}
                            title={`Best run: ${runTimeLabel}`}
                        />
                    )}
                </div>
                <div className="timerRulerLabels" aria-hidden="true">
                    <span className="timerRulerLabel timerRulerLabel--start">0:00</span>
                    <span
                        className="timerRulerLabel"
                        style={{left: `${plus3Position}%`}}
                        title={`+3: ${formatDuration(thresholds.plus3)}`}
                    >+3</span>
                    <span
                        className="timerRulerLabel"
                        style={{left: `${plus2Position}%`}}
                        title={`+2: ${formatDuration(thresholds.plus2)}`}
                    >+2</span>
                    <span
                        className="timerRulerLabel"
                        style={{left: `${targetPosition}%`}}
                        title={`Target: ${formatDuration(thresholds.target)}`}
                    >Target</span>
                    <span
                        className="timerRulerLabel timerRulerLabel--end"
                        title={`Final timer: ${formatDuration(thresholds.fail)}`}
                    >Fail</span>
                </div>
            </div>
            <div className="runProgressDetail">{getStatusDetail(status, clearTime, thresholds)}</div>
        </div>
    );
}

export default TimerRuler;
