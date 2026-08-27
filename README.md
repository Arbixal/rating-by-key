# Rating by M+ Key

A React application for viewing current Mythic+ affixes and analyzing a
World of Warcraft character's key ratings using data from Raider.IO.

## Development

Install dependencies:

```sh
npm ci
```

Start the Vite development server:

```sh
npm run dev
```

## Checks

Run the test suite once:

```sh
npm test -- --run
```

Run the linter:

```sh
npm run lint
```

## Production

Build the application:

```sh
npm run build
```

The production files are written to `build/`. Preview the production build
locally with:

```sh
npm run preview
```

The `master` branch is built and deployed to AWS S3 and CloudFront through
GitHub Actions.
