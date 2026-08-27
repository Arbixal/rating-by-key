import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";

export type CharacterInput = {
    region: string;
    realm: string;
    name: string;
    playerClass: string;
    lastAccessed: number;
};

function isCharacterInput(value: unknown): value is CharacterInput[] {
    return Array.isArray(value) && value.every((item) => {
        return typeof item === "object" && item !== null
            && "region" in item && "realm" in item && "name" in item;
    });
}

interface RecentCharactersProps {
    selectedCharacter: CharacterInput | null,
}

function characterEquals(compare1: CharacterInput, compare2: CharacterInput) {
    return compare1.name === compare2.name
        && compare1.realm === compare2.realm
        && compare1.region === compare2.region;
}

function RecentCharacters({selectedCharacter}: RecentCharactersProps) {
    const [recents, setRecents] = useState(() => {
        const saved: string | null = localStorage.getItem("characters");
        const initialValue = JSON.parse(saved ?? "[]");

        if (isCharacterInput(initialValue)) {
            return initialValue;
        }

        return [];
    });
    const processedCharacter = useRef<string | null>(null);

    useEffect(() => {
        if (selectedCharacter == null) {
            return;
        }

        const characterKey = JSON.stringify([
            selectedCharacter.region,
            selectedCharacter.realm,
            selectedCharacter.name,
        ]);

        if (processedCharacter.current === characterKey) {
            return;
        }

        processedCharacter.current = characterKey;
        const lastAccessed = Date.now() / 1000;

        setRecents((previous) => {
            const existingCharacter = previous.find((item) => characterEquals(item, selectedCharacter));
            const withoutExisting = previous.filter((item) => !characterEquals(item, selectedCharacter));
            const updatedCharacter = {
                ...(existingCharacter ?? selectedCharacter),
                lastAccessed,
            };

            return [updatedCharacter, ...withoutExisting]
                .toSorted((a,b) => (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0))
                .slice(0, 5);
        });
    }, [selectedCharacter]);

    useEffect(() => {
        localStorage.setItem("characters", JSON.stringify(recents));
    }, [recents]);

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
