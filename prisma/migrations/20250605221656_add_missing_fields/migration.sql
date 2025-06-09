/*
  Warnings:

  - You are about to drop the column `request_text` on the `foia_requests` table. All the data in the column will be lost.
  - You are about to drop the column `county` on the `regions` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `regions` table. All the data in the column will be lost.
  - You are about to alter the column `score` on the `risk_scores` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(5,2)`.
  - The `details` column on the `risk_scores` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[state_code,county_name]` on the table `regions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `data` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `decision_chains` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `foia_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `request_type` to the `foia_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `foia_requests` table without a default value. This is not possible if the table is not empty.
  - Made the column `user_id` on table `foia_requests` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `foia_requests` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `state_code` to the `regions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state_name` to the `regions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "child_dependency_classification" AS ENUM ('CHINS', 'CINA', 'FINS', 'PINS', 'DEPENDENCY');

-- CreateEnum
CREATE TYPE "cps_system_type" AS ENUM ('STATE_LED', 'COUNTY_LED', 'HYBRID');

-- CreateEnum
CREATE TYPE "outcome_type" AS ENUM ('REUNIFICATION', 'ADOPTION', 'AGED_OUT', 'GUARDIANSHIP', 'OTHER');

-- CreateEnum
CREATE TYPE "actor_role" AS ENUM ('MANDATED_REPORTER', 'INTAKE', 'INVESTIGATOR', 'PROSECUTOR', 'JUDGE');

-- CreateEnum
CREATE TYPE "official_role" AS ENUM ('LEGISLATOR', 'JUDGE', 'GOVERNOR', 'APPOINTEE', 'OTHER');

-- DropForeignKey
ALTER TABLE "foia_requests" DROP CONSTRAINT "foia_requests_region_id_fkey";

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "details" JSONB,
ALTER COLUMN "action" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "data" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "published_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "decision_chains" ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "foia_requests" DROP COLUMN "request_text",
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "request_type" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "user_id" SET NOT NULL,
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'pending',
ALTER COLUMN "status" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "regions" DROP COLUMN "county",
DROP COLUMN "state",
ADD COLUMN     "county_name" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "state_code" TEXT NOT NULL,
ADD COLUMN     "state_name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "risk_scores" ALTER COLUMN "score" SET DATA TYPE DECIMAL(5,2),
DROP COLUMN "details",
ADD COLUMN     "details" JSONB;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "username" SET DATA TYPE TEXT,
ALTER COLUMN "password_hash" SET DATA TYPE TEXT,
ALTER COLUMN "email" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "scoring_dimensions" (
    "dimension_id" SERIAL NOT NULL,
    "dimension_name" TEXT NOT NULL,
    "description" TEXT,
    "weight" DECIMAL(65,30) NOT NULL DEFAULT 1.0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "scoring_dimensions_pkey" PRIMARY KEY ("dimension_id")
);

-- CreateTable
CREATE TABLE "scoring_criteria" (
    "criteria_id" SERIAL NOT NULL,
    "dimension_id" INTEGER NOT NULL,
    "criteria_name" TEXT NOT NULL,
    "description" TEXT,
    "data_source" TEXT NOT NULL,
    "weight" DECIMAL(65,30) NOT NULL DEFAULT 1.0,
    "threshold_type" TEXT NOT NULL,
    "threshold_value" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "scoring_criteria_pkey" PRIMARY KEY ("criteria_id")
);

-- CreateTable
CREATE TABLE "scoring_snapshots" (
    "snapshot_id" SERIAL NOT NULL,
    "dimension_id" INTEGER NOT NULL,
    "criteria_id" INTEGER,
    "entity_type" TEXT NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "score_value" DECIMAL(65,30) NOT NULL,
    "confidence_score" DECIMAL(65,30),
    "raw_value" JSONB,
    "data_sources" JSONB,
    "score_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schema_version" TEXT,

    CONSTRAINT "scoring_snapshots_pkey" PRIMARY KEY ("snapshot_id")
);

-- CreateTable
CREATE TABLE "api_data_cache" (
    "cache_id" SERIAL NOT NULL,
    "api_name" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "data_key" TEXT NOT NULL,
    "data_value" JSONB,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "api_data_cache_pkey" PRIMARY KEY ("cache_id")
);

-- CreateTable
CREATE TABLE "api_integrations" (
    "api_integration_id" SERIAL NOT NULL,
    "api_name" TEXT NOT NULL,
    "description" TEXT,
    "last_accessed" TIMESTAMP(3),
    "auth_credentials_ref" TEXT,
    "api_version" TEXT,
    "config_params" JSONB,
    "rate_limit_rules" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "api_integrations_pkey" PRIMARY KEY ("api_integration_id")
);

-- CreateTable
CREATE TABLE "ngo_organizations" (
    "ngo_id" SERIAL NOT NULL,
    "legal_name" TEXT NOT NULL,
    "ein" TEXT,
    "headquarters_state" INTEGER,
    "website_url" TEXT,
    "mission_statement" TEXT,

    CONSTRAINT "ngo_organizations_pkey" PRIMARY KEY ("ngo_id")
);

-- CreateTable
CREATE TABLE "system_logs" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" TEXT,

    CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "scoring_dimensions_dimension_name_key" ON "scoring_dimensions"("dimension_name");

-- CreateIndex
CREATE UNIQUE INDEX "api_data_cache_api_name_entity_type_entity_id_data_key_key" ON "api_data_cache"("api_name", "entity_type", "entity_id", "data_key");

-- CreateIndex
CREATE UNIQUE INDEX "ngo_organizations_ein_key" ON "ngo_organizations"("ein");

-- CreateIndex
CREATE INDEX "system_logs_timestamp_level_idx" ON "system_logs"("timestamp", "level");

-- CreateIndex
CREATE UNIQUE INDEX "regions_state_code_county_name_key" ON "regions"("state_code", "county_name");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- AddForeignKey
ALTER TABLE "foia_requests" ADD CONSTRAINT "foia_requests_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scoring_criteria" ADD CONSTRAINT "scoring_criteria_dimension_id_fkey" FOREIGN KEY ("dimension_id") REFERENCES "scoring_dimensions"("dimension_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scoring_snapshots" ADD CONSTRAINT "scoring_snapshots_dimension_id_fkey" FOREIGN KEY ("dimension_id") REFERENCES "scoring_dimensions"("dimension_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scoring_snapshots" ADD CONSTRAINT "scoring_snapshots_criteria_id_fkey" FOREIGN KEY ("criteria_id") REFERENCES "scoring_criteria"("criteria_id") ON DELETE SET NULL ON UPDATE CASCADE;
