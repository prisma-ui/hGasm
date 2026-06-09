import * as cheerio from "cheerio";
import type {
  VideoCard,
  VideoDetail,
  Genre,
  PaginatedResponse,
  SortOrder,
} from "@/types";
import { fetchPage, BASE_URL } from "./fetch";

// Domain used to filter out ad cards (external links)
const SITE_HOST = new URL(BASE_URL).hostname;

// CDN hosts — each serves a different asset type
const IMAGE_CDN_HOST    = process.env.IMAGE_CDN_HOST    ?? ""; // thumbnails/previews
const VIDEO_CDN_HOST    = process.env.VIDEO_CDN_HOST    ?? ""; // video stream src
const DOWNLOAD_CDN_HOST = process.env.DOWNLOAD_CDN_HOST ?? ""; // download button

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugFromUrl(url: string): string {
  try {
    return new URL(url).pathname.replace(/^\/|\/$/g, "");
  } catch {
    return url;
  }
}

/**
 * Parse a listing page (homepage / genre / search / hentai-series).
 * Selectors verified against live HTML 2026-06-10.
 *
 * HTML structure per card:
 *   <div class="item cf item-post post-NNN ...">
 *     <div class="thumb">
 *       <a class="clip-link" href=URL title=TITLE>
 *         <span class="clip"><img src=THUMB /></span>
 *       </a>
 *     </div>
 *     <div class="data">
 *       <h2 class="title"><a href=URL>TITLE</a></h2>  <!-- listing pages -->
 *       <h4 class="title"><a href=URL>TITLE</a></h4>  <!-- footer/widget -->
 *       <p class="meta">
 *         <span class="author">Added by <a>admin</a></span>
 *         <span class="time">2 days ago</span>
 *       </p>
 *       <p class="stats">
 *         <span class="views"><i class="count">1.23M</i></span>
 *         <span class="comments"><i class="count">42</i></span>
 *         <span class="dp-post-likes likes"><i class="count" data-pid="NNN">99</i></span>
 *       </p>
 *     </div>
 *   </div>
 */
function parseCards($: cheerio.CheerioAPI): VideoCard[] {
  const cards: VideoCard[] = [];

  $("div.item.cf").each((_, el) => {
    const item = $(el);

    // Title anchor — h2.title or h4.title (footer widgets use h4)
    // Use text() first; attr("title") contains "Permalink to XXX" so strip prefix
    const anchor = item.find(".title a").first();
    const rawAttrTitle = anchor.attr("title") ?? "";
    const title =
      anchor.text().trim() ||
      rawAttrTitle.replace(/^Permalink to\s*/i, "").trim();
    const url = anchor.attr("href") ?? item.find("a.clip-link").attr("href") ?? "";

    // Skip ad cards (external links not on the main site)
    const isAd = !url.includes(SITE_HOST);

    // Thumbnail
    const thumbnail =
      item.find(".thumb img").attr("src") ??
      item.find("img").first().attr("src") ??
      "";

    // Time ago
    const addedAgo = item.find(".meta .time").text().trim() || "";

    // Stats — <i class="count"> inside .views / .comments / .likes
    const views = item.find(".views i.count").text().trim();
    const comments = item.find(".comments i.count").text().trim();
    const likes = item.find(".likes i.count").text().trim();

    cards.push({
      title,
      slug: slugFromUrl(url),
      url,
      thumbnail,
      addedAgo,
      views,
      likes,
      comments,
      isAd,
    });
  });

  return cards;
}

/** Check if there is a next-page link.
 * Hentaigasm uses the WP-PageNavi plugin which renders:
 *   <a class="nextpostslink" rel="next" href="...">»</a>
 * (not the default WordPress .nav-previous / .next.page-numbers classes)
 */
function hasNextPage($: cheerio.CheerioAPI): boolean {
  return $("a.nextpostslink, .nav-previous a, .next.page-numbers").length > 0;
}

// ─── Public scraper functions ─────────────────────────────────────────────────

