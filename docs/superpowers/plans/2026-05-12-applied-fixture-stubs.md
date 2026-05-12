# Applied Fixture Stubs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create XML fixture stubs and `sync` folders for every non-excluded metadata object marked in the specification.

**Architecture:** Use the specification as the single source of truth for fixture selection. A temporary generator script parses the spec, validates conflicts, copies XML files from `/Users/nikita/git/roundTripElements`, creates empty YAML sync inputs, and verifies copied bytes. No metadata rules, tests, registrations, or YAML contracts are added.

**Tech Stack:** Node.js built-ins (`fs`, `path`, `crypto`), existing repository fixture layout under `packages/core/metadata/appliedObjects`.

---

## File Structure

- Read: `docs/superpowers/specs/2026-05-12-applied-fixture-stubs-design.md`
  Source of selected XML files. Every line with action other than `исключить` becomes a fixture.
- Create temporarily: `/private/tmp/create-applied-fixture-stubs.mjs`
  One-off generator used for validation, copying, and byte-for-byte verification. Do not commit this file.
- Create: `packages/core/metadata/appliedObjects/<metadataDir>/__fixtures__/*.xml`
  XML fixtures copied from `/Users/nikita/git/roundTripElements/<xmlDir>/*.xml`.
- Create: `packages/core/metadata/appliedObjects/<metadataDir>/__fixtures__/sync/data.ts`
  Empty YAML expectation export for future `convertFromXML` tests.
- Create: `packages/core/metadata/appliedObjects/<metadataDir>/__fixtures__/sync/xml/<ИмяВсеСвойства>.xml`
  Sync reference XML chosen from an included source whose original name contains `ВсеСвойства`.
- Create: `packages/core/metadata/appliedObjects/<metadataDir>/__fixtures__/sync/xml/<ИмяВсеСвойства>/**`
  Related XML external files copied with the same relative structure when the source export has an adjacent folder.
- Create: `packages/core/metadata/appliedObjects/<metadataDir>/__fixtures__/sync/nkdk/<ИмяВсеСвойства>/Свойства.yaml`
  Empty YAML input for future `syncToXML` tests.

Metadata directory mapping:

```text
AccountingRegisters -> metadataAccountingRegister
AccumulationRegisters -> metadataAccumulationRegister
Bots -> metadataBot
BusinessProcesses -> metadataBusinessProcess
CalculationRegisters -> metadataCalculationRegister
ChartsOfAccounts -> metadataChartOfAccounts
ChartsOfCalculationTypes -> metadataChartOfCalculationTypes
ChartsOfCharacteristicTypes -> metadataChartOfCharacteristicTypes
CommandGroups -> metadataCommandGroup
CommonAttributes -> metadataCommonAttribute
CommonForms -> metadataCommonForm
CommonPictures -> metadataCommonPicture
CommonTemplates -> metadataCommonTemplate
Constants -> metadataConstant
DataProcessors -> metadataDataProcessor
DefinedTypes -> metadataDefinedType
DocumentJournals -> metadataDocumentJournal
EventSubscriptions -> metadataEventSubscription
ExchangePlans -> metadataExchangePlan
ExternalDataSources -> metadataExternalDataSource
FilterCriteria -> metadataFilterCriterion
FunctionalOptions -> metadataFunctionalOption
FunctionalOptionsParameters -> metadataFunctionalOptionsParameter
HTTPServices -> metadataHTTPService
InformationRegisters -> metadataInformationRegister
IntegrationServices -> metadataIntegrationService
Languages -> metadataLanguage
Roles -> metadataRole
ScheduledJobs -> metadataScheduledJob
SessionParameters -> metadataSessionParameter
SettingsStorages -> metadataSettingsStorage
StyleItems -> metadataStyleItem
Styles -> metadataStyle
Subsystems -> metadataSubsystem
Tasks -> metadataTask
WSReferences -> metadataWSReference
WebServices -> metadataWebService
```

## Task 1: Create Temporary Generator

**Files:**
- Create: `/private/tmp/create-applied-fixture-stubs.mjs`

- [ ] **Step 1: Write the generator**

Create `/private/tmp/create-applied-fixture-stubs.mjs` with this complete content:

