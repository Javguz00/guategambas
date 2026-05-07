import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, getAdminPassword } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { password?: string };
  const password = String(body.password || "");

  if (!password || password !== getAdminPassword()) {
    return NextResponse.json({ error: "Contraseña invalida" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE_NAME, password, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
  return response;
}
