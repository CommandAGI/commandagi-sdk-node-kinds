/** Historical classifier for migration 0498 ONLY. Frozen from the pre-collapse
 * resolveNodeKind on 2026-09-08. Never import this from a runtime consumer.
 * A fresh environment must migrate old rows identically after the live classifier
 * drops MIME/surface inputs. Keep this with the taxonomy, not in a SQL classifier.
 */
type LegacyKind = { id: string; exts: readonly string[]; names?: readonly string[] };
type LegacyNode = {
  name: string;
  kind?: "dir" | "folder" | "file";
  contentType?: string;
  surface?: string;
  nodeKind?: string | null;
  markers?: readonly string[];
};
const NODE_KINDS: readonly LegacyKind[] = [
  { id: "shortcut", exts: ["shortcut"] },
  { id: "folder", exts: [] },
  { id: "repo", exts: [] },
  { id: "app", exts: [] },
  { id: "terraform-stack", exts: [] },
  { id: "computer", exts: [] },
  { id: "phone", exts: [] },
  { id: "camera", exts: [] },
  { id: "robot", exts: [] },
  { id: "simulation", exts: [] },
  { id: "printer", exts: [] },
  { id: "laser", exts: [] },
  { id: "cnc", exts: [] },
  { id: "markdown", exts: ["md", "markdown", "mdx"] },
  { id: "skill", exts: [], names: ["skill.md"] },
  { id: "issue", exts: ["issue"] },
  { id: "run", exts: [], names: ["run.json"] },
  { id: "agent", exts: [], names: ["agent.md"] },
  { id: "json", exts: ["json"] },
  { id: "text", exts: [] },
  { id: "yaml", exts: ["yaml", "yml"] },
  { id: "notebook", exts: ["ipynb"] },
  { id: "csv", exts: ["csv", "tsv"] },
  {
    id: "code",
    exts: [
      "js",
      "ts",
      "tsx",
      "jsx",
      "mjs",
      "cjs",
      "py",
      "rs",
      "go",
      "java",
      "c",
      "cpp",
      "cc",
      "h",
      "hpp",
      "css",
      "scss",
      "sh",
      "bash",
      "sql",
      "rb",
      "php",
      "toml",
      "ini",
      "xml",
      "kt",
      "swift",
      "lua",
      "r",
      "sln",
      "csproj",
      "vbproj",
      "vcxproj",
      "fsproj",
      "props",
      "targets",
      "gradle",
      "kts",
      "cmake",
      "bazel",
      "bzl",
      "mk",
      "gemspec",
      "podspec",
      "tf",
      "hcl",
      "proto",
      "graphql",
      "gql",
      "vue",
      "svelte",
      "astro",
      "dockerfile",
      "env",
      "editorconfig",
      "gitignore",
      "gitattributes",
      "npmrc",
      "nvmrc",
      "prettierrc",
      "eslintrc",
      "lock",
      "conf",
      "cfg",
      "properties",
    ],
  },
  { id: "nodegraph", exts: ["opgraph"] },
  { id: "human-examination", exts: ["humanx"] },
  { id: "molecule-experiment", exts: ["molx"] },
  { id: "physics-experiment", exts: ["physx"] },
  { id: "biology-experiment", exts: ["biox"] },
  { id: "brain-experiment", exts: ["brainx"] },
  { id: "chem-structure", exts: ["mol", "sdf", "pdb", "cif"] },
  { id: "geo-project", exts: ["geox"] },
  { id: "task", exts: ["task"] },
  { id: "project", exts: ["project"] },
  { id: "instance", exts: ["instance"] },
  { id: "contract", exts: ["contract"] },
  { id: "snapshot", exts: ["snapshot"] },
  { id: "dashboard", exts: ["dashboard"] },
  { id: "site", exts: ["site"] },
  { id: "eval", exts: ["eval"] },
  { id: "metric", exts: ["metric"] },
  { id: "viz", exts: ["vizx"] },
  { id: "graph-view", exts: ["graphx"] },
  { id: "3d", exts: ["3dx"] },
  { id: "sim-run", exts: ["simx"] },
  { id: "cad", exts: ["step", "stp", "iges", "igs", "wrl", "vrml"] },
  {
    id: "model",
    exts: [
      "blend",
      "stl",
      "glb",
      "gltf",
      "obj",
      "ply",
      "3mf",
      "fbx",
      "dae",
      "usd",
      "usda",
      "usdc",
      "usdz",
    ],
  },
  { id: "video-project", exts: ["vidx"] },
  { id: "music", exts: ["musx"] },
  { id: "eda", exts: ["edax"] },
  { id: "eda-source", exts: ["kicad_sch", "kicad_pcb", "kicad_pro"] },
  { id: "database", exts: ["sqlite", "sqlite3", "db", "duckdb"] },
  { id: "dataset", exts: ["parquet", "arrow", "feather", "ndjson", "jsonl"] },
  { id: "paint", exts: ["paintx"] },
  { id: "drawing", exts: ["drawx"] },
  { id: "nest", exts: ["nestx"] },
  { id: "slice", exts: ["slicex"] },
  { id: "cam", exts: ["camx"] },
  { id: "workbook", exts: ["sheetx"] },
  { id: "richtext", exts: ["pagex"] },
  { id: "deck", exts: ["deckx"] },
  { id: "photo", exts: ["imgx"] },
  { id: "image", exts: ["png", "jpg", "jpeg", "webp", "gif", "bmp", "svg"] },
  { id: "video", exts: ["mp4", "webm", "mov", "m4v", "mkv", "avi", "ogv"] },
  { id: "audio", exts: ["mp3", "wav", "m4a", "aac", "ogg", "flac", "opus", "mid", "midi"] },
  { id: "gcode", exts: ["gcode", "gco", "nc", "ngc", "tap", "cnc"] },
  { id: "spreadsheet", exts: ["xlsx", "xls", "ods"] },
  { id: "richdoc", exts: ["docx"] },
  { id: "html", exts: ["html", "htm"] },
  { id: "font", exts: ["ttf", "otf", "woff", "woff2", "eot"] },
  { id: "calendar", exts: ["ics"] },
  { id: "slides", exts: ["pptx", "ppt", "odp", "key"] },
  { id: "office", exts: ["doc", "odt", "rtf", "pages", "numbers"] },
  { id: "pdf", exts: ["pdf"] },
  { id: "archive", exts: [] },
  { id: "other", exts: [] },
];
export const MIGRATION_0498_FOLDER_MARKERS: readonly {
  kind: string;
  child?: string;
  childExt?: string;
}[] = [
  { kind: "repo", child: ".git" },
  { kind: "app", child: "app.json" },
  { kind: "terraform-stack", childExt: "tf" },
];
const FOLDER_MARKERS = MIGRATION_0498_FOLDER_MARKERS;
const BY_EXT = new Map<string, LegacyKind>();
for (const k of NODE_KINDS) for (const e of k.exts) BY_EXT.set(e, k);
const BY_NAME = new Map<string, LegacyKind>();
for (const k of NODE_KINDS) for (const n of k.names ?? []) BY_NAME.set(n, k);
const BY_ID = new Map<string, LegacyKind>(NODE_KINDS.map((k) => [k.id, k]));
const FOLDER = BY_ID.get("folder")!;
const OTHER = BY_ID.get("other")!;
const TEXT = BY_ID.get("text")!;
const IMAGE = BY_ID.get("image")!;
const AUDIO = BY_ID.get("audio")!;
const VIDEO_MEDIA = BY_ID.get("video")!;
const ARCHIVE = BY_ID.get("archive")!;
const CODE = BY_EXT.get("ts")!;