```javascript
import { createHash } from "node:crypto"
import fs from "node:fs"
import path from "node:path"

const repoRoot = "/Users/nikita/git/nakidka-core/.worktrees/applied-fixture-stubs"
const sourceRoot = "/Users/nikita/git/roundTripElements"
const specPath = path.join(repoRoot, "docs/superpowers/specs/2026-05-12-applied-fixture-stubs-design.md")
const outputRoot = path.join(repoRoot, "packages/core/metadata/appliedObjects")

const metadataDirs = {
  AccountingRegisters: "metadataAccountingRegister",
  AccumulationRegisters: "metadataAccumulationRegister",
  Bots: "metadataBot",
  BusinessProcesses: "metadataBusinessProcess",
  CalculationRegisters: "metadataCalculationRegister",
  ChartsOfAccounts: "metadataChartOfAccounts",
  ChartsOfCalculationTypes: "metadataChartOfCalculationTypes",
  ChartsOfCharacteristicTypes: "metadataChartOfCharacteristicTypes",
  CommandGroups: "metadataCommandGroup",
  CommonAttributes: "metadataCommonAttribute",
  CommonForms: "metadataCommonForm",
  CommonPictures: "metadataCommonPicture",
  CommonTemplates: "metadataCommonTemplate",
  Constants: "metadataConstant",
  DataProcessors: "metadataDataProcessor",
  DefinedTypes: "metadataDefinedType",
  DocumentJournals: "metadataDocumentJournal",
  EventSubscriptions: "metadataEventSubscription",
  ExchangePlans: "metadataExchangePlan",
  ExternalDataSources: "metadataExternalDataSource",
  FilterCriteria: "metadataFilterCriterion",
  FunctionalOptions: "metadataFunctionalOption",
  FunctionalOptionsParameters: "metadataFunctionalOptionsParameter",
  HTTPServices: "metadataHTTPService",
  InformationRegisters: "metadataInformationRegister",
  IntegrationServices: "metadataIntegrationService",
  Languages: "metadataLanguage",
  Roles: "metadataRole",
  ScheduledJobs: "metadataScheduledJob",
  SessionParameters: "metadataSessionParameter",
  SettingsStorages: "metadataSettingsStorage",
  StyleItems: "metadataStyleItem",
  Styles: "metadataStyle",
  Subsystems: "metadataSubsystem",
  Tasks: "metadataTask",
  WSReferences: "metadataWSReference",
  WebServices: "metadataWebService",
}

const mode = process.argv.includes("--write") ? "write" : "check"

function readSelections() {
  const selections = []
  let section = ""
  for (const line of fs.readFileSync(specPath, "utf8").split("\n")) {
    const heading = line.match(/^### (.+)$/)
    if (heading) {
      section = heading[1]
      continue
    }
    const item = line.match(/^- (.+) - (.+)$/)
    if (!item || !section || item[2] === "исключить") continue
    selections.push({ xmlDir: section, sourceName: item[1], targetName: item[2] })
  }
  return selections
}

function hashFile(filePath) {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex")
}

function isUnsafePathComponent(value) {
  return (
    value === "" ||
    path.posix.isAbsolute(value) ||
    path.win32.isAbsolute(value) ||
    value.includes("/") ||
    value.includes("\\") ||
    value.includes("..")
  )
}

function copyDirWithoutTrash(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) return
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (entry.name === ".DS_Store") continue
    const sourcePath = path.join(sourceDir, entry.name)
    const targetPath = path.join(targetDir, entry.name)
    if (entry.isDirectory()) {
      fs.mkdirSync(targetPath, { recursive: true })
      copyDirWithoutTrash(sourcePath, targetPath)
    } else if (entry.isFile()) {
      fs.mkdirSync(path.dirname(targetPath), { recursive: true })
      fs.copyFileSync(sourcePath, targetPath)
    }
  }
}

function listFilesWithoutTrash(sourceDir, baseDir = sourceDir) {
  if (!fs.existsSync(sourceDir)) return []
  const files = []
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (entry.name === ".DS_Store") continue
    const sourcePath = path.join(sourceDir, entry.name)
    if (entry.isDirectory()) {
      files.push(...listFilesWithoutTrash(sourcePath, baseDir))
    } else if (entry.isFile()) {
      files.push(path.relative(baseDir, sourcePath))
    }
  }
  return files
}

function yamlExportName(metadataDir) {
  const base = metadataDir.replace(/^metadata/, "")
  return `read${base}YAML`
}

function groupByXmlDir(selections) {
  const grouped = new Map()
  for (const selection of selections) {
    const items = grouped.get(selection.xmlDir) ?? []
    items.push(selection)
    grouped.set(selection.xmlDir, items)
  }
  return grouped
}

function validate(selections) {
  const errors = []
  const bySection = groupByXmlDir(selections)

  for (const [xmlDir, items] of bySection) {
    if (!metadataDirs[xmlDir]) {
      errors.push(`No metadata directory mapping for ${xmlDir}`)
      continue
    }

    const targetNames = new Map()
    for (const item of items) {
      const sourceFile = path.join(sourceRoot, xmlDir, `${item.sourceName}.xml`)
      if (isUnsafePathComponent(item.sourceName)) errors.push(`Unsafe source name: ${xmlDir}/${item.sourceName}`)
      if (isUnsafePathComponent(item.targetName)) errors.push(`Unsafe target name: ${xmlDir}/${item.sourceName} -> ${item.targetName}`)
      if (!fs.existsSync(sourceFile)) errors.push(`Missing source XML: ${sourceFile}`)
      if (!item.targetName.endsWith(".xml")) errors.push(`Target must end with .xml: ${xmlDir}/${item.sourceName} -> ${item.targetName}`)
      const duplicate = targetNames.get(item.targetName)
      if (duplicate) errors.push(`Duplicate target in ${xmlDir}: ${duplicate} and ${item.sourceName} both map to ${item.targetName}`)
      targetNames.set(item.targetName, item.sourceName)
    }
  }

  return errors
}

function writeFixtures(selections) {
  const bySection = groupByXmlDir(selections)
  const report = []

  for (const [xmlDir, items] of bySection) {
    const metadataDir = metadataDirs[xmlDir]
    const fixtureDir = path.join(outputRoot, metadataDir, "__fixtures__")
    fs.mkdirSync(fixtureDir, { recursive: true })

    for (const item of items) {
      const sourceFile = path.join(sourceRoot, xmlDir, `${item.sourceName}.xml`)
      const targetFile = path.join(fixtureDir, item.targetName)
      fs.copyFileSync(sourceFile, targetFile)
      report.push(`fixture ${xmlDir}/${item.sourceName}.xml -> ${path.relative(repoRoot, targetFile)}`)
    }

    const syncCandidates = items.filter((item) => item.sourceName.includes("ВсеСвойства"))
    if (syncCandidates.length === 0) {
      report.push(`sync skipped ${xmlDir}: no included source contains ВсеСвойства`)
      continue
    }
    const syncSource = syncCandidates[0]
    if (syncCandidates.length > 1) {
      report.push(`sync selected ${xmlDir}/${syncSource.sourceName}.xml among ${syncCandidates.map((item) => item.sourceName).join(", ")}`)
    }

    const syncRoot = path.join(fixtureDir, "sync")
    const syncXmlDir = path.join(syncRoot, "xml")
    const syncNkdkDir = path.join(syncRoot, "nkdk", syncSource.sourceName)
    fs.mkdirSync(syncXmlDir, { recursive: true })
    fs.mkdirSync(syncNkdkDir, { recursive: true })

    fs.copyFileSync(
      path.join(sourceRoot, xmlDir, `${syncSource.sourceName}.xml`),
      path.join(syncXmlDir, `${syncSource.sourceName}.xml`),
    )
    copyDirWithoutTrash(path.join(sourceRoot, xmlDir, syncSource.sourceName), path.join(syncXmlDir, syncSource.sourceName))

    fs.writeFileSync(path.join(syncNkdkDir, "Свойства.yaml"), "")
    fs.writeFileSync(path.join(syncRoot, "data.ts"), `export const ${yamlExportName(metadataDir)} = ""\n`)
    report.push(`sync ${xmlDir}/${syncSource.sourceName}.xml -> ${path.relative(repoRoot, syncRoot)}`)
  }

  return report
}

function verifyHash(sourceFile, targetFile, errors) {
  if (!fs.existsSync(targetFile)) {
    errors.push(`Missing copied file: ${targetFile}`)
    return
  }
  if (hashFile(sourceFile) !== hashFile(targetFile)) {
    errors.push(`Hash mismatch: ${sourceFile} -> ${targetFile}`)
  }
}

function verifyCopiedFiles(selections) {
  const bySection = groupByXmlDir(selections)
  const errors = []

  for (const [xmlDir, items] of bySection) {
    const metadataDir = metadataDirs[xmlDir]
    const fixtureDir = path.join(outputRoot, metadataDir, "__fixtures__")
    for (const item of items) {
      const sourceFile = path.join(sourceRoot, xmlDir, `${item.sourceName}.xml`)
      const targetFile = path.join(fixtureDir, item.targetName)
      verifyHash(sourceFile, targetFile, errors)
    }

    const syncCandidates = items.filter((item) => item.sourceName.includes("ВсеСвойства"))
    if (syncCandidates.length === 0) continue

    const syncSource = syncCandidates[0]
    const syncXmlDir = path.join(fixtureDir, "sync", "xml")
    verifyHash(
      path.join(sourceRoot, xmlDir, `${syncSource.sourceName}.xml`),
      path.join(syncXmlDir, `${syncSource.sourceName}.xml`),
      errors,
    )

    const sourceDir = path.join(sourceRoot, xmlDir, syncSource.sourceName)
    for (const relativeFile of listFilesWithoutTrash(sourceDir)) {
      const sourceFile = path.join(sourceDir, relativeFile)
      const targetFile = path.join(syncXmlDir, syncSource.sourceName, relativeFile)
      verifyHash(sourceFile, targetFile, errors)
    }
  }

  return errors
}

const selections = readSelections()
const validationErrors = validate(selections)
if (validationErrors.length > 0) {
  console.error(validationErrors.join("\n"))
  process.exit(1)
}

if (mode === "check") {
  console.log(`OK: ${selections.length} fixture selections validated`)
  process.exit(0)
}

const report = writeFixtures(selections)
const verifyErrors = verifyCopiedFiles(selections)
if (verifyErrors.length > 0) {
  console.error(verifyErrors.join("\n"))
  process.exit(1)
}

console.log(report.join("\n"))
console.log(`OK: wrote and verified ${selections.length} fixture files`)
```

