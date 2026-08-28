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
npm test
```

Run the linter:

```sh
npm run lint
```

Run the TypeScript check:

```sh
npm run typecheck
```

Run the browser tests after building the application:

```sh
npm run build
npm run test:e2e
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

Pull requests targeting `master` run the validation workflow without
deploying. Pushes to `master` are built and deployed to AWS S3 and CloudFront
through GitHub Actions.
