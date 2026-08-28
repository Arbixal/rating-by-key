import { MouseEvent, useEffect, useState } from "react";
import "./CurrentAffixes.css";
import { fetchJson, isFiniteNumber, isRecord, isString } from "../../shared/api/api";

export interface Affix {
    id: number;
    name: string;
    description: string;
    icon: string;
    wowhead_url: string;
}

interface AffixesResult {
    affix_details: Affix[];
}

function isAffix(value: unknown): value is Affix {
    return isRecord(value)
        && isFiniteNumber(value.id)
        && isString(value.name)
        && isString(value.description)
        && isString(value.icon)
        && isString(value.wowhead_url);
}

function isAffixesResult(value: unknown): value is AffixesResult {
    return isRecord(value)
        && Array.isArray(value.affix_details)
        && value.affix_details.every(isAffix);
}

function matchesTouchDevice(): boolean {
    return typeof window !== "undefined"
        && typeof window.matchMedia === "function"
        && window.matchMedia("(hover: none) and (pointer: coarse)").matches;
}

function CurrentAffixes()
{
    const [error, setError] = useState<Error | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [affixes, setAffixes] = useState<Affix[]>([]);
    const [isTouchDevice, setIsTouchDevice] = useState(matchesTouchDevice);
    const [expandedAffixId, setExpandedAffixId] = useState<number | null>(null);
    const [requestVersion, setRequestVersion] = useState(0);

    useEffect(() => {
        if (typeof window.matchMedia !== "function") {
            return;
        }

        const mediaQuery = window.matchMedia("(hover: none) and (pointer: coarse)");
        const updateTouchDevice = () => {
            setIsTouchDevice(mediaQuery.matches);
            if (!mediaQuery.matches) {
                setExpandedAffixId(null);
            }
        };

        if (typeof mediaQuery.addEventListener === "function") {
            mediaQuery.addEventListener("change", updateTouchDevice);

            return () => mediaQuery.removeEventListener("change", updateTouchDevice);
        }

        mediaQuery.addListener(updateTouchDevice);

        return () => mediaQuery.removeListener(updateTouchDevice);
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        fetchJson<AffixesResult>("https://raider.io/api/v1/mythic-plus/affixes?region=us&locale=en", {
            signal: controller.signal,
            validate: isAffixesResult,
        })
            .then((result: AffixesResult) => {
                if (controller.signal.aborted) {
                    return;
                }

                setIsLoading(false);
                setAffixes(result.affix_details);
            })
            .catch((error) => {
                if (controller.signal.aborted) {
                    return;
                }

                setIsLoading(false);
                setError(error);
            });

        return () => controller.abort();
    }, [requestVersion])

    const handleRetry = (): void => {
        setError(null);
        setIsLoading(true);
        setAffixes([]);
        setRequestVersion((currentVersion) => currentVersion + 1);
    };

    const handleAffixClick = (event: MouseEvent<HTMLAnchorElement>, affixId: number): void => {
        if (!isTouchDevice) {
            return;
        }

        event.preventDefault();
        setExpandedAffixId((currentAffixId) => currentAffixId === affixId ? null : affixId);
    };

    if (error) {
        return (
            <section className="affixBox affixBox--status" aria-labelledby="current-affixes-heading" role="alert">
                <h2 id="current-affixes-heading">Current Affixes:</h2>
                <p>Error: {error.message}</p>
                <button className="retryButton" type="button" onClick={handleRetry}>Retry</button>
            </section>
        )
    } else if (isLoading) {
        return (
            <section className="affixBox affixBox--status" aria-labelledby="current-affixes-heading" role="status" aria-live="polite">
                <h2 id="current-affixes-heading">Current Affixes:</h2>
                <p>Loading current affixes...</p>
            </section>
        )
    } else {
        return (
            <section className="affixBox" aria-labelledby="current-affixes-heading">
            <div className="panelHeading">
                <div>
                    <span className="panelEyebrow">Weekly modifiers</span>
                    <h2 id="current-affixes-heading">Current Affixes:</h2>
                </div>
                <span className="affixCount">{affixes.length} active</span>
            </div>
            <ul className="affixList">
                {affixes.map(affix => (
                    <li className="affixItem" key={affix.id}>
                        <a
                            className="affixLink"
                            href={affix.wowhead_url}
                            onClick={(event) => handleAffixClick(event, affix.id)}
                            aria-controls={isTouchDevice ? `affix-details-${affix.id}` : undefined}
                            aria-expanded={isTouchDevice ? expandedAffixId === affix.id : undefined}
                        >
                            <img className="affixIcon" width="40" height="40" src={"https://assets.rpglogs.com/img/warcraft/abilities/" + affix.icon + ".jpg"} alt={affix.name}/>
                            <span className="affixName">{affix.name}</span>
                        </a>
                        {isTouchDevice && expandedAffixId === affix.id && (
                            <div className="affixDetails" id={`affix-details-${affix.id}`}>
                                <p>{affix.description}</p>
                                <a className="affixDetailsLink" href={affix.wowhead_url}>View on Wowhead</a>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
            </section>
        )
    }
}

export default CurrentAffixes;
