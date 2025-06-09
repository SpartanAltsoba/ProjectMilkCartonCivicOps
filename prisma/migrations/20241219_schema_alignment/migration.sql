-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regions" (
    "id" SERIAL NOT NULL,
    "state" VARCHAR(50) NOT NULL,
    "county" VARCHAR(50) NOT NULL,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "action" VARCHAR(255) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_scores" (
    "id" SERIAL NOT NULL,
    "region_id" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foia_requests" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "region_id" INTEGER NOT NULL,
    "request_text" TEXT,
    "status" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "foia_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_chains" (
    "id" SERIAL NOT NULL,
    "region_id" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decision_chains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT,
    "state" TEXT,
    "county" TEXT,
    "published_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_scores" ADD CONSTRAINT "risk_scores_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foia_requests" ADD CONSTRAINT "foia_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foia_requests" ADD CONSTRAINT "foia_requests_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_chains" ADD CONSTRAINT "decision_chains_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for users table
CREATE TRIGGER update_user_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
