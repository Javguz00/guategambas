-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('DEPOSITO_PREVIO', 'PAGO_CONTRAENTREGA');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "departamento" TEXT,
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'PAGO_CONTRAENTREGA',
ADD COLUMN     "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "CatalogVariantState" (
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "stockAvailable" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogVariantState_pkey" PRIMARY KEY ("productId","variantId")
);
