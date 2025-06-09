-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "last_login" TIMESTAMP(3),
ADD COLUMN     "name" TEXT,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'user',
ADD COLUMN     "token_version" TEXT NOT NULL DEFAULT '1';
