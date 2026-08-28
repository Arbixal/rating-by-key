import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import DungeonRunCountBar from './DungeonRunCountBar';

describe('DungeonRunCountBar', () => {
  test('renders timed and overtime runs in the table cell', () => {
    render(
      <DungeonRunCountBar
        runCount={{
          zone_id: 1,
          dungeon: 'Altar of Fangs',
          short_name: 'AOF',
          season_runs_total: 2,
          season_runs_timed: 1,
        }}
      />,
    );

    expect(screen.getByText('1 timed / 1 overtime')).toBeInTheDocument();
    expect(screen.getByRole('img', {name: /Altar of Fangs: 1 timed, 1 overtime, 2 total/})).toBeInTheDocument();
  });

  test('renders an empty bar for a dungeon with no completed runs', () => {
    render(
      <DungeonRunCountBar
        runCount={{
          zone_id: 1,
          dungeon: 'Altar of Fangs',
          short_name: 'AOF',
          season_runs_total: 0,
          season_runs_timed: 0,
        }}
      />,
    );

    expect(screen.getByText('No runs')).toBeInTheDocument();
    expect(screen.getByRole('img', {name: /Altar of Fangs: 0 timed, 0 overtime, 0 total/})).toBeInTheDocument();
  });
});