const CODE_NAMES = new Set([
  "makefile",
  "dockerfile",
  "cmakelists.txt",
  "gemfile",
  "rakefile",
  "procfile",
  "brewfile",
  "vagrantfile",
  "jenkinsfile",
  "build",
  "workspace",
  ".gitignore",
  ".gitattributes",
  ".env",
  ".editorconfig",
  ".npmrc",
  ".nvmrc",
  ".prettierrc",
  ".eslintrc",
  ".babelrc",
  ".dockerignore",
  "license",
  "readme",
  "codeowners",
]);
const CODE_NAME_PREFIXES = ["dockerfile.", ".env."];

/** The minimum shape we classify against — a Drive listing row satisfies it. */

function resolveFolderKind(markers?: readonly string[]): LegacyKind {
  if (!markers?.length) return FOLDER;
  const names = new Set<string>();
  const exts = new Set<string>();
  for (const raw of markers) {
    const n = raw.toLowerCase().replace(/^.*\//, "");
    if (!n) continue;
    names.add(n);
    const dot = n.lastIndexOf(".");
    if (dot > 0) exts.add(n.slice(dot + 1));
  }
  for (const m of FOLDER_MARKERS) {
    if (m.child && names.has(m.child)) return BY_ID.get(m.kind) ?? FOLDER;
    if (m.childExt && exts.has(m.childExt)) return BY_ID.get(m.kind) ?? FOLDER;
  }
  return FOLDER;
}

export function resolveMigration0498NodeKind(file: LegacyNode): LegacyKind {
  // 1. THE DECLARATION — checked before the directory branch, so it governs both. An id no registry
  // knows falls through rather than resolving to a broken row: a declaration naming nothing must not
  // shadow a pattern that names something.
  const declared = file.nodeKind ? BY_ID.get(file.nodeKind) : undefined;
  if (declared) return declared;

  if (file.kind === "dir" || file.kind === "folder") return resolveFolderKind(file.markers);

  const name = file.name.toLowerCase();
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".") + 1) : "";
  const ct = file.contentType ?? "";
  const basename = name.includes("/") ? name.slice(name.lastIndexOf("/") + 1) : name;

  // Named kinds win over the extension table: `SKILL.md` is a skill, not generic markdown, and that has
  // to hold no matter which of the two rules also matches the file.
  const byName = BY_NAME.get(basename);
  if (byName) return byName;

  if (ct === "application/pdf" || ext === "pdf") return BY_EXT.get("pdf") ?? OTHER;
  const byExt = BY_EXT.get(ext);
  if (byExt) return byExt;

  if (CODE_NAMES.has(basename)) return CODE;
  if (CODE_NAME_PREFIXES.some((p) => basename.startsWith(p))) return CODE;

  // Fallbacks by backend surface / content-type (files without a known extension).
  if (file.surface === "video" || ct.startsWith("video/")) return VIDEO_MEDIA;
  if (file.surface === "image" || ct.startsWith("image/")) return IMAGE;
  if (file.surface === "audio" || ct.startsWith("audio/")) return AUDIO;
  if (file.surface === "archive" || /(zip|tar|gzip|x-7z|x-rar)/.test(ct)) return ARCHIVE;
  if (file.surface === "3d") return BY_EXT.get("stl") ?? OTHER; // backend-tagged mesh
  if (file.surface === "code") return CODE;
  if (file.surface === "document" || ct.startsWith("text/") || ext === "txt" || ext === "log")
    return TEXT;
  return OTHER;
}
