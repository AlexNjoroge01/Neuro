/*
  Warnings:

  - A unique constraint covering the columns `[checkoutRequestId]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "orderId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "merchantRequestId" DROP NOT NULL,
ALTER COLUMN "resultCode" DROP NOT NULL,
ALTER COLUMN "resultDesc" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_checkoutRequestId_key" ON "Transaction"("checkoutRequestId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
