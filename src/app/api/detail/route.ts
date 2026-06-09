import { NextRequest, NextResponse } from "next/server";
import { scrapeDetail } from "@/lib/scraper";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const slug = searchParams.get("slug")?.trim() ?? "";

  if (!slug) {
    return NextResponse.json(
      { error: "Missing query param: slug", status: 400 },
      { status: 400 }
    );
  }

  try {
    const result = await scrapeDetail(slug);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message, status: 500 }, { status: 500 });
  }
}
