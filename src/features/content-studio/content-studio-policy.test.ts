import { test } from "node:test";
import assert from "node:assert/strict";
import { isContentSiteId, validateStudioSlug, validateStudioBlocks, canPublishStudioRevision } from "./content-studio-policy";

test("allowlists brand sites; no fallback to wrong website", () => {
  assert.equal(isContentSiteId("vietnamclothing.vn"), true);
  assert.equal(isContentSiteId("attd.vn"), true);
  assert.equal(isContentSiteId("aothunthongdiep.com"), false);
});
test("validates canonical site-relative slugs", () => {
  assert.equal(validateStudioSlug("/entertainment-merchandise"), "/entertainment-merchandise");
  assert.throws(() => validateStudioSlug("https://attd.vn/"));
  assert.throws(() => validateStudioSlug("/foo?site=attd"));
});
test("rejects unexpected content block and oversized payload", () => {
  assert.deepEqual(validateStudioBlocks([{ type: "hero", data: { title: "VNC" } }])[0].type, "hero");
  assert.throws(() => validateStudioBlocks([{ type: "rawHtml", data: { markup: "<script>x</script>" } }]));
  assert.throws(() => validateStudioBlocks([{ type: "image", data: { text: "x".repeat(21000) } }]));
});
test("publish requires approved state and approver", () => {
  assert.equal(canPublishStudioRevision("APPROVED", "editor-id"), true);
  assert.equal(canPublishStudioRevision("DRAFT", "editor-id"), false);
  assert.equal(canPublishStudioRevision("APPROVED", null), false);
});
