/**
 * THE FILE TAXONOMY — "what kind of file is this?", answered once, for the whole platform.
 *
 * ## What changed, and why it is here rather than in `@commandagi/document`
 *
 * This table used to live in `sdk/document/fileKinds.ts` and carried a fifth field, `edit`,
 * naming which of four UI shells opened the kind. Both facts were wrong, and they were wrong together
 * (notes/decisions/2026-08-16-one-relation-app-opens-kind-replaces-documents-and-edit-mode.md):
 *
 *  - **Placement.** `core` sits BELOW `@commandagi/document`, so while the taxonomy lived above, `AppDef`
 *    (`packages/domain/core/src/apps.ts`) could not name a `NodeType`. That is the entire reason `AppDef.documents` existed with a
 *    `by:"editor"` branch that deferred to a registry passed in as a function parameter: the model
 *    wanted to say `app → kind` and the layering forbade it, so it said `app → "go ask someone else"`.
 *    A file kind is a domain fact — `core` already held `STUDIO_EXTENSIONS` — so it belongs at the
 *    bottom where every consumer (web, the api worker, agent tools, the eval Lambdas) can reach it.
 *
 *  - **`edit` was a surface field on a taxonomy row, and it was TOTAL.** Its floor was `download`, which
 *    therefore did double duty as a real capability *and* as the null: a `.pdf` (genuinely nothing to
 *    show) and a `.dashboard` (an app route exists, nobody wired it) stored the same value, so "we
 *    decided" and "we never got to it" were indistinguishable and no check could separate them. Nine
 *    rows carried a comment apologising for the value they stored — *"`download` is the honest fallback
 *    for a host that cannot launch a route-backed app document"* — which is nine rows explaining in
 *    prose that the field could not say what they are. No host reads prose.
 *
 * ## What a row says now
 *
 * A row declares what the file IS and what the PLATFORM ITSELF can read. It never names an app.
 *
 *  - {@link NodeKindDef.textual} — the bytes are human-readable text. For indexers, diffs, grep. This is
 *    a property of the bytes and nothing else; it was already split out of `edit.mode` once, after
 *    keying on the surface silently skipped every CSV in the search index.
 *  - {@link NodeKindDef.surface} — the BUILT-IN reader for these bytes, when the platform has one.
 *    **Optional, and absent is the answer**: a kind with no surface and no app claiming it has nothing
 *    that opens it, which is now a representable state rather than a value spelled `download`.
 *
 * WHICH APP opens a kind is the separate relation `AppDef.opens` (`appsForKind`, `packages/domain/core/src/apps.ts`), and the
 * two are combined by `resolveDocumentSurface` (same module) — the one resolver every host calls.
 */

export type NodeType =
  | `ext:${string}`
  // The node that is not a file. FIRST-CLASS, and that is load-bearing: while "folder" lived outside
  // the taxonomy, an app that opened folders needed a rule of its own (`documents: {by:"dir"}`) and the
  // URL layer needed a guard so a FOLDER named `notes.docs` was not mounted into the Docs editor. A
  // folder is a kind; the guard and the rule are both gone.
  | "shortcut"
  | "folder"
  // ── REFINED folder kinds. A directory that carries a MARKER child is that more specific kind, and
  // still matches `folder` too (`claimTokens`, `packages/domain/core/src/apps.ts`) — specific first, generic second, exactly
  // as `other` + `ext:` already works for files.
  //
  // Without these, an app that opens directories claims EVERY directory natively: Cloud Architect sat
  // in the "Open with" menu of a photo album, and Code could not be told apart from it for a Terraform
  // stack. The marker is what lets an app say which KIND of folder it means.
  | "repo"
  | "app"
  | "terraform-stack"
  // ── A MACHINE'S OWN DIRECTORY. A embodiment is already a file — its channels live at
  // `.commandagi/<dir>/<id>/<channel>.jsonl` — but the directory holding them had no kind, so the one
  // taxonomy that answers "what is this and what opens it" could not describe the platform's most
  // important object. It listed as a generic folder, drew the generic glyph, and no app could declare
  // it opens a computer. These rows are what "let a computer be its own file type" means.
  //
  // They are refined FOLDER kinds like `repo` above, which means they still match `folder` in the
  // opens relation — an app that opens directories keeps working on them, and specificity is added
  // rather than access taken away. `EmbodimentKindDef.fileKind` is the single declaration of which kind a
  // embodiment carries; nothing else maps embodiment kinds to these ids.
  | "computer"
  | "phone"
  | "camera"
  | "robot"
  | "simulation"
  | "printer"
  | "laser"
  | "cnc"
  // ── text ──
  | "markdown"
  | "skill"
  | "agent"
  | "code"
  | "json"
  | "csv"
  | "yaml"
  | "notebook"
  | "text"
  // ── the project namespace's own documents (`.commandagi/`, one per entity) ──
  | "issue"
  | "run"
  // A MEMORY DOCUMENT (docs/kg/MEMORY-GRAPH.md "Memory documents") — the subset of the agent memory
  // graph that named itself with a `section` (profile/topic/area/person/other) and a one-line
  // `summary` of when to read it. Mirrored, one file per node, at
  // `.commandagi/memories/<section>/<slug>.memory` — an extension rather than a name rule, same
  // reasoning as `issue`: the document's name is its label, not a fixed filename to inherit.
  | "memory"
  // ── platform documents (each owned by an app route) ──
  | "nodegraph"
  | "human-examination"
  | "molecule-experiment"
  | "physics-experiment"
  | "biology-experiment"
  | "brain-experiment"
  | "chem-structure"
  | "geo-project"
  | "task"
  | "project"
  | "instance"
  | "contract"
  | "snapshot"
  | "dashboard"
  // A COMPUTER RECORDING — one machine's own streams over a window, live while it is being written.
  | "computer-recording"
  // THE INPUT TRACK of one computer recording — every acknowledged control op, its own file because
  // it is its own consent. See the def below.
  | "recording-input"
  | "eval"
  | "metric"
  | "site"
  | "viz"
  | "graph-view"
  // ── editor documents + the foreign formats editors ingest ──
  | "3d"
  | "sim-run"
  | "cad"
  | "video-project"
  | "music"
  | "eda"
  | "eda-source"
  | "database"
  | "dataset"
  | "paint"
  | "drawing"
  // A SHEET-NESTING LAYOUT — the laser's design document. Its own kind rather than a reuse of `gcode`
  // or `3d`, because it is neither: `gcode` is what a nest COMPILES TO (a document you cannot edit
  // back into its inputs is a dead end), and `3d` is a solid where this is a flat parts pile plus the
  // stock, the beam width and the quantities. See packages/applets/lasers/src/doc.ts.
  | "nest"
  // A SLICING SETUP — the 3D printer's design document. Its own kind for the same reason `nest` is:
  // `gcode` is what a setup COMPILES TO and already has a reader, and `3d` is the solid this points AT
  // rather than the question asked about it. See packages/applets/printers/src/doc.ts.
  | "slice"
  // A MACHINING SETUP — the CNC mill's design document. Its own kind for the same reason `nest` and
  // `slice` are: `gcode` is what a setup COMPILES TO and already has a reader, and `3d` is the solid this
  // points AT rather than the question asked about it. What is different here is that the question is an
  // ORDERED LIST of cuts rather than one set of parameters. See packages/applets/cnc/src/doc.ts.
  | "cam"
  | "workbook"
  | "richtext"
  | "deck"
  | "photo"
  | "model"
  // ── bytes with a built-in reader ──
  | "video"
  | "audio"
  | "gcode"
  | "spreadsheet"
  | "richdoc"
  | "html"
  | "font"
  | "calendar"
  | "image"
  // ── bytes with no reader at all ──
  | "slides"
  | "office"
  | "archive"
  | "pdf"
  | "other";

