import { prisma } from "@/lib/prisma";

type ManagedTable = "MediaAsset" | "MediaMapping" | "CatalogProductState";

const managedTables: ManagedTable[] = ["MediaAsset", "MediaMapping", "CatalogProductState"];

export type SchemaCheckStatus = "ok" | "recovered" | "error";

export type SchemaCheckResult = {
  status: SchemaCheckStatus;
  tables: Record<ManagedTable, "present" | "created" | "missing" | "error">;
  message: string;
};

async function runStatement(sql: string) {
  await prisma.$executeRawUnsafe(sql);
}

async function tableExists(tableName: ManagedTable) {
  const rows = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
    `SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = '${tableName}'
    ) as "exists"`
  );

  return Boolean(rows[0]?.exists);
}

async function createTableIfMissing(tableName: ManagedTable) {
  if (tableName === "MediaAsset") {
    await runStatement(`
      CREATE TABLE IF NOT EXISTS "MediaAsset" (
        "id" TEXT NOT NULL,
        "filename" TEXT NOT NULL,
        "mimeType" TEXT NOT NULL,
        "data" BYTEA NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
      )
    `);
    await runStatement(`CREATE UNIQUE INDEX IF NOT EXISTS "MediaAsset_filename_key" ON "MediaAsset"("filename")`);
    return;
  }

  if (tableName === "MediaMapping") {
    await runStatement(`
      CREATE TABLE IF NOT EXISTS "MediaMapping" (
        "id" TEXT NOT NULL,
        "productId" TEXT NOT NULL,
        "filename" TEXT NOT NULL,
        "grade" TEXT,
        "slot" TEXT,
        "title" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "MediaMapping_pkey" PRIMARY KEY ("id")
      )
    `);
    await runStatement(`CREATE INDEX IF NOT EXISTS "MediaMapping_productId_idx" ON "MediaMapping"("productId")`);
    await runStatement(`CREATE INDEX IF NOT EXISTS "MediaMapping_productId_slot_idx" ON "MediaMapping"("productId", "slot")`);
    await runStatement(`CREATE INDEX IF NOT EXISTS "MediaMapping_productId_filename_idx" ON "MediaMapping"("productId", "filename")`);
    return;
  }

  await runStatement(`
    CREATE TABLE IF NOT EXISTS "CatalogProductState" (
      "productId" TEXT NOT NULL,
      "name" TEXT,
      "category" TEXT,
      "description" TEXT,
      "highlight" TEXT,
      "note" TEXT,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CatalogProductState_pkey" PRIMARY KEY ("productId")
    )
  `);
}

export async function checkAndFixSchema(): Promise<SchemaCheckResult> {
  const tables: SchemaCheckResult["tables"] = {
    MediaAsset: "missing",
    MediaMapping: "missing",
    CatalogProductState: "missing"
  };

  try {
    let createdAny = false;

    for (const tableName of managedTables) {
      const existsBefore = await tableExists(tableName);
      if (existsBefore) {
        tables[tableName] = "present";
        continue;
      }

      try {
        await createTableIfMissing(tableName);
        const existsAfter = await tableExists(tableName);
        if (existsAfter) {
          tables[tableName] = "created";
          createdAny = true;
        } else {
          tables[tableName] = "missing";
        }
      } catch (error) {
        console.error(`Schema recovery failed for table ${tableName}`, error);
        tables[tableName] = "error";
      }
    }

    const hasError = managedTables.some((name) => tables[name] === "error");
    const hasMissing = managedTables.some((name) => tables[name] === "missing");

    if (hasError || hasMissing) {
      return {
        status: "error",
        tables,
        message: "No se pudo validar o reparar completamente el esquema. Ejecuta prisma migrate deploy y verifica permisos DDL."
      };
    }

    if (createdAny) {
      return {
        status: "recovered",
        tables,
        message: "Se detectaron tablas faltantes y fueron creadas correctamente."
      };
    }

    return {
      status: "ok",
      tables,
      message: "Esquema verificado. Todas las tablas requeridas existen."
    };
  } catch (error) {
    console.error("checkAndFixSchema failed", error);
    return {
      status: "error",
      tables,
      message: "Error al verificar esquema o conexión de base de datos."
    };
  }
}
