-- Verified VNC USD receiving account supplied by VNC management.
-- Legal address/tax registration are deliberately left unset pending formal verification.
INSERT INTO "VncLegalEntity" ("id","code","legalName","address","isActive","isDefault","createdAt","updatedAt")
VALUES ('vnc-legal-manufacturing','VNC-MFG','Vietnam Clothing Manufacturing Co.,Ltd',NULL,true,true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "VncBankAccount" (
  "id","legalEntityId","accountName","accountNo","accountAddress",
  "bankName","bankAddress","branch","swift","currency",
  "isActive","isDefault","createdAt","updatedAt"
)
SELECT
  'vnc-acb-usd-34277567', e."id",
  'CTY TNHH SX MAY MAC VIET NAM (VIETNAM CLOTHING MANUFACTURING CO.,LTD)',
  '34277567',
  '14B Bui Cam Ho, Tan Thoi Hoa, Tan Phu, Ho Chi Minh City, Vietnam',
  'ASIA COMMERCIAL JOINT STOCK BANK (ACB)',
  '442 Nguyễn Thị Minh Khai, Ward 5, District 3, Ho Chi Minh City',
  'ACB - PGD HAM TU','ASCBVNVX','USD',true,true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
FROM "VncLegalEntity" e
WHERE e."code" = 'VNC-MFG'
  AND NOT EXISTS (
    SELECT 1 FROM "VncBankAccount" b
    WHERE b."legalEntityId"=e."id" AND b."accountNo"='34277567' AND b."currency"='USD'
  );
