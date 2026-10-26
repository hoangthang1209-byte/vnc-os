import assert from "node:assert/strict";
import test from "node:test";
import { resolveVerifiedZaloOaSource } from "./zalo-oa-attribution";

test("maps only owner-identified Vietnam Clothing OA ID", () => {
  assert.equal(resolveVerifiedZaloOaSource("1814500354229784667"), "vietnamclothing.vn");
});
test("does not guess source for unverified or malformed OA IDs", () => {
  assert.equal(resolveVerifiedZaloOaSource("1814500354229784668"), null);
  assert.equal(resolveVerifiedZaloOaSource(""), null);
  assert.equal(resolveVerifiedZaloOaSource({ id: "1814500354229784667" }), null);
  assert.equal(resolveVerifiedZaloOaSource("1814500354229784667evil"), null);
});
