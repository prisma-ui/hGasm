const BASE_URL = process.env.TARGET_BASE_URL ?? "";

if (!BASE_URL) {
  throw new Error("Missing env var: TARGET_BASE_URL");
}

// Cloudflare Worker forward proxy – set in Vercel env vars.
const PROXY_URL = process.env.PROXY_URL ?? "";

/**
 * Fetch a target page, routing through the CF Worker proxy when
 * PROXY_URL is configured. Returns raw HTML text.
 */
export async function fetchPage(path: string): Promise<string> {
  const targetUrl = path.startsWith("http") ? path : `${BASE_URL}${path}`;

  const requestUrl = PROXY_URL
    ? `${PROXY_URL}?url=${encodeURIComponent(targetUrl)}`
    : targetUrl;

  const res = await fetch(requestUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: BASE_URL,
    },
    next: { revalidate: 300 }, // ISR – cache 5 min
  });

  if (!res.ok) {
    throw new Error(`Upstream ${res.status}: ${targetUrl}`);
  }

  return res.text();
}

export { BASE_URL };
