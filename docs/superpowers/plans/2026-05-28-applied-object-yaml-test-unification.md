# Applied Object YAML Test Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one shared applied-object YAML test harness and use it to cover objects that already have `rules.ts` but lack complete YAML tests.

**Architecture:** Put shared test data and generic tests under `packages/core/metadata/appliedObjects/__tests__/`. Keep object-specific behavior tests next to objects; the shared harness covers only generic model YAML round-trip and file sync cycles.

**Tech Stack:** TypeScript, Vitest, existing `~/tests/appliedObject` helpers, existing metadata `rules.ts` declarations.

---

## File Structure

- Create `packages/core/metadata/appliedObjects/__tests__/yamlFixtures.ts`
  - Owns the table of applied-object scenarios.
  - Imports object rules and sync YAML constants.
  - Exposes helper selectors so tests can filter model and sync scenarios.

- Create `packages/core/metadata/appliedObjects/__tests__/yamlRoundTrip.test.ts`
  - Runs generic `XML fixture -> model -> YAML -> model -> YAML` checks.
  - Compares parsed YAML objects, not string formatting.

- Create `packages/core/metadata/appliedObjects/__tests__/syncRoundTrip.test.ts`
  - Runs generic `XML -> YAML project` and `YAML project -> XML` checks for scenarios that have sync fixtures.
  - Uses existing `testConvertAppliedObjectFromXML` and `testSyncAppliedObjectToXML`.
  - Discovers expected XML files from `__fixtures__/sync/xml` to avoid per-object copy-paste.

- Modify existing `packages/core/metadata/appliedObjects/*/__fixtures__/sync/data.ts`
  - Replace empty expected YAML strings for newly covered objects with actual `Свойства.yaml` contents.

- Modify `packages/core/metadata/appliedObjects/*/rules.ts` only when a generic test exposes an obvious YAML default or XML-only/YAML-only annotation.

---

### Task 1: Add Shared Fixture Table With Pilot Objects

**Files:**
- Create: `packages/core/metadata/appliedObjects/__tests__/yamlFixtures.ts`
- Test: `packages/core/metadata/appliedObjects/__tests__/yamlFixtures.ts`

- [ ] **Step 1: Create the fixture table**

Create `packages/core/metadata/appliedObjects/__tests__/yamlFixtures.ts` with this initial content:

```ts
import type { MetadataItemRule } from "~/metadata/orchestration"
import { MetadataAccumulationRegisterRules } from "../metadataAccumulationRegister/rules"
import { readAccumulationRegisterYAML } from "../metadataAccumulationRegister/__fixtures__/sync/data"
import { MetadataInformationRegisterRules } from "../metadataInformationRegister/rules"
import { readInformationRegisterYAML } from "../metadataInformationRegister/__fixtures__/sync/data"

export type AppliedObjectModelFixture = {
  fixture: string
  name: string
}

export type AppliedObjectSyncFixture = {
  name: string
  expectedYAML: string
  externalObjectDir?: boolean
}

export type AppliedObjectYAMLFixture = {
  group: string
  rule: MetadataItemRule
  importMetaUrl: string
  modelFixtures: AppliedObjectModelFixture[]
  sync?: AppliedObjectSyncFixture
}

export const appliedObjectYAMLFixtures = [
  {
    group: "metadataAccumulationRegister",
    rule: MetadataAccumulationRegisterRules,
    importMetaUrl: import.meta.resolve("../metadataAccumulationRegister/rules.ts"),
    modelFixtures: [
      { fixture: "full.xml", name: "РегистрНакопленияВсеСвойстваОбороты" },
      { fixture: "minimal.xml", name: "РегистрНакопленияПоУмолчанию" },
    ],
    sync: {
      name: "РегистрНакопленияВсеСвойстваОбороты",
      expectedYAML: readAccumulationRegisterYAML,
      externalObjectDir: true,
    },
  },
  {
    group: "metadataInformationRegister",
    rule: MetadataInformationRegisterRules,
    importMetaUrl: import.meta.resolve("../metadataInformationRegister/rules.ts"),
    modelFixtures: [
      { fixture: "full.xml", name: "РегистрСведенийВсеСвойстваНезависимый" },
      { fixture: "minimal.xml", name: "РегистрСведенийПоУмолчанию" },
      { fixture: "reg.xml", name: "РегистрСведенийПодчиненРегистратору" },
    ],
    sync: {
      name: "РегистрСведенийВсеСвойстваНезависимый",
      expectedYAML: readInformationRegisterYAML,
      externalObjectDir: true,
    },
  },
] as const satisfies AppliedObjectYAMLFixture[]

export const appliedObjectModelCases = appliedObjectYAMLFixtures.flatMap((scenario) =>
  scenario.modelFixtures.map((fixture) => ({
    label: `${scenario.group}/${fixture.fixture}`,
    scenario,
    fixture,
  }))
)

export const appliedObjectSyncCases = appliedObjectYAMLFixtures.flatMap((scenario) =>
  scenario.sync === undefined ? [] : [{ label: scenario.group, scenario, sync: scenario.sync }]
)
```

