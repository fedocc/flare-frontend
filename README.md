# Flare frontend MVP

A standalone frontend for Flare, an AI second brain. It recreates the supplied Stitch direction with an intentionally small Next.js App Router codebase and a mock data provider.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Routes: `/dashboard`, `/vault`, and `/insights`; `/` redirects to `/dashboard`.

For a production check:

```bash
npm run lint
npm run build
npm start
```

## What to try

- Capture a note or URL on Dashboard; it is immediately visible in Recently Added and Vault.
- Select a local file. Only name/type/size metadata is retained.
- Record audio where MediaRecorder is available. Otherwise the button creates a useful processing mock rather than doing nothing.
- Search and filter Vault, then choose items to inspect their facts, source content and related items.
- Select an insight and open its evidence source.
- Refresh after creating an item: local mock items persist in browser localStorage. Use the small reset icon in Vault to remove only locally captured items.

## Current mock boundary

No backend, authentication, database, files, or AI calls are included. Seed items and insights live in `src/mocks/seed.ts`; user-created mock item metadata is stored under `flare-user-items-v1` in localStorage. The UI accesses data only through `FlareDataProvider`.

Integration details and the frontend contract are in [docs/INTEGRATION.md](docs/INTEGRATION.md) and [docs/API_CONTRACT.md](docs/API_CONTRACT.md).
