import { test } from "node:test";
import assert from "node:assert/strict";
import {
  NODE_KINDS,
  isDirectory,
  isShortcut,
  isContainer,
  surfaceOf,
  isTextualType,
  capabilitiesFor,
  type StoreCapabilities,
  nodeKindById,
  isFolderKind,
  isTextualKind,
  resolveNodeKind,
  resolveFolderKind,
  type NodeType,
} from "./index.js";

test("SKILL.md is a skill, not generic markdown", () => {
  // The discriminator is the NAME (the agentskills.io convention), not an invented `.skill` extension —
  // so a skill authored anywhere in that ecosystem is a skill here, and the type is spelled once.
  assert.equal(resolveNodeKind({ name: "SKILL.md" }).id, "skill");
  assert.equal(resolveNodeKind({ name: "skill.md" }).id, "skill");
  assert.equal(resolveNodeKind({ name: "skills/web-research/SKILL.md" }).id, "skill");
});

test("AGENT.md is an agent, not generic markdown", () => {
  assert.equal(resolveNodeKind({ name: "AGENT.md" }).id, "agent");
  assert.equal(resolveNodeKind({ name: ".commandagi/agents/abc123/AGENT.md" }).id, "agent");
});

test("an ordinary markdown file is untouched by the named-kind rule", () => {
  for (const name of ["README.md", "my-skill.md", "SKILLS.md", "AGENTS.md", "my-agent.md"])
    assert.equal(resolveNodeKind({ name }).id, "markdown", name);
});

test("the named-kind rule did not disturb the extensionless code names", () => {
  assert.equal(resolveNodeKind({ name: "Dockerfile" }).id, "code");
  assert.equal(resolveNodeKind({ name: "project/Makefile" }).id, "code");
  assert.equal(resolveNodeKind({ name: "package-lock.json" }).id, "json");
});

test("a DIRECTORY is the `folder` kind, whatever it is named", () => {
  // The reason `folder` is a kind at all. While it lived outside the taxonomy, an app that opened
  // folders needed a rule of its own and the URL layer needed a guard against exactly this name — a
  // directory whose name ends in a claimed extension. The guard is deleted; this is what replaced it.
  assert.equal(resolveNodeKind({ name: "notes.docs", type: "folder" }).id, "folder");
  assert.equal(resolveNodeKind({ name: "design.3dx", type: "folder" }).id, "folder");
  assert.equal(resolveNodeKind({ name: "src", type: "folder" }).id, "folder");
  // …and a FILE of the same name is still a document.
  assert.equal(resolveNodeKind({ name: "design.3dx" }).id, "3d");
});

test("isTextualKind answers about the BYTES, not about which surface opens them", () => {
  // The distinction that mattered: keying "is this text?" off the surface silently skipped every CSV in
  // the content index, because a `.csv` opens the table grid. Both questions are legitimate; only one is
  // about the bytes, and there is exactly one predicate for it now.
  assert.equal(nodeKindById("csv")?.surface, "table", "a csv reads in the grid");
  assert.equal(isTextualKind("csv"), true, "but its bytes are plainly text");

  for (const id of ["calendar", "html", "gcode", "eda-source", "nodegraph"] as const)
    assert.equal(isTextualKind(id), true, `${id} is text on disk`);

  // Every kind whose built-in reader is the TEXT editor must be textual; the superset can never be
  // smaller than the subset.
  for (const k of NODE_KINDS)
    if (k.surface === "text") assert.equal(isTextualKind(k.id), true, k.id);
});

test("packages and binaries are NOT textual — an indexer must not read them as text", () => {
  // `.task`/`.project`/`.3dx` are ZIPs, indexed through the CONTAINER path; reading their bytes as text
  // would store compressed noise.
  for (const id of [
    "task",
    "project",
    "3d",
    "video-project",
    "music",
    "image",
    "pdf",
    "font",
  ] as const)
    assert.equal(isTextualKind(id), false, `${id} must not be read as text`);
  // `dataset` spans .jsonl (text) and .parquet (binary), so the question has no honest answer at kind
  // granularity — it stays unflagged rather than guessing.
  assert.equal(isTextualKind("dataset"), false);
});

