---
description: Full tool access - asks before file changes and destructive commands
mode: primary
permission:
  edit: ask
  bash:
    # Default: ask before running anything.
    "*": ask

    # --- Read-only git (safe) ---
    "git status*": allow
    "git log*": allow
    "git show*": allow
    "git diff*": allow
    "git blame*": allow
    "git branch": allow
    "git branch -a*": allow
    "git branch -r*": allow
    "git branch -v*": allow
    "git branch --list*": allow
    "git fetch*": allow
    "git stash list*": allow
    "git stash show*": allow
    "git rev-parse*": allow
    "git rev-list*": allow
    "git ls-files*": allow
    "git ls-tree*": allow
    "git remote -v*": allow
    "git remote show*": allow
    "git merge-base*": allow
    "git describe*": allow
    "git tag -l*": allow
    "git tag --list*": allow
    "git shortlog*": allow
    "git --no-pager *": allow

    # Common chained read-only git checks.
    "git status && git branch --show-current": allow
    "git status && git diff*": allow
    "git status && git log --oneline*": allow
    "git status && git rev-parse --abbrev-ref HEAD": allow

    # --- Destructive git (always ask) ---
    "git push*": ask
    "git commit*": ask
    "git rebase*": ask
    "git reset*": ask
    "git merge*": ask
    "git cherry-pick*": ask
    "git checkout*": ask
    "git switch*": ask
    "git restore*": ask
    "git stash drop*": ask
    "git stash pop*": ask
    "git stash clear*": ask
    "git branch -d*": ask
    "git branch -D*": ask
    "git clean*": ask
    "git tag -d*": ask
    "git revert*": ask

    # --- Tests and linting (safe) ---
    "pnpm test*": allow
    "pnpm turbo test*": allow
    "pnpm lint*": allow
    "pnpm check*": allow
    "pnpm type-check*": allow
    "pnpm check-types*": allow
    "pnpm build*": allow
    "pnpm start*": allow
    "npm test*": allow
    "npm run test*": allow
    "npm run lint*": allow
    "npm run check*": allow
    "npm run build*": allow
    "npx vitest*": allow
    "npx jest*": allow
    "npx tsc*": allow
    "yarn test*": allow
    "go test*": allow
    "cargo test*": allow
    "pytest*": allow
    "make test*": allow
    "make lint*": allow
    "make check*": allow

    # --- Read-only shell (safe) ---
    "grep *": allow
    "rg *": allow
    "find *": allow
    "fd *": allow
    "ls*": allow
    "cat *": allow
    "head *": allow
    "tail *": allow
    "wc *": allow
    "echo *": allow
    "pwd": allow
    "which *": allow
    "file *": allow
    "stat *": allow
    "env": allow
    "printenv*": allow
    "jq *": allow
    "sort *": allow
    "uniq *": allow
    "diff *": allow
    "tree *": allow
    "du *": allow

    # --- Always block ---
    "rm -rf /*": deny
    "rm -rf ~*": deny
---

Run safe/read-only shell checks as separate commands by default.
Avoid chaining with `&&` or `;` unless there is a real dependency between
commands. Do not mix read-only checks and potentially mutating commands in a
single chain.

Reason: permissions are matched against the full command string. Splitting
safe commands avoids unnecessary approval prompts while keeping destructive
operations gated.
