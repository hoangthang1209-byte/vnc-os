import { test } from "node:test";
import assert from "node:assert/strict";
import { VNC_CATEGORIES_V1, VNC_PARENT_CATEGORIES, VNC_CATEGORY_IDS } from "./catalog-taxonomy-v1";
import { VNC_PRODUCT_IDEAS_V1 } from "./product-backlog-v1";

test("catalog V1 contains 10 parents, 66 unique children, and bilingual names", () => {
  assert.equal(VNC_PARENT_CATEGORIES.length, 10);
  assert.equal(VNC_CATEGORY_IDS.size, 66);
  assert.equal(VNC_CATEGORIES_V1.length, 76);
  assert.equal(new Set(VNC_CATEGORIES_V1.map(c => c.id)).size, 76);
  assert.equal(new Set(VNC_CATEGORIES_V1.map(c => c.slug)).size, 76);
  const roots = new Set(VNC_PARENT_CATEGORIES.map(c => c.id));
  for (const category of VNC_CATEGORIES_V1) {
    assert.ok(category.nameEn.trim() && category.nameVi.trim());
    if (category.parentId) assert.ok(roots.has(category.parentId));
  }
});
test("55 ideas remain unapproved and map to valid V1 categories", () => {
  assert.equal(VNC_PRODUCT_IDEAS_V1.length, 55);
  assert.equal(new Set(VNC_PRODUCT_IDEAS_V1.map(p => p.id)).size, 55);
  assert.equal(VNC_PRODUCT_IDEAS_V1.filter(p => p.priority === "P0").length, 44);
  assert.equal(VNC_PRODUCT_IDEAS_V1.filter(p => p.priority === "P1").length, 11);
  for (const item of VNC_PRODUCT_IDEAS_V1) {
    assert.ok(VNC_CATEGORY_IDS.has(item.categoryId));
    assert.equal(item.status, "NOT_APPROVED");
    assert.ok(item.nameEn.trim() && item.nameVi.trim());
  }
});
