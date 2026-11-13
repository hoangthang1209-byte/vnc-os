#!/usr/bin/env python3
"""Offline, read-only legacy SQL inventory for VietnamClothing migrations.

Never commit the SQL dump, credentials, personal records or raw report.
This tool reports schema and INSERT tuple counts only; counts are approximate
when SQL statement formatting differs. Content import needs a separate,
reviewed parser and media rights / site approval.
"""
import argparse
import csv
import pathlib
import re

CREATE = re.compile(r"CREATE TABLE `([A-Za-z0-9_]+)`", re.IGNORECASE)
INSERT = re.compile(r"INSERT INTO `([A-Za-z0-9_]+)`", re.IGNORECASE)
PUBLIC = {
    "qsv_product": "Products; approval and media matching required",
    "qsv_product_type": "Product categories",
    "qsv_product_color": "Color metadata",
    "qsv_product_size": "Size metadata",
    "qsv_article": "Editorial articles",
    "qsv_article_catalog": "Article categories",
    "qsv_pages": "Static pages",
    "qsv_service": "Service pages",
    "qsv_service_catalog": "Service categories",
    "qsv_files": "Media file references; verify physical assets",
    "qsv_seo_rewrite": "Legacy URL aliases",
    "qsv_seo_redirect": "Historical redirects",
}
PRIVATE = {"qsv_member", "qsv_member_log", "qsv_order", "qsv_order_item",
           "qsv_request", "qsv_delivery"}

def inventory(sql):
    tables = set(CREATE.findall(sql))
    inserted = set(INSERT.findall(sql))
    rows = []
    for table in sorted(tables):
        classification = "PRIVATE_EXCLUDE" if table in PRIVATE else (
            "PUBLIC_REVIEW" if table in PUBLIC else "MANUAL_REVIEW"
        )
        rows.append([table, classification, "yes" if table in inserted else "no",
                     PUBLIC.get(table, "Inspect before migration")])
    return rows

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("dump", type=pathlib.Path)
    parser.add_argument("--out", type=pathlib.Path, required=True,
                        help="Save sanitized inventory to a private local path")
    args = parser.parse_args()
    sql = args.dump.read_text(encoding="utf-8", errors="replace")
    rows = inventory(sql)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["legacy_table", "migration_review", "has_insert", "notes"])
        writer.writerows(rows)
    print(f"Inventory: {len(rows)} tables, {sum(r[2] == 'yes' for r in rows)} with INSERT statements.")
    print("No customer records, product records, image URLs or credentials exported.")

if __name__ == "__main__":
    main()
