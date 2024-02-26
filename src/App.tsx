import { useCallback, useState } from 'react';
import './App.css';
import CharacterSelector, {RaiderIORun} from './CharacterSelector';
import CurrentAffixes from './CurrentAffixes';
import RatingByKey from './RatingByKey';
import { useParams } from 'react-router-dom';

function App() {

  const {region, realm, character} = useParams();
  const [affix, setAffix] = useState<string | null>(null);
  const [runData, setRunData] = useState<RaiderIORun[] | null>(null);

  const onAffixChange= useCallback((data: string | null) => {
    setAffix(data);
  }, [setAffix]);
  
  const onRunDataChange = useCallback((data: RaiderIORun[] | null) => {
    setRunData(data);
  }, [setRunData]);

  return (
    <div className="App">
      <header className="App-header">
        Rating by Key
      </header>
      <CurrentAffixes onDataChange={onAffixChange} />
      <CharacterSelector onDataChange={onRunDataChange} region={region ?? 'us'} realm={realm ?? ''} character={character ?? ''} />
      <RatingByKey affix={affix} runData={runData} />
    </div>
  );
}

export default App;
