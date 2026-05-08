import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });

  const cart = await prisma.cart.findUnique({ where: { key } });
  return NextResponse.json({ ok: true, cart });
}

export async function POST(request: Request) {
  const body = await request.json();
  const key = body?.key;
  const data = body?.data;
  if (!key || !data) return NextResponse.json({ error: "Missing key or data" }, { status: 400 });

  const cart = await prisma.cart.upsert({
    where: { key },
    create: { key, data },
    update: { data }
  });

  return NextResponse.json({ ok: true, cart });
}