test("raw media and the Studio project are DIFFERENT kinds", () => {
  // They shared the id `video` for as long as the table had an `edit` field to tell them apart. Once
  // the surface is computed from app edges, one id for two things is a wrong answer: Studio's native
  // claim captured every mp4 in the Drive and offered to open it in the NLE.
  assert.equal(resolveNodeKind({ name: "clip.mp4" }).id, "video");
  assert.equal(resolveNodeKind({ name: "cut.vidx" }).id, "video-project");
  assert.equal(resolveNodeKind({ name: "song.mp3" }).id, "audio");
  assert.equal(resolveNodeKind({ name: "track.musx" }).id, "music");
});

test("a kind's `surface` is optional — absent is a real answer, not a gap", () => {
  // The whole point of deleting `edit: {mode}`. `download` was the TOTAL field's floor, so "nothing
  // reads these bytes" and "nobody wired this yet" stored the same value. Absent now means the former,
  // and `scripts/check-openers.mjs` fails on the latter.
  assert.equal(nodeKindById("pdf")?.surface, undefined);
  assert.equal(nodeKindById("dashboard")?.surface, undefined);
  assert.equal(nodeKindById("image")?.surface, "preview");
});

// ─── Refined FOLDER kinds (2026-08-17) ──────────────────────────────────────────────────────────────
//
// The anchor is the marker convention every tool already uses: `.git` makes a directory a working tree
// (git's own definition), `*.tf` makes it a Terraform stack (Terraform's own — a stack IS the .tf files
// in a directory, there is no manifest). These tests assert that, not this table's shape.

test("a directory with .git is a repository — that is now the whole definition of `repo`", () => {
  assert.equal(resolveFolderKind([".git", "src"]).id, "repo");
});

test("a `.commandagi/` alone does NOT refine a folder — a kind must change an answer to exist", () => {
  // Code opens `folder` natively, so a "managed folder" kind would add a name without adding a claim.
  // (`project` is separately the kind of a `.project` DOCUMENT — it would also have meant two things.)
  assert.equal(resolveFolderKind([".commandagi", "README.md"]).id, "folder");
});

test("a tracked Terraform stack is a REPOSITORY — version control governs the whole tree", () => {
  // Order is the rule and this is the case that fixes it: how a tree is handled is decided by whether
  // it is under version control, not by which file types happen to be inside it.
  assert.equal(resolveFolderKind([".git", "main.tf"]).id, "repo");
  assert.equal(resolveFolderKind(["main.tf", "vars.tf"]).id, "terraform-stack");
});

test("no markers means the GENERIC folder — a listing must never have to readdir to classify a tile", () => {
  assert.equal(resolveNodeKind({ name: "photos", type: "folder" }).id, "folder");
  assert.equal(resolveFolderKind([]).id, "folder");
  assert.equal(resolveFolderKind(["a.jpg"]).id, "folder");
});

test("a refined folder is STILL a folder — the node kind beats every name rule, as before", () => {
  // The guard this replaced: a FOLDER named `notes.docs` must not mount into the Docs editor.
  assert.equal(resolveFolderKind([".git"]).id, "repo");
  assert.equal(isFolderKind("repo"), true);
  assert.equal(isFolderKind("folder"), true);
  assert.equal(isFolderKind("markdown"), false);
});

test("an issue and a run are ordinary kinds — a file and a package's declaring file", () => {
  assert.equal(resolveNodeKind({ name: "7.issue" }).id, "issue");
  assert.equal(resolveNodeKind({ name: "run.json" }).id, "run");
  // `run.json` is name-matched, so the extension table must not steal it back as generic JSON.
  assert.equal(resolveNodeKind({ name: "other.json" }).id, "json");
  assert.equal(
    isTextualKind("issue"),
    true,
    "an issue is markdown — indexers and grep must see it",
  );
});

// ─── DECLARATION BEATS INFERENCE ──────────────────────────────────────────────────────────────────
//
// A folder's kind is DECLARED; marker inference is the fallback for folders that have declared nothing
// (notes/decisions/2026-08-26-a-node-kind-is-declared-inference-is-only-a-fallback.md). Until migration
// 0415 only SYNTHETIC directories could declare, so these pin the precedence a real folder now relies
// on — and the must-fail control that a bad declaration does not become a silent generic folder.

test("a DECLARED folder kind wins over the markers sitting right next to it", () => {
  // The whole point: the owner said what it is, and a `.git` that happens to be present does not
  // overrule them. Under inference-only this folder was a repo and nobody could say otherwise.
  assert.equal(resolveNodeKind({ name: "stack", type: "terraform-stack" }).id, "terraform-stack");
});

