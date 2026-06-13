# Remove XML Patches Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove dependency patch files and patch tooling while preserving the current XML output for `ChildItems`.

**Architecture:** Keep metadata exporters unchanged. Move the `ChildItems` grouping rule into `packages/core/xml/export/exporter.ts` by converting `ChildItems` arrays into the existing `xmlOrderedChildren` representation before serialization. This reuses the current preserve-order XML path so repeated child tags keep their original order without patching `fast-xml-parser` internals.

**Tech Stack:** TypeScript, Vitest, pnpm, `fast-xml-parser` `XMLBuilder`.

---

## File Structure

- Create: `packages/core/xml/export/exporter.test.ts`
  - Focused tests for `xmlExport` behavior that was previously supplied by patches.
- Modify: `packages/core/xml/export/exporter.ts`
  - Add a `ChildItems` normalization helper before `XMLBuilder` serialization.
  - Remove the stale patch comment.
- Modify: `package.json`
  - Remove `postinstall`, `patch-package`, and root `pnpm.patchedDependencies`.
- Modify: `pnpm-workspace.yaml`
  - Remove workspace-level `patchedDependencies`.
- Modify: `pnpm-lock.yaml`
  - Regenerate after dependency metadata removal.
- Delete: `patches/fast-xml-builder@1.0.0.patch`
- Delete: `patches/fast-xml-parser@5.3.3.patch`

## Task 1: Expose the Missing `ChildItems` Behavior

**Files:**

- Modify: `package.json`
- Modify: `pnpm-workspace.yaml`
- Modify: `pnpm-lock.yaml`
- Delete: `patches/fast-xml-builder@1.0.0.patch`
- Delete: `patches/fast-xml-parser@5.3.3.patch`
- Create: `packages/core/xml/export/exporter.test.ts`

- [ ] **Step 1: Remove patch metadata from `package.json`**

Remove the `postinstall` script, `patch-package` dev dependency, `postinstall-postinstall` dev dependency, and root `pnpm.patchedDependencies` block.

Expected root `scripts` block:

```json
"scripts": {
  "build": "tsc -p tsconfig.build.json && tsc-alias -p tsconfig.build.json",
  "type-check": "pnpm -r exec tsc --noEmit",
  "test": "pnpm -r run test",
  "test:isolated": "pnpm -r run test:isolated",
  "prepare": "ts-patch install"
}
```

Expected root `devDependencies` block must not contain `patch-package`:

```json
"devDependencies": {
  "@types/node": "^24.12.0",
  "prettier": "^3.8.1",
  "ts-patch": "^3.3.0",
  "tsc-alias": "^1.8.16",
  "typescript": "~5.9.3",
  "vitest": "^4.0.18"
}
```

- [ ] **Step 2: Remove patch metadata from `pnpm-workspace.yaml`**

Expected file:

```yaml
packages:
  - packages/*
```

- [ ] **Step 3: Delete patch files**

Run:

```bash
rm patches/fast-xml-builder@1.0.0.patch patches/fast-xml-parser@5.3.3.patch
```

Expected: both files are removed, and `find patches -maxdepth 1 -type f -print` prints nothing. Keep the empty `patches/` directory until Task 3, so the cleanup is easy to review.

- [ ] **Step 4: Regenerate the lockfile metadata**

Run:

```bash
pnpm install --lockfile-only
```

Expected:

- root `patchedDependencies` disappears from `pnpm-lock.yaml`;
- `patch_hash=` disappears from `pnpm-lock.yaml`;
- `patch-package` disappears from the root importer.

- [ ] **Step 5: Write the focused failing test**

Create `packages/core/xml/export/exporter.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { xmlExport } from "./exporter"

describe("xmlExport", () => {
  it("groups ChildItems array into one XML node and preserves child order", () => {
    const xml = xmlExport(
      {
        ChildItems: [
          { InputField: { _name: "Input1" } },
          { LabelField: { _name: "Label2" } },
          { InputField: { _name: "Input3" } },
        ],
      },
      false
    )

    expect(xml).toBe(
      [
        "<ChildItems>",
        '\t<InputField name="Input1"/>',
        '\t<LabelField name="Label2"/>',
        '\t<InputField name="Input3"/>',
        "</ChildItems>",
      ].join("\n")
    )
  })
})
```

- [ ] **Step 6: Run the focused test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run xml/export/exporter.test.ts
```

Expected: FAIL. The output should show multiple sibling `<ChildItems>` nodes or otherwise differ from the single-wrapper expectation.

- [ ] **Step 7: Commit the exposed failing state only if useful for review**

Prefer not to commit a red state. If the executor needs a checkpoint, use:

```bash
git add package.json pnpm-workspace.yaml pnpm-lock.yaml packages/core/xml/export/exporter.test.ts patches
git commit -m "test: :white_check_mark: зафиксировать XML ChildItems без патчей"
```

Expected: commit is optional and only acceptable if the team wants to preserve the failing test checkpoint.

## Task 2: Move `ChildItems` Grouping Into XML Export

**Files:**

- Modify: `packages/core/xml/export/exporter.ts`
- Test: `packages/core/xml/export/exporter.test.ts`

- [ ] **Step 1: Add `ChildItems` normalization helpers**

In `packages/core/xml/export/exporter.ts`, remove the three-line comment about patches and add these helpers after `hasOrderedChildren`:

```ts
const CHILD_ITEMS_XML_TAG = "ChildItems"

