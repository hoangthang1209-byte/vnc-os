-- Additive Content Studio storage. Existing ATTD CMS tables are untouched.
CREATE TABLE "StudioSite" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "domain" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "StudioSite_domain_key" ON "StudioSite"("domain");
CREATE TABLE "StudioPage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "siteId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "seoTitle" TEXT,
  "seoDescription" TEXT,
  "canonicalPath" TEXT,
  "publishedRevisionId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudioPage_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "StudioSite"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "StudioPage_siteId_slug_key" ON "StudioPage"("siteId","slug");
CREATE INDEX "StudioPage_siteId_updatedAt_idx" ON "StudioPage"("siteId","updatedAt");
CREATE TABLE "StudioPageRevision" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "pageId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "content" JSONB NOT NULL,
  "authorId" TEXT,
  "approvedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "approvedAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  CONSTRAINT "StudioPageRevision_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "StudioPage"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "StudioPageRevision_pageId_version_key" ON "StudioPageRevision"("pageId","version");
CREATE INDEX "StudioPageRevision_pageId_status_createdAt_idx" ON "StudioPageRevision"("pageId","status","createdAt");
