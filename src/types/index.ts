// ─── Video card (listing pages) ──────────────────────────────────────────────
export interface VideoCard {
  title: string;
  slug: string;               // e.g. "sei-yariman-sisters-..."
  url: string;                // full canonical URL on hentaigasm.com
  thumbnail: string;          // hgasm1.com preview image URL
  addedAgo: string;           // "1 hour ago", "2 days ago", etc.
  views: string;              // raw string: "1.68M"
  likes: string;              // raw string: "74"
  comments: string;           // raw string: "881"
  isAd: boolean;              // true when card links to external ad
}

// ─── Video detail (single episode page) ──────────────────────────────────────
export interface VideoDetail {
  title: string;
  slug: string;
  url: string;
  publishedDate: string;      // "June 9, 2026"
  hentaiSeries: string;       // series name
  hentaiSeriesUrl: string;    // /hentai/sei-yariman-... URL
  genres: Genre[];
  views: string;
  likes: string;
  comments: string;
  downloadUrl: string | null; // hgasm3.com direct mp4 link
  embedHtml: string | null;   // raw iframe/video embed HTML if present
  relatedVideos: VideoCard[];
}

// ─── Genre ───────────────────────────────────────────────────────────────────
export interface Genre {
  name: string;
  slug: string;               // e.g. "vanilla"
  url: string;                // full genre URL
}

// ─── Paginated response wrapper ───────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  hasNextPage: boolean;
  source: string;             // canonical URL that was scraped
}

// ─── API error ────────────────────────────────────────────────────────────────
export interface ApiError {
  error: string;
  status: number;
}

// ─── Sort options ─────────────────────────────────────────────────────────────
export type SortOrder = "date" | "views" | "rand";
