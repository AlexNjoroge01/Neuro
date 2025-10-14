/*
  Warnings:

  - You are about to drop the column `category` on the `Product` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ProductUnit" AS ENUM ('TRAY', 'DOZEN', 'PIECE');

-- DropForeignKey
ALTER TABLE "public"."InventoryLog" DROP CONSTRAINT "InventoryLog_productId_fkey";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "category",
ADD COLUMN     "size" TEXT,
ADD COLUMN     "unit" "ProductUnit" NOT NULL DEFAULT 'TRAY';

-- AddForeignKey
ALTER TABLE "InventoryLog" ADD CONSTRAINT "InventoryLog_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
