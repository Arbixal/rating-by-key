import { lazy, Suspense, useCallback, useState } from 'react';
import './App.css';
import CharacterSelector, {RaiderIORun} from './CharacterSelector';
import CurrentAffixes from './CurrentAffixes';
import { useParams } from 'react-router';

const RatingByKey = lazy(() => import('./RatingByKey'));

function App() {

  const {region, realm, character} = useParams();
  const [runData, setRunData] = useState<RaiderIORun[] | null>(null);
  const [characterRating, setCharacterRating] = useState<number | null>(null);
  
  const onRunDataChange = useCallback((data: RaiderIORun[] | null, rating: number | null) => {
    setRunData(data);
    setCharacterRating(rating);
  }, [setRunData, setCharacterRating]);

  return (
    <div className="App">
      <header className="App-header">
        Rating by Key
      </header>
      <CurrentAffixes />
      <CharacterSelector
        key={`${region ?? 'us'}/${realm ?? ''}/${character ?? ''}`}
        onDataChange={onRunDataChange}
        region={region ?? 'us'}
        realm={realm ?? ''}
        character={character ?? ''}
      />
      {runData !== null && characterRating !== null && (
        <Suspense fallback={<div>Loading ratings...</div>}>
          <RatingByKey runData={runData} characterRating={characterRating} />
        </Suspense>
      )}
    </div>
  );
}

export default App;
