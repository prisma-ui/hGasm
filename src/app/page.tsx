import type { Metadata } from "next";

export const metadata: Metadata = { title: "HentaigasmAPI — Docs" };

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

interface Endpoint {
  method: "GET";
  path: string;
  description: string;
  params: { name: string; required: boolean; description: string }[];
  example: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    method: "GET",
    path: "/api/latest",
    description: "Latest videos from the homepage.",
    params: [
      { name: "page", required: false, description: "Page number (default: 1)" },
      {
        name: "orderby",
        required: false,
        description: "Sort order: date | views | rand (default: date)",
      },
    ],
    example: "/api/latest?page=1&orderby=date",
  },
  {
    method: "GET",
    path: "/api/search",
    description: "Full-text search across all videos.",
    params: [
      { name: "q", required: true, description: "Search query" },
      { name: "page", required: false, description: "Page number (default: 1)" },
    ],
    example: "/api/search?q=vanilla&page=1",
  },
  {
    method: "GET",
    path: "/api/detail",
    description: "Full detail for a single video episode.",
    params: [
      {
        name: "slug",
        required: true,
        description: "URL slug, e.g. sei-yariman-sisters-pakopako-nikki-the-animation-1-subbed",
      },
    ],
    example:
      "/api/detail?slug=sei-yariman-sisters-pakopako-nikki-the-animation-1-subbed",
  },
  {
    method: "GET",
    path: "/api/genre/[slug]",
    description: "Videos filtered by genre tag.",
    params: [
      { name: "slug", required: true, description: "Genre slug, e.g. vanilla, uncensored" },
      { name: "page", required: false, description: "Page number (default: 1)" },
      {
        name: "orderby",
        required: false,
        description: "Sort order: date | views | rand",
      },
    ],
    example: "/api/genre/vanilla?page=1&orderby=views",
  },
  {
    method: "GET",
    path: "/api/hentai/[slug]",
    description: "All episodes for a hentai series.",
    params: [
      {
        name: "slug",
        required: true,
        description: "Series slug, e.g. sei-yariman-sisters-pakopako-nikki-the-animation",
      },
      { name: "page", required: false, description: "Page number (default: 1)" },
    ],
    example: "/api/hentai/sei-yariman-sisters-pakopako-nikki-the-animation",
  },
  {
    method: "GET",
    path: "/api/debug",
    description: "Live Cheerio selector inspector — for debugging scraper selectors.",
    params: [
      { name: "path", required: false, description: "Site path to fetch (default: /)" },
      { name: "selector", required: false, description: "CSS selector (default: article.post)" },
      { name: "limit", required: false, description: "Max matched elements returned (default: 3)" },
    ],
    example: "/api/debug?path=/genre/vanilla/&selector=.entry-title&limit=2",
  },
];

