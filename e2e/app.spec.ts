import { expect, test, type Page, type Route } from '@playwright/test';

const affixesResponse = {
  region: 'us',
  title: 'Fortified, Tyrannical',
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
  mythic_plus_dungeon_run_counts: [
    {
      zone_id: 16865,
      dungeon: 'Altar of Fangs',
      short_name: 'AOF',
      season_runs_total: 2,
      season_runs_timed: 1,
    },
  ],
  mythic_plus_best_runs: [
    {
      dungeon: 'Altar of Fangs',
      short_name: 'AOF',
      mythic_level: 10,
      completed_at: '2026-08-25T11:35:03.000Z',
      clear_time_ms: 1_856_494,
      par_time_ms: 1_800_999,
      num_keystone_upgrades: 0,
      map_challenge_mode_id: 588,
      zone_id: 16865,
      url: 'https://raider.io/mythic-plus-runs/example',
      affixes: [],
      score: 303.8,
    },
  ],
};

const staticDataResponse = {
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

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function stubRaiderIo(page: Page, character: unknown = characterResponse) {
  await page.route('**/wow.zamimg.com/**', (route) => route.abort());
  await page.route('**/api/v1/mythic-plus/affixes**', (route) => fulfillJson(route, affixesResponse));
  await page.route('**/api/v1/characters/profile**', (route) => fulfillJson(route, character));
  await page.route('**/api/v1/mythic-plus/static-data**', (route) => fulfillJson(route, staticDataResponse));
}

function collectPageErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

test('loads the root page', async ({ page }) => {
  const pageErrors = collectPageErrors(page);
  await stubRaiderIo(page);

  const response = await page.goto('/');

  expect(response?.status()).toBe(200);
  await expect(page.getByText('Rating by Key', { exact: true })).toBeVisible();
  await expect(page.getByText('Current Affixes:', { exact: true })).toBeVisible();
  await expect(page.getByAltText('Fortified')).toHaveAttribute('alt', 'Fortified');
  expect(pageErrors).toEqual([]);
});

test('reveals affix details before following its external link on touch devices', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'This interaction is specific to the mobile project.');

  await stubRaiderIo(page);
  await page.goto('/');

  const affixLink = page.getByRole('link', { name: /Fortified/ }).first();
  await expect(affixLink).toBeVisible();
  await affixLink.tap();

  await expect(page).toHaveURL(/127\.0\.0\.1:4173\/$/);
  await expect(affixLink).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByText('Non-boss enemies have more health.', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'View on Wowhead' }))
    .toHaveAttribute('href', 'https://wowhead.com/affix=10');
});

test('loads a character from a direct deep link and loads the rating chunk', async ({ page }) => {
  const pageErrors = collectPageErrors(page);
  await stubRaiderIo(page);
  const ratingChunk = page.waitForResponse((response) => {
    return /\/assets\/RatingByKey-[^/]+\.js$/.test(response.url()) && response.status() === 200;
  });

  const response = await page.goto('/us/nagrand/bixwar');

  expect(response?.status()).toBe(200);
  await expect(page.getByText('Bixwar', { exact: true })).toBeVisible();
  await expect(page.getByText('Altar of Fangs', { exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: /Altar of Fangs: 1 timed, 1 overtime/ })).toBeVisible();
  expect((await ratingChunk).status()).toBe(200);
  expect(pageErrors).toEqual([]);
});

test('renders an API error for an unknown character', async ({ page }) => {
  const pageErrors = collectPageErrors(page);
  await stubRaiderIo(page, {
    statusCode: 404,
    message: 'Character not found',
  });

  const response = await page.goto('/us/nagrand/unknown');

  expect(response?.status()).toBe(200);
  await expect(page.getByText('Character not found', { exact: true })).toBeVisible();
  expect(pageErrors).toEqual([]);
});
