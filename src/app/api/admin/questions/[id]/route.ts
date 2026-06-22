import { requireAdmin, tokenFromCookieHeader } from "@/lib/admin-auth";
import { buildQuestionUpdateData } from "@/lib/admin-question-data";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin(tokenFromCookieHeader(request.headers.get("cookie")));
  const { id } = await params;
  const body = await request.json();
  const question = await prisma.question.update({ where: { id }, data: buildQuestionUpdateData(body) });
  return NextResponse.json({ question });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin(tokenFromCookieHeader(request.headers.get("cookie")));
  const { id } = await params;
  await prisma.question.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