test("with NO declaration, inference still answers — the fallback is intact", () => {
  assert.equal(resolveFolderKind([".git"]).id, "repo");
  assert.equal(resolveFolderKind(["main.tf"]).id, "terraform-stack");
});

test("no declaration AND no markers is the GENERIC folder — undeclared, not broken", () => {
  // A listing of a thousand tiles must not have to readdir each one; degrading here costs specificity
  // and never correctness, which is why `markers` is optional in the first place.
  assert.equal(resolveNodeKind({ name: "photos", type: "folder" }).id, "folder");
});

test("unknown declaration does not shadow filename inference", () => {
  assert.equal(
    resolveNodeKind({ name: "x.md", type: "not-a-real-kind" as NodeType }).id,
    "markdown",
  );
});

test("isFolderKind admits the declarable directory kinds and REFUSES machine kinds", () => {
  // This predicate is the edge's allowlist for `POST /drive/folders {kind}`. Machine directories are
  // minted by the provider from an embodiment row; if a drive write could claim one, "an embodiment is
  // a file" would be forgeable. That is a security property, not a taxonomy nicety.
  for (const ok of ["folder", "repo", "app", "terraform-stack"] as const)
    assert.equal(isFolderKind(ok), true, `${ok} is declarable`);
  for (const no of ["computer", "phone", "camera", "robot", "simulation", "printer"] as const)
    assert.equal(isFolderKind(no), false, `${no} must NOT be declarable by a drive write`);
  assert.equal(isFolderKind("markdown"), false, "a file kind is not a folder kind");
});

// ─── A DECLARATION GOVERNS EVERY NODE, NOT JUST DIRECTORIES ───────────────────────────────────────
//
// 0415 gave folders a declared kind; 0416 gives files one. The split was never principled — a folder
// was classified from its CONTENTS and a file from its EXTENSION, and both are facts about how a node
// is spelled or filled standing in for a fact about what it IS.

test("a FILE's declaration beats its extension", () => {
  // Renaming budget.csv to budget.txt does not make it a different document; neither does the reverse.
  assert.equal(resolveNodeKind({ name: "budget.txt", type: "csv" }).id, "csv");
  assert.equal(resolveNodeKind({ name: "notes.md", type: "skill" }).id, "skill");
});

test("a FILE's declaration beats even the NAME table, which outranks extensions", () => {
  // `SKILL.md` is a skill by an exact-name rule that deliberately outranks the extension table. A
  // declaration outranks that too, or it would not be the primary answer — it would be third.
  assert.equal(resolveNodeKind({ name: "SKILL.md", type: "markdown" }).id, "markdown");
});

test("a FILE with NO extension and no declaration still infers, and with one is exact", () => {
  assert.equal(resolveNodeKind({ name: "Dockerfile" }).id, "code", "inference survives untouched");
  assert.equal(resolveNodeKind({ name: "generated-output", type: "csv" }).id, "csv");
});

test("MUST-FAIL CONTROL: an unknown declaration on a FILE falls through to inference", () => {
  assert.equal(
    resolveNodeKind({ name: "a.csv", type: "not-a-real-kind" as NodeType }).id,
    "csv",
    "a declaration naming nothing must not shadow a rule that names something",
  );
});

test("MUST-FAIL CONTROL: the declaration does not leak between the two node shapes", () => {
  // A directory kind declared on a file, and a file kind declared on a directory, are both category
  // errors the EDGE refuses. The resolver still has to answer honestly if one is ever stored: it
  // returns exactly what was declared rather than silently substituting, so the bug is VISIBLE.
  assert.equal(resolveNodeKind({ name: "x", type: "repo" }).id, "repo");
  assert.equal(resolveNodeKind({ name: "d", type: "csv" }).id, "csv");
});

test("the full precedence ladder, in one place", () => {
  const name = "thing.csv";
  // 1 declaration > 4 extension
  assert.equal(resolveNodeKind({ name, type: "json" }).id, "json");
  // 4 extension
  assert.equal(resolveNodeKind({ name }).id, "csv");
  // 6 other
  assert.equal(resolveNodeKind({ name: "blob" }).id, "other");
  // 2 markers only apply to directories — a FILE named like a repo is not one
  assert.equal(resolveNodeKind({ name: ".git" }).id, "other");
});

