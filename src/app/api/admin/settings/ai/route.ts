import { requireAdmin, tokenFromCookieHeader } from "@/lib/admin-auth";
import { getAiExplanationsEnabled, setAiExplanationsEnabled } from "@/lib/app-settings";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  aiExplanationsEnabled: z.boolean()
});

export async function GET(request: Request) {
  await requireAdmin(tokenFromCookieHeader(request.headers.get("cookie")));
  return NextResponse.json({ aiExplanationsEnabled: await getAiExplanationsEnabled() });
}

export async function PATCH(request: Request) {
  await requireAdmin(tokenFromCookieHeader(request.headers.get("cookie")));
  const body = schema.parse(await request.json());
  const aiExplanationsEnabled = await setAiExplanationsEnabled(body.aiExplanationsEnabled);
  return NextResponse.json({ aiExplanationsEnabled });
}
