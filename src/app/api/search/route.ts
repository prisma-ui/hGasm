import { NextRequest, NextResponse } from "next/server";
import { scrapeSearch } from "@/lib/scraper";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim() ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));

  if (!q) {
    return NextResponse.json(
      { error: "Missing query param: q", status: 400 },
      { status: 400 }
    );
  }

  try {
    const result = await scrapeSearch(q, page);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message, status: 500 }, { status: 500 });
  }
}
