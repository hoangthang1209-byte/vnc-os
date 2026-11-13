-- Lightweight SVG measurement annotations, kept separate from POM sizing values.
ALTER TABLE "Pattern" ADD COLUMN "measurementAnnotations" JSONB;
