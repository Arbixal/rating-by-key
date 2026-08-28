import { lazy, Suspense, useCallback, useState } from 'react';
import './App.css';
import CharacterSelector, {RaiderIORun} from './CharacterSelector';
import CurrentAffixes from './CurrentAffixes';
import ErrorBoundary from './ErrorBoundary';
import type { DungeonRunCount } from './ratingData';
import { useParams } from 'react-router';

const RatingByKey = lazy(() => import('./RatingByKey'));

function App() {

  const {region, realm, character} = useParams();
  const [runData, setRunData] = useState<RaiderIORun[] | null>(null);
  const [characterRating, setCharacterRating] = useState<number | null>(null);
  const [runCounts, setRunCounts] = useState<DungeonRunCount[]>([]);
  
  const onRunDataChange = useCallback((data: RaiderIORun[] | null, rating: number | null, counts: DungeonRunCount[] = []) => {
    setRunData(data);
    setCharacterRating(rating);
    setRunCounts(counts);
  }, [setRunData, setCharacterRating]);

  return (
    <div className="App">
      <header className="App-header">
        <div className="appHeaderContent">
          <span className="appHeaderAccent" aria-hidden="true"></span>
          <div>
            <h1>Rating by Key</h1>
            <p>Mythic+ rating analysis</p>
          </div>
        </div>
      </header>
      <main className="appMain">
        <CurrentAffixes />
        <CharacterSelector
          key={`${region ?? 'us'}/${realm ?? ''}/${character ?? ''}`}
          onDataChange={onRunDataChange}
          region={region ?? 'us'}
          realm={realm ?? ''}
          character={character ?? ''}
        />
        {runData !== null && characterRating !== null && (
          <section className="ratingSection" aria-label="Rating by key projections">
            <ErrorBoundary
              key={`${region ?? 'us'}/${realm ?? ''}/${character ?? ''}`}
              title="Rating analysis unavailable"
              message="The character loaded, but the rating analysis could not be displayed."
            >
              <Suspense fallback={<div className="loadingPanel">Loading ratings...</div>}>
                <RatingByKey runData={runData} characterRating={characterRating} runCounts={runCounts} />
              </Suspense>
            </ErrorBoundary>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
