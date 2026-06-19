# FunctionalOptionsParameter Root Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix subsystem content round-trip so `ПараметрФункциональныхОпций.*` maps to canonical `FunctionalOptionsParameter.*`, not erroneous `FunctionalOptionParameter.*`.

**Architecture:** Keep a single canonical metadata target root, `FunctionalOptionsParameter`, across target parsing, formatting, metadata path typing, and subsystem allowed content paths. Do not change XML fixtures, YAML Russian names, or metadata item rules.

**Tech Stack:** TypeScript, Vitest, pnpm, existing metadata `rules.ts` and metadata target helpers.

---

## File Structure

- Modify `packages/core/metadata/commonObjects/metadataTargets/parse.test.ts`: prove YAML root `ПараметрФункциональныхОпций` parses/formats through canonical `FunctionalOptionsParameter`.
- Modify `packages/core/metadata/appliedObjects/metadataSubsystem/metadataTarget.test.ts`: prove subsystem `Состав` imports YAML functional option parameter links into canonical model links.
- Modify `packages/core/metadata/commonObjects/metadataTargets/types.ts`: remove erroneous `FunctionalOptionParameter` root from `MetadataRootName`.
- Modify `packages/core/metadata/commonObjects/metadataTargets/roots.ts`: remove duplicate Russian-root mapping for `FunctionalOptionParameter`.
- Modify `packages/core/metadata/commonObjects/metadataPath/types.ts`: remove erroneous metadata path root mapping.
- Modify `packages/core/metadata/appliedObjects/metadataSubsystem/rules.ts`: remove erroneous allowed subsystem content path.

### Task 1: Add Failing Coverage

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataTargets/parse.test.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataSubsystem/metadataTarget.test.ts`

- [ ] **Step 1: Update metadata target parse/format expectation**

In `packages/core/metadata/commonObjects/metadataTargets/parse.test.ts`, change the functional options parameter case in `parses and formats additional top-level roots used by subsystem content` to:

```ts
[
  "ПараметрФункциональныхОпций.ПараметрФункциональныхОпцийВсеСвойства",
  "FunctionalOptionsParameter.ПараметрФункциональныхОпцийВсеСвойства",
  "FunctionalOptionsParameter",
],
```

- [ ] **Step 2: Add subsystem YAML import coverage**

In `packages/core/metadata/appliedObjects/metadataSubsystem/metadataTarget.test.ts`, after `exports functional options parameter links from XML model content`, add:

```ts
it("imports functional options parameter links to XML model content", () => {
  expect(
    importMetadataItemFromYAML({
      context: mockContext,
      rule: MetadataSubsystemRules,
      name: "СтандартныеПодсистемы",
      yaml: {
        Состав: ["ПараметрФункциональныхОпций.ПараметрФункциональныхОпцийВсеСвойства"],
      },
    })
  ).toMatchObject({
    content: ["FunctionalOptionsParameter.ПараметрФункциональныхОпцийВсеСвойства"],
  })
})
```

- [ ] **Step 3: Run focused tests and confirm failure**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/metadataTargets/parse.test.ts metadata/appliedObjects/metadataSubsystem/metadataTarget.test.ts
```

Expected before implementation: at least the new/updated functional options parameter assertions fail because YAML still resolves to `FunctionalOptionParameter`.

### Task 2: Remove Erroneous Root

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataTargets/types.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTargets/roots.ts`
- Modify: `packages/core/metadata/commonObjects/metadataPath/types.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataSubsystem/rules.ts`

- [ ] **Step 1: Remove root from metadata target type**

In `packages/core/metadata/commonObjects/metadataTargets/types.ts`, remove this union member:

```ts
| "FunctionalOptionParameter"
```

- [ ] **Step 2: Remove duplicate metadata target root mapping**

In `packages/core/metadata/commonObjects/metadataTargets/roots.ts`, remove this property:

```ts
FunctionalOptionParameter: "ПараметрФункциональныхОпций",
```

Keep:

```ts
FunctionalOptionsParameter: "ПараметрФункциональныхОпций",
```

- [ ] **Step 3: Remove metadata path root mapping**

In `packages/core/metadata/commonObjects/metadataPath/types.ts`, remove this property:

```ts
FunctionalOptionParameter: "ПараметрФункциональныхОпций",
```

- [ ] **Step 4: Remove erroneous subsystem allowed path**

In `packages/core/metadata/appliedObjects/metadataSubsystem/rules.ts`, remove:

```ts
["FunctionalOptionParameter"],
```

Keep:

```ts
["FunctionalOptionsParameter"],
```

- [ ] **Step 5: Run focused tests and confirm pass**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/metadataTargets/parse.test.ts metadata/appliedObjects/metadataSubsystem/metadataTarget.test.ts
```

Expected: PASS.

### Task 3: Verify Round-Trip Behavior

**Files:**
- No source edits.

- [ ] **Step 1: Run fast-mode unit tests**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run `acc` fast round-trip**

Run:

```bash
NKDK_XML_REPO=/home/nikita/git/round-trip/acc NKDK_XML_DIR=/home/nikita/git/round-trip/acc ./.agents/skills/round-trip-yaml-fast/round-trip.sh
```

Expected: no `FunctionalOptionsParameter` to `FunctionalOptionParameter` diff. Prefer `DIFF_COUNT=0`; if other unrelated diffs appear, inspect and report them separately.

- [ ] **Step 3: Run full project tests**

Run:

```bash
pnpm test
```

Expected: PASS.

### Task 4: Commit

**Files:**
- Commit all changed files from Tasks 1-3.

- [ ] **Step 1: Inspect diff**

Run:

```bash
git diff --check
git diff -- packages/core/metadata/commonObjects/metadataTargets/parse.test.ts packages/core/metadata/appliedObjects/metadataSubsystem/metadataTarget.test.ts packages/core/metadata/commonObjects/metadataTargets/types.ts packages/core/metadata/commonObjects/metadataTargets/roots.ts packages/core/metadata/commonObjects/metadataPath/types.ts packages/core/metadata/appliedObjects/metadataSubsystem/rules.ts
```

Expected: no whitespace errors; diff only removes erroneous singular root and adds canonical import coverage.

- [ ] **Step 2: Commit**

Run:

```bash
git add packages/core/metadata/commonObjects/metadataTargets/parse.test.ts packages/core/metadata/appliedObjects/metadataSubsystem/metadataTarget.test.ts packages/core/metadata/commonObjects/metadataTargets/types.ts packages/core/metadata/commonObjects/metadataTargets/roots.ts packages/core/metadata/commonObjects/metadataPath/types.ts packages/core/metadata/appliedObjects/metadataSubsystem/rules.ts docs/superpowers/plans/2026-06-19-functional-options-parameter-root.md
git commit -m "fix: :bug: исправить root FunctionalOptionsParameter"
```

Expected: commit succeeds.

## Self-Review

- Spec coverage: the plan removes `FunctionalOptionParameter` from every runtime file listed in the spec, keeps `FunctionalOptionsParameter`, keeps Russian YAML `ПараметрФункциональныхОпций`, and verifies parser, subsystem import/export, fast round-trip, and full tests.
- Placeholder scan: no `TBD`, `TODO`, “similar”, or unspecified test steps.
- Type consistency: all planned code uses `FunctionalOptionsParameter` as the canonical root and `ПараметрФункциональныхОпций` as the YAML root.
