import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { checkAndFixSchema } from "@/lib/prisma/schema-checker";
import { withSchemaProtection } from "@/lib/middleware/with-schema-protection";

async function handleGET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const schema = await checkAndFixSchema();

  let connection = "ok";
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
  } catch (error) {
    console.error("Database connection check failed", error);
    connection = "error";
  }

  return NextResponse.json({
    status: connection === "ok" && schema.status !== "error" ? "ok" : "degraded",
    databaseConnection: connection,
    schema,
    timestamp: new Date().toISOString()
  });
}

async function handlePOST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const schema = await checkAndFixSchema();
  return NextResponse.json({
    status: schema.status,
    schema,
    timestamp: new Date().toISOString()
  });
}

export const GET = withSchemaProtection(async (request) => {
  void request;
  return handleGET();
});
export const POST = withSchemaProtection(async (request) => {
  void request;
  return handlePOST();
});
