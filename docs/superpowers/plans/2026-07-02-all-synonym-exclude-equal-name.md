# All Synonym Equal-Name Exclusion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply `excludeIfEqualNameYAML: true` to every production metadata `synonym` rule that represents YAML `Синоним`.

**Architecture:** The existing `excludeIfEqualNameYAML` helper, YAML import/export, validation, and schema logic remain unchanged. This work only extends the declarative contract in production `rules.ts`, then verifies it with the real `РегистрСведений/ЗадачиУниверсальныхПроцессов` case and existing validation coverage.

**Tech Stack:** TypeScript, Vitest, `@nakidka/core` metadata rules, `@nakidka/cli` import/validate commands.

---

## File Structure

Modify production metadata rules only:

- `packages/core/metadata/appliedObjects/metadataAccountingRegister/rules.ts`
- `packages/core/metadata/appliedObjects/metadataAccumulationRegister/rules.ts`
- `packages/core/metadata/appliedObjects/metadataBot/rules.ts`
- `packages/core/metadata/appliedObjects/metadataBusinessProcess/rules.ts`
- `packages/core/metadata/appliedObjects/metadataCalculationRegister/rules.ts`
- `packages/core/metadata/appliedObjects/metadataChartOfAccounts/rules.ts`
- `packages/core/metadata/appliedObjects/metadataChartOfCalculationTypes/rules.ts`
- `packages/core/metadata/appliedObjects/metadataChartOfCharacteristicTypes/rules.ts`
- `packages/core/metadata/appliedObjects/metadataCommandGroup/rules.ts`
- `packages/core/metadata/appliedObjects/metadataCommonAttribute/rules.ts`
- `packages/core/metadata/appliedObjects/metadataCommonForm/rules.ts`
- `packages/core/metadata/appliedObjects/metadataCommonModule/rules.ts`
- `packages/core/metadata/appliedObjects/metadataCommonPicture/rules.ts`
- `packages/core/metadata/appliedObjects/metadataCommonTemplate/rules.ts`
- `packages/core/metadata/appliedObjects/metadataConstant/rules.ts`
- `packages/core/metadata/appliedObjects/metadataDataProcessor/rules.ts`
- `packages/core/metadata/appliedObjects/metadataDefinedType/rules.ts`
- `packages/core/metadata/appliedObjects/metadataDocument/rules.ts`
- `packages/core/metadata/appliedObjects/metadataDocumentJournal/rules.ts`
- `packages/core/metadata/appliedObjects/metadataDocumentNumerator/rules.ts`
- `packages/core/metadata/appliedObjects/metadataEnumeration/rules.ts`
- `packages/core/metadata/appliedObjects/metadataEventSubscription/rules.ts`
- `packages/core/metadata/appliedObjects/metadataExchangePlan/rules.ts`
- `packages/core/metadata/appliedObjects/metadataExternalDataSource/rules.ts`
- `packages/core/metadata/appliedObjects/metadataFilterCriterion/rules.ts`
- `packages/core/metadata/appliedObjects/metadataFunctionalOption/rules.ts`
- `packages/core/metadata/appliedObjects/metadataFunctionalOptionsParameter/rules.ts`
- `packages/core/metadata/appliedObjects/metadataHTTPService/rules.ts`
- `packages/core/metadata/appliedObjects/metadataInformationRegister/rules.ts`
- `packages/core/metadata/appliedObjects/metadataIntegrationService/rules.ts`
- `packages/core/metadata/appliedObjects/metadataLanguage/rules.ts`
- `packages/core/metadata/appliedObjects/metadataReport/rules.ts`
- `packages/core/metadata/appliedObjects/metadataRole/rules.ts`
- `packages/core/metadata/appliedObjects/metadataScheduledJob/rules.ts`
- `packages/core/metadata/appliedObjects/metadataSequence/rules.ts`
- `packages/core/metadata/appliedObjects/metadataSessionParameter/rules.ts`
- `packages/core/metadata/appliedObjects/metadataSettingsStorage/rules.ts`
- `packages/core/metadata/appliedObjects/metadataStyle/rules.ts`
- `packages/core/metadata/appliedObjects/metadataStyleItem/rules.ts`
- `packages/core/metadata/appliedObjects/metadataSubsystem/rules.ts`
- `packages/core/metadata/appliedObjects/metadataTask/rules.ts`
- `packages/core/metadata/appliedObjects/metadataWSReference/rules.ts`
- `packages/core/metadata/appliedObjects/metadataWebService/rules.ts`
- `packages/core/metadata/appliedObjects/metadataWebSocketClient/rules.ts`
- `packages/core/metadata/appliedObjects/metadataXDTOPackage/rules.ts`
- `packages/core/metadata/commonObjects/metadataDocumentJournalColumn/rules.ts`
- `packages/core/metadata/commonObjects/metadataExternalDataSourceCube/rules.ts`
- `packages/core/metadata/commonObjects/metadataExternalDataSourceDimensionTable/rules.ts`
- `packages/core/metadata/commonObjects/metadataExternalDataSourceField/rules.ts`
- `packages/core/metadata/commonObjects/metadataExternalDataSourceFunction/rules.ts`
- `packages/core/metadata/commonObjects/metadataExternalDataSourceTable/rules.ts`
- `packages/core/metadata/commonObjects/metadataHTTPServiceMethod/rules.ts`
- `packages/core/metadata/commonObjects/metadataHTTPServiceURLTemplate/rules.ts`
- `packages/core/metadata/commonObjects/metadataIntegrationServiceChannel/rules.ts`
- `packages/core/metadata/commonObjects/metadataSequenceDimension/rules.ts`
- `packages/core/metadata/commonObjects/metadataWebServiceOperation/rules.ts`
- `packages/core/metadata/commonObjects/recalculation/rules.ts`
- `packages/core/metadata/commonObjects/standardAttributeDescription/rules.ts`
- `packages/core/metadata/commonObjects/standardTabularSectionDescription/rules.ts`
- `packages/core/metadata/forms/clientApplicationForm/rules.ts`

