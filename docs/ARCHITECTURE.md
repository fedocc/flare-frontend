# Architecture

The App Router shell is server-rendered where possible. `AppShell` is client-side only because it owns mobile drawer state and active navigation. Each interactive page is a narrowly scoped client feature under `src/features`.

```
src/app        routes and shared layout
src/components shared UI and shell
src/features   Dashboard, Vault, Insights interactions
src/lib/data   domain types and provider boundary
src/mocks      seed data
```

UI components never import mock arrays. They call the singleton `dataProvider`, typed by `FlareDataProvider`. `MockDataProvider` merges immutable seed content with browser-only user items from localStorage. Its storage calls are guarded against SSR and parsing failure. It stores file metadata and audio-derived text only — never blobs or binary.

`ApiDataProvider` is an intentionally non-functional adapter stub. Keeping it beside `MockDataProvider` makes the future seam explicit without imposing a backend design today.
