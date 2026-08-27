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

import { useEffect, useState } from "react";
import "./CurrentAffixes.css";

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

function CurrentAffixes()
{
    const [error, setError] = useState<Error | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [affixes, setAffixes] = useState<Affix[]>([]);

    useEffect(() => {
        const controller = new AbortController();

        fetch("https://raider.io/api/v1/mythic-plus/affixes?region=us&locale=en", {signal: controller.signal})
            .then(res => res.json())
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
                        <a className="affixLink" href={affix.wowhead_url}>
                            <img className="affixIcon" width="40" height="40" src={"https://assets.rpglogs.com/img/warcraft/abilities/" + affix.icon + ".jpg"} alt={affix.name}/>
                            <span className="affixName">{affix.name}</span>
                        </a>
                    </li>
                ))}
            </ul>
            </section>
        )
    }
}

export default CurrentAffixes;
