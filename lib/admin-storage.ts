import { prisma } from "@/lib/prisma";

let ensureAdminStoragePromise: Promise<void> | null = null;

async function runStatement(sql: string) {
  await prisma.$executeRawUnsafe(sql);
}

export function ensureAdminStorage() {
  if (!ensureAdminStoragePromise) {
    ensureAdminStoragePromise = (async () => {
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
    })().catch((error) => {
      ensureAdminStoragePromise = null;
      throw error;
    });
  }

  return ensureAdminStoragePromise;
}