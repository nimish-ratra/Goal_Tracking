/*
  Warnings:

  - A unique constraint covering the columns `[azureOid]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "EscalationTrigger" AS ENUM ('GOAL_NOT_SUBMITTED', 'GOAL_NOT_APPROVED', 'CHECKIN_NOT_COMPLETED');

-- CreateEnum
CREATE TYPE "EscalationStatus" AS ENUM ('PENDING', 'RESOLVED', 'ACKNOWLEDGED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "azureOid" TEXT,
ADD COLUMN     "ssoProvider" TEXT DEFAULT 'local';

-- CreateTable
CREATE TABLE "EscalationRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "triggerType" "EscalationTrigger" NOT NULL,
    "delayDays" INTEGER NOT NULL,
    "escalationLevel" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EscalationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscalationLog" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "escalatedToId" TEXT NOT NULL,
    "triggerType" "EscalationTrigger" NOT NULL,
    "status" "EscalationStatus" NOT NULL DEFAULT 'PENDING',
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "notificationSentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "context" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EscalationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_azureOid_key" ON "User"("azureOid");

-- AddForeignKey
ALTER TABLE "EscalationLog" ADD CONSTRAINT "EscalationLog_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "EscalationRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscalationLog" ADD CONSTRAINT "EscalationLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscalationLog" ADD CONSTRAINT "EscalationLog_escalatedToId_fkey" FOREIGN KEY ("escalatedToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
