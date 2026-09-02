CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

INSERT INTO "Organization" ("id", "name", "createdAt", "updatedAt")
VALUES ('default-organization', 'Spectra Operations', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

ALTER TABLE "User" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "Guard" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "Client" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "Site" ADD COLUMN "organizationId" TEXT;

UPDATE "User" SET "organizationId" = 'default-organization' WHERE "organizationId" IS NULL;
UPDATE "Guard" SET "organizationId" = 'default-organization' WHERE "organizationId" IS NULL;
UPDATE "Client" SET "organizationId" = 'default-organization' WHERE "organizationId" IS NULL;
UPDATE "Site" SET "organizationId" = 'default-organization' WHERE "organizationId" IS NULL;

ALTER TABLE "User" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Guard" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Client" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Site" ALTER COLUMN "organizationId" SET NOT NULL;

ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Guard" ADD CONSTRAINT "Guard_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Client" ADD CONSTRAINT "Client_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Site" ADD CONSTRAINT "Site_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