/**
 * GET /api/latest
 * Scrapes the homepage (sorted by date, views, or random).
 */
export async function scrapeLatest(
  page = 1,
  orderby: SortOrder = "date"
): Promise<PaginatedResponse<VideoCard>> {
  let path: string;

  if (orderby === "date") {
    // Default: WordPress uses pretty pagination /page/N/
    path = page > 1 ? `/page/${page}/` : "/";
  } else {
    // Non-default orderby falls back to query string
    const qs = new URLSearchParams({ orderby });
    if (page > 1) qs.set("paged", String(page));
    path = `/?${qs.toString()}`;
  }
  const html = await fetchPage(path);
  const $ = cheerio.load(html);

  return {
    data: parseCards($).filter((c) => !c.isAd),
    page,
    hasNextPage: hasNextPage($),
    source: `${BASE_URL}${path}`,
  };
}

/**
 * GET /api/search?q=QUERY&page=1
 * Hentaigasm uses WordPress default search (?s=QUERY).
 */
export async function scrapeSearch(
  query: string,
  page = 1
): Promise<PaginatedResponse<VideoCard>> {
  const qs = new URLSearchParams({ s: query });
  if (page > 1) qs.set("paged", String(page));

  const path = `/?${qs.toString()}`;
  const html = await fetchPage(path);
  const $ = cheerio.load(html);

  return {
    data: parseCards($).filter((c) => !c.isAd),
    page,
    hasNextPage: hasNextPage($),
    source: `${BASE_URL}${path}`,
  };
}

/**
 * GET /api/genre/[slug]?page=1&orderby=date
 * e.g. /genre/vanilla/ or /genre/uncensored/
 */
export async function scrapeGenre(
  genreSlug: string,
  page = 1,
  orderby: SortOrder = "date"
): Promise<PaginatedResponse<VideoCard>> {
  let path: string;

  if (orderby === "date") {
    path = page > 1
      ? `/genre/${genreSlug}/page/${page}/`
      : `/genre/${genreSlug}/`;
  } else {
    const qs = new URLSearchParams({ orderby });
    if (page > 1) qs.set("paged", String(page));
    path = `/genre/${genreSlug}/?${qs.toString()}`;
  }
  const html = await fetchPage(path);
  const $ = cheerio.load(html);

  return {
    data: parseCards($).filter((c) => !c.isAd),
    page,
    hasNextPage: hasNextPage($),
    source: `${BASE_URL}${path}`,
  };
}

/**
 * GET /api/hentai/[slug]?page=1
 * Hentai series index: /hentai/kuroinu-.../
 */
export async function scrapeHentaiSeries(
  seriesSlug: string,
  page = 1
): Promise<PaginatedResponse<VideoCard>> {
  const path =
    page > 1
      ? `/hentai/${seriesSlug}/page/${page}/`
      : `/hentai/${seriesSlug}/`;
  const html = await fetchPage(path);
  const $ = cheerio.load(html);

  return {
    data: parseCards($).filter((c) => !c.isAd),
    page,
    hasNextPage: hasNextPage($),
    source: `${BASE_URL}${path}`,
  };
}

/**
 * GET /api/detail?slug=SLUG
 * Single episode detail page.
 *
 * Key selectors (verified against live HTML 2026-06-10):
 *   Title:         #headline h1#title
 *   Date:          #extras h4:first-of-type  (text "May 29, 2026")
 *   Hentai series: #extras a[href*='/hentai/']  first match
 *   Genres:        #extras a[href*='/genre/']
 *   Views:         #details .stats .views i.count
 *   Comments:      #details .stats .comments i.count
 *   Likes:         #details .stats .likes i.count
 *   Video src:     video#my-video[src] → video#my-video source[src] (fallback)
 *   Download:      a[href*=DOWNLOAD_CDN_HOST] or a[download] (same CDN as video)
 *   Video src:     video#my-video source[src]
 *   Related:       .related-posts div.item.cf  (same parseCards logic)
 */
