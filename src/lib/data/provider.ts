import type { CreateItemInput, Insight, Item, ListItemOptions } from "./types";
export interface FlareDataProvider {
  listItems(options?: ListItemOptions): Promise<Item[]>;
  getItem(id: string): Promise<Item | null>;
  createItem(input: CreateItemInput): Promise<Item>;
  listInsights(): Promise<Insight[]>;
  getInsight(id: string): Promise<Insight | null>;
  resetDemoData(): Promise<void>;
}
