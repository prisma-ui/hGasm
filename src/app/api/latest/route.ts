import { NextRequest, NextResponse } from "next/server";
import { scrapeLatest } from "@/lib/scraper";
import type { SortOrder } from "@/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const orderby = (searchParams.get("orderby") ?? "date") as SortOrder;

  try {
    const result = await scrapeLatest(page, orderby);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message, status: 500 }, { status: 500 });
  }
}
