export type ItemType = "note" | "url" | "file" | "audio";
export type ItemStatus = "ready" | "processing" | "error";

export interface ExtractedFact { id: string; text: string; }
export interface Item {
  id: string; type: ItemType; title: string; content: string; sourceUrl?: string;
  fileName?: string; fileSize?: number; status: ItemStatus; createdAt: string;
  extractedFacts: ExtractedFact[]; relatedItemIds: string[];
}
export interface Evidence { itemId: string; sourceTitle: string; sourceType: ItemType; excerpt: string; }
export interface Insight { id: string; title: string; summary: string; explanation: string; evidence: Evidence[]; createdAt: string; }
export interface CreateItemInput {
  type: ItemType; title?: string; content?: string; sourceUrl?: string;
  fileName?: string; fileSize?: number; status?: ItemStatus;
}
export interface ListItemOptions { query?: string; type?: ItemType | "all"; limit?: number; }
