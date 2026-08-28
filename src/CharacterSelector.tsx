import { KeyboardEvent, MouseEvent, useCallback, useEffect, useState } from "react";
import "./CharacterSelector.css";
import CharacterBadge, {CharacterDetails} from "./CharacterBadge";
import type { Affix } from "./CurrentAffixes";
import RecentCharacters, { CharacterInput } from "./RecentCharacters";
import type { DungeonRunCount } from "./ratingData";
import { fetchJson, isFiniteNumber, isRecord, isString } from "./api";
import { useNavigate } from "react-router";

interface RaiderIOCharacter {
    name: string,
    class: string,
    thumbnail_url: string,
    profile_url: string,
    mythic_plus_scores_by_season: RaiderIOScoreBySeason[],
    mythic_plus_best_runs: RaiderIORun[],
    mythic_plus_alternate_runs?: RaiderIORun[],
    mythic_plus_dungeon_run_counts?: DungeonRunCount[],
}

interface RaiderIOErrorResponse {
    statusCode: number,
    error?: string | null,
    message?: string | null,
}

type RaiderIOCharacterResponse = RaiderIOCharacter | RaiderIOErrorResponse;

interface RaiderIOScoreBySeason {
    scores: { 
        all: number,
    }
    segments: { 
        all: RaiderIOScoreSegment,
    }
}

interface RaiderIOScoreSegment {
    color: string,
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

function isRaiderIOScoreSegment(value: unknown): value is RaiderIOScoreSegment {
    return isRecord(value)
        && isString(value.color);
}

function isRaiderIOScoreBySeason(value: unknown): value is RaiderIOScoreBySeason {
    if (!isRecord(value) || !isRecord(value.scores) || !isRecord(value.segments)) {
        return false;
    }

    return isFiniteNumber(value.scores.all) && isRaiderIOScoreSegment(value.segments.all);
}

function isRaiderIOAffix(value: unknown): value is Affix {
    return isRecord(value)
        && isFiniteNumber(value.id)
        && isString(value.name)
        && isString(value.description)
        && isString(value.icon)
        && isString(value.wowhead_url);
}

function isRaiderIORun(value: unknown): value is RaiderIORun {
    return isRecord(value)
        && isString(value.dungeon)
        && isString(value.short_name)
        && isFiniteNumber(value.mythic_level)
        && isString(value.completed_at)
        && isFiniteNumber(value.clear_time_ms)
        && isFiniteNumber(value.par_time_ms)
        && isFiniteNumber(value.num_keystone_upgrades)
        && isFiniteNumber(value.map_challenge_mode_id)
        && isFiniteNumber(value.zone_id)
        && isString(value.url)
        && Array.isArray(value.affixes)
        && value.affixes.every(isRaiderIOAffix)
        && isFiniteNumber(value.score);
}

function isDungeonRunCount(value: unknown): value is DungeonRunCount {
    return isRecord(value)
        && isFiniteNumber(value.zone_id)
        && isString(value.dungeon)
        && isString(value.short_name)
        && isFiniteNumber(value.season_runs_total)
        && isFiniteNumber(value.season_runs_timed);
}

function isRaiderIOCharacter(value: unknown): value is RaiderIOCharacter {
    return isRecord(value)
        && isString(value.name)
        && isString(value.class)
        && isString(value.thumbnail_url)
        && isString(value.profile_url)
        && Array.isArray(value.mythic_plus_scores_by_season)
        && value.mythic_plus_scores_by_season.every(isRaiderIOScoreBySeason)
        && Array.isArray(value.mythic_plus_best_runs)
        && value.mythic_plus_best_runs.every(isRaiderIORun)
        && (value.mythic_plus_alternate_runs === undefined
            || (Array.isArray(value.mythic_plus_alternate_runs) && value.mythic_plus_alternate_runs.every(isRaiderIORun)))
        && (value.mythic_plus_dungeon_run_counts === undefined
            || (Array.isArray(value.mythic_plus_dungeon_run_counts) && value.mythic_plus_dungeon_run_counts.every(isDungeonRunCount)));
}

function isRaiderIOErrorResponse(value: unknown): value is RaiderIOErrorResponse {
    return isRecord(value)
        && isFiniteNumber(value.statusCode)
        && value.statusCode !== 200
        && (value.error === undefined || value.error === null || isString(value.error))
        && (value.message === undefined || value.message === null || isString(value.message));
}

function isRaiderIOCharacterResponse(value: unknown): value is RaiderIOCharacterResponse {
    return isRaiderIOErrorResponse(value) || isRaiderIOCharacter(value);
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

        fetchJson<RaiderIOCharacterResponse>("https://raider.io/api/v1/characters/profile?region=" + regionLocal.toLowerCase()
            + "&realm=" + realmLocal.toLowerCase() 
            + "&name=" + characterLocal.toLowerCase() 
            + "&fields=mythic_plus_scores_by_season%3Acurrent%2Cmythic_plus_best_runs%2Cmythic_plus_dungeon_run_counts%3Acurrent", {
                signal,
                validate: isRaiderIOCharacterResponse,
            })
            .then((result: RaiderIOCharacterResponse) => {
                if (signal.aborted) {
                    return;
                }

                if (isRaiderIOErrorResponse(result)) {
                    setError(new Error(result.message ?? result.error ?? "An error occurred."));
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
