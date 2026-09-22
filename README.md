# @commandagi/node-kinds — THE NODE TAXONOMY

"What kind of thing is this node?", answered once, for the whole platform. A **node** is a file *or* a
folder; a **kind** is what it IS (`markdown`, `3d`, `repo`, `computer`, `task`). Declaration first,
inference second — see `resolveNodeKind`.

## Why this is its own package, at the very bottom

It lived in `@commandagi/core` and had to leave, because publishing `@commandagi/document` would
otherwise have dragged `core` — `escrow-frame-abi`, `merkle-liabilities`, `oracle-market`, `billing`,
`capacity` — onto npm so that a developer could name a file kind.

It could not simply move UP into `@commandagi/document` either, and the reason is a real cycle rather
than taste: **`core/apps.ts` and `core/ontology.ts` name a `NodeType`** (`AppDef.opens` is the one
relation `(app, kind) → capability`), and `core` sits BELOW `document`. Putting the taxonomy in
`document` recreates precisely the cycle that
`notes/decisions/2026-08-16-one-relation-app-opens-kind-replaces-documents-and-edit-mode.md` fixed by
moving it down in the first place.

A leaf below BOTH is the only placement that satisfies both consumers:

```
@commandagi/node-kinds        ← zero dependencies, this package
   ↑              ↑
@commandagi/core   @commandagi/document
                        ↑
                   app-* (the SDKs)
```

That is also why it has no dependencies at all, and must keep none: anything it imports becomes a
transitive dependency of every published SDK.
