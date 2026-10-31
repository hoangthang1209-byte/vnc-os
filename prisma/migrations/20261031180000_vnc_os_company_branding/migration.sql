-- Dedicated VNC OS company branding, never shared with ATTD website branding.
CREATE TABLE IF NOT EXISTS "VncOsCompanyBranding" (
  "id" TEXT NOT NULL,
  "logoUrl" TEXT,
  "faviconUrl" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VncOsCompanyBranding_pkey" PRIMARY KEY ("id")
);
