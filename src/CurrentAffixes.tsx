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

interface CurrentAffixesProps {
    onDataChange: (data: string | null) => void;
}

function CurrentAffixes({onDataChange}: CurrentAffixesProps)
{
    const [error, setError] = useState<Error | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [affixes, setAffixes] = useState<Affix[]>([]);

    useEffect(() => {
        fetch("https://raider.io/api/v1/mythic-plus/affixes?region=us&locale=en")
            .then(res => res.json())
            .then((result: AffixesResult) => {
                setIsLoaded(true);
                setAffixes(result.affix_details);
                onDataChange(result.affix_details[0].name);
            },
            (error) => {
                setIsLoaded(true);
                setError(error);
                onDataChange(null);
            })
    }, [onDataChange])

    if (error) {
        return <div>Error: {error.message}</div>
    } else if (!isLoaded) {
        return <div>Loading ...</div>
    } else {
        return (
            <div className="affixBox">
            Current Affixes:
            <ul>
                {affixes.map(affix => (
                    <li key={affix.id}>
                        <a href={affix.wowhead_url}><img width="32" height="32" src={"https://assets.rpglogs.com/img/warcraft/abilities/" + affix.icon + ".jpg"} alt={affix.name}/></a>
                    </li>
                ))}
            </ul>
            </div>
        )
    }
}

export default CurrentAffixes;