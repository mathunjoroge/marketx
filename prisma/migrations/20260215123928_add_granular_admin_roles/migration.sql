/*
  Migration: add_granular_admin_roles

  Replaces the binary USER/ADMIN enum with granular roles:
  SUPER_ADMIN, MARKET_ADMIN, COMPLIANCE_OFFICER, SUPPORT_AGENT, USER

  Existing ADMIN users are migrated to SUPER_ADMIN.

  Strategy: Convert to text, drop old enum, create new enum, convert back.
  This avoids PostgreSQL's "ADD VALUE" transaction restriction.
*/

-- 1. Convert column to text to detach from the old enum
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE TEXT USING "role"::TEXT;

-- 2. Migrate data: rename ADMIN → SUPER_ADMIN
UPDATE "User" SET "role" = 'SUPER_ADMIN' WHERE "role" = 'ADMIN';

-- 3. Drop the old enum type
DROP TYPE "UserRole";

-- 4. Create new enum with granular roles
CREATE TYPE "UserRole" AS ENUM ('USER', 'SUPER_ADMIN', 'MARKET_ADMIN', 'COMPLIANCE_OFFICER', 'SUPPORT_AGENT');

-- 5. Convert column back to the enum type
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole" USING "role"::"UserRole";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';
