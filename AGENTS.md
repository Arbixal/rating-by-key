# Project Context

This file provides repository context and working guidance for coding
assistants, including Claude, Copilot, OpenCode, and other tools.

## Application

Rating by M+ Key is a static React single-page application for viewing current
Mythic+ affixes and analyzing a World of Warcraft character's key ratings.
Character, affix, and dungeon data comes from the Raider.IO public API.

The production site is:

```text
https://rating-by-key.bixnpieces.com
```

The application supports these routes:

```text
/
/:region/:realm/:character
```

Direct deep links are expected to serve the SPA entry document through the
S3/CloudFront fallback configuration.

## Stack

- React `19.2.8`
- React DOM `19.2.8`
- React Router `8.3.0`
- Recharts `3.10.1`
- Font Awesome core and solid icons `7.3.1`
- `@fortawesome/react-fontawesome` `3.5.0`
- Vite `8.2.2`
- Vitest with jsdom and Testing Library
- Node.js `>=22.22.0`

The application uses React Router Data Mode through `createBrowserRouter`, but
does not use SSR, loaders, actions, fetchers, or the React Router framework
plugin. General router APIs are imported from `react-router`; the browser
`RouterProvider` is imported from `react-router/dom`.

## Commands

Install the locked dependency tree:

```sh
npm ci
```

Start development:

```sh
npm run dev
```

Run linting:

```sh
npm run lint
```

Run tests once:

```sh
npm test -- --run
```

Build for production:

```sh
npm run build
```

Preview the production build:

```sh
npm run preview
```

The production output directory is `build`. This is intentional because the
deployment workflow uploads that directory.

## Architecture Notes

- `src/main.tsx` creates the browser router and renders the application.
- `RatingByKey` is lazy-loaded from `src/App.tsx` because it contains the large
  Recharts dependency. It is loaded after character data becomes available.
- Route-driven Raider.IO requests are made from an effect in
  `CharacterSelector`; requests use `AbortController` so stale responses are
  ignored.
- Recent characters are persisted in `localStorage` by `RecentCharacters`.
  State updates are immutable and persistence is handled in a separate effect.
- Rating table data and key bounds are derived together from `runData` in a
  pure `useMemo` in `RatingByKey`.
- Shared rating data types and calculations live in `src/ratingData.ts`.
- `public/` assets are served at the site root by Vite.
- `index.html` includes an external WoWHead tooltip script. Preserve it unless
  its removal is intentional.

## Deployment

`.github/workflows/publish.yml` runs on pushes to `master`.

The workflow:

1. Uses Node `22.x`.
2. Runs `npm ci`.
3. Runs `npm run build`.
4. Uploads the `build` directory as an artifact.
5. Downloads the artifact in a separate deployment job.
6. Uses GitHub Secrets for AWS credentials.
7. Uploads the artifact to the configured S3 bucket.
8. Invalidates the CloudFront distribution's `/index.html` path.

Do not store AWS credentials, GitHub tokens, or other secret values in this
file or the repository. The S3 bucket, CloudFront distribution, and secret
names are already defined in the workflow and should be treated as deployment
configuration rather than duplicated elsewhere.

Hashed Vite assets do not normally need broad CloudFront invalidation. If the
HTML entry point or SPA fallback behavior changes, verify both `/` and a deep
link such as `/us/nagrand/bixwar` after deployment.

## Current Validation

The following checks have passed after the migration and dependency upgrades:

- `npm run lint`
- `npm test -- --run`
- `npm run build`
- `npm audit`
- `npm audit --omit=dev`
- Production root and deep-link HTTP checks

The production workflow has also completed successfully on Node 22, including
the S3 upload and CloudFront invalidation jobs.

`npx tsc --noEmit` is not currently clean. Known issues are missing Vitest
global types in `src/App.test.tsx`, the untyped Recharts tooltip formatter in
`src/RatingByKeyRow.tsx`, and the `test` property typing in `vite.config.ts`.
Do not treat those known issues as evidence that the production build is
broken.

## Working Conventions

- Prefer small, focused changes that preserve existing behavior.
- Do not replace Vite with another framework or introduce SSR without an
  explicit architectural decision.
- Do not change the `build` output directory without updating deployment in
  the same change.
- Do not run destructive Git commands or revert unrelated user changes.
- Do not commit, push, merge, or close external work items unless explicitly
  requested.
- Run relevant lint, tests, and build checks after code changes.
- Review dependency upgrades for peer requirements and run `npm audit` after
  dependency changes.
