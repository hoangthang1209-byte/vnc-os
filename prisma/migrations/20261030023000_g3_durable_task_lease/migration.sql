-- G3 durable lease storage. Additive migration only; DO NOT apply to Production
-- before schema/CI/security review, backup and explicit release approval.
-- This does not enable any executor or background dispatch.
CREATE TABLE "G3TaskLease" (
  "id" TEXT NOT NULL,
  "taskRunId" TEXT NOT NULL,
  "executorId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "headSha" TEXT NOT NULL,
  "attempt" INTEGER NOT NULL DEFAULT 1,
  "status" TEXT NOT NULL DEFAULT 'CLAIMED',
  "heartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "G3TaskLease_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "G3TaskLease_status_check" CHECK ("status" IN ('CLAIMED', 'RUNNING', 'RELEASED')),
  CONSTRAINT "G3TaskLease_attempt_check" CHECK ("attempt" > 0)
);

CREATE UNIQUE INDEX "G3TaskLease_taskRunId_key" ON "G3TaskLease"("taskRunId");
CREATE INDEX "G3TaskLease_status_expiresAt_idx" ON "G3TaskLease"("status", "expiresAt");

ALTER TABLE "G3TaskLease"
  ADD CONSTRAINT "G3TaskLease_taskRunId_fkey"
  FOREIGN KEY ("taskRunId") REFERENCES "TaskRun"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
