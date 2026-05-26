---
name: comment-trim
description: Trim code comments to a sparse, why-not-what baseline. Deletes restated-code, narration, banners, filler, contextless TODOs, AI chatter, and stale comments; preserves non-obvious why, invariants, public-API docstrings, and external references. Use when the user asks to trim, clean up, prune, audit, or review code comments — and whenever the user invokes `/comment-trim`.
allowed-tools: Bash, Read, Edit, Glob, Grep, TodoWrite
---

# comment-trim

## Principle

Sparse comments. Explain the **why**, not the **what** — and only when necessary.

If the surrounding repo has its own comment-style doc (e.g. a `CONTRIBUTING.md`, a cursor/agent rule, a `STYLE.md`), read it first and let it override this skill where they conflict.

## Scope

- **Default target:** files changed on the current branch vs the repo's default branch.
- **If the user names files/dirs:** use those instead.
- **Never touch:**
  - Generated files (`*.gen.*`, `*.pb.*`, codegen banners like `// AUTO-GENERATED`, `# DO NOT EDIT`).
  - Build outputs (`dist/`, `build/`, `target/`, `out/`, `.next/`, `.nuxt/`).
  - Third-party trees (`node_modules/`, `vendor/`, `.venv/`, `Pods/`).
  - License headers, copyright notices, shebangs.
  - Lint-suppression comments **that carry a justification** (e.g. `eslint-disable-* -- reason`, `# noqa: E501 reason`, `@ts-expect-error: reason`, `# type: ignore[arg-type]  # reason`).
  - Snapshot files (`*.snap`, `__snapshots__/`) and golden fixtures.
  - Test data files unless explicitly requested.

## Workflow

1. **Discover targets**
   - With args: use the paths the user provided.
   - No args: detect the default branch and list changed source files since the branch point:
     ```sh
     base=$(git rev-parse --abbrev-ref origin/HEAD 2>/dev/null | sed 's@^origin/@@' || echo main)
     git --no-pager diff --name-only "$(git merge-base HEAD "origin/$base")"
     ```
     Filter to source files only (skip lockfiles, generated paths, binaries). If `origin/HEAD` isn't set, fall back to `main` then `master`; if neither exists, ask the user for a base ref.
2. **Diagnose** — read each file and enumerate every comment with a proposed action: `delete` / `trim` / `keep` / `ask`.
3. **Propose** — present the plan grouped by file (file → comment → action → one-line reason). Do **not** edit yet.
4. **Apply on confirmation** — only after the user approves. Resolve every `ask` item individually before editing.
5. **Verify** — run the project's existing lint/format/type-check commands. Look at `package.json` scripts, `Makefile`, `pyproject.toml`, `Cargo.toml`, `go.mod`, etc. Do **not** introduce new tooling; if there's no clear command, just confirm the files still parse and ask the user how they want to verify.

## Decision table

| Pattern | Action |
|---|---|
| Restates the code (`// increment counter` on `counter++`) | **delete** |
| Tutorial narration (`# First we X, then Y, then Z`) | **delete** |
| Section banner (`// ===== HELPERS =====`, `# --- utils ---`) | **delete** |
| Filler / reassurance (`// this works`, `// safe to ignore`, `# obvious`) | **delete** |
| AI chatter (`// Updated to handle new case`, `# Refactored above`) | **delete** |
| Bare `TODO` / `FIXME` / `XXX` with no ticket or context | **delete** (or ask to add a ticket ref) |
| Contradicted by current code (stale) | **delete** |
| Commented-out code with no explanation | **delete** |
| Non-obvious *why* (business rule, perf tradeoff, workaround, ordering, regulatory constraint) | **keep** |
| Invariant / gotcha / counterintuitive constraint | **keep** |
| Link to RFC, ticket, upstream issue, vendor doc | **keep** |
| Public-API docstring (JSDoc, Python `"""..."""`, Go `// Foo ...`, Rust `///`) | **keep** |
| Lint suppression with a `-- reason` / `# reason` | **keep** |
| Ambiguous — could be load-bearing context | **ask** |

When in doubt: **ask**, do not delete.

## Examples

**1. Restated code (TS)**
```ts
// before
// increment retry counter
retries++;

// after
retries++;
```

**2. Narration (Python)**
```py
# before
# First, fetch the user. Then look up their tenant. Finally, return the bot list.
user = get_user(id)
tenant = get_tenant(user.tenant_id)
return list_bots(tenant.id)

# after
user = get_user(id)
tenant = get_tenant(user.tenant_id)
return list_bots(tenant.id)
```

**3. Keep the non-obvious why**
```ts
// keep — explains business constraint, not the code
// Stripe requires amount in cents, not dollars
const chargeAmount = orderTotal * 100;
```

**4. Contextless TODO → ticketed TODO**
```go
// before
// TODO
func refreshSession() { /* ... */ }

// after — either delete or replace with a ticketed reference
// TODO(SELF-1234): rotate refresh token before expiry
func refreshSession() { /* ... */ }
```

**5. Stale, contradicted by code**
```ts
// before
// returns null when the bot is archived
function getBot(id: string): Bot { /* never returns null */ }

// after — delete the lie; let the signature speak
function getBot(id: string): Bot { /* ... */ }
```

## Anti-patterns

- Do **not** strip license headers, copyright notices, or shebangs.
- Do **not** edit files under `node_modules/`, `vendor/`, `.venv/`, `dist/`, `build/`, `target/`, or anything matching codegen banners (`AUTO-GENERATED`, `DO NOT EDIT`).
- Do **not** remove lint-suppression comments that carry a justification — those are usually required by the project's lint policy.
- Do **not** batch-delete without showing the plan first. The user confirms before edits land.
- Do **not** rewrite a comment to "improve" it when deletion suffices. Sparse wins.
- Do **not** touch comments inside test fixtures, snapshot files, or golden data unless explicitly asked.
- Do **not** introduce new tooling to verify changes. Use what the repo already has, or ask.
