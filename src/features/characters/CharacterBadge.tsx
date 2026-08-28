import "./CharacterBadge.css";

export interface CharacterDetails {
    name: string | undefined,
    character_class: string | undefined,
    thumbnail_url: string | undefined,
    profile_url: string | undefined,
    rating: number | undefined,
    rating_color: string | undefined,
};

function CharacterBadge({name, character_class, thumbnail_url, profile_url, rating, rating_color}: CharacterDetails) {

    const isLoaded = (name !== undefined && character_class !== undefined && thumbnail_url !== undefined && profile_url !== undefined && rating !== undefined);

    if (!isLoaded) {
        return (
            <div></div>
        )
    }

    const cssClass = character_class.toLowerCase().replace(" ", "_");

    return (
        <article className="characterPanel">
            <div className="characterThumbnail">
                <img src={thumbnail_url} alt={`${name} portrait`} />
            </div>
            <div className="characterIdentity">
                <span className="characterEyebrow">Current character</span>
                <div className={"characterName " + cssClass}>{name}</div>
                <div className="characterRatingRow">
                    <span className="characterRatingLabel">Mythic+ rating</span>
                    <span className="characterRating" style={{color: rating_color}}>{rating}</span>
                </div>
            </div>
            <a className="profileLink" href={profile_url} target="_blank" rel="noreferrer">
                <img width="20" height="20" alt="" src="https://cdn.raiderio.net/images/brand/Mark_2ColorWhite.png" />
                <span>Raider.IO</span>
            </a>
        </article>
    )
}

export default CharacterBadge;
