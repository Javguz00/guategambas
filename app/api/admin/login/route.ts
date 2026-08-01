import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, getAdminPassword } from "@/lib/admin-auth";
import { withSchemaProtection } from "@/lib/middleware/with-schema-protection";

async function handlePOST(request: Request) {
  const body = (await request.json()) as { password?: string };
  const password = String(body.password || "");
  const expected = getAdminPassword();

  if (!expected) {
    return NextResponse.json({ error: "ADMIN_SECRET no está configurado en el servidor." }, { status: 503 });
  }

  if (!password || password !== expected) {
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

export const POST = withSchemaProtection(handlePOST);
