import { NextResponse } from "next/server";
import { checkAndFixSchema } from "@/lib/prisma/schema-checker";

type RouteHandler<Args extends [Request, ...unknown[]]> = (...args: Args) => Promise<Response>;

export function withSchemaProtection<Args extends [Request, ...unknown[]]>(handler: RouteHandler<Args>): RouteHandler<Args> {
  return (async (...args: Args) => {
    const schema = await checkAndFixSchema();

    if (schema.status === "error") {
      return NextResponse.json(
        {
          error: "Servicio temporalmente no disponible: problema de esquema en base de datos.",
          details: schema.message,
          schema
        },
        { status: 503 }
      );
    }

    return handler(...args);
  }) as RouteHandler<Args>;
}
