import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { fetchPage } from "@/lib/fetch";

export const runtime = "nodejs";

/**
 * /api/debug?path=/some-slug/&selector=.entry-title
 * Returns matched elements as raw outer HTML — useful for verifying
 * Cheerio selectors against live site HTML without re-deploying.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const path = searchParams.get("path") ?? "/";
  const selector = searchParams.get("selector") ?? "article.post";
  const limit = Math.min(10, Number(searchParams.get("limit") ?? "3"));

  try {
    const html = await fetchPage(path);
    const $ = cheerio.load(html);

    const matches: string[] = [];
    $(selector)
      .slice(0, limit)
      .each((_, el) => {
        matches.push($.html(el).trim());
      });

    return NextResponse.json({
      path,
      selector,
      count: $(selector).length,
      matches,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message, status: 500 }, { status: 500 });
  }
}