- [ ] **Step 2: Run typecheck through a focused test command**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/__tests__/yamlFixtures.ts
```

Expected: Vitest reports no test files or exits without compiling this helper as a test. If Vitest refuses helper-only files, skip to Task 2; TypeScript will compile the helper when the first test imports it.

- [ ] **Step 3: Commit**

```bash
git add packages/core/metadata/appliedObjects/__tests__/yamlFixtures.ts
git commit -m "test: :white_check_mark: добавить таблицу YAML-фикстур объектов"
```

---

### Task 2: Add Generic Model YAML Round-Trip Test

**Files:**
- Create: `packages/core/metadata/appliedObjects/__tests__/yamlRoundTrip.test.ts`
- Modify: `packages/core/metadata/appliedObjects/__tests__/yamlFixtures.ts`

- [ ] **Step 1: Write the generic round-trip test**

Create `packages/core/metadata/appliedObjects/__tests__/yamlRoundTrip.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import {
  testExportAppliedObjectToYAML,
  testImportAppliedObjectFromXML,
  testImportAppliedObjectFromYAML,
} from "~/tests/appliedObject"
import { appliedObjectModelCases } from "./yamlFixtures"

describe("applied object YAML model round-trip", () => {
  it.each(appliedObjectModelCases)("$label", ({ scenario, fixture }) => {
    const model = testImportAppliedObjectFromXML({
      rule: scenario.rule,
      importMetaUrl: scenario.importMetaUrl,
      fixture: fixture.fixture,
    })
    const yaml = testExportAppliedObjectToYAML({
      rule: scenario.rule,
      data: model,
    })
    const imported = testImportAppliedObjectFromYAML({
      rule: scenario.rule,
      yaml,
      name: fixture.name,
    })

    expect(
      testExportAppliedObjectToYAML({
        rule: scenario.rule,
        data: imported,
      })
    ).toEqual(yaml)
  })
})
```

- [ ] **Step 2: Run the new test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/__tests__/yamlRoundTrip.test.ts
```

Expected: PASS for accumulation and information registers.

- [ ] **Step 3: Commit**

```bash
git add packages/core/metadata/appliedObjects/__tests__/yamlRoundTrip.test.ts packages/core/metadata/appliedObjects/__tests__/yamlFixtures.ts
git commit -m "test: :white_check_mark: унифицировать YAML round-trip объектов"
```

---

### Task 3: Add Generic Sync Test With File Discovery

**Files:**
- Create: `packages/core/metadata/appliedObjects/__tests__/syncRoundTrip.test.ts`
- Modify: `packages/core/metadata/appliedObjects/__tests__/yamlFixtures.ts`

- [ ] **Step 1: Write file discovery helpers and sync tests**

Create `packages/core/metadata/appliedObjects/__tests__/syncRoundTrip.test.ts`:

