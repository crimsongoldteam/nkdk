# DataPath Owner ValueList Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make DataPath validation resolve owner object attributes of type `СписокЗначений` / `ValueListType` as `ValueList` table sources.

**Architecture:** Keep the change local to `packages/core/metadata/validation/dataPath/resolver.ts`. Convert an `ObjectField` with `typeInfo.table` into a strict `tableSource` when `field.tableSource` is absent, then reuse existing `virtualTableColumn` handling for `Value`, `Presentation`, `Check`, and `Picture`.

**Tech Stack:** TypeScript, Vitest, existing metadata validation helpers, `pnpm`, Node 22 for final checks.

---

### Task 1: Confirm Real ERP Shape

**Files:**
- Read: `/tmp/round-trip-yaml-validation/erp/Отчет/АнализСубконто/Свойства.yaml`
- Read: `/tmp/round-trip-yaml-validation/erp/Отчет/АнализСубконто/Формы/ФормаОтчета/Форма.yaml`
- Read: `packages/core/metadata/validation/dataPath/resolver.ts`

- [ ] **Step 1: Inspect owner and form YAML**

Run:

```bash
rg -n "СписокВидовСубконто|СписокВидовКорСубконто" \
  /tmp/round-trip-yaml-validation/erp/Отчет/АнализСубконто/Свойства.yaml \
  /tmp/round-trip-yaml-validation/erp/Отчет/АнализСубконто/Формы/ФормаОтчета/Форма.yaml
```

Expected:

- `Свойства.yaml` contains `СписокВидовСубконто` with `Тип: СписокЗначений`.
- `Форма.yaml` contains paths like `Отчет.СписокВидовСубконто.Value` and `Отчет.СписокВидовСубконто.Picture`.

- [ ] **Step 2: Verify imported owner type info**

Run:

```bash
pnpm --dir packages/core exec tsx -e 'import "./index.ts"; import { createProjectYamlCache } from "./metadata/validation/projectYamlCache.ts"; import { createOwnerMetadataCache } from "./metadata/validation/dataPath/ownerCache.ts"; import { resolveObjectFieldSegment } from "./metadata/validation/dataPath/objectFields.ts"; import { mockContext } from "./tests/mockContext.ts"; const projectDir="/tmp/round-trip-yaml-validation/erp"; const cache=createProjectYamlCache(); const ownerCache=createOwnerMetadataCache({projectDir,yamlCache:cache,context:mockContext}); const owner=ownerCache.get({kind:"ОтчетОбъект",name:"АнализСубконто"}); if (owner.status!=="ok") { console.log(owner); process.exit(1); } const field=resolveObjectFieldSegment({index: owner.owner.fieldIndex, segment:"СписокВидовСубконто"}); console.log(JSON.stringify(field, null, 2));'
```

Expected:

- Output includes `"kinds": ["tableSource"]`.
- Output includes `"table": { "kind": "ValueList" }`.
- Output has no `tableSource` property on the field.

### Task 2: Add Failing Resolver Tests

**Files:**
- Modify: `packages/core/metadata/validation/dataPath/resolver.test.ts`

- [ ] **Step 1: Add owner ValueList tests**

In `packages/core/metadata/validation/dataPath/resolver.test.ts`, after the existing form-only table tests, add:

```ts
  it("resolves owner ValueList virtual columns", () => {
    const owners = ownerCache([
      owner({
        ref: { kind: "ОтчетОбъект", name: "АнализСубконто" },
        rule: MetadataReportRules,
        model: {
          itemType: "MetadataReport",
          attributes: [
            { name: "СписокВидовСубконто", type: { type: ["ValueListType"] } },
            { name: "СписокВидовКорСубконто", type: { type: ["СписокЗначений"] } },
          ],
        },
      }),
    ])

    for (const [path, columnName, sourceText] of [
      ["Отчет.СписокВидовСубконто.Value", "Value", "ValueList.Value"],
      ["Отчет.СписокВидовСубконто.Picture", "Picture", "ValueList.Picture"],
      ["Отчет.СписокВидовКорСубконто[0].Value", "Value", "ValueList.Value"],
    ] as const) {
      expect(
        resolve(path, {
          index: indexWithAttributes([attribute("Отчет", { type: ["ReportObject.АнализСубконто"] })]),
          ownerCache: owners,
        }),
      ).toMatchObject({
        status: "ok",
        diagnostics: [],
        target: {
          value: path,
          source: { kind: "tableColumn", name: columnName },
          typeInfo: { sourceText },
        },
      })
    }
  })

  it("keeps unknown owner ValueList columns as errors", () => {
    const result = resolve("Отчет.СписокВидовСубконто.Unknown", {
      index: indexWithAttributes([attribute("Отчет", { type: ["ReportObject.АнализСубконто"] })]),
      ownerCache: ownerCache([
        owner({
          ref: { kind: "ОтчетОбъект", name: "АнализСубконто" },
          rule: MetadataReportRules,
          model: {
            itemType: "MetadataReport",
            attributes: [{ name: "СписокВидовСубконто", type: { type: ["ValueListType"] } }],
          },
        }),
      ]),
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          message: 'ПутьКДанным "Отчет.СписокВидовСубконто.Unknown": неизвестная колонка "Unknown"',
        }),
      ],
    })
  })
```

