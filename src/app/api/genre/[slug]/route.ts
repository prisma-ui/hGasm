import { NextRequest, NextResponse } from "next/server";
import { scrapeGenre } from "@/lib/scraper";
import type { SortOrder } from "@/types";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const orderby = (searchParams.get("orderby") ?? "date") as SortOrder;

  try {
    const result = await scrapeGenre(slug, page, orderby);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message, status: 500 }, { status: 500 });
  }
}