```ts
import fs from "fs"
import { dirname, join, relative } from "path"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"
import { testConvertAppliedObjectFromXML, testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { appliedObjectSyncCases } from "./yamlFixtures"

const normalizeText = (value: string) => value.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").trimEnd()

const binaryExtensions = new Set([".bin", ".png", ".jpg", ".jpeg", ".gif", ".ico", ".bmp", ".webp"])

const isBinaryPath = (path: string) => {
  return Array.from(binaryExtensions).some((extension) => path.toLowerCase().endsWith(extension))
}

const listFiles = (root: string): string[] => {
  if (!fs.existsSync(root)) return []
  const entries = fs.readdirSync(root, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const fullPath = join(root, entry.name)
    if (entry.isDirectory()) return listFiles(fullPath)
    return [relative(root, fullPath)]
  })
}

const listReferenceFiles = (importMetaUrl: string): { textFiles: string[]; binaryFiles: string[] } => {
  const testDir = dirname(fileURLToPath(importMetaUrl))
  const xmlDir = join(testDir, "__fixtures__", "sync", "xml")
  const files = listFiles(xmlDir).sort()
  return {
    textFiles: files.filter((path) => !isBinaryPath(path)),
    binaryFiles: files.filter(isBinaryPath),
  }
}

describe("applied object XML -> YAML sync", () => {
  it.each(appliedObjectSyncCases)("$label", async ({ scenario, sync }) => {
    const result = await testConvertAppliedObjectFromXML({
      rule: scenario.rule,
      name: sync.name,
      importMetaUrl: scenario.importMetaUrl,
      expectedYAML: sync.expectedYAML,
    })

    expect(result.yaml.result).toBe(result.yaml.expected)
  })
})

describe("applied object YAML -> XML sync", () => {
  it.each(appliedObjectSyncCases)("$label", async ({ scenario, sync }) => {
    const { textFiles, binaryFiles } = listReferenceFiles(scenario.importMetaUrl)
    const { comparisons, binaryComparisons } = await testSyncAppliedObjectToXML({
      rule: scenario.rule,
      name: sync.name,
      importMetaUrl: scenario.importMetaUrl,
      externalObjectDir: sync.externalObjectDir,
      expectedFiles: textFiles,
      binaryExpectedFiles: binaryFiles,
    })

    for (const { path, result, expected } of comparisons) {
      expect(normalizeText(result), path).toBe(normalizeText(expected))
    }
    for (const { path, result, expected } of binaryComparisons) {
      expect(result.equals(expected), path).toBe(true)
    }
  })
})
```

- [ ] **Step 2: Run the generic sync test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/__tests__/syncRoundTrip.test.ts
```

Expected: PASS for accumulation and information registers.

- [ ] **Step 3: Commit**

```bash
git add packages/core/metadata/appliedObjects/__tests__/syncRoundTrip.test.ts packages/core/metadata/appliedObjects/__tests__/yamlFixtures.ts
git commit -m "test: :white_check_mark: унифицировать sync-тесты объектов"
```

---

### Task 4: Add Missing Register Scenarios

**Files:**
- Modify: `packages/core/metadata/appliedObjects/__tests__/yamlFixtures.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataAccountingRegister/__fixtures__/sync/data.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataCalculationRegister/__fixtures__/sync/data.ts`
- Modify when the failing test points to an unambiguous scalar default: `packages/core/metadata/appliedObjects/metadataAccountingRegister/rules.ts`
- Modify when the failing test points to an unambiguous scalar default: `packages/core/metadata/appliedObjects/metadataCalculationRegister/rules.ts`

- [ ] **Step 1: Add imports and fixture rows for accounting and calculation registers**

Append these imports to `yamlFixtures.ts`:

```ts
import { MetadataAccountingRegisterRules } from "../metadataAccountingRegister/rules"
import { readAccountingRegisterYAML } from "../metadataAccountingRegister/__fixtures__/sync/data"
import { MetadataCalculationRegisterRules } from "../metadataCalculationRegister/rules"
import { readCalculationRegisterYAML } from "../metadataCalculationRegister/__fixtures__/sync/data"
```

Add these scenarios to `appliedObjectYAMLFixtures`:

```ts
  {
    group: "metadataAccountingRegister",
    rule: MetadataAccountingRegisterRules,
    importMetaUrl: import.meta.resolve("../metadataAccountingRegister/rules.ts"),
    modelFixtures: [
      { fixture: "full.xml", name: "РегистрБухгалтерииВсеСвойстваОбороты" },
      { fixture: "minimal.xml", name: "РегистрБухгалтерииПоУмолчанию" },
    ],
    sync: {
      name: "РегистрБухгалтерииВсеСвойстваОбороты",
      expectedYAML: readAccountingRegisterYAML,
      externalObjectDir: true,
    },
  },
  {
    group: "metadataCalculationRegister",
    rule: MetadataCalculationRegisterRules,
    importMetaUrl: import.meta.resolve("../metadataCalculationRegister/rules.ts"),
    modelFixtures: [
      { fixture: "full.xml", name: "РегистрРасчетаВсеСвойства" },
      { fixture: "minimal.xml", name: "РегистрРасчетаПоУмолчанию" },
    ],
    sync: {
      name: "РегистрРасчетаВсеСвойства",
      expectedYAML: readCalculationRegisterYAML,
      externalObjectDir: true,
    },
  },
