---
name: executing-plans-with-review
description: Use when an approved specification and implementation plan must be implemented in the current session with an independent conformance review before the branch is finished.
---

# Executing Plans With Review

## Overview

Implement an approved plan without implementation subagents, then put an independent reviewer between implementation and branch completion.

**Core principle:** implementation is complete only when a reviewer who did not write the code confirms that the whole diff matches both the specification and the plan.

Announce at start: "I'm using the executing-plans-with-review skill to implement the plan and verify it independently."

## Preconditions

Identify the approved specification and implementation plan, read both completely, and pin the comparison base to a commit SHA before implementation.

If the documents conflict, omit a required decision, or leave the comparison base unclear, stop and ask the human partner. Do not choose a document silently or edit either to match the implementation.

## Workflow

1. **Implement as the primary agent.**
   - **REQUIRED SUB-SKILL:** Use `superpowers:executing-plans` for plan review and task execution.
   - This wrapper replaces its subagent recommendation: do not switch to `superpowers:subagent-driven-development` or delegate implementation.
   - Defer `superpowers:finishing-a-development-branch` until the review gate passes.

2. **Verify.** Run every check required by the plan and repository. Keep the complete implementation in the worktree.

3. **Dispatch one independent reviewer.** The reviewer must not have implemented or fixed the change. Give it the specification path, plan path, base SHA, and worktree path. It reads both documents and relevant repository context. Its review surface is every change since the pinned SHA: committed changes, staged and unstaged changes, plus every implementation-related untracked file reported by `git status --short`. An implementer summary or plain `git diff` is insufficient.

   The review response has this contract:

   ```text
   VERDICT: APPROVED | CHANGES_REQUIRED

   Findings:
   - <severity> <file:line> — <violated specification or plan requirement>; <observed mismatch>; <required correction>

   Verification gaps:
   - <required check that is missing or insufficient>
   ```

   `APPROVED` means no known specification, plan, or verification gaps. The reviewer reports findings only and does not edit files.

4. **Close every finding.** On `CHANGES_REQUIRED`, the primary agent fixes all findings, runs affected checks, and asks the same reviewer to inspect the updated full diff. The reviewer remains review-only between rounds. Repeat until `APPROVED`.

5. **Finish after approval.** After `APPROVED`, run final repository checks. If they require any file change, the approval is void: verify again and return the full result to the reviewer. Invoke `superpowers:finishing-a-development-branch` only when the exact approved tree remains unchanged.

There is no retry limit or self-approval. If a finding needs a product or architectural choice absent from the approved documents, stop and ask the human partner.

## Quick Reference

| State | Owner | Next action |
|---|---|---|
| Plan execution | Primary agent | Implement with `superpowers:executing-plans` |
| Full result ready | Reviewer subagent | Inspect all changes since the pinned SHA against both documents |
| `CHANGES_REQUIRED` | Primary agent | Fix all findings and re-run checks |
| `APPROVED` | Primary agent | Run final checks and finish the branch |

## Common Mistakes

| Rationalization | Required response |
|---|---|
| "Subagents are available, so use `subagent-driven-development`." | The primary agent implements and fixes; only review is delegated. |
| "The specification probably outranks the plan." | Ask about conflicts; never invent precedence. |
| "Each task was reviewed, so the whole change is covered." | Review the final full diff against both documents. |
| "Tests pass" or "we reached the retry limit." | Neither substitutes for `APPROVED`; continue the loop. |

## Red Flags

Implementation by a subagent, partial-diff review, self-approval, or branch completion before `APPROVED` means the gate has not passed.
