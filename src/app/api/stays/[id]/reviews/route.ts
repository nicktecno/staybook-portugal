import { NextResponse } from "next/server";
import { getStayStore } from "@/lib/stay-store";
import { moderateReviewText } from "@/lib/moderation";
import { log } from "@/lib/logger";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const started = Date.now();
  const { id } = await context.params;
  const store = getStayStore();
  if (!store.getStay(id)) {
    return NextResponse.json({ error: "Stay not found" }, { status: 404 });
  }
  const reviews = store.listReviews(id);
  log.info("api.stays.reviews.list", { id, count: reviews.length, ms: Date.now() - started });
  return NextResponse.json({ reviews });
}

export async function POST(request: Request, context: RouteContext) {
  const started = Date.now();
  const { id } = await context.params;
  const store = getStayStore();
  if (!store.getStay(id)) {
    return NextResponse.json({ error: "Stay not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const author = "author" in body && typeof body.author === "string" ? body.author : "";
  const text = "text" in body && typeof body.text === "string" ? body.text : "";
  const rating = "rating" in body && typeof body.rating === "number" ? body.rating : NaN;

  if (!author.trim()) {
    return NextResponse.json({ error: "Author is required" }, { status: 400 });
  }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    return NextResponse.json({ error: "Rating must be an integer between 1 and 5" }, { status: 400 });
  }

  const mod = moderateReviewText(text);
  if (!mod.ok) {
    log.warn("api.stays.reviews.rejected", { id, reason: mod.reason, ms: Date.now() - started });
    return NextResponse.json({ error: mod.reason }, { status: 422 });
  }

  const review = store.addReview({
    stayId: id,
    author,
    rating,
    text,
    status: "visible",
  });

  log.info("api.stays.reviews.created", { id, reviewId: review.id, ms: Date.now() - started });
  return NextResponse.json({ review }, { status: 201 });
}
