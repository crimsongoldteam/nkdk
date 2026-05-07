---
name: finish-pr-cycle
description: Finish a completed development branch by verifying tests, pushing the branch, creating a GitHub PR, merging it, deleting the remote branch, removing the git worktree, and deleting the local branch. Use when the user asks to finish the cycle, ship via PR, merge and clean up, or says this is the end of a worktree/PR cycle.
---

# Finish PR Cycle

## Workflow

Use this after implementation is complete and tests have already passed, or when the user explicitly asks to finish a branch through PR and cleanup.

1. Verify the worktree is clean:

```bash
git status --short
git branch --show-current
```

If dirty, stop and report the changed files. Do not stash or discard.

2. Verify tests if they were not just run in this session. Prefer the project's normal focused or full test command. In `nakidka-core`, use:

```bash
pnpm --filter '@nakidka/core' test
```

3. Push the current branch:

```bash
git push -u origin <branch>
```

4. Create a PR into `develop`. The PR base branch must be exactly `develop`; do not target `main`, `master`, or any other branch unless the user explicitly overrides this in the current request:

```bash
gh pr create --base develop --head <branch> --title "<title>" --body "<summary and test plan>"
```

5. Merge the PR with squash unless the user requested another merge method:

```bash
gh pr merge <number> --squash --delete-branch --subject "<conventional commit title>"
```

If `gh pr merge` reports a local git/worktree error, check the PR state before retrying:

```bash
gh pr view <number> --json state,mergedAt,mergeCommit,url,headRefName,baseRefName
```

If the PR is already `MERGED`, continue cleanup.

6. Confirm the remote branch is gone. If it remains, delete it:

```bash
git ls-remote --heads origin <branch>
git push origin --delete <branch>
```

7. Remove the feature worktree:

```bash
git worktree remove <absolute-worktree-path>
```

8. Delete the local branch:

```bash
git branch -D <branch>
```

Use `-D` only after confirming the PR is merged.

9. Verify cleanup:

```bash
git worktree list
git branch --list <branch>
git ls-remote --heads origin <branch>
```

Report the PR URL, merge commit, removed worktree path, branch cleanup status, and any residual risk.
