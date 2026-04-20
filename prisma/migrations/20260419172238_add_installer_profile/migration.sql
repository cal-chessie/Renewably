/*
  Warnings:

  - You are about to drop the `Activity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Installer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Lead` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Activity";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Installer";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Lead";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "counties" TEXT NOT NULL,
    "seaiReg" TEXT,
    "teamSize" INTEGER,
    "installsPerYear" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'prospect',
    "website" TEXT,
    "notes" TEXT,
    "industry" TEXT,
    "address" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "role" TEXT,
    "isDecisionMaker" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "jobTitle" TEXT,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "description" TEXT,
    "linkedin" TEXT,
    "lastContactAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Contact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "mrr" REAL,
    "setupFee" REAL,
    "stage" TEXT NOT NULL DEFAULT 'new_lead',
    "qualifiedAnswers" TEXT,
    "demoOutcome" TEXT,
    "closeReason" TEXT,
    "assignedToId" TEXT,
    "value" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Deal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Deal_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DealActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dealId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DealActivity_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DealActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Onboarding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "solarpilotProgress" INTEGER NOT NULL DEFAULT 0,
    "aiWorkforceProgress" INTEGER NOT NULL DEFAULT 0,
    "solarpilotSteps" TEXT,
    "aiWorkforceSteps" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Onboarding_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OnboardingSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "formData" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "userId" TEXT,
    "companyId" TEXT,
    "contactId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InstallerProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "contactId" TEXT,
    "companyId" TEXT,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "vatNumber" TEXT,
    "businessAddress" TEXT,
    "serviceCounties" TEXT NOT NULL DEFAULT '[]',
    "planId" TEXT NOT NULL DEFAULT 'pro',
    "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
    "billingEmail" TEXT,
    "billingAddress" TEXT,
    "billingCity" TEXT,
    "billingCounty" TEXT,
    "billingEircode" TEXT,
    "stripeCustomerId" TEXT,
    "integrations" TEXT NOT NULL DEFAULT '[]',
    "securityFeatures" TEXT NOT NULL DEFAULT '[]',
    "yearsInBusiness" INTEGER,
    "publicLiability" REAL,
    "seaiRegistered" BOOLEAN NOT NULL DEFAULT false,
    "seaiNumber" TEXT,
    "reciRegistered" BOOLEAN NOT NULL DEFAULT false,
    "reciNumber" TEXT,
    "maxProjectsMonth" INTEGER,
    "avgProjectValue" REAL,
    "avgInstallDays" INTEGER,
    "teamSize" INTEGER,
    "qualifiedElectricians" INTEGER,
    "vanFleetSize" INTEGER,
    "hasDrone" BOOLEAN NOT NULL DEFAULT false,
    "hasScaffolding" BOOLEAN NOT NULL DEFAULT false,
    "maxLeadsMonth" INTEGER,
    "minLeadValue" REAL,
    "responseTimeHours" REAL,
    "quotationTurnaround" REAL,
    "maxTravelKm" INTEGER,
    "ruralSpecialist" BOOLEAN NOT NULL DEFAULT false,
    "commercialSpecialist" BOOLEAN NOT NULL DEFAULT false,
    "heritageExperience" BOOLEAN NOT NULL DEFAULT false,
    "offersEvCharger" BOOLEAN NOT NULL DEFAULT false,
    "offersHeatPump" BOOLEAN NOT NULL DEFAULT false,
    "acceptsFinancing" BOOLEAN NOT NULL DEFAULT true,
    "leadTargetMonth" INTEGER,
    "installsMonth" INTEGER,
    "revenueTarget" REAL,
    "trialStartAt" DATETIME,
    "trialEndsAt" DATETIME,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "onboardingStep" INTEGER NOT NULL DEFAULT 0,
    "signedDocuments" TEXT NOT NULL DEFAULT '[]',
    "teamMembers" TEXT NOT NULL DEFAULT '[]',
    "dataRetentionMonths" INTEGER NOT NULL DEFAULT 24,
    "demoBookingDate" DATETIME,
    "demoBookingTime" TEXT,
    "demoFocusAreas" TEXT NOT NULL DEFAULT '[]',
    "demoCompanySize" TEXT,
    "demoRole" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InstallerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InstallerProfile_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InstallerProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "installerId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'trialing',
    "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "currentPeriodStart" DATETIME,
    "currentPeriodEnd" DATETIME,
    "canceledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT,
    CONSTRAINT "Subscription_installerId_fkey" FOREIGN KEY ("installerId") REFERENCES "InstallerProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Subscription_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InstallerEquipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "installerId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "installDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InstallerEquipment_installerId_fkey" FOREIGN KEY ("installerId") REFERENCES "InstallerProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InstallerDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "installerId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileName" TEXT,
    "fileUrl" TEXT,
    "signedAt" DATETIME,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InstallerDocument_installerId_fkey" FOREIGN KEY ("installerId") REFERENCES "InstallerProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Contact_companyId_idx" ON "Contact"("companyId");

-- CreateIndex
CREATE INDEX "Deal_companyId_idx" ON "Deal"("companyId");

-- CreateIndex
CREATE INDEX "Deal_stage_idx" ON "Deal"("stage");

-- CreateIndex
CREATE INDEX "DealActivity_dealId_idx" ON "DealActivity"("dealId");

-- CreateIndex
CREATE INDEX "DealActivity_createdAt_idx" ON "DealActivity"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Onboarding_companyId_key" ON "Onboarding"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingSubmission_email_key" ON "OnboardingSubmission"("email");

-- CreateIndex
CREATE UNIQUE INDEX "InstallerProfile_userId_key" ON "InstallerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InstallerProfile_contactId_key" ON "InstallerProfile"("contactId");

-- CreateIndex
CREATE INDEX "InstallerProfile_userId_idx" ON "InstallerProfile"("userId");

-- CreateIndex
CREATE INDEX "InstallerProfile_companyId_idx" ON "InstallerProfile"("companyId");

-- CreateIndex
CREATE INDEX "Subscription_installerId_idx" ON "Subscription"("installerId");

-- CreateIndex
CREATE INDEX "InstallerEquipment_installerId_idx" ON "InstallerEquipment"("installerId");

-- CreateIndex
CREATE INDEX "InstallerDocument_installerId_idx" ON "InstallerDocument"("installerId");
