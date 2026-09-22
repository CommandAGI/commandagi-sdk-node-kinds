import { test } from "node:test";
import assert from "node:assert/strict";
import { nodeKindById, resolveNodeKind, isDirectory, isContainer, isTextualType } from "./index.js";

test("extension vocabulary preserves declared identity without inventing capabilities", () => {
  assert.equal(resolveNodeKind({ name: "notes.md", type: "ext:custom" }).id, "ext:custom");
  assert.equal(nodeKindById("ext:custom")?.mark, "FileText");
  assert.equal(isDirectory("ext:custom"), false);
  assert.equal(isContainer("ext:custom"), false);
  assert.equal(isTextualType("ext:custom"), false);
  assert.equal(resolveNodeKind({ name: "blob.custom" }).id, "other");
});

test("integration directory and textual JSON Lines use registry properties", () => {
  assert.equal(isDirectory("ext:integration"), true);
  assert.equal(isContainer("ext:integration"), false);
  assert.equal(resolveNodeKind({ name: "account.integration" }).id, "other");
  assert.equal(resolveNodeKind({ name: "frames.jsonl" }).id, "ext:jsonl");
  assert.equal(isTextualType("ext:jsonl"), true);
  assert.equal(resolveNodeKind({ name: "frames.parquet" }).id, "dataset");
  assert.equal(isTextualType("dataset"), false);
});
