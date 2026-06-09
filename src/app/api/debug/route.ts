import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { fetchPage } from "@/lib/fetch";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const path = searchParams.get("path") ?? "/";
  const selector = searchParams.get("selector") ?? "video";
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

    // Show first 2000 chars of raw HTML to see what was actually fetched
    const rawSnippet = html.substring(0, 2000);

    // Show body title / h1 to detect challenge pages
    const pageTitle = $("title").first().text().trim();
    const h1 = $("h1").first().text().trim();
    const bodyClass = $("body").attr("class") ?? "";

    return NextResponse.json({
      path,
      selector,
      count: $(selector).length,
      matches,
      pageTitle,
      h1,
      bodyClass,
      rawSnippet,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message, status: 500 }, { status: 500 });
  }
}
