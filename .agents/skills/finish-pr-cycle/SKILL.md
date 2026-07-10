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

2. Update the branch from the PR base before verification. The PR base for this project is `develop`, so pull in the latest merged work before running tests or creating the PR:

```bash
git fetch origin develop
git merge --no-edit origin/develop
```

If the merge conflicts, stop and report the conflicted files. Do not resolve conflicts silently. This is required because stale feature branches can rediscover round-trip diffs that were already fixed and merged in another branch.

3. Verify tests if they were not just run in this session. Prefer the project's normal focused or full test command. In `nkdk-core`, use:

```bash
pnpm --filter '@nkdk/core' test
```

4. Push the current branch:

```bash
git push -u origin <branch>
```

5. Create a PR into `develop`. The PR base branch must be exactly `develop`; do not target `main`, `master`, or any other branch unless the user explicitly overrides this in the current request:

```bash
gh pr create --base develop --head <branch> --title "<title>" --body "<summary and test plan>"
```

6. Merge the PR with a regular merge commit unless the user requested another merge method:

```bash
gh pr merge <number> --merge --delete-branch
```

If `gh pr merge` reports a local git/worktree error, check the PR state before retrying:

```bash
gh pr view <number> --json state,mergedAt,mergeCommit,url,headRefName,baseRefName
```

If the PR is already `MERGED`, continue cleanup.

7. Confirm the remote branch is gone. If it remains, delete it:

```bash
git ls-remote --heads origin <branch>
git push origin --delete <branch>
```

8. Remove the feature worktree:

```bash
git worktree remove <absolute-worktree-path>
```

9. Delete the local branch:

```bash
git branch -D <branch>
```

Use `-D` only after confirming the PR is merged.

10. Verify cleanup:

```bash
git worktree list
git branch --list <branch>
git ls-remote --heads origin <branch>
```

Report the PR URL, merge commit, removed worktree path, branch cleanup status, and any residual risk.
