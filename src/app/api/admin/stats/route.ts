import { requireAdmin, tokenFromCookieHeader } from "@/lib/admin-auth";
import { clearAttemptHistory, getAggregateStats } from "@/lib/stats";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  await requireAdmin(tokenFromCookieHeader(request.headers.get("cookie")));
  return NextResponse.json(await getAggregateStats());
}

export async function DELETE(request: Request) {
  await requireAdmin(tokenFromCookieHeader(request.headers.get("cookie")));
  return NextResponse.json(await clearAttemptHistory());
}
