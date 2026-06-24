---
name: comment-trim
description: Trim code comments to a sparse, why-not-what baseline. Deletes restated-code, narration, banners, filler, contextless TODOs, AI chatter, and stale comments; preserves non-obvious why, invariants, public-API docstrings, and external references. Use when the user asks to trim, clean up, prune, audit, or review code comments — and whenever the user invokes `/comment-trim`.
allowed-tools: Bash, Read, Edit, Glob, Grep, TodoWrite
---

# comment-trim

## Principle

Sparse comments. Explain the **why**, not the **what** — and only when necessary. Prefer deletion to rewriting; if a comment isn't earning its line, it goes.

If the repo has its own comment-style doc (`CONTRIBUTING.md`, cursor/agent rule, `STYLE.md`), read it first and let it override this skill on conflict.

## Invocation modes

**Mode 1 — Explicit user request** (`/comment-trim`, "trim the comments in X"): full workflow — discover → diagnose → **propose** → wait for confirmation → apply → verify. The propose step is the safety gate.

**Mode 2 — Self-applied** (subagent cleaning its own diff at closeout, or tech-lead applying mid-flow): no propose step, no confirmation gate. Discover → diagnose → apply → report in the closing summary. **When in doubt, keep** — no gate means be conservative. Scope the cleanup to comments authored in the current session; leave unrelated pre-existing comments alone.

## Scope

- **Default target:** files changed on the current branch vs the repo's default branch.
- **If the user names files/dirs:** use those instead.
- **Never touch:**
  - Generated files (`*.gen.*`, `*.pb.*`, codegen banners like `// AUTO-GENERATED`, `# DO NOT EDIT`).
  - Build outputs (`dist/`, `build/`, `target/`, `out/`, `.next/`, `.nuxt/`).
  - Third-party trees (`node_modules/`, `vendor/`, `.venv/`, `Pods/`).
  - License headers, copyright notices, shebangs.
  - Lint-suppression comments **that carry a justification** (e.g. `eslint-disable-* -- reason`, `# noqa: E501 reason`, `@ts-expect-error: reason`).
  - Snapshot files (`*.snap`, `__snapshots__/`) and golden fixtures.
  - Test data files unless explicitly requested.

## Workflow

1. **Discover targets.** With args: use them. No args: detect default branch and list changed source files:
   ```sh
   base=$(git rev-parse --abbrev-ref origin/HEAD 2>/dev/null | sed 's@^origin/@@' || echo main)
   git --no-pager diff --name-only "$(git merge-base HEAD "origin/$base")"
   ```
   Filter to source files (skip lockfiles, generated paths, binaries). Fall back to `main` then `master`; if neither exists, ask for a base ref.
2. **Diagnose.** Enumerate every comment with a proposed action: `delete` / `trim` / `keep` / `ask`.
3. **Propose** (Mode 1 only). Plan grouped by file: file → comment → action → one-line reason.
4. **Apply.** Mode 1: only after user approves; resolve every `ask` individually first. Mode 2: apply directly.
5. **Verify.** Run the project's existing lint/format/type-check via `package.json` scripts, `Makefile`, `pyproject.toml`, `Cargo.toml`, `go.mod`, etc. Do **not** introduce new tooling; if there's no clear command, confirm files still parse and ask the user how to verify.

## Decision table

| Pattern | Action |
|---|---|
| Restates the code (`// increment counter` on `counter++`) | **delete** |
| Tutorial narration (`# First we X, then Y, then Z`) | **delete** |
| Section banner (`// ===== HELPERS =====`) | **delete** |
| Filler / reassurance (`// this works`, `// safe to ignore`) | **delete** |
| AI chatter (`// Updated to handle new case`, `# Refactored above`) | **delete** |
| Over-elaboration: multi-line gloss on a short guard, alternate-timeline narration, reference trails, defensive verbosity | **trim** to one sentence |
| Bare `TODO` / `FIXME` / `XXX` with no ticket or context | **delete** (or ask to add a ticket ref) |
| Contradicted by current code (stale) | **delete** |
| Commented-out code with no explanation | **delete** |
| Non-obvious *why* (business rule, perf tradeoff, workaround, ordering, regulatory constraint) | **keep** |
| Invariant / gotcha / counterintuitive constraint | **keep** |
| Link to RFC, ticket, upstream issue, vendor doc | **keep** |
| Public-API docstring (JSDoc, Python `"""..."""`, Go `// Foo ...`, Rust `///`) | **keep** |
| Lint suppression with a `-- reason` / `# reason` | **keep** |
| Ambiguous — could be load-bearing context | **ask** |

## Examples

**Keep the non-obvious why** — explains business constraint, not code:
```ts
// Stripe requires amount in cents, not dollars
const chargeAmount = orderTotal * 100;
```

**Contextless TODO → ticketed TODO** (or delete):
```go
// before
// TODO
func refreshSession() { /* ... */ }

// after
// TODO(SELF-1234): rotate refresh token before expiry
func refreshSession() { /* ... */ }
```

**Stale, contradicted by code** — delete the lie; let the signature speak:
```ts
// before
// returns null when the bot is archived
function getBot(id: string): Bot { /* never returns null */ }

// after
function getBot(id: string): Bot { /* ... */ }
```
