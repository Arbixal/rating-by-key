import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

export type CharacterInput = {
    region: string;
    realm: string;
    name: string;
    playerClass: string;
    lastAccessed: number;
};

function isCharacterInput(o: any): o is CharacterInput[] {
    return Array.isArray(o) && o.every((item) => "region" in item && "realm" in item && "name" in item);
}

interface RecentCharactersProps {
    selectedCharacter: CharacterInput | null,
}

function characterEquals(compare1: CharacterInput, compare2: CharacterInput) {
    return compare1.name === compare2.name && compare1.realm === compare2.realm && compare1.region && compare2.region;
}

function RecentCharacters({selectedCharacter}: RecentCharactersProps) {
    const [character, setCharacter] = useState<CharacterInput | undefined>();
    const [recents, setRecents] = useState(() => {
        const saved: string | null = localStorage.getItem("characters");
        const initialValue = JSON.parse(saved ?? "[]");

        if (isCharacterInput(initialValue)) {
            return initialValue;
        }

        return [];
    });

    useMemo(() => {
        // Check if the selected character is not set
        if (selectedCharacter == null) {
            return;
        }

        // Check if the most recent character is the same as the current character
        if (character !== undefined && characterEquals(selectedCharacter, character)) {
            return;
        }

        setCharacter(selectedCharacter);

        const existingCharacter = recents.find(x => characterEquals(x, selectedCharacter));
        if (existingCharacter !== undefined) {
            existingCharacter.lastAccessed = (new Date()).getTime() / 1000;
        } else {
            selectedCharacter.lastAccessed = (new Date()).getTime() / 1000;
            recents.unshift(selectedCharacter);
        }

        var newArray = recents
                        .toSorted((a,b) => (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0))
                        .slice(0, 5);

        localStorage.setItem("characters", JSON.stringify(newArray))
        setRecents(newArray);

    }, [selectedCharacter, character, recents])

    return (
        <div className="topArea">
            Recent Characters:
            <div className="recent-list">
            {recents.map((recent) => (
                <div key={recent.name + "-" + recent.realm} className={"player-name " + recent.playerClass}><Link to={`/${recent.region}/${recent.realm}/${recent.name}`}>{recent.name} - {recent.realm}</Link></div>
            ))}
            </div>
        </div>
    )
}

export default RecentCharacters;