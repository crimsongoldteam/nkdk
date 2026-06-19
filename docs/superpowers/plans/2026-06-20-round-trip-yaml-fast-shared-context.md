# round-trip-yaml-fast Shared Context Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `round-trip-yaml-fast` check child file-item XML with the same parent owner context used by the normal metadata import path.

**Architecture:** Extract a small generic owner-context helper under `packages/core/metadata/orchestration/appliedObject/`. Use it from the existing working import path and from `roundTripYAMLFast`, so the fast checker no longer builds an incompatible owner context. Keep fast output behavior unchanged: it still compares in memory and reports diffs/errors without writing YAML/XML trees.

**Tech Stack:** TypeScript, Vitest, existing metadata orchestration APIs, `fast-xml-parser`, project scripts through `pnpm`.

---

## Scope And File Map

This plan implements one bounded fix: shared owner/path context for child file-item round-trip checks.

Before touching `packages/core/metadata/orchestration/**`, read:

- `.agents/knowledge/metadata/INDEX.md`
- `.agents/knowledge/metadata/sources-of-truth.md`
- `.agents/knowledge/metadata/round-trip-cycle.md`
- `.agents/knowledge/metadata/yaml-contract.md`
- `.agents/architecture-orchestration.md`

Files:

- Create `packages/core/metadata/orchestration/appliedObject/metadataItemOwnerContext.ts`
  - Generic helpers for owner stacks.
  - No imports from concrete `appliedObjects/*` or `forms/*`.
  - Converts owner stack to `metadataTargetOwners` and `itemsTree`.
- Modify `packages/core/metadata/orchestration/appliedObject/convertFromXML.ts`
  - Replace local owner-stack helper with shared helper.
  - This keeps the working contour and fast contour tied to one mechanism.
- Modify `packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.ts`
  - Add ancestor owner stack to `RoundTripEntry`.
  - Pass ancestor owners into YAML export/import contexts and XML export context.
  - Pass the current item name into `importMetadataItemFromYAML`, not the parent name.
- Modify `packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts`
  - Add regression tests for external data source table, cube, dimension table, and default form owner targets.

Do not modify XML fixtures. Use existing fixture copies in temporary directories.

### Task 1: Add Shared Owner Context Helper

**Files:**
- Create: `packages/core/metadata/orchestration/appliedObject/metadataItemOwnerContext.ts`
- Modify: none
- Test: none in this task; Task 2 and Task 3 exercise this helper through existing behavior.

- [ ] **Step 1: Read required architecture and metadata docs**

Run:

```bash
sed -n '1,260p' .agents/knowledge/metadata/INDEX.md
sed -n '1,260p' .agents/knowledge/metadata/sources-of-truth.md
sed -n '1,260p' .agents/knowledge/metadata/round-trip-cycle.md
sed -n '1,260p' .agents/knowledge/metadata/yaml-contract.md
sed -n '1,220p' .agents/architecture-orchestration.md
```

Expected: documents are readable. Note the orchestration invariant: do not import concrete applied objects or forms into the new helper.

- [ ] **Step 2: Create the helper**

Create `packages/core/metadata/orchestration/appliedObject/metadataItemOwnerContext.ts` with:

