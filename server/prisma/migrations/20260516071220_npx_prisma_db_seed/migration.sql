-- CreateEnum
CREATE TYPE "Role" AS ENUM ('EMPLOYEE', 'MANAGER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UoM" AS ENUM ('NUMERIC_MIN', 'NUMERIC_MAX', 'TIMELINE', 'ZERO');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'RETURNED', 'LOCKED');

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('NOT_STARTED', 'ON_TRACK', 'COMPLETED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "department" TEXT,
    "managerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "thrustArea" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "uom" "UoM" NOT NULL,
    "target" DOUBLE PRECISION NOT NULL,
    "weightage" DOUBLE PRECISION NOT NULL,
    "status" "GoalStatus" NOT NULL DEFAULT 'DRAFT',
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "sharedGroupId" TEXT,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedGoalRecipient" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "weightage" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedGoalRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cycle" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "settingOpen" TIMESTAMP(3) NOT NULL,
    "settingClose" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quarter" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "windowOpen" TIMESTAMP(3) NOT NULL,
    "windowClose" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quarter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuarterlyData" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "quarterId" TEXT NOT NULL,
    "actual" DOUBLE PRECISION,
    "completionDate" TIMESTAMP(3),
    "progressStatus" "ProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "score" DOUBLE PRECISION,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "QuarterlyData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckIn" (
    "id" TEXT NOT NULL,
    "quarterlyDataId" TEXT NOT NULL,
    "quarterId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "goalId" TEXT,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "field" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "reason" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Goal_ownerId_cycleId_idx" ON "Goal"("ownerId", "cycleId");

-- CreateIndex
CREATE UNIQUE INDEX "SharedGoalRecipient_goalId_recipientId_key" ON "SharedGoalRecipient"("goalId", "recipientId");

-- CreateIndex
CREATE INDEX "QuarterlyData_goalId_quarterId_idx" ON "QuarterlyData"("goalId", "quarterId");

-- CreateIndex
CREATE UNIQUE INDEX "QuarterlyData_goalId_quarterId_key" ON "QuarterlyData"("goalId", "quarterId");

-- CreateIndex
CREATE UNIQUE INDEX "CheckIn_quarterlyDataId_key" ON "CheckIn"("quarterlyDataId");

-- CreateIndex
CREATE INDEX "AuditLog_goalId_idx" ON "AuditLog"("goalId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedGoalRecipient" ADD CONSTRAINT "SharedGoalRecipient_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedGoalRecipient" ADD CONSTRAINT "SharedGoalRecipient_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quarter" ADD CONSTRAINT "Quarter_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuarterlyData" ADD CONSTRAINT "QuarterlyData_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuarterlyData" ADD CONSTRAINT "QuarterlyData_quarterId_fkey" FOREIGN KEY ("quarterId") REFERENCES "Quarter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_quarterlyDataId_fkey" FOREIGN KEY ("quarterlyDataId") REFERENCES "QuarterlyData"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_quarterId_fkey" FOREIGN KEY ("quarterId") REFERENCES "Quarter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
