import { adminCookieName, createAdminToken, isAdminPassword } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ password: z.string().min(1) });

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  if (!(await isAdminPassword(body.password))) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookieName(), await createAdminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
  return response;
}