```ts
import type {
  ConfigurationContext,
  ConfigurationContextWithExportToXML,
  ContextElementToXML,
  MetadataTargetOwnerContext,
} from "~/metadata/context/types"
import type { MetadataItemType } from "~/metadata/orchestration/metadataItem/registry"

export interface MetadataItemOwnerContextEntry {
  itemType: MetadataItemType
  name: string
  path: string
}

export const appendMetadataItemOwner = (
  owners: readonly MetadataItemOwnerContextEntry[],
  itemType: MetadataItemType,
  name: string,
  path = ""
): MetadataItemOwnerContextEntry[] => [...owners, { itemType, name, path }]

export const metadataItemOwnersToTargetOwners = (
  owners: readonly MetadataItemOwnerContextEntry[]
): MetadataTargetOwnerContext[] => owners.map(({ itemType, name }) => ({ itemType, name }))

export const metadataItemOwnersToItemsTree = (
  owners: readonly MetadataItemOwnerContextEntry[]
): ContextElementToXML[] => owners.map(({ itemType, name, path }) => ({ itemType, name, path }))

export function withExportMetadataTargetOwners<TContext extends ConfigurationContext>(
  context: TContext,
  owners: readonly MetadataItemOwnerContextEntry[]
): TContext {
  if (!context.exportToYAML || owners.length === 0) return context

  return {
    ...context,
    exportToYAML: {
      ...context.exportToYAML,
      metadataTargetOwners: [
        ...(context.exportToYAML.metadataTargetOwners ?? []),
        ...metadataItemOwnersToTargetOwners(owners),
      ],
    },
  }
}

export function withImportMetadataTargetOwners<TContext extends ConfigurationContext>(
  context: TContext,
  owners: readonly MetadataItemOwnerContextEntry[]
): TContext {
  if (owners.length === 0) return context

  return {
    ...context,
    importFromYAML: {
      ...context.importFromYAML,
      metadataTargetOwners: [
        ...(context.importFromYAML?.metadataTargetOwners ?? []),
        ...metadataItemOwnersToTargetOwners(owners),
      ],
    },
  }
}

export function withExportToXMLItemsTree<TContext extends ConfigurationContextWithExportToXML>(
  context: TContext,
  owners: readonly MetadataItemOwnerContextEntry[]
): TContext {
  if (owners.length === 0) return context

  return {
    ...context,
    exportToXML: {
      ...context.exportToXML,
      itemsTree: [...context.exportToXML.itemsTree, ...metadataItemOwnersToItemsTree(owners)],
    },
  }
}
```

- [ ] **Step 3: Run a type check for the new file**

Run:

```bash
pnpm --dir packages/core type-check
```

Expected: this may fail because the new helper is not used yet only if imports/types are wrong. If it fails, fix only type errors in `metadataItemOwnerContext.ts`.

- [ ] **Step 4: Commit**

```bash
git add packages/core/metadata/orchestration/appliedObject/metadataItemOwnerContext.ts
git commit -m "refactor: :recycle: вынести контекст владельцев metadata"
```

### Task 2: Use The Shared Helper In The Working Import Path

**Files:**
- Modify: `packages/core/metadata/orchestration/appliedObject/convertFromXML.ts`
- Test: `packages/core/metadata/appliedObjects/configuration/convertFromXML.test.ts`

- [ ] **Step 1: Replace local owner helper import**

In `packages/core/metadata/orchestration/appliedObject/convertFromXML.ts`, add this import near the other local appliedObject imports:

```ts
import {
  appendMetadataItemOwner,
  withExportMetadataTargetOwners,
  type MetadataItemOwnerContextEntry,
} from "./metadataItemOwnerContext"
```

- [ ] **Step 2: Replace the top-level owner context construction**

Find:

```ts
  const contextWithCurrentOwner = withExportMetadataTargetOwner(context, rule.itemType, name)
```

Replace it with:

```ts
  const contextWithCurrentOwner = withExportMetadataTargetOwners(context, [
    { itemType: rule.itemType, name, path: "" },
  ])
```

- [ ] **Step 3: Add an owner stack parameter to child sync**

In the call to `syncChildCollectionsFromXML` inside `convertAppliedObjectFromXML`, add:

```ts
    ownerStack: [],
```

The full call should include:

```ts
  await syncChildCollectionsFromXML({
    context,
    rule,
    model: mutableModel,
    xmlDir: inputDir,
    nkdkDir,
    name,
    xmlDirContainsCurrentItem: false,
    ownerStack: [],
  })
```

Update the `syncChildCollectionsFromXML` parameter type by adding:

```ts
  ownerStack: readonly MetadataItemOwnerContextEntry[]
```

- [ ] **Step 4: Use the shared helper inside child sync**

Inside `syncChildCollectionsFromXML`, replace:

```ts
  const context = withExportMetadataTargetOwner(params.context, rule.itemType, name)
```

with:

```ts
  const ownerStack = appendMetadataItemOwner(params.ownerStack, rule.itemType, name)
  const context = withExportMetadataTargetOwners(params.context, [{ itemType: rule.itemType, name, path: "" }])
```

In the recursive call to `syncChildCollectionsFromXML`, add:

```ts
        ownerStack,
```

The recursive call should include:

