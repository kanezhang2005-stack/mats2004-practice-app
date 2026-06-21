import { requireAdmin, tokenFromCookieHeader } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  await requireAdmin(tokenFromCookieHeader(request.headers.get("cookie")));
  const questions = await prisma.question.findMany({ orderBy: [{ source: "asc" }, { questionNumber: "asc" }] });
  return NextResponse.json({ questions });
}

export async function POST(request: Request) {
  await requireAdmin(tokenFromCookieHeader(request.headers.get("cookie")));
  const body = await request.json();
  const question = await prisma.question.create({ data: body });
  return NextResponse.json({ question }, { status: 201 });
}
