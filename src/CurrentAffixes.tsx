// https://raider.io/api/v1/mythic-plus/affixes?region=us&locale=en
/*
{
  "region": "us",
  "title": "Fortified, Incorporeal, Sanguine",
  "leaderboard_url": "https://raider.io/mythic-plus-affix-rankings/season-df-3/all/us/leaderboards-strict/fortified-incorporeal-sanguine",
  "affix_details": [
    {
      "id": 10,
      "name": "Fortified",
      "description": "Non-boss enemies have 20% more health and inflict up to 30% increased damage.",
      "icon": "ability_toughness",
      "wowhead_url": "https://wowhead.com/affix=10"
    },
    {
      "id": 136,
      "name": "Incorporeal",
      "description": "While in combat, incorporeal beings periodically appear and attempt to weaken players.",
      "icon": "achievement_boss_anomalus",
      "wowhead_url": "https://wowhead.com/affix=136"
    },
    {
      "id": 8,
      "name": "Sanguine",
      "description": "When slain, non-boss enemies leave behind a lingering pool of ichor that heals their allies and damages players.",
      "icon": "spell_shadow_bloodboil",
      "wowhead_url": "https://wowhead.com/affix=8"
    }
  ]
}
*/

import { MouseEvent, useEffect, useState } from "react";
import "./CurrentAffixes.css";
import { fetchJson } from "./api";

export interface Affix {
    id: number;
    name: string;
    description: string;
    icon: string;
    wowhead_url: string;
}

interface AffixesResult {
    region: string;
    title: string;
    leaderboard_url: string;
    affix_details: Affix[];
}

function matchesTouchDevice(): boolean {
    return typeof window !== "undefined"
        && typeof window.matchMedia === "function"
        && window.matchMedia("(hover: none) and (pointer: coarse)").matches;
}

function CurrentAffixes()
{
    const [error, setError] = useState<Error | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [affixes, setAffixes] = useState<Affix[]>([]);
    const [isTouchDevice, setIsTouchDevice] = useState(matchesTouchDevice);
    const [expandedAffixId, setExpandedAffixId] = useState<number | null>(null);

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

        fetchJson<AffixesResult>("https://raider.io/api/v1/mythic-plus/affixes?region=us&locale=en", {signal: controller.signal})
            .then((result: AffixesResult) => {
                if (controller.signal.aborted) {
                    return;
                }

                setIsLoaded(true);
                setAffixes(result.affix_details);
            })
            .catch((error) => {
                if (controller.signal.aborted) {
                    return;
                }

                setIsLoaded(true);
                setError(error);
            });

        return () => controller.abort();
    }, [])

    const handleAffixClick = (event: MouseEvent<HTMLAnchorElement>, affixId: number): void => {
        if (!isTouchDevice) {
            return;
        }

        event.preventDefault();
        setExpandedAffixId((currentAffixId) => currentAffixId === affixId ? null : affixId);
    };

    if (error) {
        return (
            <section className="affixBox affixBox--status" aria-labelledby="current-affixes-heading">
                <h2 id="current-affixes-heading">Current Affixes:</h2>
                <p>Error: {error.message}</p>
            </section>
        )
    } else if (!isLoaded) {
        return (
            <section className="affixBox affixBox--status" aria-labelledby="current-affixes-heading">
                <h2 id="current-affixes-heading">Current Affixes:</h2>
                <p>Loading ...</p>
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