- [ ] **Step 2: Run resolver tests and confirm RED**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/validation/dataPath/resolver.test.ts
```

Expected:

- New tests fail.
- Failure for valid paths mentions `промежуточный реквизит "СписокВидовСубконто" имеет неизвестный тип`.

### Task 3: Implement ObjectField Table Source Reuse

**Files:**
- Modify: `packages/core/metadata/validation/dataPath/resolver.ts`

- [ ] **Step 1: Add helper for ObjectField table sources**

In `packages/core/metadata/validation/dataPath/resolver.ts`, after `formOnlyTableFromAdditionalColumns`, add:

```ts
function tableSourceFromObjectField(field: {
  typeInfo: DataPathTypeInfo
  tableSource?: ObjectFieldTableSource
}): ObjectFieldTableSource | undefined {
  if (field.tableSource !== undefined) return field.tableSource
  const table = field.typeInfo.table
  if (table === undefined) return undefined

  return {
    table,
    columns: new Map(),
    hasColumns:
      table.kind === "ValueList" ||
      table.kind === "GanttChart" ||
      table.kind === "RegisterRecordSet",
  }
}
```

- [ ] **Step 2: Use helper when building object field state**

Replace:

```ts
    state = {
      typeInfo: field.typeInfo,
      source: { kind: "objectField", owner: ownerResult.owner.ref, name: field.name },
      ...(field.tableSource !== undefined ? { tableSource: field.tableSource } : {}),
    }
```

with:

```ts
    const tableSource = tableSourceFromObjectField(field)
    state = {
      typeInfo: field.typeInfo,
      source: { kind: "objectField", owner: ownerResult.owner.ref, name: field.name },
      ...(tableSource !== undefined ? { tableSource } : {}),
    }
```

- [ ] **Step 3: Run resolver tests and confirm GREEN**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/validation/dataPath/resolver.test.ts
```

Expected:

- `resolver.test.ts` passes.

### Task 4: Add ValidateForm Integration Test

**Files:**
- Modify: `packages/core/metadata/validation/validateForm.test.ts`

- [ ] **Step 1: Add integration test**

In `packages/core/metadata/validation/validateForm.test.ts`, after the test named `accepts owner form-only table paths described by additional columns`, add:

```ts
  it("accepts owner ValueList virtual columns", () => {
    const project = createProject({
      ownerDir: "Отчет",
      ownerName: "АнализСубконто",
      owner: [
        "Реквизиты:",
        "  СписокВидовСубконто:",
        "    Тип: СписокЗначений",
      ],
      form: [
        "Реквизиты:",
        "  Отчет:",
        "    Тип: ОтчетОбъект.АнализСубконто",
        "Элементы:",
        "  ВидСубконто:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Отчет.СписокВидовСубконто.Value",
        "  Картинка:",
        "    Вид: ПолеРисунка",
        "    ПутьКДанным: Отчет.СписокВидовСубконто.Picture",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })
```

- [ ] **Step 2: Run integration tests**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/validation/validateForm.test.ts
```

Expected:

- `validateForm.test.ts` passes.

### Task 5: Verification

**Files:**
- No source edits.

- [ ] **Step 1: Run focused validation tests**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/validation/dataPath/resolver.test.ts metadata/validation/validateForm.test.ts metadata/validation/validateProject.test.ts
```

Expected:

- All listed tests pass.

- [ ] **Step 2: Run ERP YAML validation**

Run:

```bash
env npm_config_cache=/tmp/npm-cache npx -y -p node@22 -c 'pnpm --dir packages/cli dev validate /tmp/round-trip-yaml-validation/erp' > /tmp/erp-yaml-validate-valuelist-owner.log 2>&1
```

Expected:

- Command exits with code `1` because unrelated validation errors remain.

Then run:

```bash
rg 'summary:' /tmp/erp-yaml-validate-valuelist-owner.log
rg -c ' error: ПутьКДанным ' /tmp/erp-yaml-validate-valuelist-owner.log
rg 'СписокВидовСубконто|СписокВидовКорСубконто' /tmp/erp-yaml-validate-valuelist-owner.log
```

Expected:

- Summary is expected to be `2242 error, 36940 warning`, unless unrelated validation inputs changed after this plan was written.
- DataPath count is expected to be `93`, unless unrelated validation inputs changed after this plan was written.
- The last `rg` prints no `error:` lines for `СписокВидовСубконто` or `СписокВидовКорСубконто`.

- [ ] **Step 3: Run full test suite**

Run:

```bash
env npm_config_cache=/tmp/npm-cache npx -y -p node@22 -c 'pnpm test'
```

Expected:

- All workspace tests pass.

### Task 6: Commit Implementation

**Files:**
- Modify: `packages/core/metadata/validation/dataPath/resolver.ts`
- Modify: `packages/core/metadata/validation/dataPath/resolver.test.ts`
- Modify: `packages/core/metadata/validation/validateForm.test.ts`

- [ ] **Step 1: Review diff**

Run:

```bash
git diff -- packages/core/metadata/validation/dataPath/resolver.ts packages/core/metadata/validation/dataPath/resolver.test.ts packages/core/metadata/validation/validateForm.test.ts
```

Expected:

- Diff only contains the ValueList owner-table-source change and tests from this plan.

- [ ] **Step 2: Commit**

Run:

```bash
git add packages/core/metadata/validation/dataPath/resolver.ts packages/core/metadata/validation/dataPath/resolver.test.ts packages/core/metadata/validation/validateForm.test.ts
git commit -m "fix: :bug: исправить DataPath для ValueList владельца" -m "- разрешать объектные реквизиты владельца типа СписокЗначений как табличный источник ValueList
- переиспользовать существующие виртуальные колонки ValueList
- покрыть resolver и validateForm тестами"
```

Expected:

- Commit succeeds.
- `git status --short` is clean.
