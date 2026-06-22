import { requireAdmin, tokenFromCookieHeader } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin(tokenFromCookieHeader(request.headers.get("cookie")));
  const { id } = await params;
  const question = await prisma.question.update({
    where: { id },
    data: { aiExplanation: null }
  });
  return NextResponse.json({ question });
}
