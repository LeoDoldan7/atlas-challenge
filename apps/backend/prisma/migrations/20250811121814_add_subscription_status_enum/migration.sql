/*
  Warnings:

  - Changed the type of `status` on the `healthcare_subscriptions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('DRAFT', 'PENDING', 'ACTIVE', 'CANCELLED', 'TERMINATED', 'EXPIRED');

-- AlterTable
ALTER TABLE "public"."healthcare_subscriptions" DROP COLUMN "status",
ADD COLUMN     "status" "public"."SubscriptionStatus" NOT NULL;
