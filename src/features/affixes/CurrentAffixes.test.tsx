import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import CurrentAffixes from './CurrentAffixes';

const affixesResponse = {
  region: 'us',
  title: 'Fortified',
  leaderboard_url: 'https://raider.io/example',
  affix_details: [
    {
      id: 10,
      name: 'Fortified',
      description: 'Non-boss enemies have more health.',
      icon: 'ability_toughness',
      wowhead_url: 'https://wowhead.com/affix=10',
    },
  ],
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('CurrentAffixes touch interactions', () => {
  test('reveals details before navigating on a touch device', async () => {
    const matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => affixesResponse,
    });

    vi.stubGlobal('matchMedia', matchMedia);
    vi.stubGlobal('fetch', fetchMock);
    render(<CurrentAffixes />);

    const affixLink = await screen.findByRole('link', {name: /Fortified/});

    fireEvent.click(affixLink);

    expect(affixLink).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Non-boss enemies have more health.')).toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'View on Wowhead'}))
      .toHaveAttribute('href', 'https://wowhead.com/affix=10');
  });

  test('keeps the direct link behavior on a desktop device', async () => {
    const matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => affixesResponse,
    });

    vi.stubGlobal('matchMedia', matchMedia);
    vi.stubGlobal('fetch', fetchMock);
    render(<CurrentAffixes />);

    const affixLink = await screen.findByRole('link', {name: /Fortified/});

    expect(affixLink).toHaveAttribute('href', 'https://wowhead.com/affix=10');
    expect(screen.queryByText('Non-boss enemies have more health.')).not.toBeInTheDocument();
  });

  test('shows an error for a malformed API payload', async () => {
    const matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({affix_details: [{name: 'Incomplete'}]}),
    });

    vi.stubGlobal('matchMedia', matchMedia);
    vi.stubGlobal('fetch', fetchMock);
    render(<CurrentAffixes />);

    expect(await screen.findByText(/The API returned data in an unexpected format\./)).toBeInTheDocument();
  });
});