```ts
      await syncChildCollectionsFromXML({
        context,
        rule: childCollection.itemRule,
        model: item.model,
        xmlDir: childXmlDir,
        nkdkDir: childNkdkDir,
        name: item.name,
        xmlDirContainsCurrentItem: params.xmlDirContainsCurrentItem || childCollection.xmlDir !== undefined,
        ownerStack,
      })
```

- [ ] **Step 5: Remove the old local helper**

Delete this function from `convertFromXML.ts`:

```ts
function withExportMetadataTargetOwner(
  context: ConfigurationContextFromXML,
  itemType: MetadataItemRule["itemType"],
  name: string
): ConfigurationContextFromXML {
  return context.exportToYAML
    ? {
        ...context,
        exportToYAML: {
          ...context.exportToYAML,
          metadataTargetOwners: [...(context.exportToYAML.metadataTargetOwners ?? []), { itemType, name }],
        },
      }
    : context
}
```

- [ ] **Step 6: Run the targeted import-path tests**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/appliedObjects/configuration/convertFromXML.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 7: Run type check**

Run:

```bash
pnpm --dir packages/core type-check
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/orchestration/appliedObject/convertFromXML.ts
git commit -m "refactor: :recycle: использовать общий контекст владельцев"
```

### Task 3: Add Failing Tests For round-trip-yaml-fast Owner Context

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts`
- Test: `packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts`

- [ ] **Step 1: Add regression tests**

Append these tests to the existing `describe("roundTripYAMLFast", () => { ... })` block in `packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts`:

```ts
  it("keeps external data source file-item InternalInfo owner names", async () => {
    const xmlDir = makeExternalDataSourceFixtureProject()
    try {
      const result = await roundTripYAMLFast({ inputDir: xmlDir })
      const files = [...result.diffs.map((diff) => diff.file), ...result.errors.map((error) => error.file)]

      expect(files).not.toContain(
        "ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаПоУмолчанию.xml"
      )
      expect(files).not.toContain(
        "ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Cubes/КубПоУмолчанию.xml"
      )
      expect(files).not.toContain(
        "ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства/DimensionTables/ТаблицаИзмеренияВсеСвойства.xml"
      )
    } finally {
      fs.rmSync(xmlDir, { recursive: true, force: true })
    }
  })

  it("uses nested owner context for external data source default form targets", async () => {
    const xmlDir = makeExternalDataSourceFixtureProject()
    try {
      const result = await roundTripYAMLFast({ inputDir: xmlDir })

      expect(result.errors.map((error) => ({ file: error.file, message: error.message }))).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            file: "ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаВсеСвойства.xml",
            message: expect.stringContaining('Неизвестный сегмент "Table"'),
          }),
          expect.objectContaining({
            file: "ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства.xml",
            message: expect.stringContaining('Неизвестный сегмент "Cube"'),
          }),
        ])
      )
    } finally {
      fs.rmSync(xmlDir, { recursive: true, force: true })
    }
  })
```

- [ ] **Step 2: Run the targeted tests and confirm failure**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts --no-isolate
```

Expected before implementation: FAIL. The first new test should report at least one of the listed files present in diffs/errors, or the second test should show `Неизвестный сегмент "Table"` / `Неизвестный сегмент "Cube"`.

- [ ] **Step 3: Commit the failing tests**

```bash
git add packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts
git commit -m "test: :white_check_mark: зафиксировать контекст yaml-fast"
```

### Task 4: Pass Shared Owner Context Through roundTripYAMLFast

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.ts`
- Test: `packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts`

- [ ] **Step 1: Import shared owner helpers**

In `packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.ts`, add:

```ts
import {
  appendMetadataItemOwner,
  withExportMetadataTargetOwners,
  withExportToXMLItemsTree,
  withImportMetadataTargetOwners,
  type MetadataItemOwnerContextEntry,
} from "~/metadata/orchestration/appliedObject/metadataItemOwnerContext"
```

- [ ] **Step 2: Extend entry types**

Replace the `RoundTripEntry` type with:

```ts
type RoundTripEntryBase = {
  file: string
  xmlFileAbs: string
  itemName: string
  parentName: string
  ownerStack: readonly MetadataItemOwnerContextEntry[]
}

type RoundTripEntry =
  | (RoundTripEntryBase & { kind: "metadata"; rule: MetadataItemRule })
  | (RoundTripEntryBase & {
      kind: "form"
      metadataFile: string
      formXmlFile: string
      formsDir: string
      formName: string
    })