/**
 * A reader the PLATFORM ships, for bytes no app claims — never an app, and never a fallback that always
 * has an answer.
 *
 *  - `text`     — the inline text editor with a format-aware toolbar.
 *  - `table`    — the delimited-data grid.
 *  - `notebook` — the notebook cell reader.
 *  - `preview`  — a dedicated in-browser viewer (image, audio, video, font, calendar, web page, …).
 *  - `launch`   — **not a reader at all.** Opening these bytes RUNS something: the host prompts to
 *                 start a machine from them and, on confirm, navigates to the machine — it never puts
 *                 the file on screen.
 *
 * `table` and `notebook` are here because they already existed as `if (k.id === "csv")` /
 * `if (k.id === "notebook")` special cases sitting immediately in front of the old `edit.mode` switch —
 * two kinds whose real reader the field could not name, patched by id. A field the callers route around
 * is a field that is missing a value.
 */
export type BuiltinSurface = "text" | "table" | "notebook" | "preview" | "launch";

/**
 * `launch` is the odd one, and naming it is the point.
 *
 * The other four answer "which reader draws these bytes". A `.snapshot` has no answer to that: it is a
 * saved MACHINE STATE, and the only thing anyone does with one is start a machine from it. It spent a
 * long time modelled as an app (`/app/snapshots`) because "a thing you can open needs somewhere to
 * open" was read as "needs a page" — so a library of one file kind grew a registry row, a home, a
 * detail route and a tile on everyone's front page.
 *
 * The honest reading is that OPENING IT IS A VERB. That dissolves the modelling problem the app was
 * hiding: which embodiment app owns a capture (computers? robots?) is not a question anyone has to answer,
 * because the record carries its own class and the launcher reads it. A snapshot's "opener" is the same
 * confirm prompt you get choosing a snapshot while starting a machine the ordinary way — one flow, one
 * implementation, reached from either direction.
 */

export interface NodeKindDef {
  id: NodeType;
  /** Structural properties, declared once beside the type. */
  directory?: boolean;
  container?: boolean;
  /** Friendly product name (tiles, download cards, "Open in <label>", tool labels). */
  label: string;
  /** Lowercased extensions (no dot). Matched after {@link names}, before content-type fallbacks. */
  exts: readonly string[];
  /**
   * Exact lowercased BASENAMES this kind claims, matched AHEAD of the extension table.
   *
   * Some kinds are named, not extended: a skill is `SKILL.md` — markdown bytes whose ROLE is declared by
   * the filename, which is the portable convention (agentskills.io) we deliberately did not replace with
   * an invented `.skill` extension. Spelling the type twice is how the two spellings drift.
   */
  names?: readonly string[];
  /**
   * These bytes are human-readable TEXT.
   *
   * Ask this when you want the CONTENT and not the surface — a content indexer, a diff, a grep. A `.csv`
   * opens in the table grid and a `.ics` in the calendar viewer, yet both are plain text; keying on the
   * surface is what silently skipped every CSV in the search index.
   *
   * Not set on kinds whose extensions are MIXED — `dataset` covers `.parquet`
   * (binary), so the question has no honest answer at kind granularity and the caller must sniff.
   */
  textual?: boolean;
  /**
   * The built-in reader for these bytes — see {@link BuiltinSurface}. **Absent means there is none**,
   * and that is a real answer, not a gap: `.pdf` has no in-browser reader here and says so, while a
   * `.dashboard` has no reader either but IS claimed by an app, and the two are now distinguishable.
   */
  surface?: BuiltinSurface;
  /**
   * **THE MARK** — the house glyph this kind is identified by, as an `Icons.*` NAME.
   *
   * REQUIRED, and that is the whole point of it living here. It was a `Record<NodeType, string>` in
   * `apps/platform/cloudflare/web-app-worker` (`lib/fileKindGlyphs.ts`), which is total and so did fail `tsc` when a kind was added
   * without one — but in a DIFFERENT PACKAGE. Adding a kind is a `packages/domain/core` change, `pnpm --filter
   * @commandagi/core typecheck` stays green, and the break only appears when someone runs the web
   * typecheck; that happened three times in one session (the three studio kinds, then `eval`/`metric`),
   * each time leaving `main` red for another agent to complete. A fact about ONE kind belongs on that
   * kind's declaration — the same law `docs/platform/APPLET_SPEC.md` states for apps — so the second
   * table is deleted and the web map is DERIVED from this field.
   *
   * Sharing a mark is not a defect: a FAMILY sharing one is the design language working (`code`/`json`/
   * `yaml`/`notebook` are all `Code`; every tabular kind is `Grid`). What is a defect is a kind that will
   * NEVER be drawn a picture sitting on the generic `FileText` page — `fileKindGlyphs.test.ts` derives
   * that set from the preview registry and fails on it, because core cannot see either the icon set or
   * the renderers and must not pretend to.
   *
   * Named `mark`, not `icon`, deliberately: `AppDef.icon` in this same package is a SEMANTIC KEY resolved
   * through `appIconFor`, a different lookup. Two lookups, two words.
   */
  mark: string;
}

/**
 * The registry. Order matters only for an extension that could appear twice — none does.
 *
 * A kind appears here whether or not anything opens it. That is the point: `scripts/check-openers.mjs`
 * fails when a kind the PLATFORM ITSELF mints (`.dashboard`, `.site`, `.snapshot`, …) has neither a
 * `native` edge nor a `surface`, which is exactly the state three of them shipped in for months while
 * `edit: {mode:"download"}` made them look identical to PDF.
 */
