import { NextResponse } from "next/server";
import { sanitizeOrderPayload } from "@/lib/security";

export async function POST(request: Request) {
  try {
    const sanitized = sanitizeOrderPayload(await request.json());

    if (!sanitized) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const fakeOrder = {
      id: `test_${Date.now()}`,
      ...sanitized,
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({ ok: true, order: fakeOrder }, { status: 201 });
  } catch (err) {
    console.error("[test-orders] error:", err);
    return NextResponse.json({ error: "Error interno en test endpoint" }, { status: 500 });
  }
}