```

- [ ] **Step 2: Run model round-trip and record failures**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/__tests__/yamlRoundTrip.test.ts
```

Expected: either PASS, or FAIL showing missing YAML defaults/annotations in the two register rules.

- [ ] **Step 3: Fix only obvious YAML rule gaps**

If failure is a scalar default mismatch, update the matching property in the register `rules.ts` with `defaultValueYAML` equal to the existing `defaultValueXML`.

Example patch shape:

```ts
someBooleanProperty: {
  yaml: "РусскийКлюч",
  type: "boolean",
  defaultValueXML: false,
  defaultValueYAML: false,
  xmlParents: properties,
},
```

If failure belongs to `MetadataRegisterDimensions`, `MetadataRegisterResources`, `MetadataRegisterAttributes`, `Recalculation`, `StandardAttributeDescriptions`, or another shared child type, stop this task and write down the failing type and YAML/XML fragment in the final report for this task.

- [ ] **Step 4: Generate expected sync YAML strings**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/__tests__/syncRoundTrip.test.ts
```

Expected: FAIL only on `result.yaml.result` versus empty expected YAML for accounting/calculation registers.

Copy the shown `result.yaml.result` into:

- `packages/core/metadata/appliedObjects/metadataAccountingRegister/__fixtures__/sync/data.ts`
- `packages/core/metadata/appliedObjects/metadataCalculationRegister/__fixtures__/sync/data.ts`

Use this shape, replacing the string body with the exact YAML printed by the failing assertion:

```ts
export const readAccountingRegisterYAML = `Синоним: Регистр бухгалтерии все свойства`
```

```ts
export const readCalculationRegisterYAML = `Синоним: Регистр расчета все свойства`
```

The two `Синоним` examples above are only the wrapper syntax. The implemented file must contain the full assertion output for each object.

- [ ] **Step 5: Run the generic tests again**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/__tests__/yamlRoundTrip.test.ts packages/core/metadata/appliedObjects/__tests__/syncRoundTrip.test.ts
```

