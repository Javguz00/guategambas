import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.pathname.split("/").pop();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  let order = null;
  try {
    order = await prisma.order.findUnique({ where: { id } });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true, order });
}
