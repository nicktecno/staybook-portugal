import { NextResponse } from "next/server";
import { readSessionUser } from "@/lib/server-session";

export async function GET() {
  const user = await readSessionUser();
  return NextResponse.json({ user });
}
