# round-trip-yaml-fast Complete Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `round-trip-yaml-fast` cover top-level metadata XML, recursive file-item XML, and all discovered form XML pairs through the same rule structure used by `nkdk import`.

**Architecture:** Replace the current top-level-only `listRoundTripEntries` scan with a recursive rule walker driven by `MetadataItemRule.childCollections`, `fileItemRule`, `xmlDir`, and `ChildFormNames`. Keep the existing in-memory XML -> model -> YAML text -> model -> XML comparison, and add only entry discovery plus shell wrapper visibility for `checked`.

**Tech Stack:** TypeScript, Vitest, Node `fs/path`, existing metadata orchestration rules, Bash wrapper.

---

## File Structure

- Modify `packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.ts`
  - Responsibility: build round-trip entries and execute existing in-memory round-trip checks.
  - Add small helpers for rule-driven recursive discovery; do not add a filesystem glob over every XML.
- Modify `packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts`
  - Responsibility: prove recursive file-item XML and nested forms are discovered.
  - Reuse local XML fixtures under `metadataExternalDataSource/__fixtures__/sync/xml`.
- Modify `.agents/skills/round-trip-yaml-fast/round-trip.sh`
  - Responsibility: show the hidden `checked` count from CLI output.

## Task 1: Failing Coverage Test For Recursive File-Item Entries

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts`

- [ ] **Step 1: Add fixture copy helper imports**

Update the import block:

```ts
import fs from "fs"
import os from "os"
import { dirname, join } from "path"
import { describe, expect, it } from "vitest"
import { roundTripYAMLFast } from "./roundTripYAMLFast"
```

- [ ] **Step 2: Add fixture project helper**

Add this helper before `describe("roundTripYAMLFast", () => {`:

```ts
const externalDataSourceFixtureRoot = join(
  import.meta.dirname,
  "../metadataExternalDataSource/__fixtures__/sync/xml/ВнешнийИсточникДанныхВсеСвойства"
)

const makeExternalDataSourceFixtureProject = (): string => {
  const dir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-round-trip-yaml-fast-eds-"))
  const sourceRootXml = `${externalDataSourceFixtureRoot}.xml`
  const targetRootXml = join(dir, "ExternalDataSources", "ВнешнийИсточникДанныхВсеСвойства.xml")
  fs.mkdirSync(dirname(targetRootXml), { recursive: true })
  fs.copyFileSync(sourceRootXml, targetRootXml)
  fs.cpSync(externalDataSourceFixtureRoot, join(dir, "ExternalDataSources", "ВнешнийИсточникДанныхВсеСвойства"), {
    recursive: true,
  })
  return dir
}

const corruptFixtureFile = (xmlDir: string, relativePath: string): void => {
  fs.writeFileSync(join(xmlDir, relativePath), "<broken>", "utf-8")
}
```

- [ ] **Step 3: Write failing test for recursive entries**

Add this test at the end of the current `describe` block:

```ts
it("checks external data source file-item XML and nested form XML through childCollections", async () => {
  const xmlDir = makeExternalDataSourceFixtureProject()
  try {
    corruptFixtureFile(xmlDir, "ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаПоУмолчанию.xml")
    corruptFixtureFile(xmlDir, "ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Cubes/КубПоУмолчанию.xml")
    corruptFixtureFile(
      xmlDir,
      "ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства/DimensionTables/ТаблицаИзмеренияВсеСвойства.xml"
    )
    corruptFixtureFile(
      xmlDir,
      "ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаВсеСвойства/Forms/ФормаСписка/Ext/Form.xml"
    )
    corruptFixtureFile(
      xmlDir,
      "ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства/Forms/ФормаСписка/Ext/Form.xml"
    )

    const result = await roundTripYAMLFast({ inputDir: xmlDir })
    const files = [...result.diffs.map((diff) => diff.file), ...result.errors.map((error) => error.file)]

    expect(result.checked).toBeGreaterThan(1)
    expect(files).toContain("ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаПоУмолчанию.xml")
    expect(files).toContain("ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Cubes/КубПоУмолчанию.xml")
    expect(files).toContain(
      "ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства/DimensionTables/ТаблицаИзмеренияВсеСвойства.xml"
    )
    expect(files).toContain(
      "ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаВсеСвойства/Forms/ФормаСписка/Ext/Form.xml"
    )
    expect(files).toContain(
      "ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства/Forms/ФормаСписка/Ext/Form.xml"
    )
  } finally {
    fs.rmSync(xmlDir, { recursive: true, force: true })
  }
})
```

This test intentionally corrupts selected leaf files after copying the fixture. Its purpose is discovery coverage: before implementation, those nested paths are absent from `errors`.

- [ ] **Step 4: Run test and verify failure**

Run:

```bash
pnpm --dir packages/core exec vitest run --no-isolate metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts
```

Expected: FAIL in the new test because `files` does not contain nested `Tables`, `Cubes`, `DimensionTables`, or nested form paths.

- [ ] **Step 5: Commit failing test**

```bash
git add packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts
git commit -m "test: 🧪 зафиксировать полное покрытие round-trip-yaml-fast"
```

## Task 2: Rule-Driven Recursive Entry Walker

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.ts`
- Test: `packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts`

- [ ] **Step 1: Add imports for child collection path helpers**

Update imports near the top:

```ts
import fs from "fs"
import { XMLValidator } from "fast-xml-parser"
import { basename, dirname, join, relative } from "path"
import {
  normalizeFileItemCollectionItems,
  resolveChildCollectionDir,
} from "~/metadata/orchestration/appliedObject/fileItemChildCollections"
```

Keep all existing imports.

- [ ] **Step 2: Add helper types**

Add after `type MetadataXMLRoot = { MetaDataObject: unknown }`:

```ts
type MetadataModelRecord = Record<string, unknown>

type MetadataEntryParams = {
  inputDir: string
  file: string
  xmlFileAbs: string
  rule: MetadataItemRule
  parentName: string
  xmlDirAbs: string
  itemName: string
}
```

- [ ] **Step 3: Add XML import helper**

Add before `const listRoundTripEntries = (inputDir: string): RoundTripEntry[] => {`:

```ts
const importMetadataModelForDiscovery = (params: {
  xmlFileAbs: string
  rule: MetadataItemRule
}): MetadataModelRecord | undefined => {
  const originalXml = fs.readFileSync(params.xmlFileAbs, "utf-8")
  const validationResult = XMLValidator.validate(originalXml)
  if (validationResult !== true) return undefined
  const parsed = importContentFromXML<MetadataXMLRoot>(originalXml)
  const model = importMetadataItemFromXML({
    context: makeContextFromXML(true),
    xml: parsed.MetaDataObject,
    rule: params.rule,
  })
  if (!model || typeof model !== "object") return undefined
  return model as MetadataModelRecord
}
```

Discovery should not throw here: malformed XML remains handled by the existing per-entry round-trip execution after the entry is added.

- [ ] **Step 4: Add form entry collector**

Add after `importMetadataModelForDiscovery`:

```ts
const addFormEntries = (params: {
  entries: RoundTripEntry[]
  inputDir: string
  ownerDirAbs: string
  parentName: string
}): void => {
  const formsDir = join(params.ownerDirAbs, "Forms")
  if (!fs.existsSync(formsDir)) return

  for (const formEntry of fs.readdirSync(formsDir, { withFileTypes: true })) {
    if (!formEntry.isFile() || !formEntry.name.toLowerCase().endsWith(".xml")) continue
    const formName = basename(formEntry.name, ".xml")
    const metadataFileAbs = join(formsDir, formEntry.name)
    const formXmlFileAbs = join(formsDir, formName, "Ext", "Form.xml")
    if (!fs.existsSync(formXmlFileAbs)) continue

    params.entries.push({
      kind: "form",
      file: toPosixPath(relative(params.inputDir, formXmlFileAbs)),
      xmlFileAbs: formXmlFileAbs,
      metadataFile: toPosixPath(relative(params.inputDir, metadataFileAbs)),
      formXmlFile: toPosixPath(relative(params.inputDir, formXmlFileAbs)),
      formsDir,
      formName,
      parentName: params.parentName,
    })
  }
}
```

- [ ] **Step 5: Add recursive metadata entry collector**

Add after `addFormEntries`:

```ts
const addMetadataEntryWithChildren = (params: MetadataEntryParams & { entries: RoundTripEntry[] }): void => {
  params.entries.push({
    kind: "metadata",
    file: params.file,
    xmlFileAbs: params.xmlFileAbs,
    rule: params.rule,
    parentName: params.parentName,
  })

  addFormEntries({
    entries: params.entries,
    inputDir: params.inputDir,
    ownerDirAbs: join(params.xmlDirAbs, params.itemName),
    parentName: params.itemName,
  })

  const model = importMetadataModelForDiscovery({ xmlFileAbs: params.xmlFileAbs, rule: params.rule })
  if (model === undefined) return

  for (const childCollection of params.rule.childCollections ?? []) {
    if (!childCollection.fileItemRule || !childCollection.xmlDir) continue
    const childItems = normalizeFileItemCollectionItems(model[childCollection.propertyKey])
    for (const childItem of childItems) {
      const childDir = resolveChildCollectionDir(childCollection.xmlDir, childItem.name, params.itemName)
      const childXmlBaseAbs = join(params.xmlDirAbs, params.itemName, childDir)
      const childXmlFileAbs = `${childXmlBaseAbs}.xml`
      if (!fs.existsSync(childXmlFileAbs)) continue

      addMetadataEntryWithChildren({
        entries: params.entries,
        inputDir: params.inputDir,
        file: toPosixPath(relative(params.inputDir, childXmlFileAbs)),
        xmlFileAbs: childXmlFileAbs,
        rule: childCollection.fileItemRule,
        parentName: params.itemName,
        xmlDirAbs: dirname(childXmlBaseAbs),
        itemName: childItem.name,
      })
    }
  }
}
```

- [ ] **Step 6: Replace top-level scan with recursive collector**

Replace the current loop inside `listRoundTripEntries` after the `Configuration.xml` block with:

```ts
for (const rule of TopLevelMetadataItemRules) {
  if (rule.xmlDir === undefined) continue
  const dir = join(inputDir, rule.xmlDir)
  if (!fs.existsSync(dir)) continue

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".xml")) continue
    const xmlFileAbs = join(dir, entry.name)
    const itemName = basename(entry.name, ".xml")

    addMetadataEntryWithChildren({
      entries,
      inputDir,
      file: toPosixPath(relative(inputDir, xmlFileAbs)),
      xmlFileAbs,
      rule,
      parentName: itemName,
      xmlDirAbs: dir,
      itemName,
    })
  }
}
```

Remove the old inline form scan from `listRoundTripEntries`.

- [ ] **Step 7: Run focused test**

Run:

```bash
pnpm --dir packages/core exec vitest run --no-isolate metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts
```

Expected: PASS. The copied fixture keeps the root and `КубВсеСвойства.xml` valid so recursion can reach `DimensionTables`, while the intentionally corrupted leaf files prove the walker includes each required path.

- [ ] **Step 8: Commit implementation**

```bash
git add packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.ts packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts
git commit -m "feat: ✨ покрыть вложенные file-item в round-trip-yaml-fast"
```

## Task 3: Show Checked Count In Shell Wrapper

**Files:**
- Modify: `.agents/skills/round-trip-yaml-fast/round-trip.sh`

- [ ] **Step 1: Extract checked count**

After the existing `DIFF_COUNT` block, add:

```bash
CHECKED_COUNT="$(
  awk '
    /^checked: / { sub(/^checked: /, ""); print; exit }
  ' "${OUTPUT_FILE}"
)"
CHECKED_COUNT="${CHECKED_COUNT:-0}"
is_positive_integer "${CHECKED_COUNT}" || [ "${CHECKED_COUNT}" = "0" ] || die "не удалось прочитать checked"
```

- [ ] **Step 2: Print checked count**

After:

```bash
echo "=== ACTIVE_XML_DIR ==="
echo "${NKDK_XML_DIR}"
echo ""
```

add:

```bash
echo "=== CHECKED ==="
echo "${CHECKED_COUNT}"
echo ""
```

- [ ] **Step 3: Smoke-test wrapper output**

Run:

```bash
./.agents/skills/round-trip-yaml-fast/round-trip.sh
```

Expected: output includes:

```text
=== CHECKED ===
<positive number>
```

If sandbox blocks `tsx` IPC under `/tmp`, rerun the same command with approved escalation. Do not change code to work around the sandbox.

- [ ] **Step 4: Commit wrapper change**

```bash
git add .agents/skills/round-trip-yaml-fast/round-trip.sh
git commit -m "chore: 🔧 показывать checked в round-trip-yaml-fast"
```

## Task 4: Full Verification

**Files:**
- Verify only; no code changes expected.

- [ ] **Step 1: Run focused core tests**

Run:

```bash
pnpm --dir packages/core exec vitest run --no-isolate metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts
```

Expected: all tests pass.

- [ ] **Step 2: Run fast round-trip on configured XML catalog**

Run:

```bash
./.agents/skills/round-trip-yaml-fast/round-trip.sh
```

Expected: output includes `=== CHECKED ===` with a count greater than the previous `247`, because recursive file-item XML and nested forms are now included. Diff count may be nonzero; if so, report the first diff through the existing skill format instead of fixing unrelated metadata rules in this task.

- [ ] **Step 3: Run full project tests**

Run:

```bash
pnpm test
```

Expected: all package tests pass.

- [ ] **Step 4: Inspect final git status**

Run:

```bash
git status --short
```

Expected: only intentional files are modified or committed. Do not revert unrelated pre-existing working tree changes.

## Self-Review

- Spec coverage: covered recursive file-item XML, nested forms, form metadata XML, shared rule source with `nkdk import`, no full import execution, wrapper `checked`, focused and full verification.
- Placeholder scan: no unfinished-marker strings and no unspecified edge handling.
- Type consistency: helper names and types match the existing `roundTripYAMLFast.ts` imports and `MetadataItemRule.childCollections` shape.
