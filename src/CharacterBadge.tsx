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
        <div className="characterPanel">
            <div className="characterThumbnail"><img src={thumbnail_url} alt="Character thumbnail" /></div>
            <div className="verticalFlex">
                <div className={"characterName " + cssClass}>{name}</div>
                <div className="characterRating" style={{color: rating_color}}>{rating}</div>
                <div>
                    <a href={profile_url} target="_blank" rel="noreferrer">
                        <img width="24" height="24" alt="RaiderIO link" src="https://cdn.raiderio.net/images/brand/Mark_2ColorWhite.png" />
                    </a>
                </div>
            </div>
        </div>
    )
}

export default CharacterBadge;