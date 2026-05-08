import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const attempts = await prisma.paymentAttempt.findMany({
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ attempts });
}