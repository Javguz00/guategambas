import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { withSchemaProtection } from "@/lib/middleware/with-schema-protection";

async function handlePOST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
  return response;
}

export const POST = withSchemaProtection(async (request) => {
  void request;
  return handlePOST();
});
