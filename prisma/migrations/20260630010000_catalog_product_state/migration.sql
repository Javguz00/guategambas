-- CreateTable
CREATE TABLE "CatalogProductState" (
    "productId" TEXT NOT NULL,
    "name" TEXT,
    "category" TEXT,
    "description" TEXT,
    "highlight" TEXT,
    "note" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogProductState_pkey" PRIMARY KEY ("productId")
);
