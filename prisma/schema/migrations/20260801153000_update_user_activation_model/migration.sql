-- Alter users table for explicit activation state and separated provider email.
ALTER TABLE "users" ADD COLUMN "google_email" TEXT;
ALTER TABLE "users" ADD COLUMN "is_activated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "activated_at" TIMESTAMP(3);

-- Application email is optional. Google provider email is stored separately.
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;

-- Display name is required for activated application users.
UPDATE "users"
SET "display_name" = COALESCE("display_name", "google_email", "email", 'Unknown User')
WHERE "display_name" IS NULL;

ALTER TABLE "users" ALTER COLUMN "display_name" SET NOT NULL;

CREATE UNIQUE INDEX "users_google_email_key" ON "users"("google_email");
