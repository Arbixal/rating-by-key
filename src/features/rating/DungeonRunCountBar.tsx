import "./DungeonRunCountBar.css";
import type { DungeonRunCount } from "./ratingData";

interface DungeonRunCountBarProps {
    runCount: DungeonRunCount | null;
}

function DungeonRunCountBar({runCount}: DungeonRunCountBarProps) {
    if (runCount === null) {
        return (
            <div className="runCountsCellContent runCountsCellContent--unavailable" role="img" aria-label="Season run count data unavailable">
                No data
            </div>
        );
    }

    const totalRuns = Math.max(0, runCount.season_runs_total);
    const timedRuns = Math.max(0, Math.min(totalRuns, runCount.season_runs_timed));
    const overtimeRuns = totalRuns - timedRuns;
    const timedWidth = totalRuns === 0 ? 0 : (timedRuns / totalRuns) * 100;
    const overtimeWidth = totalRuns === 0 ? 0 : (overtimeRuns / totalRuns) * 100;
    const countLabel = totalRuns === 0
        ? "No runs"
        : `${timedRuns} timed / ${overtimeRuns} overtime`;

    return (
        <div
            className="runCountsCellContent"
            role="img"
            aria-label={`${runCount.dungeon}: ${timedRuns} timed, ${overtimeRuns} overtime, ${totalRuns} total`}
            title={`${runCount.dungeon}: ${timedRuns} timed, ${overtimeRuns} overtime`}
        >
            <div className="runCountsCellSummary">
                <span className="runCountsCellValue">{countLabel}</span>
            </div>
            <div className={`runCountsCellBar ${totalRuns === 0 ? "runCountsCellBar--empty" : ""}`}>
                <span className="runCountsCellBarTimed" style={{width: `${timedWidth}%`}} />
                <span className="runCountsCellBarOvertime" style={{width: `${overtimeWidth}%`}} />
            </div>
        </div>
    );
}

export default DungeonRunCountBar;
