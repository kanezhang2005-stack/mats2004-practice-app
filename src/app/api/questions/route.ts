import { listPublicQuestions } from "@/lib/questions";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const source = url.searchParams.get("source") || undefined;
  const questions = await listPublicQuestions(source);
  return NextResponse.json({ questions });
}
