/** @format */

/** Raw article as extracted from the DOM, before enrichment. */
export interface RawArticle {
  title: string;
  url: string;
  timestamp: string;
  byline: string;
}

/**
 * Standard shape every scraper must return.
 * `isoTimestamp` is `null` when the source timestamp is missing or
 * unparseable — callers must handle it instead of silently getting "now".
 * Optional extras (e.g. newsWire) stay opt-in so consumers can rely on
 * the core fields.
 */
export interface ProcessedArticle extends RawArticle {
  isoTimestamp: string | null;
  baseUrl: string;
  checkSum: string;
  readableTime?: string;
  imageUrl?: string;
}

export type ScraperFn = (url: string) => Promise<ProcessedArticle[]>;
