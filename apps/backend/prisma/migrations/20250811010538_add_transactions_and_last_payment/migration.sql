-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('subscription_payment', 'wallet_credit', 'wallet_debit');

-- AlterTable
ALTER TABLE "public"."healthcare_subscriptions" ADD COLUMN     "last_payment_at" DATE;

-- CreateTable
CREATE TABLE "public"."transactions" (
    "id" BIGSERIAL NOT NULL,
    "employee_id" BIGINT NOT NULL,
    "healthcare_subscription_id" BIGINT,
    "type" "public"."TransactionType" NOT NULL,
    "amount_cents" BIGINT NOT NULL,
    "currency_code" CHAR(3) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transactions_employee_id_idx" ON "public"."transactions"("employee_id");

-- CreateIndex
CREATE INDEX "transactions_healthcare_subscription_id_idx" ON "public"."transactions"("healthcare_subscription_id");

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_healthcare_subscription_id_fkey" FOREIGN KEY ("healthcare_subscription_id") REFERENCES "public"."healthcare_subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