const toOrderedChildItemsNode = (items: unknown[]): Record<PropertyKey, unknown> => {
  const orderedChildren = items.flatMap((item): Array<{ key: string; value: unknown }> => {
    const normalizedItem = normalizeChildItemsForExport(item)
    if (!isRecord(normalizedItem)) return []
    return Object.entries(normalizedItem).map(([key, value]) => ({ key, value }))
  })

  return { [XML_ORDERED_CHILDREN]: orderedChildren }
}

const normalizeChildItemsForExport = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeChildItemsForExport(item))
  }

  if (!isRecord(value)) return value

  return Object.fromEntries(
    Object.entries(value).map(([key, childValue]) => [
      key,
      key === CHILD_ITEMS_XML_TAG && Array.isArray(childValue)
        ? toOrderedChildItemsNode(childValue)
        : normalizeChildItemsForExport(childValue),
    ])
  )
}
```

- [ ] **Step 2: Use the normalized data in `xmlExport`**

Replace the body of `xmlExport` with:

```ts
export const xmlExport = (data: Record<string, any>, addDeclaration: boolean = true): string => {
  const normalizedData = normalizeChildItemsForExport(data) as Record<string, any>
  const xml = (
    hasOrderedChildren(normalizedData)
      ? preserveOrderBuilder.build(toPreserveOrder(normalizedData))
      : builder.build(normalizedData)
  ).replace(/^\n/, "")
  const declaration = addDeclaration ? '\uFEFF<?xml version="1.0" encoding="UTF-8"?>\n' : ""
  const result = declaration + xml
  return result.trimEnd()
}
```

- [ ] **Step 3: Run the focused XML export test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run xml/export/exporter.test.ts
```

Expected: PASS for `packages/core/xml/export/exporter.test.ts`.

- [ ] **Step 4: Run the existing child items tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/commonObjects/childItems/toXML.test.ts
```

Expected: PASS. This proves the metadata-level exporter still emits the same `ChildItems` XML shape.

- [ ] **Step 5: Commit the XML exporter behavior**

Run:

```bash
git add packages/core/xml/export/exporter.ts packages/core/xml/export/exporter.test.ts
git commit -m "fix: :bug: сохранить XML ChildItems без патча"
```

Expected: one commit containing the exporter helper and focused test.

## Task 3: Finish Dependency Cleanup

**Files:**

- Modify: `package.json`
- Modify: `pnpm-workspace.yaml`
- Modify: `pnpm-lock.yaml`
- Delete: `patches/fast-xml-builder@1.0.0.patch`
- Delete: `patches/fast-xml-parser@5.3.3.patch`

- [ ] **Step 1: Verify no patch references remain outside historical docs**

Search:

```bash
rg -n "postinstall-postinstall|patch-package|patchedDependencies|patches/" package.json pnpm-lock.yaml pnpm-workspace.yaml packages docs .agents
```

Expected: only the approved design document and this plan mention removed patch files. Runtime files must not contain `postinstall-postinstall`, `patch-package`, `patchedDependencies`, `patch_hash=`, or `patches/`.

- [ ] **Step 2: Regenerate lockfile after dependency cleanup**

Run:

```bash
pnpm install --lockfile-only
```

Expected: `pnpm-lock.yaml` no longer contains:

```text
patch-package
postinstall-postinstall
patchedDependencies
patch_hash=
patches/
```

- [ ] **Step 3: Remove empty `patches/` directory if Git no longer tracks files in it**

Run:

```bash
rmdir patches
```

Expected: command succeeds. If it fails because the directory is already gone, continue.

- [ ] **Step 4: Verify no patch references remain**

Run:

```bash
rg -n "patch-package|patchedDependencies|patch_hash=|patches/" package.json pnpm-lock.yaml pnpm-workspace.yaml packages docs .agents
```

Expected: no matches, except historical docs/spec references if the team intentionally keeps them. For this task, the new design document may still mention removed files; do not edit the approved spec unless requested.

- [ ] **Step 5: Run install scripts without patch warnings**

Run:

```bash
pnpm install --frozen-lockfile
```

Expected: install completes without `patch-package` output and without warnings about unrecognized patch files.

- [ ] **Step 6: Commit dependency cleanup**

Run:

```bash
git add package.json pnpm-workspace.yaml pnpm-lock.yaml patches
git commit -m "chore: :wrench: удалить patch-механику XML"
```

Expected: one commit containing package metadata, lockfile, and patch file deletions.

## Task 4: Final Verification

**Files:**

- No code changes expected.

- [ ] **Step 1: Run focused XML tests**

Run:

```bash
pnpm --filter @nakidka/core test -- xml/export metadata/forms/commonObjects/childItems/toXML.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run full project tests**

Run:

```bash
pnpm test
```

Expected: PASS for graph, core, and cli packages. In this worktree the baseline was:

- `packages/graph`: 89 passed;
- `packages/core`: 4474 passed, 5 skipped;
- `packages/cli`: 81 passed.

- [ ] **Step 3: Check final Git state**

Run:

```bash
git status --short
git log --oneline -n 5
```

Expected: clean working tree after commits; latest commits include XML exporter behavior and dependency cleanup.

- [ ] **Step 4: Report completion**

Include:

- worktree path: `/home/nikita/git/nkdk/.worktrees/remove-xml-patches`;
- branch: `codex/remove-xml-patches`;
- focused test command and result;
- full `pnpm test` result;
- note that the original sandbox-only `spawnSync node EPERM` failure was resolved by running baseline tests outside the sandbox.