test("UNIX shapes include every machine directory and keep shortcut bytes readable", () => {
  for (const type of [
    "folder",
    "repo",
    "app",
    "terraform-stack",
    "computer",
    "phone",
    "camera",
    "robot",
    "simulation",
    "printer",
    "laser",
    "cnc",
  ] as const) {
    assert.equal(isDirectory(type), true, type);
    assert.equal(isContainer(type), false, type);
  }
  for (const type of ["shortcut", "markdown", "image", "3d", "task"] as const)
    assert.equal(isDirectory(type), false, type);
  assert.equal(isShortcut("shortcut"), true);
  assert.equal(isShortcut("json"), false);
  assert.equal(isTextualType("shortcut"), true);
  assert.equal(surfaceOf("csv"), "table");
  assert.equal(surfaceOf("camera"), undefined);
  assert.equal(isContainer("task"), true);
  assert.equal(isContainer("image"), false);
});

test("store refusal and access intersect without making readable files uncopyable", () => {
  const store: StoreCapabilities = {
    read: true,
    write: false,
    append: false,
    mkdir: false,
    move: false,
    remove: false,
    share: false,
    handles: false,
    offline: false,
    range: true,
  };
  const file = capabilitiesFor("image", store, "view");
  assert.equal(file.copy, true);
  assert.equal(file.write, false);
  assert.equal(file.move, false);
  assert.equal(file.enumerate, false);
  assert.equal(capabilitiesFor("camera", store, "view").enumerate, true);
  assert.equal(capabilitiesFor("task", store, "view").enumerate, true);
  assert.equal(capabilitiesFor("image", store, "none").read, false);
  assert.equal(capabilitiesFor("image", { ...store, write: true }, "view").write, false);
  assert.equal(capabilitiesFor("image", { ...store, write: true }, "edit").write, true);
  assert.equal(capabilitiesFor("repo", { ...store, write: true }, "edit").write, false);
});

test("Geo JSON types are assigned at creation and retained across renames", () => {
  assert.equal(resolveNodeKind({ name: "world.geox" }).id, "geo-project");
  assert.equal(resolveNodeKind({ name: "world.geo-project" }).id, "ext:geo-project");
  assert.equal(resolveNodeKind({ name: "map.layer" }).id, "ext:geo-layer");
  assert.equal(resolveNodeKind({ name: "renamed.txt", type: "ext:geo-layer" }).id, "ext:geo-layer");
  assert.equal(isTextualType("ext:geo-layer"), true);
});

test("transport metadata never changes a node type", () => {
  const upload = { name: "blob", contentType: "image/png", surface: "image" };
  assert.equal(resolveNodeKind(upload).id, "other");
  assert.equal(resolveNodeKind({ ...upload, type: "csv" }).id, "csv");
});

test("renaming a declared markdown file preserves its stored type", () => {
  const original = { name: "notes.md", type: "markdown" as const };
  assert.equal(resolveNodeKind(original).id, "markdown");
  assert.equal(resolveNodeKind({ ...original, name: "notes.txt" }).id, "markdown");
  assert.equal(resolveNodeKind({ name: "notes.txt" }).id, "text");
});

test("explicit extension types preserve identity with conservative regular-file behavior", () => {
  assert.equal(resolveNodeKind({ name: "notes.md", type: "ext:custom" }).id, "ext:custom");
  assert.equal(resolveNodeKind({ name: "blob.custom" }).id, "other");
  assert.equal(nodeKindById("ext:custom")?.mark, "FileText");
  assert.equal(isDirectory("ext:custom"), false);
  assert.equal(isContainer("ext:custom"), false);
  assert.equal(isTextualType("ext:custom"), false);
  assert.equal(isDirectory("ext:integration"), true);
  assert.equal(isContainer("ext:integration"), false);
  assert.equal(resolveNodeKind({ name: "account.integration" }).id, "other");
});

test("JSON Lines and Parquet have different textual capabilities", () => {
  assert.equal(resolveNodeKind({ name: "frames.jsonl" }).id, "ext:jsonl");
  assert.equal(isTextualType("ext:jsonl"), true);
  assert.equal(resolveNodeKind({ name: "frames.parquet" }).id, "dataset");
  assert.equal(isTextualType("dataset"), false);
});
