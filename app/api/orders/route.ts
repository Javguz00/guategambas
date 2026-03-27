import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { Order } from "@/lib/types";

const ordersPath = path.join(process.cwd(), "data", "orders.json");

async function readOrders(): Promise<Order[]> {
  try {
    const raw = await fs.readFile(ordersPath, "utf-8");
    const parsed = JSON.parse(raw) as Order[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeOrders(orders: Order[]) {
  await fs.mkdir(path.dirname(ordersPath), { recursive: true });
  await fs.writeFile(ordersPath, JSON.stringify(orders, null, 2), "utf-8");
}

export async function GET() {
  const orders = await readOrders();
  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Omit<Order, "id" | "createdAt">;

  if (!body.customerName || !body.whatsapp || !body.city || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const orders = await readOrders();
  const newOrder: Order = {
    id: `ord-${Date.now()}`,
    customerName: body.customerName,
    whatsapp: body.whatsapp,
    city: body.city,
    notes: body.notes || "",
    items: body.items,
    total: Number(body.total || 0),
    createdAt: new Date().toISOString()
  };

  orders.push(newOrder);
  await writeOrders(orders);

  return NextResponse.json({ ok: true, order: newOrder }, { status: 201 });
}
