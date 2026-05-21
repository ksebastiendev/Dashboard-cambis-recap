-- Migration V2 : ajout des modèles Operation, ClientType, OperationAudit
-- Les tables V1 (transactions, transaction_audits) sont conservées intactes.

-- CreateEnum
CREATE TYPE "OpType" AS ENUM ('TYPE_A', 'TYPE_B', 'TYPE_C');

-- CreateEnum
CREATE TYPE "ClientRole" AS ENUM ('DOLLAR_SELLER', 'DOLLAR_BUYER', 'NAIRA_BUYER');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('UPDATE', 'DELETE');

-- CreateTable
CREATE TABLE "operations" (
    "id" TEXT NOT NULL,
    "type" "OpType" NOT NULL,
    "amountUsd" DECIMAL(18,4),
    "rateCfaPerUsd" DECIMAL(18,4),
    "rateNgnPerUsd" DECIMAL(18,4),
    "amountNgn" DECIMAL(18,2),
    "rateCfaPerNgn" DECIMAL(18,6),
    "totalCfaSpent" DECIMAL(18,2),
    "totalNgnReceived" DECIMAL(18,2),
    "totalCfaReceived" DECIMAL(18,2),
    "note" TEXT,
    "operationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_types" (
    "id" TEXT NOT NULL,
    "type" "ClientRole" NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "client_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operation_audits" (
    "id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "snapshot" JSONB NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "operation_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "operations_operationDate_idx" ON "operations"("operationDate");

-- CreateIndex
CREATE INDEX "operations_type_idx" ON "operations"("type");

-- CreateIndex
CREATE INDEX "operations_clientId_idx" ON "operations"("clientId");

-- CreateIndex
CREATE INDEX "operations_userId_idx" ON "operations"("userId");

-- CreateIndex
CREATE INDEX "operations_isDeleted_idx" ON "operations"("isDeleted");

-- CreateIndex
CREATE INDEX "operations_type_operationDate_isDeleted_idx" ON "operations"("type", "operationDate", "isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "client_types_clientId_type_key" ON "client_types"("clientId", "type");

-- CreateIndex
CREATE INDEX "operation_audits_operationId_idx" ON "operation_audits"("operationId");

-- CreateIndex
CREATE INDEX "operation_audits_userId_idx" ON "operation_audits"("userId");

-- CreateIndex
CREATE INDEX "operation_audits_performedAt_idx" ON "operation_audits"("performedAt");

-- AddForeignKey
ALTER TABLE "operations" ADD CONSTRAINT "operations_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operations" ADD CONSTRAINT "operations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_types" ADD CONSTRAINT "client_types_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operation_audits" ADD CONSTRAINT "operation_audits_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "operations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operation_audits" ADD CONSTRAINT "operation_audits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
