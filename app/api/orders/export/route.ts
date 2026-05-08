import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

type ExportOrder = {
  id: string;
  customerName: string;
  whatsapp: string;
  email?: string | null;
  city: string;
  departamento?: string | null;
  paymentMethod: string;
  total: number;
  shippingCost: number;
  status: string;
  createdAt: Date;
};

function toCsv(rows: string[][]) {
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
}

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim();
  const paymentMethod = url.searchParams.get("paymentMethod")?.trim();

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { customerName: { contains: q, mode: "insensitive" } },
      { whatsapp: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } }
    ];
  }
  if (paymentMethod) where.paymentMethod = paymentMethod;

  let orders: ExportOrder[] = [];
  try {
    orders = await prisma.order.findMany({ where, orderBy: { createdAt: "desc" } });
  } catch {
    orders = [];
  }

  const rows = [["id", "customerName", "whatsapp", "email", "city", "departamento", "paymentMethod", "total", "shippingCost", "status", "createdAt"]];
  for (const o of orders) {
    rows.push([String(o.id), String(o.customerName), String(o.whatsapp), String(o.email || ""), String(o.city), String(o.departamento || ""), String(o.paymentMethod), String(o.total), String(o.shippingCost), String(o.status), String(o.createdAt.toISOString())]);
  }

  const csv = toCsv(rows);
  return new NextResponse(csv, { status: 200, headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=orders.csv" } });
}
