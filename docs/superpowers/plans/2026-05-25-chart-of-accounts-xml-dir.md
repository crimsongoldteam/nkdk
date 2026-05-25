# ChartOfAccounts XML Directory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `MetadataChartOfAccountsRules` read and write real 1C dump directories named `ChartsOfAccounts`.

**Architecture:** Keep the existing metadata rule architecture intact. Change only the filesystem directory name in the `MetadataChartOfAccountsRules.xmlDir` field; keep XML container names, references, YAML prefixes, and `Configuration.xml` child object tag names singular.

**Tech Stack:** TypeScript, Vitest, pnpm, existing metadata `rules.ts` and configuration top-level rule tests.

---

## File Structure

- Modify `packages/core/metadata/appliedObjects/metadataChartOfAccounts/rules.ts`: set the XML directory for plans of accounts to `ChartsOfAccounts`.
- Modify `packages/core/metadata/appliedObjects/configuration/topLevelRules.test.ts`: assert the top-level rule exposes `xmlDir: "ChartsOfAccounts"`.
- No new production files are needed.

---

### Task 1: Pin Top-Level XML Directory Contract

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/topLevelRules.test.ts`

- [ ] **Step 1: Write the failing test expectation**

In `packages/core/metadata/appliedObjects/configuration/topLevelRules.test.ts`, add this expected object inside the existing `expect.arrayContaining([...])` block:

```ts
{ itemType: "MetadataChartOfAccounts", xmlDir: "ChartsOfAccounts" },
```

The relevant fragment should include both existing neighboring object types and the new expectation:

```ts
expect(rules).toEqual(
  expect.arrayContaining([
    { itemType: "MetadataDefinedType", xmlDir: "DefinedTypes" },
    { itemType: "MetadataSessionParameter", xmlDir: "SessionParameters" },
    { itemType: "MetadataEventSubscription", xmlDir: "EventSubscriptions" },
    { itemType: "MetadataFilterCriterion", xmlDir: "FilterCriteria" },
    { itemType: "MetadataFunctionalOptionsParameter", xmlDir: "FunctionalOptionsParameters" },
    { itemType: "MetadataSettingsStorage", xmlDir: "SettingsStorages" },
    { itemType: "MetadataStyleItem", xmlDir: "StyleItems" },
    { itemType: "MetadataCommonAttribute", xmlDir: "CommonAttributes" },
    { itemType: "MetadataConstant", xmlDir: "Constants" },
    { itemType: "MetadataChartOfAccounts", xmlDir: "ChartsOfAccounts" },
    { itemType: "MetadataBot", xmlDir: "Bots" },
    { itemType: "MetadataWSReference", xmlDir: "WSReferences" },
    { itemType: "MetadataEnumeration", xmlDir: "Enums" },
    { itemType: "MetadataReport", xmlDir: "Reports" },
  ])
)
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/appliedObjects/configuration/topLevelRules.test.ts
```

Expected: the test fails because the current rule still reports `xmlDir: "ChartOfAccounts"`.

- [ ] **Step 3: Commit after the failing test is observed**

Do not commit the failing test by itself unless the next implementation step cannot be done immediately. This task is complete when the failure is observed and noted.

---

### Task 2: Correct ChartOfAccounts XML Directory

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataChartOfAccounts/rules.ts`
- Test: `packages/core/metadata/appliedObjects/configuration/topLevelRules.test.ts`

- [ ] **Step 1: Change the production rule**

In `packages/core/metadata/appliedObjects/metadataChartOfAccounts/rules.ts`, change:

```ts
xmlDir: "ChartOfAccounts",
```

to:

```ts
xmlDir: "ChartsOfAccounts",
```

Do not change:

```ts
xmlRoot: { type: "XMLRoot", container: "ChartOfAccounts", ... }
itemTypePrefix: "ПланСчетов"
```

- [ ] **Step 2: Run the focused test and verify it passes**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/appliedObjects/configuration/topLevelRules.test.ts
```

Expected: `metadata/appliedObjects/configuration/topLevelRules.test.ts` passes.

- [ ] **Step 3: Run the core test suite**

Run:

```bash
pnpm --filter @nakidka/core test
```

Expected: all core tests pass, with skipped tests allowed only if they are already skipped by the suite.

- [ ] **Step 4: Commit the code change**

Run:

```bash
git add packages/core/metadata/appliedObjects/metadataChartOfAccounts/rules.ts packages/core/metadata/appliedObjects/configuration/topLevelRules.test.ts
git commit -m "fix: :bug: исправить каталог планов счетов"
```

---

### Task 3: Verify Against Round-Trip YAML

**Files:**
- No source files modified by this task.
- External check target: `/Users/nikita/git/round-trip-source`

- [ ] **Step 1: Run round-trip-yaml against the real XML source**

Run:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source ./.agents/skills/round-trip-yaml/round-trip.sh
```

Expected: the command completes import and sync for `/Users/nikita/git/round-trip-source/acc`.

- [ ] **Step 2: Inspect the remaining `Configuration.xml` diff by child object tag**

Run:

```bash
git -C /Users/nikita/git/round-trip-source/acc diff -- Configuration.xml | rg '^-[[:space:]]*<([A-Za-z]+)>' -o -r '$1' | sort | uniq -c
```

Expected: `ChartOfAccounts` is absent from the output. Remaining entries may include unsupported object types such as `CommonModule`, `XDTOPackage`, and `CommonCommand`.

- [ ] **Step 3: Report verification result**

Summarize whether `ChartOfAccounts` disappeared from the round-trip diff. Mention any remaining unsupported child object tags separately from the fixed directory issue.

---

## Self-Review

- Spec coverage: the plan changes only `xmlDir`, preserves XML container and YAML prefix, and verifies `round-trip-yaml`.
- Placeholder scan: no placeholders remain.
- Type consistency: `MetadataChartOfAccounts`, `ChartOfAccounts`, `ChartsOfAccounts`, and `ПланСчетов` are used with distinct meanings throughout the plan.
