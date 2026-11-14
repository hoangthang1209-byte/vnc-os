import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("Customer 360 workspace navigation", () => {
  const content = readFileSync("src/components/admin/crm/CrmCustomerDetailView.tsx", "utf8");
  it("puts navigation before content of the active overview tab", () => {
    const tabs = content.indexOf('role="group" aria-label="Điều hướng hồ sơ khách hàng"');
    const overview = content.indexOf('activeV9Tab === "overview" ? (');
    assert.ok(tabs > -1);
    assert.ok(overview > tabs, "overview must be after the workspace navigation");
  });
  it("preserves existing contacts, profile, advanced sections and save workflow", () => {
    for (const hook of ['setActiveV9Tab("profile")', 'setActiveV9Tab("contacts")', 'setActiveV9Tab("activity")', 'async function saveCustomer()', 'CustomerAccountWorkspace overview={overview}']) {
      assert.ok(content.includes(hook), `missing existing behavior ${hook}`);
    }
  });
});