- [ ] **Step 2: Run the generator in check mode**

Run:

```bash
node /private/tmp/create-applied-fixture-stubs.mjs
```

Expected before copying:

```text
OK: 85 fixture selections validated
```

- [ ] **Step 3: Stop on any validation error**

If the generator prints any validation error, do not copy fixtures. Fix the exact line in `docs/superpowers/specs/2026-05-12-applied-fixture-stubs-design.md`, then rerun Step 2.

- [ ] **Step 4: Confirm FunctionalOptions selection**

Run:

```bash
rg -n 'ФункциональнаяОпцияВсеСвойства|ФункциональныеОпцииПолный' docs/superpowers/specs/2026-05-12-applied-fixture-stubs-design.md
```

Expected:

```text
ФункциональнаяОпцияВсеСвойства - full.xml
ФункциональныеОпцииПолный - исключить
```

- [ ] **Step 5: Commit spec correction if Step 3 changed it**

Run only if Step 3 changed the spec:

```bash
git add docs/superpowers/specs/2026-05-12-applied-fixture-stubs-design.md
git commit -m "docs: :memo: уточнить выбор функциональной опции"
```

Expected: commit succeeds, or `git status --short` is empty if Step 3 was not needed.

- [ ] **Step 6: Re-run check mode after any spec correction**

