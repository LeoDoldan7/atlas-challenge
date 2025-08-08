-- CreateEnum
CREATE TYPE "public"."SubscriptionType" AS ENUM ('individual', 'family');

-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('draft', 'pending', 'active', 'canceled', 'terminated');

-- CreateEnum
CREATE TYPE "public"."ItemRole" AS ENUM ('employee', 'spouse', 'child');

-- CreateEnum
CREATE TYPE "public"."StepStatus" AS ENUM ('pending', 'completed', 'skipped');

-- CreateEnum
CREATE TYPE "public"."MaritalStatus" AS ENUM ('single', 'married', 'divorced', 'widowed', 'separated');

-- CreateTable
CREATE TABLE "public"."companies" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "country_iso_code" CHAR(2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."demographics" (
    "id" BIGSERIAL NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "government_id" TEXT NOT NULL,
    "birth_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demographics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."employees" (
    "id" BIGSERIAL NOT NULL,
    "company_id" BIGINT NOT NULL,
    "demographics_id" BIGINT NOT NULL,
    "email" TEXT NOT NULL,
    "birth_date" DATE NOT NULL,
    "marital_status" "public"."MaritalStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."wallets" (
    "id" BIGSERIAL NOT NULL,
    "employee_id" BIGINT NOT NULL,
    "balance_cents" BIGINT NOT NULL,
    "currency_code" CHAR(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."healthcare_plans" (
    "id" BIGSERIAL NOT NULL,
    "cost_employee_cents" BIGINT NOT NULL,
    "pct_employee_paid_by_company" DECIMAL(5,2) NOT NULL,
    "cost_spouse_cents" BIGINT NOT NULL,
    "pct_spouse_paid_by_company" DECIMAL(5,2) NOT NULL,
    "cost_child_cents" BIGINT NOT NULL,
    "pct_child_paid_by_company" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "healthcare_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."healthcare_subscriptions" (
    "id" BIGSERIAL NOT NULL,
    "company_id" BIGINT NOT NULL,
    "employee_id" BIGINT NOT NULL,
    "type" "public"."SubscriptionType" NOT NULL,
    "status" "public"."SubscriptionStatus" NOT NULL,
    "plan_id" BIGINT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "billing_anchor" SMALLINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "healthcare_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."healthcare_subscription_items" (
    "id" BIGSERIAL NOT NULL,
    "healthcare_subscription_id" BIGINT NOT NULL,
    "role" "public"."ItemRole" NOT NULL,
    "demographic_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "healthcare_subscription_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."healthcare_subscription_steps" (
    "id" BIGSERIAL NOT NULL,
    "healthcare_subscription_id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "public"."StepStatus" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "healthcare_subscription_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."healthcare_subscription_step_files" (
    "id" BIGSERIAL NOT NULL,
    "healthcare_subscription_step_id" BIGINT NOT NULL,
    "path" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "file_size_bytes" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "healthcare_subscription_step_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "demographics_government_id_key" ON "public"."demographics"("government_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "public"."employees"("email");

-- CreateIndex
CREATE INDEX "employees_company_id_idx" ON "public"."employees"("company_id");

-- CreateIndex
CREATE INDEX "employees_demographics_id_idx" ON "public"."employees"("demographics_id");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_employee_id_key" ON "public"."wallets"("employee_id");

-- CreateIndex
CREATE INDEX "healthcare_subscriptions_company_id_idx" ON "public"."healthcare_subscriptions"("company_id");

-- CreateIndex
CREATE INDEX "healthcare_subscriptions_employee_id_idx" ON "public"."healthcare_subscriptions"("employee_id");

-- CreateIndex
CREATE INDEX "healthcare_subscriptions_plan_id_idx" ON "public"."healthcare_subscriptions"("plan_id");

-- CreateIndex
CREATE INDEX "healthcare_subscription_items_healthcare_subscription_id_idx" ON "public"."healthcare_subscription_items"("healthcare_subscription_id");

-- CreateIndex
CREATE INDEX "healthcare_subscription_items_demographic_id_idx" ON "public"."healthcare_subscription_items"("demographic_id");

-- CreateIndex
CREATE INDEX "healthcare_subscription_steps_healthcare_subscription_id_idx" ON "public"."healthcare_subscription_steps"("healthcare_subscription_id");

-- CreateIndex
CREATE INDEX "healthcare_subscription_step_files_healthcare_subscription__idx" ON "public"."healthcare_subscription_step_files"("healthcare_subscription_step_id");

-- AddForeignKey
ALTER TABLE "public"."employees" ADD CONSTRAINT "employees_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employees" ADD CONSTRAINT "employees_demographics_id_fkey" FOREIGN KEY ("demographics_id") REFERENCES "public"."demographics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wallets" ADD CONSTRAINT "wallets_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."healthcare_subscriptions" ADD CONSTRAINT "healthcare_subscriptions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."healthcare_subscriptions" ADD CONSTRAINT "healthcare_subscriptions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."healthcare_subscriptions" ADD CONSTRAINT "healthcare_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."healthcare_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."healthcare_subscription_items" ADD CONSTRAINT "healthcare_subscription_items_healthcare_subscription_id_fkey" FOREIGN KEY ("healthcare_subscription_id") REFERENCES "public"."healthcare_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."healthcare_subscription_items" ADD CONSTRAINT "healthcare_subscription_items_demographic_id_fkey" FOREIGN KEY ("demographic_id") REFERENCES "public"."demographics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."healthcare_subscription_steps" ADD CONSTRAINT "healthcare_subscription_steps_healthcare_subscription_id_fkey" FOREIGN KEY ("healthcare_subscription_id") REFERENCES "public"."healthcare_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."healthcare_subscription_step_files" ADD CONSTRAINT "healthcare_subscription_step_files_healthcare_subscription_fkey" FOREIGN KEY ("healthcare_subscription_step_id") REFERENCES "public"."healthcare_subscription_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
