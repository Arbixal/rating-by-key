import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import CharacterSelector from './CharacterSelector';
import type { RaiderIORun } from './CharacterSelector';
import CurrentAffixes from './CurrentAffixes';
import RatingByKey from './RatingByKey';
import RecentCharacters, { CharacterInput } from './RecentCharacters';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  localStorage.clear();
});

describe('route-driven character loading', () => {
  test('loads character data after route parameters are available', async () => {
    const characterResponse = {
      name: 'Bixwar',
      class: 'Warrior',
      thumbnail_url: 'https://example.com/bixwar.jpg',
      profile_url: 'https://raider.io/characters/us/nagrand/Bixwar',
      mythic_plus_scores_by_season: [
        {
          scores: { all: 837 },
          segments: { all: { color: '#9eff83' } },
        },
      ],
      mythic_plus_best_runs: [],
    };
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => characterResponse,
    });
    const onDataChange = vi.fn();

    vi.stubGlobal('fetch', fetchMock);
    render(
      <MemoryRouter>
        <CharacterSelector
          onDataChange={onDataChange}
          region="us"
          realm="nagrand"
          character="bixwar"
        />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('Bixwar')).toBeInTheDocument());

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain('region=us');
    expect(fetchMock.mock.calls[0][1]).toEqual({ signal: expect.any(AbortSignal) });
    expect(onDataChange).toHaveBeenCalledWith([]);
  });
});

describe('rating data derivation', () => {
  test('renders the current dungeon table from run data', async () => {
    const runData: RaiderIORun[] = [
      {
        dungeon: 'Altar of Fangs',
        short_name: 'AOF',
        mythic_level: 10,
        completed_at: new Date(),
        clear_time_ms: 1_856_494,
        par_time_ms: 1_800_999,
        num_keystone_upgrades: 0,
        map_challenge_mode_id: 588,
        zone_id: 16865,
        url: 'https://raider.io/mythic-plus-runs/example',
        affixes: [],
        score: 303.8,
      },
    ];
    const staticData = {
      seasons: [
        {
          is_main_season: true,
          starts: { us: '2026-01-01T00:00:00Z' },
          ends: { us: '2030-01-01T00:00:00Z' },
          dungeons: [
            {
              id: 16865,
              challenge_mode_id: 588,
              slug: 'altar-of-fangs',
              name: 'Altar of Fangs',
              short_name: 'AOF',
              keystone_timer_seconds: 1800,
              icon_url: 'https://example.com/icon.jpg',
              background_image_url: 'https://example.com/background.jpg',
            },
          ],
        },
      ],
    };
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => staticData,
    });

    vi.stubGlobal('fetch', fetchMock);
    render(<RatingByKey runData={runData} />);

    await waitFor(() => expect(screen.getByText('Altar of Fangs')).toBeInTheDocument());

    expect(screen.getByRole('columnheader', { name: 'Rating gained by running' }))
      .toHaveAttribute('colspan', '6');
  });

  test('aborts the static data request when unmounted', async () => {
    const runData: RaiderIORun[] = [
      {
        dungeon: 'Altar of Fangs',
        short_name: 'AOF',
        mythic_level: 10,
        completed_at: new Date(),
        clear_time_ms: 1_856_494,
        par_time_ms: 1_800_999,
        num_keystone_upgrades: 0,
        map_challenge_mode_id: 588,
        zone_id: 16865,
        url: 'https://raider.io/mythic-plus-runs/example',
        affixes: [],
        score: 303.8,
      },
    ];
    const fetchMock = vi.fn().mockImplementation(() => new Promise(() => {}));

    vi.stubGlobal('fetch', fetchMock);
    const { unmount } = render(<RatingByKey runData={runData} />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const signal = fetchMock.mock.calls[0][1].signal as AbortSignal;

    expect(signal.aborted).toBe(false);
    unmount();
    expect(signal.aborted).toBe(true);
  });
});

describe('current affix request cleanup', () => {
  test('aborts the affix request when unmounted', async () => {
    const fetchMock = vi.fn().mockImplementation(() => new Promise(() => {}));

    vi.stubGlobal('fetch', fetchMock);
    const { unmount } = render(<CurrentAffixes />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const signal = fetchMock.mock.calls[0][1].signal as AbortSignal;

    expect(signal.aborted).toBe(false);
    unmount();
    expect(signal.aborted).toBe(true);
  });
});

describe('recent character persistence', () => {
  test('persists a copied character without mutating the selected prop', async () => {
    const selectedCharacter: CharacterInput = {
      region: 'us',
      realm: 'nagrand',
      name: 'bixwar',
      playerClass: 'warrior',
      lastAccessed: 0,
    };

    render(
      <MemoryRouter>
        <RecentCharacters selectedCharacter={selectedCharacter} />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'bixwar - nagrand' })).toBeInTheDocument();
    });

    const savedCharacters = JSON.parse(localStorage.getItem('characters') ?? '[]');

    expect(selectedCharacter.lastAccessed).toBe(0);
    expect(savedCharacters).toHaveLength(1);
    expect(savedCharacters[0]).toMatchObject({
      region: 'us',
      realm: 'nagrand',
      name: 'bixwar',
      playerClass: 'warrior',
    });
    expect(savedCharacters[0].lastAccessed).toBeGreaterThan(0);
  });
});
