import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import "./RecentCharacters.css";

export type CharacterInput = {
    region: string;
    realm: string;
    name: string;
    playerClass: string;
    lastAccessed: number;
};

function isCharacterInput(value: unknown): value is CharacterInput[] {
    return Array.isArray(value) && value.every((item) => {
        if (typeof item !== "object" || item === null || Array.isArray(item)) {
            return false;
        }

        const candidate = item as Record<string, unknown>;
        return typeof candidate.region === "string"
            && typeof candidate.realm === "string"
            && typeof candidate.name === "string"
            && typeof candidate.playerClass === "string"
            && typeof candidate.lastAccessed === "number"
            && Number.isFinite(candidate.lastAccessed);
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
    const [recents, setRecents] = useState<CharacterInput[]>(() => {
        const saved: string | null = localStorage.getItem("characters");
        if (saved === null) {
            return [];
        }

        try {
            const initialValue: unknown = JSON.parse(saved);
            if (isCharacterInput(initialValue)) {
                return initialValue;
            }
        } catch {
            return [];
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
        <section className="recentCharactersPanel" aria-labelledby="recent-characters-heading">
            <div className="panelHeading">
                <div>
                    <span className="panelEyebrow">Quick access</span>
                    <h2 id="recent-characters-heading">Recent Characters:</h2>
                </div>
                <span className="recentCount">{recents.length} / 5</span>
            </div>
            {recents.length === 0 ? (
                <p className="emptyRecentCharacters">No characters loaded yet</p>
            ) : (
                <ul className="recentCharacterList">
                    {recents.map((recent) => {
                        const isSelected = selectedCharacter !== null && characterEquals(recent, selectedCharacter);

                        return (
                            <li
                                key={recent.name + "-" + recent.realm}
                                className={"recentCharacterItem " + recent.playerClass + (isSelected ? " isSelected" : "")}
                            >
                                <Link
                                    className="recentCharacterLink"
                                    to={`/${recent.region}/${recent.realm}/${recent.name}`}
                                    aria-current={isSelected ? "page" : undefined}
                                    aria-label={`${recent.name} - ${recent.realm}`}
                                >
                                    <span className="recentCharacterName">{recent.name}</span>
                                    <span className="recentCharacterLocation">{recent.region.toUpperCase()} / {recent.realm}</span>
                                    <span className="recentCharacterArrow" aria-hidden="true">&gt;</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    )
}

export default RecentCharacters;
