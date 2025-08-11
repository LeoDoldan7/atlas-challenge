/*
  Warnings:

  - You are about to drop the column `child_company_pct` on the `healthcare_subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `child_employee_pct` on the `healthcare_subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `employee_company_pct` on the `healthcare_subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `employee_employee_pct` on the `healthcare_subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `spouse_company_pct` on the `healthcare_subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `spouse_employee_pct` on the `healthcare_subscriptions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."healthcare_subscription_items" ADD COLUMN     "company_pct" SMALLINT,
ADD COLUMN     "employee_pct" SMALLINT;