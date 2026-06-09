/**
 * Cloudflare Worker — forward proxy (plain JS, paste-ready for dashboard)
 *
 * Required env vars (set via Settings > Variables in dashboard):
 *   TARGET_BASE_URL      e.g. https://example.com
 *   ALLOWED_CDN_HOSTS    comma-separated, e.g. cdn1.example.com,cdn2.example.com
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
    const cdnHosts = env.ALLOWED_CDN_HOSTS
      ? env.ALLOWED_CDN_HOSTS.split(",").map((h) => h.trim()).filter(Boolean)
      : [];
    const allowed = [baseHost, ...cdnHosts];

    const targetHost = new URL(target).hostname;
    if (!allowed.some((h) => targetHost === h || targetHost.endsWith(`.${h}`))) {
      return new Response(JSON.stringify({ error: "Domain not allowed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const upstream = await fetch(target, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
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
