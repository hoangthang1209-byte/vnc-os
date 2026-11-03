import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import {
  adminNavigationSections, filterNavigationForWorkspaceMode,
  SOLO_HIDDEN_CONTENT_HREFS,
} from "@/lib/admin/admin-navigation";
import {
  ADMIN_DOCUMENT_TITLE, ADMIN_TITLE_TEMPLATE, adminPageMetadata,
} from "@/lib/admin/admin-metadata";

const V9_LABELS = [
  "WORKSPACE", "SALES & CRM", "ORDERS & OPERATIONS",
  "TECHNICAL & SOURCING", "FINANCE & DOCUMENTS",
  "PRODUCTS & MULTI-SITE", "CONTENT & MARKETING", "ADMINISTRATION",
];
const items = () => adminNavigationSections.flatMap((section) =>
  section.platforms.flatMap((platform) => platform.items),
);

describe("VNC OS V9 navigation contract (#294)", () => {
  it("follows approved V9 HTML domain hierarchy", () => {
    assert.deepEqual(adminNavigationSections.map((section) => section.label), V9_LABELS);
    for (const section of adminNavigationSections) {
      assert.equal(section.platforms.length, 1);
      assert.equal(section.platforms[0].label, "");
    }
  });

  it("uses one dashboard entry and no duplicate active routes", () => {
    const hrefs = items().filter((item) => item.status === "active").map((item) => item.href);
    assert.equal(hrefs.filter((href) => href === "/admin/dashboard").length, 1);
    assert.equal(new Set(hrefs).size, hrefs.length);
  });

  it("preserves key operational routes and original access requirements", () => {
    const hrefs = items().map((item) => item.href);
    for (const href of [
      "/admin/crm/leads", "/admin/crm/customers", "/admin/quotes",
      "/admin/pricing/costing", "/admin/orders", "/admin/orders/new/quick",
      "/admin/production", "/admin/production-suppliers",
      "/admin/tech-pack", "/admin/documents/invoices",
      "/admin/products", "/admin/danh-muc", "/admin/media",
      "/admin/blog", "/admin/content/seo",
    ]) assert.ok(hrefs.includes(href), `missing V9 route ${href}`);
    assert.equal(
      items().find((item) => item.href === "/admin/documents/invoices")?.requiredPermissions?.[0],
      "canViewFinancials",
    );
  });

  it("exposes no dead routes or placeholder links", () => {
    for (const item of items()) {
      assert.equal(item.status, "active");
      assert.ok(item.href?.startsWith("/admin/"));
      const relative = item.href!.replace(/^\/admin\//, "");
      const base = path.join("src/app/(backend)/admin", relative);
      assert.ok(existsSync(path.join(base, "page.tsx")) || existsSync(`${base}.tsx`), `missing page: ${item.href}`);
    }
  });

  it("keeps restricted expert tools outside the main menu", () => {
    const hrefs = new Set(items().map((item) => item.href));
    for (const href of [
      "/admin/knowledge-graph", "/admin/knowledge-base",
      "/admin/content/ai", "/admin/content/operations",
      "/admin/dealer", "/admin/crm/whatsapp-assistant",
    ]) assert.equal(hrefs.has(href), false);
  });

  it("applies Solo-mode Content filter without mutating V9 registry", () => {
    const original = adminNavigationSections.find((s) => s.label === "CONTENT & MARKETING");
    const filtered = filterNavigationForWorkspaceMode(adminNavigationSections, true)
      .find((s) => s.label === "CONTENT & MARKETING");
    assert.ok(original && filtered);
    const hrefs = filtered.platforms.flatMap((p) => p.items.map((item) => item.href));
    for (const href of SOLO_HIDDEN_CONTENT_HREFS) assert.ok(!hrefs.includes(href));
    assert.ok(hrefs.includes("/admin/blog"));
    assert.ok(hrefs.includes("/admin/content/seo"));
    assert.deepEqual(
      filterNavigationForWorkspaceMode(adminNavigationSections, false).find((s) => s.label === "CONTENT & MARKETING"),
      original,
    );
  });
});

describe("existing document metadata compatibility", () => {
  it("does not duplicate the admin title", () => {
    assert.equal(ADMIN_DOCUMENT_TITLE, "VNC OS");
    assert.equal(ADMIN_TITLE_TEMPLATE, "%s | VNC OS");
    assert.deepEqual(adminPageMetadata("Khách hàng"), { title: "Khách hàng" });
  });
});