Expected: PASS for the four register scenarios.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/appliedObjects/__tests__/yamlFixtures.ts packages/core/metadata/appliedObjects/metadataAccountingRegister packages/core/metadata/appliedObjects/metadataCalculationRegister
git commit -m "test: :white_check_mark: покрыть YAML-цикл регистров"
```

---

### Task 5: Add Missing Chart Scenarios

**Files:**
- Modify: `packages/core/metadata/appliedObjects/__tests__/yamlFixtures.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataChartOfAccounts/__fixtures__/sync/data.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataChartOfCalculationTypes/__fixtures__/sync/data.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataChartOfCharacteristicTypes/__fixtures__/sync/data.ts`
- Modify corresponding `rules.ts` files only when the failing test points to an unambiguous scalar default.

- [ ] **Step 1: Add imports and fixture rows for charts**

Add imports:

```ts
import { MetadataChartOfAccountsRules } from "../metadataChartOfAccounts/rules"
import { readChartOfAccountsYAML } from "../metadataChartOfAccounts/__fixtures__/sync/data"
import { MetadataChartOfCalculationTypesRules } from "../metadataChartOfCalculationTypes/rules"
import { readChartOfCalculationTypesYAML } from "../metadataChartOfCalculationTypes/__fixtures__/sync/data"
import { MetadataChartOfCharacteristicTypesRules } from "../metadataChartOfCharacteristicTypes/rules"
import { readChartOfCharacteristicTypesYAML } from "../metadataChartOfCharacteristicTypes/__fixtures__/sync/data"
```

Add scenarios:

```ts
  {
    group: "metadataChartOfAccounts",
    rule: MetadataChartOfAccountsRules,
    importMetaUrl: import.meta.resolve("../metadataChartOfAccounts/rules.ts"),
    modelFixtures: [
      { fixture: "full.xml", name: "ПланСчетовВсеСвойства" },
      { fixture: "minimal.xml", name: "ПланСчетовПоУмолчанию" },
    ],
    sync: {
      name: "ПланСчетовВсеСвойства",
      expectedYAML: readChartOfAccountsYAML,
      externalObjectDir: true,
    },
  },
  {
    group: "metadataChartOfCalculationTypes",
    rule: MetadataChartOfCalculationTypesRules,
    importMetaUrl: import.meta.resolve("../metadataChartOfCalculationTypes/rules.ts"),
    modelFixtures: [
      { fixture: "full.xml", name: "ПланВидовРасчетаВсеСвойства" },
      { fixture: "minimal.xml", name: "ПланВидовРасчетаПоУмолчанию" },
    ],
    sync: {
      name: "ПланВидовРасчетаВсеСвойства",
      expectedYAML: readChartOfCalculationTypesYAML,
      externalObjectDir: true,
    },
  },
  {
    group: "metadataChartOfCharacteristicTypes",
    rule: MetadataChartOfCharacteristicTypesRules,
    importMetaUrl: import.meta.resolve("../metadataChartOfCharacteristicTypes/rules.ts"),
    modelFixtures: [
      { fixture: "full.xml", name: "ПланВидовХарактеристикВсеСвойства" },
      { fixture: "minimal.xml", name: "ПланВидовХарактеристикПоУмолчанию" },
    ],
    sync: {
      name: "ПланВидовХарактеристикВсеСвойства",
      expectedYAML: readChartOfCharacteristicTypesYAML,
      externalObjectDir: true,
    },
  },
```

- [ ] **Step 2: Verify fixture names**

Run:

```bash
find packages/core/metadata/appliedObjects/metadataChartOfAccounts/__fixtures__ packages/core/metadata/appliedObjects/metadataChartOfCalculationTypes/__fixtures__ packages/core/metadata/appliedObjects/metadataChartOfCharacteristicTypes/__fixtures__ -maxdepth 3 -type f | sort
```

Expected: the names in Step 1 match actual XML filenames and sync object folder names. If a name differs, update only the `name` string in `yamlFixtures.ts`.

- [ ] **Step 3: Run generic tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/__tests__/yamlRoundTrip.test.ts packages/core/metadata/appliedObjects/__tests__/syncRoundTrip.test.ts
```

Expected: PASS after simple defaults are corrected and expected YAML constants contain the exact `convertFromXML` output.

- [ ] **Step 4: Commit**

```bash
git add packages/core/metadata/appliedObjects/__tests__/yamlFixtures.ts packages/core/metadata/appliedObjects/metadataChartOfAccounts packages/core/metadata/appliedObjects/metadataChartOfCalculationTypes packages/core/metadata/appliedObjects/metadataChartOfCharacteristicTypes
git commit -m "test: :white_check_mark: покрыть YAML-цикл планов"
```

---

### Task 6: Add Simple Root Object Scenarios With Existing Sync Fixtures

**Files:**
- Modify: `packages/core/metadata/appliedObjects/__tests__/yamlFixtures.ts`
- Modify sync `data.ts` files for:
  - `metadataBusinessProcess`
  - `metadataCommandGroup`
  - `metadataCommonCommand`
  - `metadataCommonForm`
  - `metadataCommonPicture`
  - `metadataCommonTemplate`
  - `metadataFunctionalOption`
  - `metadataIntegrationService`
  - `metadataRole`
  - `metadataScheduledJob`
  - `metadataStyle`
  - `metadataSubsystem`
  - `metadataTask`
  - `metadataWebService`

- [ ] **Step 1: Add scenarios in small groups**

For each object above:

1. Import `<ObjectRules>` from `../<object>/rules`.
2. Import `read<ObjectYAML>` from `../<object>/__fixtures__/sync/data` if `data.ts` exports it.
3. Add `full.xml` and `minimal.xml` to `modelFixtures` when both exist.
4. Add `sync` when `__fixtures__/sync/xml` and `__fixtures__/sync/yaml` both exist.

