---
name: walkthrough
description: Walk through all changes made in this session — verify each is necessary, show relevant code snippets, explain how they compose into the big picture
---

## When to use

After finishing a set of plan items, todo tasks, or any multi-file change. The user may invoke this directly or say things like "walk me through it", "what did you change", "summarize the changes", or "close it out".

## What to produce

### 1. Verification commands

Provide concrete commands to test the changes end-to-end:
- Exact shell commands with correct flags, paths, URLs, and expected output
- Call out any manual verification steps (e.g. "open the app and check X")
- Flag missing tests — if a change isn't covered by an automated test, say so explicitly

### 2. File-by-file walkthrough

For every file changed in this session:

1. **State the file path**
2. **What changed** — summarize the diff in plain language
3. **Why it was necessary** — what breaks or degrades without this change
4. **Show the relevant code** — include the key snippet (not the full file, just the meaningful part)
5. **How it connects** — explain how this file's change relates to the other files in the changeset

### 3. Big-picture summary

After the file-by-file breakdown:
- Explain how all the pieces compose into the broader system
- Call out any design decisions or tradeoffs made
- Note anything that was intentionally NOT changed and why
- List follow-up work or known gaps

## Style

- Be concrete, not abstract. Show code, not just descriptions.
- If a change is trivial (e.g. formatting), say so in one line and move on.
- If a change is consequential, spend proportional space on it.
- Group related files together rather than going in alphabetical order.
