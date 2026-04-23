const BANNED = ["spam", "scam", "http://", "https://", "viagra"];

export function moderateReviewText(text: string): { ok: true } | { ok: false; reason: string } {
  const normalized = text.trim().toLowerCase();
  if (normalized.length < 8) {
    return { ok: false, reason: "Review must be at least 8 characters." };
  }
  if (normalized.length > 2000) {
    return { ok: false, reason: "Review is too long." };
  }
  for (const word of BANNED) {
    if (normalized.includes(word)) {
      return { ok: false, reason: "Review was rejected by basic moderation." };
    }
  }
  return { ok: true };
}