Use this scenario shape:

```ts
{
  group: "metadataScheduledJob",
  rule: MetadataScheduledJobRules,
  importMetaUrl: import.meta.resolve("../metadataScheduledJob/rules.ts"),
  modelFixtures: [
    { fixture: "full.xml", name: "РегламентноеЗаданиеВсеСвойства" },
    { fixture: "minimal.xml", name: "РегламентноеЗаданиеПоУмолчанию" },
  ],
  sync: {
    name: "РегламентноеЗаданиеВсеСвойства",
    expectedYAML: readScheduledJobYAML,
    externalObjectDir: true,
  },
}
```

- [ ] **Step 2: Inspect actual names before running tests**

Run:

```bash
for dir in metadataBusinessProcess metadataCommandGroup metadataCommonCommand metadataCommonForm metadataCommonPicture metadataCommonTemplate metadataFunctionalOption metadataIntegrationService metadataRole metadataScheduledJob metadataStyle metadataSubsystem metadataTask metadataWebService; do echo "--- $dir"; find "packages/core/metadata/appliedObjects/$dir/__fixtures__" -maxdepth 3 -type f | sort; done
```

Expected: all scenario names in `yamlFixtures.ts` match file/folder names. Update `yamlFixtures.ts` where the command shows different names.

- [ ] **Step 3: Run generic tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/__tests__/yamlRoundTrip.test.ts packages/core/metadata/appliedObjects/__tests__/syncRoundTrip.test.ts
```

Expected: the command either passes or reports object-specific simple rule gaps. Fix only simple YAML defaults/XML-only fields as in Task 4.

- [ ] **Step 4: Fill expected YAML constants**

For any failing `convertFromXML` expectation where the expected constant is empty, copy the actual YAML into that object's `__fixtures__/sync/data.ts`.

Keep the export names that already exist. If `data.ts` is missing for `metadataCommonCommand`, create:

```ts
export const readCommonCommandYAML = `Синоним: Общая команда все свойства`
```

The `Синоним` value above is only the wrapper syntax. The implemented file must contain the exact generic convert test output.

Then import `readCommonCommandYAML` in `yamlFixtures.ts`.

- [ ] **Step 5: Run generic tests again**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/__tests__/yamlRoundTrip.test.ts packages/core/metadata/appliedObjects/__tests__/syncRoundTrip.test.ts
```

Expected: PASS for all scenarios added in this task, except scenarios explicitly blocked by non-local child metadata gaps.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/appliedObjects/__tests__/yamlFixtures.ts packages/core/metadata/appliedObjects/metadataBusinessProcess packages/core/metadata/appliedObjects/metadataCommandGroup packages/core/metadata/appliedObjects/metadataCommonCommand packages/core/metadata/appliedObjects/metadataCommonForm packages/core/metadata/appliedObjects/metadataCommonPicture packages/core/metadata/appliedObjects/metadataCommonTemplate packages/core/metadata/appliedObjects/metadataFunctionalOption packages/core/metadata/appliedObjects/metadataIntegrationService packages/core/metadata/appliedObjects/metadataRole packages/core/metadata/appliedObjects/metadataScheduledJob packages/core/metadata/appliedObjects/metadataStyle packages/core/metadata/appliedObjects/metadataSubsystem packages/core/metadata/appliedObjects/metadataTask packages/core/metadata/appliedObjects/metadataWebService
git commit -m "test: :white_check_mark: покрыть YAML-цикл корневых объектов"
```

---

### Task 7: Add Model-Only Scenarios For Objects Without Sync Fixtures

**Files:**
- Modify: `packages/core/metadata/appliedObjects/__tests__/yamlFixtures.ts`

- [ ] **Step 1: Add model-only scenarios**

Add these objects without `sync` blocks:

- `configuration`
- `metadataCommand`
- `metadataLanguage`

Use this shape:

```ts
{
  group: "metadataLanguage",
  rule: MetadataLanguageRules,
  importMetaUrl: import.meta.resolve("../metadataLanguage/rules.ts"),
  modelFixtures: [
    { fixture: "full.xml", name: "ЯзыкВсеСвойства" },
    { fixture: "minimal.xml", name: "ЯзыкПоУмолчанию" },
  ],
}
```

For `metadataCommand`, use the names from its existing fixture files. If it has no top-level `full.xml`/`minimal.xml`, do not add it to the shared table and add a comment in the final report that `MetadataCommand` is covered as a child through owning objects.

- [ ] **Step 2: Verify fixture files**

Run:

```bash
for dir in configuration metadataCommand metadataLanguage; do echo "--- $dir"; find "packages/core/metadata/appliedObjects/$dir/__fixtures__" -maxdepth 2 -type f | sort; done
```

Expected: `yamlFixtures.ts` references only existing XML fixture files.

- [ ] **Step 3: Run model round-trip**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/__tests__/yamlRoundTrip.test.ts
```