Run:

```bash
node /private/tmp/create-applied-fixture-stubs.mjs
```

Expected:

```text
OK: 85 fixture selections validated
```

## Task 2: Generate Fixture Files

**Files:**
- Create: `packages/core/metadata/appliedObjects/*/__fixtures__/*.xml`
- Create: `packages/core/metadata/appliedObjects/*/__fixtures__/sync/data.ts`
- Create: `packages/core/metadata/appliedObjects/*/__fixtures__/sync/xml/**`
- Create: `packages/core/metadata/appliedObjects/*/__fixtures__/sync/nkdk/*/Свойства.yaml`

- [ ] **Step 1: Run generator in write mode**

Run:

```bash
node /private/tmp/create-applied-fixture-stubs.mjs --write
```

Expected:

```text
fixture AccountingRegisters/РегистрБухгалтерииВсеСвойстваОбороты.xml -> packages/core/metadata/appliedObjects/metadataAccountingRegister/__fixtures__/full.xml
...
OK: wrote and verified 85 fixture files
```

- [ ] **Step 2: Inspect created directories**

Run:

```bash
find packages/core/metadata/appliedObjects -path '*/__fixtures__/*' -type f | sort | rg 'metadata(Accounting|Accumulation|Bot|Business|Calculation|Chart|CommandGroup|Common|Constant|DataProcessor|Defined|DocumentJournal|EventSubscription|ExchangePlan|ExternalDataSource|FilterCriterion|Functional|HTTP|Information|Integration|Language|Role|Scheduled|Session|Settings|Style|Subsystem|Task|WS|Web)'
```

