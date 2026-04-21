-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DELIVERED');

-- AlterTable
ALTER TABLE "Order"
ADD COLUMN "status" "OrderStatus" NOT NULL DEFAULT 'PENDING';