Expected: PASS for model-only scenarios, or clear failure showing missing simple YAML defaults.

- [ ] **Step 4: Commit**

```bash
git add packages/core/metadata/appliedObjects/__tests__/yamlFixtures.ts packages/core/metadata/appliedObjects/configuration packages/core/metadata/appliedObjects/metadataCommand packages/core/metadata/appliedObjects/metadataLanguage
git commit -m "test: :white_check_mark: покрыть модельный YAML-цикл объектов"
```

---

### Task 8: Remove Redundant Local Generic Tests

**Files:**
- Delete only redundant files that are fully replaced by shared tests:
  - `packages/core/metadata/appliedObjects/*/toYAML.test.ts`
  - `packages/core/metadata/appliedObjects/*/fromYAML.test.ts`
  - `packages/core/metadata/appliedObjects/*/convertFromXML.test.ts`
  - `packages/core/metadata/appliedObjects/*/syncToXML.test.ts`
- Keep object-specific files that assert special behavior.

- [ ] **Step 1: List candidate duplicate tests**

Run:

```bash
find packages/core/metadata/appliedObjects -maxdepth 2 -type f \( -name 'toYAML.test.ts' -o -name 'fromYAML.test.ts' -o -name 'convertFromXML.test.ts' -o -name 'syncToXML.test.ts' \) | sort
```

Expected: list of existing local tests.

- [ ] **Step 2: Keep tests with special assertions**

Before deleting a file, open it and keep it if it checks behavior beyond the generic cycle, for example:

```ts
expect(result).not.toHaveProperty("ВидРегистра")
expect(fs.readFileSync(join(outputDir, name, "МодульМенеджера.bsl"), "utf-8")).toBe(managerModule)
```

Those assertions are not replaced by the shared harness.

- [ ] **Step 3: Delete only fully generic duplicates**

For a local test file that only checks generic `YAML exported from XML imports back to the same YAML`, remove it with `apply_patch`.

Example deletion:

```diff
*** Begin Patch
*** Delete File: packages/core/metadata/appliedObjects/metadataDocumentNumerator/fromYAML.test.ts
*** End Patch
```

- [ ] **Step 4: Run all applied object tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/appliedObjects
git commit -m "test: :white_check_mark: убрать дубли YAML-тестов объектов"
```

---

### Task 9: Final Verification

**Files:**
- No planned source edits.

- [ ] **Step 1: Run full test suite**

Run:

```bash
pnpm test
```

Expected: all package tests pass.

- [ ] **Step 2: Inspect final status**

Run:

```bash
git status --short
```

Expected: clean working tree after commits, or only expected generated files staged/committed.

- [ ] **Step 3: Summarize coverage**

In the final response, list:

- objects added to shared model YAML round-trip;
- objects added to shared file sync round-trip;
- objects intentionally blocked or kept as local special tests;
- exact verification commands and outcomes.

---

## Self-Review

- Spec coverage: the plan creates a shared applied-object fixture table, generic model YAML test, generic sync test, candidate object coverage, and final `pnpm test`.
- Red-flag scan: no unfinished markers or unbounded generic cleanup instructions; failure handling is explicit and limited to simple YAML defaults or stop-and-report.
- Type consistency: `AppliedObjectYAMLFixture`, `appliedObjectModelCases`, and `appliedObjectSyncCases` are defined in Task 1 and used consistently in following tasks.
- Scope: tabular document and СКД remain separate `todo.md` entries, not part of this implementation plan.