Expected: output lists only new fixture files under the new `metadata*` directories. It must not list `.DS_Store`.

- [ ] **Step 3: Check sync YAML files are empty**

Run:

```bash
find packages/core/metadata/appliedObjects -path '*/__fixtures__/sync/nkdk/*/Свойства.yaml' -type f -size 0 | wc -l
```

Expected: the number equals the number of generated `sync` folders. If it is lower, inspect the non-empty files with:

```bash
find packages/core/metadata/appliedObjects -path '*/__fixtures__/sync/nkdk/*/Свойства.yaml' -type f ! -size 0
```

- [ ] **Step 4: Commit generated fixture files**

Run:

```bash
git add packages/core/metadata/appliedObjects
git commit -m "test: :white_check_mark: добавить заготовки applied-фикстур"
```

Expected: commit succeeds and contains only fixture files under `packages/core/metadata/appliedObjects`.

## Task 3: Verify Repository State

**Files:**
- Read: `packages/core/metadata/appliedObjects/**`
- Read: `docs/superpowers/specs/2026-05-12-applied-fixture-stubs-design.md`

- [ ] **Step 1: Verify no macOS service files were copied**

Run:

```bash
find packages/core/metadata/appliedObjects -name .DS_Store -print
```

Expected: no output.

- [ ] **Step 2: Verify sync sources use `ВсеСвойства`**

Run:

```bash
find packages/core/metadata/appliedObjects -path '*/__fixtures__/sync/xml/*.xml' -type f | sort
```

Expected: every listed XML basename contains `ВсеСвойства`. Directories with no included `ВсеСвойства`, such as `metadataLanguage`, must not have `__fixtures__/sync`.

- [ ] **Step 3: Verify no code or registry files were changed**

Run:

```bash
git show --stat --oneline HEAD
git diff --name-only HEAD~1..HEAD | rg -v '^packages/core/metadata/appliedObjects/.*/__fixtures__/'
```

Expected: first command shows fixture files; second command prints no file paths for the fixture commit.

- [ ] **Step 4: Run a lightweight repository check**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataEnumeration/fromXML.test.ts
```

Expected: existing metadata test passes. This does not test new objects; it confirms the workspace still runs Vitest after adding fixture-only directories.

- [ ] **Step 5: Report result**

Summarize:

```text
Created fixture stubs for <count> metadata directories.
Created <count> XML fixture files.
Created sync folders for <count> directories with included ВсеСвойства sources.
Skipped sync for <list> because no included source contains ВсеСвойства.
No rules, tests, registries, or YAML contracts were added.
```

## Self-Review

- Spec coverage: Tasks parse the spec, copy every non-`исключить` XML, create `sync` from included `ВсеСвойства`, keep YAML empty, avoid `.DS_Store`, and avoid metadata implementation files.
- Placeholder scan: no task relies on unspecified code or unnamed validation.
- Type consistency: the generator uses `xmlDir`, `sourceName`, `targetName`, and `metadataDir` consistently across validation, copy, and verification.
