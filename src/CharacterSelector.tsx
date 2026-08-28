import { KeyboardEvent, MouseEvent, useCallback, useEffect, useState } from "react";
import "./CharacterSelector.css";
import CharacterBadge, {CharacterDetails} from "./CharacterBadge";
import { Affix } from "./CurrentAffixes";
import RecentCharacters, { CharacterInput } from "./RecentCharacters";
import type { DungeonRunCount } from "./ratingData";
import { fetchJson } from "./api";
import { useNavigate } from "react-router";

interface RaiderIOCharacter extends RaiderIOError {
    name: string,
    class: string,
    thumbnail_url: string,
    profile_url: string,
    mythic_plus_scores_by_season: RaiderIOScoreBySeason[],
    mythic_plus_best_runs: RaiderIORun[],
    mythic_plus_alternate_runs: RaiderIORun[],
    mythic_plus_dungeon_run_counts?: DungeonRunCount[],
}

interface RaiderIOScoreBySeason {
    season: string,
    scores: { 
        all: number, 
        dps: number, 
        healer: number, 
        tank: number, 
        spec_0: number, 
        spec_1: number, 
        spec_2: number, 
        spec_3: number,
    }
    segments: { 
        all: RaiderIOScoreSegment,
        dps: RaiderIOScoreSegment, 
        healer: RaiderIOScoreSegment, 
        tank: RaiderIOScoreSegment, 
        spec_0: RaiderIOScoreSegment, 
        spec_1: RaiderIOScoreSegment, 
        spec_2: RaiderIOScoreSegment, 
        spec_3: RaiderIOScoreSegment,
    }
}

interface RaiderIOScoreSegment {
    score: number,
    color: string,
}

interface RaiderIOError {
    statusCode: number | null,
    error: string | null,
    message: string | null,
}

export interface RaiderIORun {
    dungeon: string,
    short_name: string,
    mythic_level: number,
    completed_at: string,
    clear_time_ms: number,
    par_time_ms: number,
    num_keystone_upgrades: number,
    map_challenge_mode_id: number,
    zone_id: number,
    url: string,
    affixes: Affix[],
    score: number,
}

interface CharacterSelectorProps {
    onDataChange: (data: RaiderIORun[] | null, rating: number | null, runCounts?: DungeonRunCount[]) => void;
    region: string;
    realm: string;
    character: string;
}

function CharacterSelector({onDataChange, region, realm, character}: CharacterSelectorProps)
{
    const navigate = useNavigate();
    const [characterState, setCharacter] = useState<string>(character);
    const [regionState, setRegion] = useState<string>(region ?? "us");
    const [realmState, setRealm] = useState<string>(realm);
    const [error, setError] = useState<Error | null>(null)
    const [characterDetails, setCharacterDetails] = useState<CharacterDetails | null>(null)
    const [loadedCharacter, setLoadedCharacter] = useState<CharacterInput | null>(null);

    const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>): void => {
        if (e.code !== "Enter" ) {
            return;
        }

        setCharacterDetails(null);
        onDataChange(null, null);

        navigate(`/${regionState}/${realmState}/${characterState}`);
    }
    
    const handleFetch = (e: MouseEvent<HTMLButtonElement>): void => {
        e.preventDefault();

        setCharacterDetails(null);
        onDataChange(null, null);
        
        navigate(`/${regionState}/${realmState}/${characterState}`);
    }

    const fetchCharacterData = useCallback((regionLocal: string, realmLocal: string | undefined, characterLocal: string | undefined, signal: AbortSignal) => {
        console.log(`Loading ${regionLocal}/${realmLocal}/${characterLocal}`)
        if (!characterLocal || !regionLocal || !realmLocal) {
            return;
        }

        fetchJson<RaiderIOCharacter>("https://raider.io/api/v1/characters/profile?region=" + regionLocal.toLowerCase()
            + "&realm=" + realmLocal.toLowerCase() 
            + "&name=" + characterLocal.toLowerCase() 
            + "&fields=mythic_plus_scores_by_season%3Acurrent%2Cmythic_plus_best_runs%2Cmythic_plus_dungeon_run_counts%3Acurrent", {signal})
            .then((result: RaiderIOCharacter) => {
                if (signal.aborted) {
                    return;
                }

                if (result.statusCode && result.statusCode !== 200) {
                    setError(new Error(result?.message ?? "An error occurred."));
                    setCharacterDetails(null);
                    onDataChange(null, null);
                    return;
                }

                let rating = 0;
                let rating_color = "#FFFFFF";
                if (result.mythic_plus_scores_by_season.length > 0) {
                    rating = result.mythic_plus_scores_by_season[0].scores.all;
                    rating_color = result.mythic_plus_scores_by_season[0].segments.all.color;
                }
                setCharacterDetails({
                    name: result.name,
                    character_class: result.class,
                    thumbnail_url: result.thumbnail_url,
                    profile_url: result.profile_url,
                    rating: rating,
                    rating_color: rating_color,
                });
                setError(null);
                onDataChange([...result.mythic_plus_best_runs], rating, result.mythic_plus_dungeon_run_counts ?? []);
                setLoadedCharacter({region: regionLocal.toLowerCase(), realm: realmLocal.toLowerCase(), name: characterLocal.toLowerCase(), lastAccessed: (new Date()).getTime() / 1000, playerClass: result.class.toLowerCase().replace(" ", "_")});
            })
            .catch(error => {
                if (signal.aborted) {
                    return;
                }

                setError(error);
                setCharacterDetails(null);
                onDataChange(null, null);
            });
    }, [onDataChange]);

    useEffect(() => {
      if (region === '' || realm === '' || character === '') {
        return;
      }

      const controller = new AbortController();

      console.log(`Region: ${region}, Realm: ${realm}, Character: ${character}`);
      fetchCharacterData(region, realm, character, controller.signal);

      return () => controller.abort();
    }, [region, realm, character, fetchCharacterData]);

    return (
        <div className="characterWorkspace">
          <div className="characterLookup">
            <section className="selectorPanel" aria-labelledby="character-lookup-heading">
                <div className="panelHeading">
                    <div>
                        <span className="panelEyebrow">Character lookup</span>
                        <h2 id="character-lookup-heading">Analyze a character</h2>
                    </div>
                    <span className="panelHint">Current Mythic+ profile</span>
                </div>
                <div className="inputPanel">
                <div className="inputField inputField--region">
                    <label htmlFor="character-region">Region</label>
                    <select id="character-region" name="region" onChange={(e) => setRegion(e.target.value)} value={regionState}>
                        <option value="us">US</option>
                        <option value="eu">EU</option>
                        <option value="kr">KR</option>
                        <option value="tw">TW</option>
                    </select>
                </div>
                <div className="inputField inputField--realm">
                    <label htmlFor="character-realm">Realm</label>
                    <input id="character-realm" type="text" onChange={(e) => setRealm(e.target.value)} value={realmState} />
                </div>
                <div className="inputField inputField--character">
                    <label htmlFor="character-name">Character</label>
                    <input id="character-name" type="text" onChange={(e) => setCharacter(e.target.value)} onKeyDown={handleKeyPress} value={characterState} />
                </div>
                <div className="inputField inputField--submit">
                    <button className="primaryButton" type="button" onClick={handleFetch}>Fetch Character</button>
                </div>
                </div>
                {error !== null && <div className="error_message" role="alert">{error.message}</div>}
            </section>
            {characterDetails !== null && <CharacterBadge {...characterDetails} />}
          </div>
          <RecentCharacters selectedCharacter={loadedCharacter} />
        </div>
    )
}

export default CharacterSelector;