Test existing behavior through:

- `packages/core/metadata/commonObjects/i8nText/toYAML.test.ts`
- `packages/core/metadata/commonObjects/i8nText/fromYAML.test.ts`
- `packages/core/metadata/validation/validateProject.test.ts`
- `packages/core/metadata/validation/excludeIfEqualNameYAML.test.ts`

Do not modify XML fixtures.

---

### Task 1: Lock The Real InformationRegister Example

**Files:**
- Test: `/Users/nikita/git/nkdk/packages/core/metadata/validation/validateProject.test.ts`
- Reference example: `/Users/nikita/git/nkdk-yaml/РегистрСведений/ЗадачиУниверсальныхПроцессов/Свойства.yaml`

- [ ] **Step 1: Write the failing validation test**

Add this test near the existing equal-name synonym validation tests in `validateProject.test.ts`:

```ts
  it("rejects an explicit information register synonym equal to the register name", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "РегистрСведений/ЗадачиУниверсальныхПроцессов/Свойства.yaml", [
      "Синоним: Задачи универсальных процессов",
    ])

    const diagnostics = (await validateProject({
      projectDir,
      filePath: "РегистрСведений/ЗадачиУниверсальныхПроцессов/Свойства.yaml",
      context: mockContext,
    })).diagnostics

    expect(diagnostics).toEqual([
      expect.objectContaining({
        filePath: join(projectDir, "РегистрСведений", "ЗадачиУниверсальныхПроцессов", "Свойства.yaml"),
        source: "structure",
        severity: "error",
        path: "/Синоним",
        message: expect.stringContaining('Поле "Синоним" не нужно указывать'),
      }),
    ])
  })
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run:

```sh
pnpm --filter @nakidka/core exec vitest run metadata/validation/validateProject.test.ts -t "information register synonym"
```

Expected: FAIL because `metadataInformationRegister/rules.ts` does not yet set `excludeIfEqualNameYAML: true`.

- [ ] **Step 3: Commit the failing test only if the workflow requires small commits**

Prefer no commit until Task 2 passes, because the repository should not keep a red intermediate commit unless explicitly requested.

---

### Task 2: Add The Flag To Production Synonym Rules

**Files:**
- Modify all production `rules.ts` files listed in File Structure.

- [ ] **Step 1: Add `excludeIfEqualNameYAML: true` to each matching `synonym` rule**

For multi-line `i8nTextRule` calls, use this shape:

```ts
    synonym: i8nTextRule({
      yaml: "Синоним",
      xmlParents: properties,
      defaultValueXMLRaw: "",
      excludeIfEqualNameYAML: true,
    }),
