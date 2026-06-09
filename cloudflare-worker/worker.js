/**
 * Cloudflare Worker — forward proxy (plain JS, paste-ready for dashboard)
 *
 * Required env vars (Settings > Variables in dashboard):
 *   TARGET_BASE_URL   e.g. https://example.com
 *   IMAGE_CDN_HOST    e.g. cdn1.example.com  (thumbnails/previews)
 *   VIDEO_CDN_HOST    e.g. cdn2.example.com  (video stream)
 *   DOWNLOAD_CDN_HOST e.g. cdn3.example.com  (download button)
 */

export default {
  async fetch(request, env) {
    const { searchParams } = new URL(request.url);
    const target = searchParams.get("url");

    if (!target) {
      return new Response(JSON.stringify({ error: "Missing ?url= param" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Build allowed host list from env vars
    const baseHost = new URL(env.TARGET_BASE_URL).hostname;
    const allowed = [
      baseHost,
      env.IMAGE_CDN_HOST,
      env.VIDEO_CDN_HOST,
      env.DOWNLOAD_CDN_HOST,
    ].filter(Boolean);

    const targetHost = new URL(target).hostname;
    if (!allowed.some((h) => targetHost === h || targetHost.endsWith(`.${h}`))) {
      return new Response(JSON.stringify({ error: "Domain not allowed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const upstream = await fetch(target, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: env.TARGET_BASE_URL,
      },
    });

    // Pass through content but scrub CF/tracking headers
    const headers = new Headers(upstream.headers);
    const dropHeaders = [
      "cf-cache-status",
      "cf-ray",
      "set-cookie",
      "nel",
      "report-to",
      "server",
    ];
    dropHeaders.forEach((h) => headers.delete(h));
    headers.set("Access-Control-Allow-Origin", "*");

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    });
  },
};