```

Update `MetadataEntryParams` by adding:

```ts
  ownerStack: readonly MetadataItemOwnerContextEntry[]
```

- [ ] **Step 3: Make context builders accept owner stacks**

Replace the existing context builder functions with:

```ts
const makeContextFromXML = (forReference: boolean): ConfigurationContextFromXML => ({
  defaultLanguage: "ru",
  version: "2.20",
  fromXML: { forReference },
})

const makeContextToYAML = (ownerStack: readonly MetadataItemOwnerContextEntry[]): ConfigurationContext =>
  withExportMetadataTargetOwners(
    {
      defaultLanguage: "ru",
      version: "2.20",
      exportToYAML: { toTyped: false },
    },
    ownerStack
  )

const makeContextFromYAML = (ownerStack: readonly MetadataItemOwnerContextEntry[]): ConfigurationContext =>
  withImportMetadataTargetOwners(
    {
      defaultLanguage: "ru",
      version: "2.20",
    },
    ownerStack
  )

const makeContextToXML = (
  parentName: string,
  ownerStack: readonly MetadataItemOwnerContextEntry[]
): ConfigurationContextWithExportToXML =>
  withExportToXMLItemsTree(
    {
      defaultLanguage: "ru",
      version: "2.20",
      exportToXML: {
        itemsTree: [],
        configDumpInfo: new Map(),
        version: "2.20",
        context: {
          forms: [],
          templates: [],
          parentName,
          metadataForNumbering: [],
        },
      },
    },
    ownerStack
  )
```

- [ ] **Step 4: Update metadata round-trip to use item name and owners**

Change the `roundTripOne` parameter type to include:

```ts
  itemName: string
  ownerStack: readonly MetadataItemOwnerContextEntry[]
```

Inside `roundTripOne`, replace:

```ts
    context: makeContextToYAML(),
```

with:

```ts
    context: makeContextToYAML(params.ownerStack),
```

Replace:

```ts
    context: makeContextFromYAML(),
    yaml: yamlObjectFromText,
    rule: params.rule,
    name: params.parentName,
```

with:

```ts
    context: makeContextFromYAML(params.ownerStack),
    yaml: yamlObjectFromText,
    rule: params.rule,
    name: params.itemName,
```

Replace:

```ts
    context: makeContextToXML(params.parentName),
```

with:

```ts
    context: makeContextToXML(params.parentName, params.ownerStack),
```

- [ ] **Step 5: Update form round-trip to use owners**

Change the `roundTripFormOne` parameter type to include:

```ts
  itemName: string
  ownerStack: readonly MetadataItemOwnerContextEntry[]
```

Replace:

```ts
  const { yaml: yamlObject } = exportClientApplicationFormToYAML(makeContextToYAML(), form)
```

with:

```ts
  const { yaml: yamlObject } = exportClientApplicationFormToYAML(makeContextToYAML(params.ownerStack), form)
```

Replace:

```ts
    makeContextFromYAML(),
```

with:

```ts
    makeContextFromYAML(params.ownerStack),
```

Replace:

```ts
  const contextToXML = makeContextToXML(params.parentName)
```

with:

```ts
  const contextToXML = makeContextToXML(params.parentName, params.ownerStack)
```

- [ ] **Step 6: Store owner stacks in discovered entries**

In `addFormEntries`, add these fields to the pushed object:

```ts
      itemName: params.parentName,
      ownerStack: params.ownerStack,
```

Update the `addFormEntries` parameter type with:

```ts
  ownerStack: readonly MetadataItemOwnerContextEntry[]
```

In `addMetadataEntryWithChildren`, push metadata entries with:

```ts
    itemName: params.itemName,
    ownerStack: params.ownerStack,
```

In the `addFormEntries` call, pass:

```ts
    ownerStack: appendMetadataItemOwner(params.ownerStack, params.rule.itemType, params.itemName),
```

Before iterating child collections, add:

```ts
  const childOwnerStack = appendMetadataItemOwner(params.ownerStack, params.rule.itemType, params.itemName)
```

In the recursive `addMetadataEntryWithChildren` call for child file-items, pass:

```ts
        ownerStack: childOwnerStack,
