import { NextResponse } from "next/server";
import { getStayStore } from "@/lib/stay-store";
import { log } from "@/lib/logger";

export async function GET(request: Request) {
  const started = Date.now();
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") ?? undefined;
  const propertyType = searchParams.get("propertyType") ?? undefined;
  const sort = searchParams.get("sort") ?? undefined;

  const store = getStayStore();
  const stays = store.listStays({ query, propertyType, sort });

  log.info("api.stays.list", {
    count: stays.length,
    ms: Date.now() - started,
    query: query ?? null,
    propertyType: propertyType ?? null,
    sort: sort ?? null,
  });

  return NextResponse.json({ stays });
}
