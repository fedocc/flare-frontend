"use client";
import { seedInsights, seedItems } from "@/mocks/seed";
import type { FlareDataProvider } from "./provider";
import type { CreateItemInput, Insight, Item, ListItemOptions } from "./types";
const STORAGE_KEY = "flare-user-items-v1";
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const getUserItems = (): Item[] => { if (typeof window === "undefined") return []; try { const raw = window.localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) as Item[] : []; } catch { return []; } };
const setUserItems = (items: Item[]) => { if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); };
const titleFor = (input: CreateItemInput) => input.title?.trim() || (input.type === "url" ? input.sourceUrl ?? "Untitled link" : input.type === "audio" ? "New voice memo" : input.fileName ?? "Untitled note");
export class MockDataProvider implements FlareDataProvider {
  async listItems(options: ListItemOptions = {}): Promise<Item[]> { const query = options.query?.toLowerCase().trim() ?? ""; return [...getUserItems(), ...clone(seedItems)].filter((item) => (options.type ?? "all") === "all" || item.type === options.type).filter((item) => !query || `${item.title} ${item.content}`.toLowerCase().includes(query)).sort((a,b) => b.createdAt.localeCompare(a.createdAt)).slice(0, options.limit); }
  async getItem(id: string) { return (await this.listItems()).find((item) => item.id === id) ?? null; }
  async createItem(input: CreateItemInput): Promise<Item> { const item: Item = { id: `local-${crypto.randomUUID()}`, type: input.type, title: titleFor(input), content: input.content?.trim() || (input.type === "audio" ? "Audio captured locally. A demo transcript will be available while processing." : "No original content available."), sourceUrl: input.sourceUrl, fileName: input.fileName, fileSize: input.fileSize, status: input.status ?? "ready", createdAt: new Date().toISOString(), extractedFacts: [], relatedItemIds: [] }; setUserItems([item, ...getUserItems()]); return item; }
  async listInsights(): Promise<Insight[]> { return clone(seedInsights); }
  async getInsight(id: string) { return clone(seedInsights).find((insight) => insight.id === id) ?? null; }
  async resetDemoData() { if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY); }
}
