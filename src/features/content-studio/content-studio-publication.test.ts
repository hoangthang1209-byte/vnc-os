import { test } from "node:test";
import assert from "node:assert/strict";
import { assertPublishableRevision, validatePublishTarget } from "./content-studio-publication";

test("publishing is always site isolated", () => {
  assert.doesNotThrow(() => validatePublishTarget("attd.vn", "attd.vn"));
  assert.throws(() => validatePublishTarget("attd.vn", "vietnamclothing.vn"));
});
test("revision must belong to page and have documented approval", () => {
  assert.equal(assertPublishableRevision({id:"rev",pageId:"p",status:"APPROVED",approvedById:"editor"}, "p"),"rev");
  assert.throws(() => assertPublishableRevision({id:"rev",pageId:"other",status:"APPROVED",approvedById:"editor"}, "p"));
  assert.throws(() => assertPublishableRevision({id:"rev",pageId:"p",status:"DRAFT",approvedById:"editor"}, "p"));
});