/**
 * The rows, with their ids kept LITERAL — the private half of {@link NODE_KINDS}.
 *
 * Split in two so the totality check below can exist. A `: readonly NodeKindDef[]` annotation widens
 * every row, so `(typeof NODE_KINDS)[number]["id"]` came back as `NodeType` itself and `Exclude`ing
 * the union from that is always `never`: a check that cannot fail, blind to the three ids that had no
 * row. `as const satisfies` checks each row against `NodeKindDef` exactly as the annotation did while
 * keeping the ids literal. The widened alias is what everything else reads, so an optional field a
 * given row omits (`names`, `surface`) is still reachable on the element type.
 */
const NODE_KIND_ROWS = [
  {
    id: "shortcut",
    mark: "Link",
    label: "Shortcut",
    exts: ["shortcut"],
    textual: true,
    surface: "text",
  },
  // The directory. No extensions and no names: {@link resolveNodeKind} returns this from the node's own
  // kind, before any name matching runs — which is what stops `notes.docs/` resolving as a document.
  { id: "folder", directory: true, mark: "Folder", label: "Folder", exts: [] },
  // The refined directories. No extensions and no names: {@link resolveFolderKind} returns these from
  // the MARKER children the caller passes, before the generic folder answer.
  { id: "repo", directory: true, mark: "Fork", label: "Repository", exts: [] },
  // An APPLICATION — a directory carrying an `app.json` (docs/platform/SERVERLESS_OS.md §2d). The
  // `launch` surface is the whole claim: opening an app is not reading its bytes, it is RUNNING it,
  // exactly as for a `.snapshot`. That is why this is a kind rather than a privileged namespace —
  // `/apps/<id>` is a shortcut to a real dir, and the dir says what it is the same way a repo does.
  { id: "app", directory: true, mark: "Grid", label: "App", exts: [], surface: "launch" },
  { id: "terraform-stack", directory: true, mark: "Building", label: "Terraform stack", exts: [] },
  // Machine directories. No `surface`: the platform ships no READER for "a computer's folder" — you
  // open a machine at its own route, which is what `AppDef.opens` on the embodiment apps expresses. Giving
  // them a `text` surface would claim a textarea can render a computer.
  //
  // `label` here is THE WORD FOR THE THING in a sentence — the same word `embodimentNoun` returns, and
  // now the only place it is written down.
  { id: "computer", directory: true, mark: "Monitor", label: "Computer", exts: [] },
  { id: "phone", directory: true, mark: "Phone", label: "Phone", exts: [] },
  { id: "camera", directory: true, mark: "Camera", label: "Camera", exts: [] },
  { id: "robot", directory: true, mark: "Robot", label: "Robot", exts: [] },
  { id: "simulation", directory: true, mark: "Globe", label: "Simulation", exts: [] },
  // Its own kind even though it browses under the Robots rail — the row that proves a machine's NOUN
  // and the rail it appears on are different facts (see EMBODIMENT_KINDS `printer`). It shares the Robot
  // mark because the icon set ships no printer glyph, and a FAMILY sharing a mark is the design
  // language working; inventing one here would be a second place icons are decided.
  { id: "printer", directory: true, mark: "Robot", label: "Printer", exts: [] },
  // The other two fabricators. Same reasoning as `printer` above: a machine IS a directory, these name
  // it, and they share the Robot mark because the icon set ships no laser or mill glyph — a FAMILY
  // sharing a mark is the design, not a shortfall.
  { id: "laser", directory: true, mark: "Robot", label: "Laser cutter", exts: [] },
  { id: "cnc", directory: true, mark: "Robot", label: "CNC", exts: [] },

  // ── text ──
  {
    id: "markdown",
    mark: "FileText",
    label: "Markdown",
    exts: ["md", "markdown", "mdx"],
    textual: true,
    surface: "text",
  },
  // A SKILL — reusable instructions an agent composes into its prompt. On disk it is markdown with YAML
  // frontmatter; what makes it a skill is the NAME, per the agentskills.io convention, so a skill authored
  // anywhere in that ecosystem is a skill here. Its FOLDER is the package (scripts/, assets/); this row is
  // the file that declares the folder's role.
  {
    id: "skill",
    mark: "Bookmark",
    label: "Skill",
    exts: [],
    names: ["skill.md"],
    textual: true,
    surface: "text",
  },
  // An ISSUE (or pull request — they share one number space, GitHub-style). Markdown bytes with YAML
  // frontmatter, at `.commandagi/issues/<number>.issue`. It gets an EXTENSION rather than a name rule
  // because its name is its number: there is no `ISSUE.md` convention to inherit the way `SKILL.md`
  // inherits agentskills.io, so inventing one here would be inventing a convention rather than
  // adopting one. `surface: "text"` is the floor — the bytes are always readable even where no app
  // that renders an issue is mounted.
  { id: "issue", mark: "Message", label: "Issue", exts: ["issue"], textual: true, surface: "text" },
  {
    id: "memory",
    mark: "Sparkles",
    label: "Memory",
    exts: ["memory"],
    textual: true,
    surface: "text",
  },
  // A RUN of a workflow. The DIRECTORY (`.commandagi/runs/<id>/`) is the run — this row is the file
  // inside it that declares the directory's role, exactly as SKILL.md declares a skill package. Its
  // siblings are `logs/<step>.log`, which are ordinary text.
  {
    id: "run",
    mark: "Play",
    label: "Run",
    exts: [],
    names: ["run.json"],
    textual: true,
    surface: "text",
  },
  // An AGENT's persona/steering, name-matched exactly like SKILL.md (docs/economy/UNIVERSAL_PUBLISH.md
  // Phase 10.2) — a real leaf in the synthetic `.commandagi/agents/<id>/` tree
  // (`readAgentFsFile`/`writeAgentFsFile`, apps/platform/cloudflare/api-worker/src/data/cagi-fs.ts), serialized as markdown with
  // frontmatter, same shape as a skill. Unlike a skill, this is a SYNTHETIC node with no `drive_files`
  // row of its own — the kind still resolves correctly because `resolveNodeKind()` only ever looks at
  // `name`/`contentType`, never at whether a real row backs it.
  {
    id: "agent",
    mark: "Sparkles",
    label: "Agent",
    exts: [],
    names: ["agent.md"],
    textual: true,
    surface: "text",
  },
  { id: "json", mark: "Code", label: "JSON", exts: ["json"], textual: true, surface: "text" },
  // Exact code filenames outrank these generic text extensions.
  {
    id: "text",
    mark: "FileText",
    label: "Text",
    exts: ["txt", "log"],
    textual: true,
    surface: "text",
  },
  {
    id: "yaml",
    mark: "Code",
    label: "YAML",
    exts: ["yaml", "yml"],
    textual: true,
    surface: "text",
  },
  // A Jupyter notebook is JSON on disk, and its reader is the cell view — which used to be an
  // `if (k.id === "notebook")` immediately in front of the surface switch, because `edit.mode` could
  // only say "text". It says `notebook` now.
  {
    id: "notebook",
    mark: "Code",
    label: "Notebook",
    exts: ["ipynb"],
    textual: true,
    surface: "notebook",
  },
  // Delimited text is tabular data. Same story as `notebook`: the grid was an id-keyed special case.
  { id: "csv", mark: "Grid", label: "CSV", exts: ["csv", "tsv"], textual: true, surface: "table" },
  {
    id: "code",
    mark: "Code",
    label: "Code",
    exts: [
      // languages
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
      // project / solution / build / config formats
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
    textual: true,
    surface: "text",
  },

  // ── platform documents ──
  // Every kind below is opened by an APP ROUTE, and each one used to store `edit: {mode:"download"}`
  // under a comment saying that value was "the honest fallback for a host that cannot launch a
  // route-backed app document". They carry no `surface` now — which is the truth (the platform has no
  // built-in reader for them) — and the app that opens each one declares the edge on its own row.
  {
    id: "nodegraph",
    container: true,
    mark: "Layers",
    label: "Node graph",
    exts: ["opgraph"],
    textual: true,
  },
  // The three EXPERIMENT STUDIOS (`./studio.ts`): one document shape, one extension per studio.
  // `fileKinds.test.ts` asserts every `STUDIO_EXTENSIONS` value is claimed here, so a fourth studio
  // cannot ship half-registered the way two of the first three did.
  {
    id: "human-examination",
    container: true,
    mark: "Body",
    label: "Human examination",
    exts: ["humanx"],
  },
  { id: "molecule-experiment", mark: "Graph", label: "Molecule experiment", exts: ["molx"] },
  // The three studios separated out on 2026-08-18. No `surface`, like their three predecessors: a
  // studio document is trials plus parameters, and the platform ships no generic reader for one — the
  // owning app's `native` edge is the honest answer, and `make check-openers` fails if that edge is
  // ever missing rather than letting the kind quietly become unopenable.
  { id: "physics-experiment", mark: "Scale", label: "Physics experiment", exts: ["physx"] },
  { id: "biology-experiment", mark: "Heart", label: "Biology experiment", exts: ["biox"] },
  { id: "brain-experiment", mark: "Sparkles", label: "Brain experiment", exts: ["brainx"] },
  // Foreign molecular structure files. A kind at last: Chemistry claimed these four extensions on its
  // own row while the taxonomy knew nothing about them, so every consumer that asked what a `.pdb` IS
  // got `other` — a generic "PDB file" with a page glyph and no textual answer for the search index.
  // Given no `surface` deliberately: they carry coordinates, and a coordinate dump in a textarea is not
  // a reader, so Chemistry's import edge is the honest answer for them.
  {
    id: "chem-structure",
    mark: "Graph",
    label: "Molecular structure",
    exts: ["mol", "sdf", "pdb", "cif"],
    textual: true,
  },
  { id: "geo-project", mark: "Globe", label: "Geo project", exts: ["geox"] },
  // The two organizer documents (docs/product/TASKS.md). Both are universal packages, and both are
  // DESCENDABLE containers (`sdk/document/containers.ts`): a `.task` enumerates its nested subtask
  // packages as filesystem children.
  { id: "task", container: true, mark: "Check", label: "Task", exts: ["task"] },
  { id: "project", container: true, mark: "Compass", label: "Project", exts: ["project"] },
  // A manufactured UNIT's provenance — signed chain of title, certificates, seals. Read-only on
  // purpose: its contents are evidence, and the only legitimate way to change it is to APPEND a signed
  // event. NOTHING CLAIMS THIS YET, and with no `surface` either that is now visible to
  // `check-app-layout.mjs` rather than hidden behind a `download` that looked deliberate.
  { id: "instance", container: true, mark: "Tag", label: "Product instance", exts: ["instance"] },
  // A signed agreement. Read-only for the same reason an instance is. Also unclaimed — see above.
  { id: "contract", container: true, mark: "Scale", label: "Contract", exts: ["contract"] },
  // The three INDEX-ONLY rows (docs/economy/UNIVERSAL_PUBLISH.md Phase 10): the real record lives in
  // `snapshots`/`dashboards`/`sites`, and the paired `drive_files` row carries THE SAME ID, which is
  // what lets the owning app's `[id]` route open the node directly.
  // A capture opens as a LAUNCH PROMPT, never as a document — see {@link BuiltinSurface}. This is what
  // lets the Snapshots app go away without `check-openers` failing: the kind resolves to a surface,
  // and the surface is an action.
  { id: "snapshot", mark: "Layers", label: "Snapshot", exts: ["snapshot"], surface: "launch" },
  { id: "dashboard", mark: "Split4", label: "Dashboard", exts: ["dashboard"] },
  // A COMPUTER RECORDING — one machine's composite stream over a window: every frame out of its
  // screen, its cameras and its robot joints, AND every input into it (a human's pointing track, an
  // acknowledged keystroke, an agent's click), materialized as a manifest that references those
  // samples rather than copying them (docs/platform/RECORDING.md). It is the computer-use counterpart
  // of `sim-run`: the same shape, one step down the same argument — a RUN is an overlay over the thing
  // it ran on, so it costs O(state x frames) and never O(world).
  //
  // A RECORDING, WHICH MAY BE LIVE WHILE IT IS BEING WRITTEN. Being live is a CAPABILITY of the
  // object, not a second co-equal state needing a neutral word for both: the row is open — and
  // playable through the same manifest door, which recomputes from the event log precisely so an
  // in-progress capture answers — from the moment it starts until it closes. The platform already
  // refuses to distinguish the two anywhere it matters (`replay_recording` re-emits a FINISHED
  // capture as a LIVE source on a thread's channels, so a consumer downstream of it holds something
  // it cannot classify), and the conclusion to draw from that is the opposite of the one drawn on
  // 2026-09-11 by `0517`: live and finished are the same artifact, so the artifact's own noun does
  // the work and no second word is needed. Jacob, overruling that rename: _"i think computer
  // recordings are what i wanted. when i think of computer sessions, what i realy want is a computer
  // recording with optional live capability."_ Every layer under this row had gone on saying
  // recording throughout — the `recordings` table, `/threads/:id/recordings/…`, `start_recording` /
  // `stop_recording` / `list_recordings` / `replay_recording`, `*.cagi-recording.json`,
  // `docs/platform/RECORDING.md` — so this name was the only one out of step.
  //
  // The row has no `exts`. Every manifest is named `*.cagi-recording.json` and its LAST extension is
  // `json`, which `resolveNodeKind` would read as generic JSON; a `names` entry cannot help either,
  // because the filename carries a slug and an id. The resolution is the DECLARED `type` on the
  // `drive_files` row, written by the close that mints the file — declaration first, inference second,
  // which is what the head of this file says the taxonomy is for.
  //
  // `preview` rather than an APP, for exactly the reason `snapshot` is `launch` and the Snapshots app
  // went away: which machine app owns a recording — computers? phones? robots? cameras? — is not a
  // question anyone has to answer, because the manifest carries its own thread and the player reads
  // it. A recording of a robot arm and a recording of a shell are one kind with one reader
  // (`apps/platform/cloudflare/web-app-worker/src/components/viewers/computerRecordingViewer.tsx`).
  {
    id: "computer-recording",
    mark: "Play",
    label: "Computer recording",
    exts: [],
    surface: "preview",
  },
  // THE INPUT TRACK — every acknowledged control op of one computer recording: the keystrokes, the
  // clicks, the joint commands, each stamped with its actor.
  //
  // A SEPARATE KIND BECAUSE IT IS A SEPARATE RESOURCE, and that is a consent decision, not a filing
  // one. Until 2026-09-11 these ops were written INLINE into the recording manifest, whose bytes are
  // served by `GET /drive/:id/content` — a route with no middleware that admits on
  // `Drive.isPubliclyReadable` alone. So "share this recording" published every keystroke in full, to
  // anyone with the link, through the platform's one byte-read endpoint. That endpoint cannot grow a
  // per-kind branch (it is the ONE byte read; a filter there is a filter the next door does not have),
  // so the fix is the one `docs/economy/ECONOMY.md` §2 already states for authority: **the narrower
  // surface is its own resource.** You do not grant on the recording and subtract its inputs; you
  // grant on the recording, and the input track is a sibling with its own visibility.
  //
  // `recording-input` and not `computer-recording-input`: the owner is unambiguous from the first
  // word inside this taxonomy, and the qualifier on the parent exists to say WHICH kind of recording
  // a machine's is, not to be carried into every part of it. The API layer had already settled on
  // this spelling before the kind did (`readInputTrack`, `recording-input-track-acl.test.ts`).
  //
  // `surface: "text"` is the honest reader: it is a JSON log and the platform ships no timeline reader
  // for one on its own (inside a recording, `RecordingScrubber` renders it — but that is the
  // recording's reader, reached through the recording's manifest). `exts: []` + a DECLARED `type` for
  // the same reason `computer-recording` has none: the filename's last extension is `json`.
  {
    id: "recording-input",
    mark: "Terminal",
    label: "Recording input track",
    exts: [],
    textual: true,
    surface: "text",
  },
  { id: "site", mark: "Rocket", label: "Site", exts: ["site"] },
  // An EVAL and a METRIC are DECLARATIONS — what to measure and how to judge it — so they are documents,
  // not rows (migration 0399). `.eval` carries its cases inline, which is what makes "a case was added to
  // this benchmark" a diff a reviewer can see.
  { id: "eval", mark: "Check", label: "Eval", exts: ["eval"], textual: true },
  // A `.metric` opens in the TEXT reader, not natively: the Evals app has a surface for an eval (its
  // cases, its leaderboard) and none for a metric declaration, and claiming `native` would have pointed
  // `/app/evals/<metric>` at a page that renders eval fields on metric bytes. JSON in the text reader is
  // the honest answer until a metric editor exists — and `check-openers` accepts it because a reader IS a
  // resolution, where a `download` would have been the "we never got to it" this taxonomy exists to name.
  {
    id: "metric",
    mark: "Chart",
    label: "Metric",
    exts: ["metric"],
    textual: true,
    surface: "text",
  },
  // Saved views produced by an ACT rather than by a create verb — a Foresight lens and a graph slice.
  // Both were `by:"ext"` claims on their apps and had no row here at all, so they resolved to `other`.
  { id: "viz", mark: "Chart", label: "Visualization", exts: ["vizx"], textual: true },
  { id: "graph-view", mark: "Graph", label: "Graph view", exts: ["graphx"], textual: true },

  // ── editor documents + the foreign formats editors ingest ──
  // `.3dx` is the native, editable feature graph. STEP/IGES and WRL/VRML are foreign 3D interchange
  // files: opening one IMPORTS it into a new 3D document and Save As writes `.3dx`. That distinction is
  // the `capability` on the app's edge now, not a property of the kind.
  { id: "3d", container: true, mark: "Box", label: "3D", exts: ["3dx"] },
  // A simulation RUN: the state a world reached, as an overlay that REFERENCES its `.3dx` design by
  // digest rather than copying it (packages/domain/sim-core/simx.ts).
  { id: "sim-run", mark: "Box", label: "Simulation run", exts: ["simx"] },
  {
    id: "cad",
    mark: "Box",
    label: "3D interchange model",
    exts: ["step", "stp", "iges", "igs", "wrl", "vrml"],
  },
  {
    id: "model",
    mark: "Box",
    label: "3D model",
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
  // The Studio PROJECT, named apart from the raw `video` media it edits. Those two shared the id
  // `video` for as long as this table had an `edit` field to tell them apart — a `.mp4` was
  // `{mode:"render"}` and a `.vidx` was `{mode:"creative"}` under one id. With the surface computed
  // from `AppDef.opens`, an id collision is a WRONG ANSWER: Studio's native edge on `video` captured
  // every mp4 in the Drive and offered to open it in the NLE. Two things, two ids.
  { id: "video-project", container: true, mark: "Film", label: "Studio", exts: ["vidx"] },
  { id: "music", container: true, mark: "Mic", label: "Music Studio", exts: ["musx"] },
  { id: "eda", container: true, mark: "Layers", label: "Circuit / PCB", exts: ["edax"] },
  // Loose KiCad project members are imports, not native packages. EDA collects same-stem companions and
  // Save As writes a new collision-safe `.edax`, never ZIP bytes over the KiCad source text. Textual,
  // but deliberately given NO `surface`: dropping a KiCad board into a plain textarea is not a reader,
  // and EDA's import edge is the real answer.
  {
    id: "eda-source",
    mark: "Layers",
    label: "KiCad project",
    exts: ["kicad_sch", "kicad_pcb", "kicad_pro"],
    textual: true,
  },
  // Data workbench — browse tables + run SQL over embedded databases and columnar/big-data files. Kept
  // aligned with what DuckDB-WASM can actually query in app-data: Avro/ORC stay ordinary binaries until
  // the browser runtime has a real reader, because routing them into Data would promise an editor and
  // then fail on every open.
  { id: "database", mark: "Grid", label: "Database", exts: ["sqlite", "sqlite3", "db", "duckdb"] },
  {
    id: "dataset",
    mark: "Grid",
    label: "Dataset",
    exts: ["parquet", "arrow", "feather", "ndjson", "jsonl"],
  },
  // A painting is its own op-graph now (packages/applets/paint — a dedicated, artist-focused editor, not
  // a mode of Draw). Draw still opens one as an IMPORT (packages/applets/draw/src/app.ts), the same
  // relationship it has with `image` relative to Photo.
  { id: "paint", container: true, mark: "Brush", label: "Painting", exts: ["paintx"] },
  { id: "drawing", container: true, mark: "Pencil", label: "Drawing", exts: ["drawx"] },
  // NO `surface`, and that is the answer rather than a gap: the platform ships no built-in reader for a
  // nesting layout, and the Lasers editor is the one that opens it (`packages/applets/lasers/src/app.ts`
  // declares the `native` edge). `textual` because a `.nestx` is JSON — a few hundred coordinate pairs
  // and five machine parameters, which is a document an indexer can read and a person can diff.
  { id: "nest", mark: "Crosshair", label: "Nest", exts: ["nestx"], textual: true },
  // NO `surface`, like `nest` above and for the same reason: the platform ships no built-in reader for a
  // slicing setup, and the Printers editor is the one that opens it (`packages/applets/printers/src/app.ts`
  // declares the `native` edge). `textual` because a `.slicex` is JSON — two file references, a profile
  // id and a handful of numbers, which is a document an indexer can read and a person can diff.
  //
  // It gets NO server-rendered preview either, and that absence is a claim rather than an omission: a
  // render is claimable only when a document can be drawn FROM ITS OWN BYTES ALONE, and this one holds a
  // Drive id and a set of parameters. Drawing it would mean fetching the mesh and running a slicer, so
  // it correctly falls through to the textual preview.
  { id: "slice", mark: "Layers", label: "Slicing setup", exts: ["slicex"], textual: true },
  // NO `surface`, like `nest` and `slice` above and for the same reason: the platform ships no built-in
  // reader for a machining setup, and the CNC editor is the one that opens it
  // (`packages/applets/cnc/src/app.ts` declares the `native` edge). `textual` because a `.camx` is JSON — two
  // file references, a stock, a machine and a short ordered list of operations, which is a document an
  // indexer can read and a person can diff. Its ORDER is the load-bearing part of it, and an order
  // diffs.
  //
  // It gets NO server-rendered preview either, and that absence is a claim rather than an omission: a
  // render is claimable only when a document can be drawn FROM ITS OWN BYTES ALONE, and this one holds a
  // Drive id, a machine and a list. Drawing it would mean fetching the solid and running FreeCAD, so it
  // correctly falls through to the textual preview.
  { id: "cam", mark: "Wrench", label: "Machining setup", exts: ["camx"], textual: true },
  { id: "workbook", container: true, mark: "Grid", label: "Spreadsheet", exts: ["sheetx"] },
  { id: "richtext", container: true, mark: "FileText", label: "Document", exts: ["pagex"] },
  { id: "deck", container: true, mark: "Play", label: "Slides", exts: ["deckx"] },
  // The professional image editor's document: a LAYER STACK, which is what makes it a different kind
  // from `image` rather than a fancier one. An `image` is a finished bitmap with a built-in reader; a
  // `photo` is a stack of layers, adjustments and masks that RENDERS to one. Photo opens both — the
  // second as an import, because a PNG carries no stack to round-trip.
  { id: "photo", container: true, mark: "Camera", label: "Photo", exts: ["imgx"] },

  // ── bytes with a built-in reader ──
  {
    id: "image",
    mark: "Image",
    label: "Image",
    exts: ["png", "jpg", "jpeg", "webp", "gif", "bmp", "svg"],
    surface: "preview",
  },
  // Raw media. Real rows with real extensions, not synthesized defs off to the side: they are as much
  // a file kind as anything else here, and keeping them out of the table is what let `video` mean two
  // different things at once.
  {
    id: "video",
    mark: "Film",
    label: "Video",
    // `mjpeg` is here because a MEDIA channel's file IS one (packages/domain/core/src/mjpeg.ts): a screen
    // or a camera is a video stream, so its file classifies as video like any other recording.
    exts: ["mp4", "webm", "mov", "m4v", "mkv", "avi", "ogv", "mjpeg"],
    surface: "preview",
  },
  {
    id: "audio",
    mark: "Mic",
    label: "Audio",
    exts: ["mp3", "wav", "m4a", "aac", "ogg", "flac", "opus", "mid", "midi"],
    surface: "preview",
  },
  // Fabrication toolpaths — the machine instructions a 3D part is sliced/CAMmed into. A read-only
  // toolpath viewer (parse G0/G1 moves → 3D polyline + layer scrub).
  {
    id: "gcode",
    mark: "Wrench",
    label: "G-code",
    exts: ["gcode", "gco", "nc", "ngc", "tap", "cnc"],
    textual: true,
    surface: "preview",
  },
  {
    id: "spreadsheet",
    mark: "Grid",
    label: "Spreadsheet",
    exts: ["xlsx", "xls", "ods"],
    surface: "preview",
  },
  { id: "richdoc", mark: "FileText", label: "Document", exts: ["docx"], surface: "preview" },
  {
    id: "html",
    mark: "Globe",
    label: "Web page",
    exts: ["html", "htm"],
    textual: true,
    surface: "preview",
  },
  {
    id: "font",
    mark: "Type",
    label: "Font",
    exts: ["ttf", "otf", "woff", "woff2", "eot"],
    surface: "preview",
  },
  {
    id: "calendar",
    mark: "Calendar",
    label: "Calendar",
    exts: ["ics"],
    textual: true,
    surface: "preview",
  },

  // ── bytes with no reader at all — and saying so is the point ──
  { id: "slides", mark: "Play", label: "Slides", exts: ["pptx", "ppt", "odp", "key"] },
  {
    id: "office",
    mark: "FileText",
    label: "Document",
    exts: ["doc", "odt", "rtf", "pages", "numbers"],
  },
  { id: "pdf", mark: "FileText", label: "PDF", exts: ["pdf"] },

  // ── what the classifier falls back TO ──
  //
  // Explicit declarations have rows even without filename patterns. Unknown names infer other;
  // transport headers do not classify existing nodes, and consumers query the stored type.

  { id: "archive", mark: "Archive", label: "Archive", exts: [] },
  // THE GENUINE UNKNOWN — an extension nothing in the taxonomy claims. The one kind that says "we do
  // not model these bytes", and the one `claimTokens` pairs with an `ext:` token so a third-party app
  // can claim a format we do not model without arguing with one we do.
  {
    id: "ext:integration",
    mark: "Folder",
    label: "Integration",
    exts: [],
    directory: true,
  },
  { id: "ext:splat", mark: "Box", label: "Gaussian splat", exts: ["splat", "ksplat", "spz"] },
  {
    id: "ext:jsonl",
    mark: "Code",
    label: "JSON Lines",
    exts: ["jsonl", "ndjson"],
    textual: true,
    surface: "table",
  },
  // Geoeconomics JSON document codecs; filename inference occurs only at creation.
  {
    id: "ext:geo-project",
    mark: "Globe",
    label: "Geo project",
    exts: ["geo-project"],
    textual: true,
    surface: "text",
  },
  {
    id: "ext:geo-dataset",
    mark: "Globe",
    label: "Geo dataset",
    exts: ["dataset"],
    textual: true,
    surface: "text",
  },
  {
    id: "ext:geo-formula",
    mark: "Globe",
    label: "Geo formula",
    exts: ["formula"],
    textual: true,
    surface: "text",
  },
  {
    id: "ext:geo-layer",
    mark: "Globe",
    label: "Geo layer",
    exts: ["layer"],
    textual: true,
    surface: "text",
  },
  {
    id: "ext:geo-event",
    mark: "Globe",
    label: "Geo event",
    exts: ["event"],
    textual: true,
    surface: "text",
  },
  {
    id: "ext:geo-model",
    mark: "Globe",
    label: "Geo model",
    exts: ["model"],
    textual: true,
    surface: "text",
  },
  {
    id: "ext:geo-params",
    mark: "Globe",
    label: "Geo params",
    exts: ["params"],
    textual: true,
    surface: "text",
  },
  {
    id: "ext:geo-scenario",
    mark: "Globe",
    label: "Geo scenario",
    exts: ["geo-scenario"],
    textual: true,
    surface: "text",
  },
  {
    id: "ext:geo-simulation",
    mark: "Globe",
    label: "Geo simulation",
    exts: ["simulation"],
    textual: true,
    surface: "text",
  },
  {
    id: "ext:geo-view",
    mark: "Globe",
    label: "Geo view",
    exts: ["view"],
    textual: true,
    surface: "text",
  },
  {
    id: "ext:geo-workspace",
    mark: "Globe",
    label: "Geo workspace",
    exts: ["workspace"],
    textual: true,
    surface: "text",
  },
  {
    id: "ext:geo-report",
    mark: "Globe",
    label: "Geo report",
    exts: ["report"],
    textual: true,
    surface: "text",
  },
  {
    id: "ext:geo-graph",
    mark: "Globe",
    label: "Geo graph",
    exts: ["graph"],
    textual: true,
    surface: "text",
  },
  { id: "other", mark: "FileText", label: "File", exts: [] },
] as const satisfies readonly NodeKindDef[];

/** THE TAXONOMY. Widened on purpose — see {@link NODE_KIND_ROWS}. */
export const NODE_KINDS: readonly NodeKindDef[] = NODE_KIND_ROWS;

const BY_EXT = new Map<string, NodeKindDef>();
for (const k of NODE_KINDS) for (const e of k.exts) BY_EXT.set(e, k);

const BY_NAME = new Map<string, NodeKindDef>();
for (const k of NODE_KINDS) for (const n of k.names ?? []) BY_NAME.set(n, k);

const BY_ID = new Map<NodeType, NodeKindDef>(NODE_KINDS.map((k) => [k.id, k]));

/**
 * EVERY `NodeType` HAS A ROW — checked by `tsc`, in the file where both halves are written.
 *
 * One direction was already enforced and the other was not: a row is typed `NodeKindDef`, so a row id
 * outside the union fails to compile. The reverse — a union member with no row — compiled silently,
 * and `text`, `archive` and `other` sat in exactly that state. That is not a tidiness problem, because
 * every consumer that projects this array into a `Record<NodeType, …>` does so through a cast
 * (`Object.fromEntries` cannot type its own keys), so the type SAYS total and the value is not:
 * `apps/platform/cloudflare/web-app-worker/src/lib/fileKindGlyphs.ts` produced `KIND_ICON["other"] === undefined`, `Icons[undefined]`
 * rendered as an element, and React #130 took the entire Files page to the error boundary.
 *
 * `Exclude` is the whole check: it is `never` when the union is covered, and the assignment below is
 * the compile error naming the missing ids when it is not. Cheaper than a test, and it fails in the
 * package where the kind is added rather than in whichever consumer runs its typecheck next.
 */
type UnrowedFileKind = Exclude<NodeType, `ext:${string}` | (typeof NODE_KIND_ROWS)[number]["id"]>;
/** `never` is the only argument this accepts, so a non-empty {@link UnrowedFileKind} is the error —
 *  and the message names the ids. A `const x: UnrowedFileKind[] = [] as never[]` does NOT work here
 *  and was the first thing written: `never[]` is assignable to `"other"[]`, so it compiles green with
 *  a row missing. Proved by deleting the `other` row and watching `tsc` say nothing. */
type MustBeNever<T extends never> = T;
export type _EveryFileKindHasARow = MustBeNever<UnrowedFileKind>;

/** One kind by id. */
export function nodeKindById(id: NodeType): NodeKindDef | undefined {
  const registered = BY_ID.get(id);
  if (registered) return registered;
  if (id.startsWith("ext:") && id.length > 4)
    return { id, mark: "FileText", label: `${id.slice(4).toUpperCase()} file`, exts: [] };
  return undefined;
}

const FOLDER = BY_ID.get("folder")!;
const OTHER = BY_ID.get("other")!;
const CODE = BY_EXT.get("ts")!;

/**
 * Extensionless / dotfile project & build files recognized by their base filename. These have no useful
 * extension to key on (Makefile, Dockerfile, Gemfile…) yet are plainly code/config. Resolved AFTER the
 * extension table (so known exts still win) before the unknown-type answer. Entries ending in `.`
 * are prefix matches (`dockerfile.` → `Dockerfile.dev`, `.env.` → `.env.local`).
 */
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

/** Creation-time inference inputs. Reads consume the stored type without reclassification. */
export interface ClassifiableNode {
  name: string;
  /** An explicit declaration wins over the filename, including after a rename. */
  type?: NodeType;
}

/**
 * WHICH CHILD DECLARES A FOLDER'S KIND — the directory half of the taxonomy.
 *
 * A file says what it is with its extension or its name. A directory has neither, so it says what it is
 * with a MARKER child: `.git` makes it a repository, a `.tf` file makes it a Terraform stack. This is
 * the same mechanism `names: ["skill.md"]` already is for files, applied one level up — a role declared
 * by a path rather than by a registry keyed on id.
 *
 * It exists because the generic answer was doing damage. While `folder` was the only directory kind, an
 * app that opened directories claimed EVERY directory `native`: Cloud Architect was offered for a photo
 * album and ranked equal with Code on a Terraform stack, because the relation had no way to say which
 * KIND of folder either app meant.
 *
 * ORDER IS THE RULE, first match wins, most specific first. A repository that also holds `.tf` files is
 * a repository — the version-control fact is the one that governs how the whole tree is handled, and a
 * stack that happens to be tracked is still primarily a stack's worth of files inside it.
 */
export interface FolderMarkerDef {
  /** The kind a matching directory resolves to. */
  kind: NodeType;
  /** An exact child NAME whose presence declares it. */
  child?: string;
  /** A child EXTENSION (no dot) whose presence declares it — for roles carried by a file TYPE. */
  childExt?: string;
}

/**
 * The manifest file that declares a directory to be an app (`app.json`).
 *
 * It is defined HERE, at the bottom of the stack, rather than beside the manifest MODEL it belongs
 * to, for one reason: this module has zero imports on purpose (the taxonomy is what `AppDef.opens`
 * and every layer above name a `NodeType` from), and the `app` folder marker below needs the
 * filename. `app-manifest.ts` re-exports it, so every existing consumer is unchanged and the name
 * still has exactly one definition.
 */
export const APP_MANIFEST_FILE = "app.json";

export const FOLDER_MARKERS: readonly FolderMarkerDef[] = [
  // A working tree. This is the whole of what "repo" means now: `notes/decisions/2026-08-17-a-repo-is-
  // a-folder-with-a-git-dir.md` deleted the three parallel spellings that used to answer this question
  // from a D1 row, and the predicate is a child lookup.
  { kind: "repo", child: ".git" },
  // An application. Same sentence as the line above — a repo is a folder with a `.git`, an app is a
  // folder with an `app.json` — and deliberately the same MECHANISM, because the alternative that was
  // shipping is a privileged `/apps` namespace that only the platform can put things in. A manifest is
  // the one file the OS looks for to launch an app (`APP_MANIFEST_FILE`), so it is exactly the marker.
  { kind: "app", child: APP_MANIFEST_FILE },
  // There is deliberately NO kind for "a folder that merely has a `.commandagi/`". A kind must EARN its
  // row by changing an answer, and that one changes none: Code opens `folder` natively already, so the
  // refinement would add a name without adding a claim — and `project` is separately the kind of a
  // `.project` DOCUMENT, so it would also have been one id meaning two things.
  // Infrastructure as code. Declared by the file TYPE rather than a marker name, because Terraform has
  // no manifest file: a stack IS the `.tf` files in a directory.
  { kind: "terraform-stack", childExt: "tf" },
];

/**
 * The kind of a DIRECTORY, given the child names the caller already holds.
 *
 * `undefined` / an empty list yields the generic {@link NODE_KINDS} `folder` row, and that is a real
 * answer rather than a gap: a caller listing a thousand tiles must not be made to readdir each one to
 * render it, so classification degrades to the generic kind and every generic-folder consumer keeps
 * working. A refined folder still matches `folder` in the opens relation (`claimTokens`, `packages/domain/core/src/apps.ts`),
 * so the degradation costs specificity and never correctness.
 */
export function resolveFolderKind(markers?: readonly string[]): NodeKindDef {
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

/** Whether a kind is a DIRECTORY kind — the generic one or any refinement of it. */
export function isFolderKind(id: NodeType): boolean {
  return id === "folder" || FOLDER_MARKERS.some((m) => m.kind === id);
}

/**
 * Infer a type at creation: declaration, exact name, extensionless code name, extension, other.
 * Directory writers use resolveFolderKind when maintaining their marker index.
 * A rename carries the existing stored type; transport headers never classify bytes.
 */
export function resolveNodeKind(file: ClassifiableNode): NodeKindDef {
  // An explicit declaration governs files and directories. An id no registry
  // knows falls through rather than resolving to a broken row: a declaration naming nothing must not
  // shadow a pattern that names something.
  const declared = file.type ? nodeKindById(file.type) : undefined;
  if (declared) return declared;

  const name = file.name.toLowerCase();
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".") + 1) : "";
  const basename = name.includes("/") ? name.slice(name.lastIndexOf("/") + 1) : name;

  // Named kinds win over the extension table: `SKILL.md` is a skill, not generic markdown, and that has
  // to hold no matter which of the two rules also matches the file.
  const byName = BY_NAME.get(basename);
  if (byName) return byName;

  if (CODE_NAMES.has(basename)) return CODE;
  if (CODE_NAME_PREFIXES.some((p) => basename.startsWith(p))) return CODE;

  const byExt = BY_EXT.get(ext);
  if (byExt) return byExt;

  return OTHER;
}

/**
 * Are this kind's BYTES human-readable text? Ask this when you want the content and not the surface —
 * a content indexer, a diff, a grep.
 *
 * There is no second `isTextKind()` any more. It answered "does this open in the textarea", which is a
 * question about the SURFACE and is now `surfaceOf(type) === "text"` — one projection, asked
 * directly, instead of two near-identical predicates a caller had to choose between.
 */
export function isTextualKind(id: NodeType): boolean {
  // No `id === "text"` special case any more: it existed because `text` had no row to read `textual`
  // off, which was the same missing row that made `KIND_ICON["text"]` undefined. One hole, two
  // symptoms — and this one was silent, which is why it survived longer.
  return BY_ID.get(id)?.textual === true;
}

/** Friendly product name for a file's format (tiles, download cards). */
export function fileKindLabel(fileName: string): string {
  const k = resolveNodeKind({ name: fileName });
  if (k.id !== "other") return k.label;
  const ext = fileName.toLowerCase().split(".").pop() ?? "";
  return ext ? `${ext.toUpperCase()} file` : "File";
}

/** Structural queries are total over the node vocabulary, including machine directories. */
export function isDirectory(type: NodeType): boolean {
  return BY_ID.get(type)?.directory === true;
}

export function isShortcut(type: NodeType): boolean {
  return type === "shortcut";
}

/** A regular file whose format exposes children, distinct from a directory. */
export function isContainer(type: NodeType): boolean {
  return BY_ID.get(type)?.container === true;
}

export function surfaceOf(type: NodeType): BuiltinSurface | undefined {
  return BY_ID.get(type)?.surface;
}

export function isTextualType(type: NodeType): boolean {
  return BY_ID.get(type)?.textual === true;
}

/** Operations and identity guarantees supplied by a store, independent of node classification. */
export interface StoreCapabilities {
  read: boolean;
  write: boolean;
  append: boolean;
  mkdir: boolean;
  move: boolean;
  remove: boolean;
  share: boolean;
  handles: boolean;
  offline: boolean;
  range: boolean;
}

export type NodeAccess = "none" | "view" | "edit";

/** Permissions intersect store support; copying only requires readable source bytes. */
export function capabilitiesFor(type: NodeType, store: StoreCapabilities, access: NodeAccess) {
  const readable = access !== "none" && store.read;
  const editable = access === "edit";
  return {
    read: readable,
    write: editable && store.write && !isDirectory(type),
    append: editable && store.append && !isDirectory(type),
    mkdir: editable && store.mkdir && isDirectory(type),
    move: editable && store.move,
    remove: editable && store.remove,
    copy: readable,
    share: editable && store.share,
    pin: readable,
    enumerate: readable && (isDirectory(type) || isContainer(type)),
  };
}
