# Frontend data contract

These are frontend domain contracts, not a prescribed backend implementation. An adapter may map any backend DTO into these shapes.

```ts
type ItemType = "note" | "url" | "file" | "audio";
type ItemStatus = "ready" | "processing" | "error";
interface ExtractedFact { id: string; text: string }
interface Item {
  id: string; type: ItemType; title: string; content: string;
  sourceUrl?: string; fileName?: string; fileSize?: number;
  status: ItemStatus; createdAt: string;
  extractedFacts: ExtractedFact[]; relatedItemIds: string[];
}
interface Evidence { itemId: string; sourceTitle: string; sourceType: ItemType; excerpt: string }
interface Insight { id: string; title: string; summary: string; explanation: string; evidence: Evidence[]; createdAt: string }
```

Logical operations expected by the interface:

- `listItems({ query?, type?, limit? }) → Item[]`
- `getItem(id) → Item | null`
- `createItem({ type, title?, content?, sourceUrl?, fileName?, fileSize?, status? }) → Item`
- `listInsights() → Insight[]`
- `getInsight(id) → Insight | null`

One possible REST mapping is `GET /items`, `GET /items/:id`, `POST /items`, `GET /insights`, and `GET /insights/:id`. `POST /items` may be asynchronous: return an `Item` with `status: "processing"`, then allow the client to refresh or subscribe. Authentication, upload URLs, pagination, and delivery mechanism remain backend concerns.
