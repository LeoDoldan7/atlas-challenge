/*
  Warnings:

  - Changed the type of `status` on the `healthcare_subscriptions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."SubscriptionStepType" AS ENUM ('demographic_verification_pending', 'document_upload_pending', 'plan_activation_pending', 'active', 'canceled', 'terminated');

-- CreateEnum
CREATE TYPE "public"."StepStatus" AS ENUM ('PENDING', 'SUCCESS');

-- AlterTable
ALTER TABLE "public"."healthcare_subscriptions" DROP COLUMN "status",
ADD COLUMN     "status" "public"."SubscriptionStepType" NOT NULL;

-- DropEnum
DROP TYPE "public"."SubscriptionStatus";

-- CreateTable
CREATE TABLE "public"."subscription_steps" (
    "id" BIGSERIAL NOT NULL,
    "healthcare_subscription_id" BIGINT NOT NULL,
    "type" "public"."SubscriptionStepType" NOT NULL,
    "status" "public"."StepStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "subscription_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subscription_steps_healthcare_subscription_id_idx" ON "public"."subscription_steps"("healthcare_subscription_id");

-- AddForeignKey
ALTER TABLE "public"."subscription_steps" ADD CONSTRAINT "subscription_steps_healthcare_subscription_id_fkey" FOREIGN KEY ("healthcare_subscription_id") REFERENCES "public"."healthcare_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
