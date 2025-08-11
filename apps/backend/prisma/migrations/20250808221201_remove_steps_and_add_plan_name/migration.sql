/*
  Warnings:

  - The values [draft,pending] on the enum `SubscriptionStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `healthcare_subscription_step_files` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `healthcare_subscription_steps` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name]` on the table `healthcare_plans` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `healthcare_plans` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."SubscriptionStatus_new" AS ENUM ('DEMOGRAPHIC_VERIFICATION', 'DOCUMENT_UPLOAD', 'PLAN_ACTIVATION');
ALTER TABLE "public"."healthcare_subscriptions" ALTER COLUMN "status" TYPE "public"."SubscriptionStatus_new" USING ("status"::text::"public"."SubscriptionStatus_new");
ALTER TYPE "public"."SubscriptionStatus" RENAME TO "SubscriptionStatus_old";
ALTER TYPE "public"."SubscriptionStatus_new" RENAME TO "SubscriptionStatus";
DROP TYPE "public"."SubscriptionStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."healthcare_subscription_step_files" DROP CONSTRAINT "healthcare_subscription_step_files_healthcare_subscription_fkey";

-- DropForeignKey
ALTER TABLE "public"."healthcare_subscription_steps" DROP CONSTRAINT "healthcare_subscription_steps_healthcare_subscription_id_fkey";

-- AlterTable
ALTER TABLE "public"."healthcare_plans" ADD COLUMN     "name" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."healthcare_subscription_step_files";

-- DropTable
DROP TABLE "public"."healthcare_subscription_steps";

-- DropEnum
DROP TYPE "public"."StepStatus";

-- CreateTable
CREATE TABLE "public"."healthcare_subscription_files" (
    "id" BIGSERIAL NOT NULL,
    "healthcare_subscription_id" BIGINT NOT NULL,
    "path" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "file_size_bytes" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "healthcare_subscription_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "healthcare_subscription_files_healthcare_subscription_id_idx" ON "public"."healthcare_subscription_files"("healthcare_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "healthcare_plans_name_key" ON "public"."healthcare_plans"("name");

-- AddForeignKey
ALTER TABLE "public"."healthcare_subscription_files" ADD CONSTRAINT "healthcare_subscription_files_healthcare_subscription_id_fkey" FOREIGN KEY ("healthcare_subscription_id") REFERENCES "public"."healthcare_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
