import { useState } from 'react';
import './App.css';
import CharacterSelector, {RaiderIORun} from './CharacterSelector';
import CurrentAffixes from './CurrentAffixes';
import RatingByKey from './RatingByKey';

function App() {

  const [affix, setAffix] = useState<string | null>(null);
  const [runData, setRunData] = useState<RaiderIORun[] | null>(null);

  const onAffixChange= (data: string | null) => {
    setAffix(data);
  }
  const onCharacterChange = (data: RaiderIORun[] | null) => {
    setRunData(data);
  }

  return (
    <div className="App">
      <header className="App-header">
        Rating by Key
      </header>
      <CurrentAffixes onDataChange={onAffixChange} />
      <CharacterSelector onDataChange={onCharacterChange} />
      <RatingByKey affix={affix} runData={runData} />
    </div>
  );
}

export default App;