export async function scrapeDetail(slug: string): Promise<VideoDetail> {
  const path = `/${slug}/`;
  const html = await fetchPage(path);
  const $ = cheerio.load(html);

  // Title — <h1 id="title"> inside #headline
  const title =
    $("#headline h1#title").text().trim() ||
    $("h1#title").text().trim() ||
    $("h1").first().text().trim();

  // Date — first <h4> inside #extras  e.g. "May 29, 2026"
  const publishedDate = $("#extras h4").first().text().trim() ?? "";

  // Hentai series link — <h4>Hentai: <a href="/hentai/...">
  const seriesAnchor = $('#extras a[href*="/hentai/"]').first();
  const hentaiSeriesUrl = seriesAnchor.attr("href") ?? "";
  const hentaiSeries = seriesAnchor.text().trim();

  // Genres — <h4>Genres: <a href="/genre/...">
  const genres: Genre[] = [];
  $('#extras a[href*="/genre/"]').each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const genreName = $(el).text().trim();
    const genreSlug = slugFromUrl(href);
    if (genreName) {
      genres.push({ name: genreName, slug: genreSlug, url: href });
    }
  });

  // Stats — ada di dalam .item.cf.item-post di luar #details (bukan di dalam #details)
  const statsBlock = $(".item.cf .stats").first();
  const views = statsBlock.find(".views i.count").text().trim();
  const comments = statsBlock.find(".comments i.count").text().trim();
  const likes = statsBlock.find(".likes i.count").text().trim();

  // Download link — cari a[download] dari VIDEO_CDN_HOST atau fallback attr download
  const downloadAnchor = DOWNLOAD_CDN_HOST
    ? $(`a[href*="${DOWNLOAD_CDN_HOST}"][download], a[href*="${DOWNLOAD_CDN_HOST}"].btn`)
        .first()
    : $("a[download]").first();
  const downloadUrl = downloadAnchor.attr("href") ?? null;

  // Video source — desktop theme pakai JW Player, src ada di script:
  //   jwplayer("player_01").setup({ file: "https://hgasm2.com/....mp4", ... })
  // Mobile theme pakai Fluid Player dengan <video><source src="...">
  // Coba keduanya dengan urutan prioritas.
  let videoSrc: string | null = null;

  // 1. JW Player setup script — cari file: "..." atau file:"..."
  $("script:not([src])").each((_, el) => {
    if (videoSrc) return;
    const scriptContent = $(el).html() ?? "";
    if (!scriptContent.includes("jwplayer")) return;
    const match = scriptContent.match(/["\']file["\']\s*:\s*["\'](https?:\/\/[^"']+\.mp4[^"']*)["\']/) ??
                  scriptContent.match(/file\s*:\s*["'](https?:\/\/[^"']+\.mp4[^"']*)['"]/);
    if (match?.[1]) videoSrc = match[1];
  });

  // 2. Fluid Player — <video id="my-video"><source src="...">
  if (!videoSrc) {
    const videoEl = $("video#my-video").first();
    videoSrc =
      videoEl.find("source[src]").first().attr("src") ??
      videoEl.attr("src") ??
      $("video source[src]").first().attr("src") ??
      null;
  }

  const iframe = $("iframe").first();
  let embedHtml: string | null = null;
  if (iframe.length) {
    embedHtml = $.html(iframe);
  } else if (videoSrc) {
    embedHtml = `<video src="${videoSrc}" controls></video>`;
  }

  // Related videos — .related-posts section uses same div.item.cf structure
  const relatedCards = parseCards($).filter(
    (c) => !c.isAd && c.slug !== slug
  );

  return {
    title,
    slug,
    url: `${BASE_URL}${path}`,
    publishedDate,
    hentaiSeries,
    hentaiSeriesUrl,
    genres,
    views,
    likes,
    comments,
    downloadUrl,
    embedHtml,
    relatedVideos: relatedCards,
  };
}