```

For one-line `i8nTextRule` calls, expand them instead of making a long line:

```ts
    synonym: i8nTextRule({
      yaml: "Синоним",
      xmlParents: properties,
      defaultValueXMLRaw: "",
      excludeIfEqualNameYAML: true,
    }),
```

For object literal rules, add the property beside `type: "I8nText"` and `yaml: "Синоним"`:

```ts
  synonym: {
    yaml: "Синоним",
    xml: "Synonym",
    type: "I8nText",
    excludeIfEqualNameYAML: true,
    xmlParents: ["Properties"],
    defaultValueXMLRaw: "",
  },
```

Do not add the flag to fields that are not named `synonym`.

- [ ] **Step 2: Verify no production `synonym` rule is missing the flag**

Run:

```sh
node - <<'NODE'
const fs = require("fs")
const cp = require("child_process")
const files = cp.execSync("rg -l 'synonym:\\\\s*(i8nTextRule\\\\(|\\\\{)' packages/core/metadata --glob 'rules.ts'", { encoding: "utf8" })
  .trim()
  .split(/\n/)
  .filter(Boolean)
let failed = false
for (const file of files) {
  const text = fs.readFileSync(file, "utf8")
  const matches = [...text.matchAll(/synonym:\s*(?:i8nTextRule\(\{|\{)/g)]
  for (const match of matches) {
    const block = text.slice(match.index, match.index + 700)
    const isSynonymYAML = /yaml:\s*["']Синоним["']/.test(block)
    const isI8n = /type:\s*["']I8nText["']|i8nTextRule/.test(block)
    const hasFlag = /excludeIfEqualNameYAML:\s*true/.test(block)
    if (isSynonymYAML && isI8n && !hasFlag) {
      console.log(`${file}: missing excludeIfEqualNameYAML`)
      failed = true
    }
  }
}
process.exit(failed ? 1 : 0)
NODE
```

Expected: exit code 0 and no output.

- [ ] **Step 3: Run focused tests**

Run:

```sh
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/i8nText metadata/validation
```

Expected: PASS.

- [ ] **Step 4: Commit rules and regression test**

Run:

```sh
git add packages/core/metadata docs/superpowers/plans/2026-07-02-all-synonym-exclude-equal-name.md
git commit -m "feat: :sparkles: скрывать равные имени синонимы"
```

---

### Task 3: Verify The User-Provided YAML Import Case

**Files:**
- External output project: `/Users/nikita/git/nkdk-yaml`
- XML input project: `/Users/nikita/git/round-trip/erp`

- [ ] **Step 1: Re-run CLI import into the same YAML project**

Run from `/Users/nikita/git/nkdk`:

```sh
pnpm --filter @nakidka/cli dev import /Users/nikita/git/round-trip/erp /Users/nikita/git/nkdk-yaml
```

Expected: `Готово: 25372 успешно, 0 с ошибкой` or the current equivalent with 0 errors.

- [ ] **Step 2: Check the example file no longer contains redundant `Синоним`**

Run:

```sh
sed -n '1,20p' /Users/nikita/git/nkdk-yaml/РегистрСведений/ЗадачиУниверсальныхПроцессов/Свойства.yaml
```

Expected: the first lines do not include:

```yaml
Синоним: Задачи универсальных процессов
```

- [ ] **Step 3: Validate that explicit equal synonym is now rejected**

Run:

```sh
pnpm --filter @nakidka/cli dev validate /Users/nikita/git/nkdk-yaml --file /Users/nikita/git/nkdk-yaml/РегистрСведений/ЗадачиУниверсальныхПроцессов/Свойства.yaml
```

Expected: PASS for the imported file after the redundant synonym is omitted.

---

### Task 4: Full Verification

**Files:**
- No new files.

- [ ] **Step 1: Run the full project tests**

Run:

```sh
pnpm test
```

Expected: PASS.

- [ ] **Step 2: Inspect final git state**

Run:

```sh
git status --short
```

Expected: only intentional committed changes remain, or the working tree is clean if all changes were committed.

---

## Self-Review

- Spec coverage: the plan changes only production `rules.ts`, adds a regression test for the provided InformationRegister case, and runs focused plus full verification.
- Placeholder scan: no unfinished placeholders remain.
- Type consistency: all references use existing `excludeIfEqualNameYAML`, `I8nText`, `i8nTextRule`, `validateProject`, and CLI command names.
