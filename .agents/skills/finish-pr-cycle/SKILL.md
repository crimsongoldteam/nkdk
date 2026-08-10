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

3. Review the tests added by the branch before verification:

```bash
git diff --name-status --diff-filter=A origin/develop...HEAD
```

Identify the added test files in this diff. Remove tests that only lock in implementation details and do not protect observable behavior or an explicit architectural contract. Keep behavior-driven tests that exercise stable public interfaces.

Do not automatically remove round-trip, fixture-based, snapshot, architecture, or issue-linked regression tests; follow the project's test architecture. For every removed test, identify the remaining test that protects the behavior. If the review changes files, run the relevant tests, commit the removal, and verify that the worktree is clean before continuing.

4. Verify tests if they were not just run in this session. Prefer the project's normal focused or full test command. In `nkdk-core`, use:

```bash
pnpm --filter '@nkdk/core' test
```

5. Push the current branch:

```bash
git push -u origin <branch>
```

6. Create a PR into `develop`. The PR base branch must be exactly `develop`; do not target `main`, `master`, or any other branch unless the user explicitly overrides this in the current request:

```bash
gh pr create --base develop --head <branch> --title "<title>" --body "<summary and test plan>"
```

7. Merge the PR with a regular merge commit unless the user requested another merge method:

```bash
gh pr merge <number> --merge --delete-branch
```

If `gh pr merge` reports a local git/worktree error, check the PR state before retrying:

```bash
gh pr view <number> --json state,mergedAt,mergeCommit,url,headRefName,baseRefName
```

If the PR is already `MERGED`, continue cleanup.

8. Confirm the remote branch is gone. If it remains, delete it:

```bash
git ls-remote --heads origin <branch>
git push origin --delete <branch>
```

9. Remove the feature worktree:

```bash
git worktree remove <absolute-worktree-path>
```

10. Delete the local branch:

```bash
git branch -D <branch>
```

Use `-D` only after confirming the PR is merged.

11. Verify cleanup:

```bash
git worktree list
git branch --list <branch>
git ls-remote --heads origin <branch>
```

Report the PR URL, merge commit, removed worktree path, branch cleanup status, and any residual risk.
