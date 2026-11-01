#!/usr/bin/env python3
"""Prepare a non-public staging catalog and image review from sanitized SQL exports.

Input: products_review.csv, files_manifest.csv, optionally media_checks.csv.
No public approvals are inferred from Active=1, registry presence, or Drive storage.
The output is a REVIEW manifest, not catalog-data.json for public serving.
"""
import argparse
import csv
import json
from pathlib import Path

def read_csv(path):
    with open(path, newline="", encoding="utf-8-sig") as handle:
        return list(csv.DictReader(handle))

def build(products, files, checks):
    registry = {row["expected_public_url"]: row for row in files}
    verified = {row["legacy_url"]: row for row in checks}
    records, media_rows = [], []
    for row in products:
        gallery = [p.strip() for p in row["gallery_image_paths"].split(" | ") if p.strip()]
        media = []
        for url in gallery:
            file = registry.get(url, {})
            check = verified.get(url, {})
            bytes_ok = check.get("bytes_verified") == "YES"
            rights_ok = check.get("rights_approved") == "YES"
            media.append({"legacyUrl": url, "storagePath": file.get("storage_path", ""),
                          "registryMatched": bool(file), "bytesVerified": bytes_ok,
                          "rightsApproved": rights_ok,
                          "readyForReview": bool(file) and bytes_ok and rights_ok})
            media_rows.append({"sku": row["sku"], "legacy_url": url,
                               "registry_match": "YES" if file else "NO",
                               "storage_path": file.get("storage_path", ""),
                               "bytes_verified": "YES" if bytes_ok else "NO",
                               "rights_approved": "YES" if rights_ok else "NO"})
        records.append({"legacyId": row["legacy_id"], "sku": row["sku"],
                        "title": row["name"], "legacyPath": row["legacy_path"],
                        "sourceLang": row["lang"], "legacyActive": row["active"] == "1",
                        "legacyCategory": row["category_raw"],
                        "status": "REVIEW_REQUIRED", "publicApproved": False,
                        "mediaRightsApproved": False, "media": media})
    return {"site": "vietnamclothing.vn", "purpose": "offline-review",
            "publicFeed": False, "products": records}, media_rows

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--products", type=Path, required=True)
    p.add_argument("--files", type=Path, required=True)
    p.add_argument("--media-checks", type=Path, help="Optional independent verification CSV")
    p.add_argument("--out", type=Path, required=True)
    args = p.parse_args()
    checks = read_csv(args.media_checks) if args.media_checks else []
    catalog, rows = build(read_csv(args.products), read_csv(args.files), checks)
    args.out.mkdir(parents=True, exist_ok=True)
    (args.out / "legacy_catalog_review.json").write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    with (args.out / "legacy_media_review.csv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]) if rows else
                                ["sku", "legacy_url", "registry_match", "storage_path", "bytes_verified", "rights_approved"])
        writer.writeheader()
        writer.writerows(rows)
    print(f"{len(catalog['products'])} products; {len(rows)} media refs; "
          f"{sum(x['registry_match']=='YES' for x in rows)} registry matches; "
          f"{sum(x['bytes_verified']=='YES' for x in rows)} verified bytes; "
          "0 automatically approved for public publication")

if __name__ == "__main__":
    main()