function Badge({ required }: { required: boolean }) {
  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold tracking-wide ${
        required
          ? "bg-[#e63946]/15 text-[#e63946]"
          : "bg-[#272727] text-[#888]"
      }`}
    >
      {required ? "required" : "optional"}
    </span>
  );
}

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-[#0d0d0d]">
      {/* Header */}
      <header className="border-b border-[#272727] px-6 py-5 flex items-center gap-4">
        <div className="w-2 h-2 rounded-full bg-[#e63946]" />
        <span className="font-mono text-sm font-semibold tracking-widest text-[#e2e2e2] uppercase">
          HentaigasmAPI
        </span>
        <span className="ml-auto text-xs font-mono text-[#555]">v0.1.0</span>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="mb-14">
          <p className="text-xs font-mono text-[#e63946] tracking-widest uppercase mb-3">
            REST API
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-[#e2e2e2] mb-4">
            Hentaigasm Scraper API
          </h1>
          <p className="text-[#888] text-sm leading-relaxed max-w-xl">
            Next.js 15 scraper API for hentaigasm.com. All responses are JSON.
            Cheerio selectors derived from live HTML. Routed through a Cloudflare
            Worker proxy to bypass ISP blocks.
          </p>
        </div>

        {/* Response shape */}
        <section className="mb-14">
          <h2 className="text-xs font-mono text-[#555] tracking-widest uppercase mb-5">
            Response shape
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#161616] border border-[#272727] rounded-lg p-5">
              <p className="text-xs font-mono text-[#888] mb-3">Listing endpoints</p>
              <pre className="text-xs font-mono text-[#ccc] leading-relaxed whitespace-pre-wrap">{`{
  "data": VideoCard[],
  "page": number,
  "hasNextPage": boolean,
  "source": string
}`}</pre>
            </div>
            <div className="bg-[#161616] border border-[#272727] rounded-lg p-5">
              <p className="text-xs font-mono text-[#888] mb-3">VideoCard</p>
              <pre className="text-xs font-mono text-[#ccc] leading-relaxed whitespace-pre-wrap">{`{
  title: string
  slug: string
  url: string
  thumbnail: string
  addedAgo: string
  views: string
  likes: string
  comments: string
  isAd: boolean
}`}</pre>
            </div>
          </div>
        </section>

        {/* Endpoints */}
        <section>
          <h2 className="text-xs font-mono text-[#555] tracking-widest uppercase mb-5">
            Endpoints
          </h2>
          <div className="flex flex-col gap-4">
            {ENDPOINTS.map((ep) => (
              <div
                key={ep.path}
                className="bg-[#161616] border border-[#272727] rounded-lg overflow-hidden"
              >
                {/* Endpoint header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-[#272727]">
                  <span className="text-[10px] font-mono font-bold bg-[#e63946]/15 text-[#e63946] px-2 py-0.5 rounded">
                    {ep.method}
                  </span>
                  <code className="text-sm font-mono text-[#e2e2e2]">
                    {ep.path}
                  </code>
                </div>

                <div className="px-5 py-4">
                  <p className="text-sm text-[#888] mb-5">{ep.description}</p>

                  {/* Params table */}
                  <div className="mb-5">
                    <p className="text-[10px] font-mono text-[#555] tracking-widest uppercase mb-3">
                      Parameters
                    </p>
                    <div className="flex flex-col gap-2">
                      {ep.params.map((p) => (
                        <div
                          key={p.name}
                          className="grid grid-cols-[120px_80px_1fr] gap-3 text-sm items-start"
                        >
                          <code className="font-mono text-[#c9d1d9] text-xs">
                            {p.name}
                          </code>
                          <Badge required={p.required} />
                          <span className="text-[#666] text-xs">{p.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Example */}
                  <div>
                    <p className="text-[10px] font-mono text-[#555] tracking-widest uppercase mb-2">
                      Example
                    </p>
                    <a
                      href={`${BASE}${ep.example}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block bg-[#0d0d0d] border border-[#272727] rounded px-4 py-2.5 text-xs font-mono text-[#e63946] hover:border-[#e63946]/40 transition-colors truncate"
                    >
                      {BASE}
                      {ep.example}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Env vars */}
        <section className="mt-14">
          <h2 className="text-xs font-mono text-[#555] tracking-widest uppercase mb-5">
            Environment variables
          </h2>
          <div className="bg-[#161616] border border-[#272727] rounded-lg overflow-hidden">
            {[
              {
                name: "PROXY_URL",
                desc: "Cloudflare Worker URL, e.g. https://hentaigasm-proxy.yourname.workers.dev",
              },
              {
                name: "NEXT_PUBLIC_API_BASE_URL",
                desc: "Deployed API base URL shown in docs examples",
              },
            ].map((env, i, arr) => (
              <div
                key={env.name}
                className={`flex items-start gap-4 px-5 py-4 ${
                  i < arr.length - 1 ? "border-b border-[#272727]" : ""
                }`}
              >
                <code className="font-mono text-xs text-[#e63946] min-w-[260px]">
                  {env.name}
                </code>
                <span className="text-xs text-[#666]">{env.desc}</span>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-16 pt-8 border-t border-[#272727] text-xs font-mono text-[#444]">
          hentaigasm-api — Next.js 15 / Cheerio / Cloudflare Workers / Vercel
        </footer>
      </div>
    </main>
  );
}
