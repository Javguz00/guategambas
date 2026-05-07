import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("[test-orders] received payload:", JSON.stringify(body));

    // Basic validation similar to real endpoint
    if (!body.customerName || !body.whatsapp || !body.city || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const fakeOrder = {
      id: `test_${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({ ok: true, order: fakeOrder }, { status: 201 });
  } catch (err) {
    console.error("[test-orders] error:", err);
    return NextResponse.json({ error: "Error interno en test endpoint" }, { status: 500 });
  }
}