```

In the configuration root entry inside `listRoundTripEntries`, add:

```ts
      itemName: "",
      ownerStack: [],
```

In the top-level `addMetadataEntryWithChildren` call inside `listRoundTripEntries`, add:

```ts
        ownerStack: [],
```

- [ ] **Step 7: Run targeted tests**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 8: Commit implementation**

```bash
git add packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.ts
git commit -m "fix: :bug: передать контекст владельцев в yaml-fast"
```

### Task 5: Verify Skill-Level Behavior On The Real Round-Trip Tree

**Files:**
- Modify: none unless tests reveal a real metadata issue outside this plan
- Test: `.agents/skills/round-trip-yaml-fast/round-trip.sh`

- [ ] **Step 1: Run the fast skill on the known failing tree**

Run:

```bash
./.agents/skills/round-trip-yaml-fast/round-trip.sh --triage --batch-size 10
```

Expected: the previous false failures disappear:

- no diff for `ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаПоУмолчанию.xml` caused only by missing `ВнешнийИсточникДанныхВсеСвойства`;
- no diff for `ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаМодульНабора.xml` caused only by missing `ВнешнийИсточникДанныхВсеСвойства`;
- no diff for `ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства/DimensionTables/ТаблицаИзмеренияВсеСвойства.xml` caused only by missing `ВнешнийИсточникДанныхВсеСвойства.КубВсеСвойства`;
- no diff for `ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства/DimensionTables/ТаблицаИзмеренияПоУмолчанию.xml` caused only by missing `ВнешнийИсточникДанныхВсеСвойства.КубВсеСвойства`;
- no diff for `ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Cubes/КубПоУмолчанию.xml` caused only by missing `ВнешнийИсточникДанныхВсеСвойства`;
- no errors containing `Неизвестный сегмент "Table"` or `Неизвестный сегмент "Cube"`.

If the sandbox blocks `tsx` IPC with `listen EPERM`, rerun the same command with escalated permissions. Do not change code for the sandbox error.

- [ ] **Step 2: Run package tests**

Run:

```bash
pnpm --dir packages/core test -- --runInBand
```

Expected: if `--runInBand` is not accepted by Vitest in this project, rerun the supported command:

```bash
pnpm --dir packages/core test
```

Expected: PASS.

- [ ] **Step 3: Run full project tests before closing**

Run from repository root:

```bash
pnpm test
```

Expected: PASS for all packages.

- [ ] **Step 4: Check git status**

Run:

```bash
git status --short
```

Expected: only intentional source/test files are modified, or the tree is clean if all commits have been made.

- [ ] **Step 5: Commit verification fallout only if needed**

If Task 5 reveals a small required source/test correction, commit it:

```bash
git add packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.ts packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts packages/core/metadata/orchestration/appliedObject/convertFromXML.ts packages/core/metadata/orchestration/appliedObject/metadataItemOwnerContext.ts
git commit -m "fix: :bug: стабилизировать общий контекст yaml-fast"
```

If no files changed, do not create an empty commit.

## Self-Review

Spec coverage:

- Shared owner/path context: Task 1 creates the helper; Task 2 uses it in the working import path; Task 4 uses it in `roundTripYAMLFast`.
- No one-off `InternalInfo` or `metadataTargets` relaxations: no task edits those files.
- Child file-item coverage preserved: Task 4 keeps recursive discovery and only adds context.
- Existing XML fixtures unchanged: tests copy fixtures to temp directories.
- Error prevention: Task 3 and Task 5 verify the current five false diffs and two owner-context errors.
- Full verification: Task 5 runs targeted skill, package tests, and root `pnpm test`.

Placeholder scan:

- No `TBD`, `TODO`, or open-ended implementation steps remain.
- Every code-changing step includes exact code or exact replacement text.

Type consistency:

- The owner stack type is consistently named `MetadataItemOwnerContextEntry`.
- Context helper function names match across tasks: `appendMetadataItemOwner`, `withExportMetadataTargetOwners`, `withImportMetadataTargetOwners`, `withExportToXMLItemsTree`.
- In the working `convertFromXML` recursion the already-augmented context receives only the current owner, while `ownerStack` carries the full stack for descendants. In `roundTripYAMLFast` contexts are built from scratch and receive the full ancestor stack.
