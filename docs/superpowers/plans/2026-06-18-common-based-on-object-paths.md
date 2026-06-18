# Common basedOn Object Paths Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Вынести общий allow-list для `basedOn` и применить его ко всем согласованным объектам с `basedOn`.

**Architecture:** Общий список допустимых объектных путей живёт рядом с `metadataTargets`, потому что это ограничение ссылок, а не свойство одного прикладного объекта. Все `rules.ts` используют один экспорт `commonBasedOnObjectPaths`; сериализация XML/YAML не меняется.

**Tech Stack:** TypeScript, Vitest, существующий rules-based metadata orchestration, `metadataTarget.allowedObjectPaths`.

---

## File Structure

- Create: `packages/core/metadata/commonObjects/metadataTargets/basedOn.ts`
  - Single responsibility: общий список разрешённых object paths для `basedOn`.
- Modify: `packages/core/metadata/commonObjects/metadataTargets/index.ts`
  - Re-export `basedOn.ts`, чтобы правила могли импортировать из общего входа.
- Create: `packages/core/metadata/commonObjects/metadataTargets/basedOn.test.ts`
  - Проверяет сам список, работу parser/formatter с разрешёнными путями и то, что все правила используют один общий список.
- Modify: `packages/core/metadata/appliedObjects/metadataCatalog/rules.ts`
  - Удаляет локальный `basedOnObjectPaths`, подключает общий список.
- Modify: `packages/core/metadata/appliedObjects/metadataDocument/rules.ts`
  - Добавляет общий `metadataTarget` в `basedOn`.
- Modify: `packages/core/metadata/appliedObjects/metadataExchangePlan/rules.ts`
  - Добавляет общий `metadataTarget` в `basedOn`.
- Modify: `packages/core/metadata/appliedObjects/metadataTask/rules.ts`
  - Добавляет общий `metadataTarget` в `basedOn`.
- Modify: `packages/core/metadata/appliedObjects/metadataBusinessProcess/rules.ts`
  - Добавляет общий `metadataTarget` в `basedOn`.
- Modify: `packages/core/metadata/appliedObjects/metadataChartOfAccounts/rules.ts`
  - Добавляет общий `metadataTarget` в `basedOn`.
- Modify: `packages/core/metadata/appliedObjects/metadataChartOfCharacteristicTypes/rules.ts`
  - Добавляет общий `metadataTarget` в `basedOn`.
- Modify: `packages/core/metadata/appliedObjects/metadataChartOfCalculationTypes/rules.ts`
  - Добавляет общий `metadataTarget` в `basedOn`.
- Modify: `packages/core/metadata/commonObjects/metadataExternalDataSourceTable/rules.ts`
  - Добавляет общий `metadataTarget` в `basedOn`.

## Prerequisites

- Read before edits:

```bash
sed -n '1,220p' .agents/knowledge/metadata/INDEX.md
sed -n '1,220p' .agents/knowledge/metadata/sources-of-truth.md
sed -n '1,220p' .agents/knowledge/metadata/metadata-item-implementation.md
sed -n '1,220p' .agents/knowledge/metadata/yaml-contract.md
sed -n '1,220p' .agents/knowledge/metadata/round-trip-cycle.md
```

- Keep these project rules in force:
  - Do not edit existing XML fixtures.
  - Do not add manual `fromXML`/`toXML`/`fromYAML`/`toYAML` rules.
  - Do not add `order` in `rules.ts`.
  - Minimize casts; this plan does not require `as any` or `as unknown`.

### Task 1: Add Shared basedOn Target List

**Files:**
- Create: `packages/core/metadata/commonObjects/metadataTargets/basedOn.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTargets/index.ts`
- Test: `packages/core/metadata/commonObjects/metadataTargets/basedOn.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/core/metadata/commonObjects/metadataTargets/basedOn.test.ts` with:

```ts
import { describe, expect, it } from "vitest"
import { MetadataBusinessProcessRules } from "~/metadata/appliedObjects/metadataBusinessProcess/rules"
import { MetadataCatalogRules } from "~/metadata/appliedObjects/metadataCatalog/rules"
import { MetadataChartOfAccountsRules } from "~/metadata/appliedObjects/metadataChartOfAccounts/rules"
import { MetadataChartOfCalculationTypesRules } from "~/metadata/appliedObjects/metadataChartOfCalculationTypes/rules"
import { MetadataChartOfCharacteristicTypesRules } from "~/metadata/appliedObjects/metadataChartOfCharacteristicTypes/rules"
import { MetadataDocumentRules } from "~/metadata/appliedObjects/metadataDocument/rules"
import { MetadataExchangePlanRules } from "~/metadata/appliedObjects/metadataExchangePlan/rules"
import { MetadataTaskRules } from "~/metadata/appliedObjects/metadataTask/rules"
import { MetadataExternalDataSourceTableRules } from "~/metadata/commonObjects/metadataExternalDataSourceTable/rules"
import { commonBasedOnObjectPaths, formatMetadataTargetToYAML, parseMetadataTargetFromModel, parseMetadataTargetFromYAML } from "./index"

describe("common basedOn metadata targets", () => {
  it("contains the shared object paths for basedOn", () => {
    expect(commonBasedOnObjectPaths).toEqual([
      ["ChartOfAccounts"],
      ["ExternalDataSource", "Table"],
      ["ExchangePlan"],
      ["Catalog"],
      ["Document"],
      ["ChartOfCharacteristicTypes"],
      ["BusinessProcess"],
      ["ChartOfCalculationTypes"],
      ["Task"],
    ])
  })

  it("parses and formats every allowed basedOn object path", () => {
    const constraint = { kind: "object", allowedObjectPaths: commonBasedOnObjectPaths } as const

    const cases = [
      ["ПланСчетов.ПланСчетов1", "ChartOfAccounts.ПланСчетов1"],
      [
        "ВнешнийИсточникДанных.ВнешнийИсточникДанныхВсеСвойства.Таблица.ТаблицаВсеСвойства",
        "ExternalDataSource.ВнешнийИсточникДанныхВсеСвойства.Table.ТаблицаВсеСвойства",
      ],
      ["ПланОбмена.ПланОбмена1", "ExchangePlan.ПланОбмена1"],
      ["Справочник.Номенклатура", "Catalog.Номенклатура"],
      ["Документ.ЗаказПокупателя", "Document.ЗаказПокупателя"],
      ["ПланВидовХарактеристик.ВидыСвойств", "ChartOfCharacteristicTypes.ВидыСвойств"],
      ["БизнесПроцесс.Согласование", "BusinessProcess.Согласование"],
      ["ПланВидовРасчета.Начисления", "ChartOfCalculationTypes.Начисления"],
      ["Задача.ЗадачаИсполнителя", "Task.ЗадачаИсполнителя"],
    ] as const

    for (const [yaml, canonical] of cases) {
      expect(parseMetadataTargetFromYAML({ value: yaml, constraint })).toMatchObject({ ok: true, canonical })
      expect(parseMetadataTargetFromModel({ canonical, constraint })).toMatchObject({ ok: true, canonical })
      expect(formatMetadataTargetToYAML({ canonical, constraint })).toBe(yaml)
    }
  })

  it("rejects object paths outside the shared basedOn allow-list", () => {
    const constraint = { kind: "object", allowedObjectPaths: commonBasedOnObjectPaths } as const

    expect(parseMetadataTargetFromYAML({ value: "Перечисление.Статусы", constraint })).toMatchObject({
      ok: false,
      code: "disallowed-kind",
    })

    expect(
      parseMetadataTargetFromModel({
        canonical: "ExternalDataSource.ВнешнийИсточникДанныхВсеСвойства.Cube.КубВсеСвойства",
        constraint,
      })
    ).toMatchObject({ ok: false, code: "disallowed-kind" })
  })

  it("is used by every basedOn rule in scope", () => {
    const rules = [
      MetadataCatalogRules,
      MetadataDocumentRules,
      MetadataExchangePlanRules,
      MetadataTaskRules,
      MetadataBusinessProcessRules,
      MetadataChartOfAccountsRules,
      MetadataChartOfCharacteristicTypesRules,
      MetadataChartOfCalculationTypesRules,
      MetadataExternalDataSourceTableRules,
    ] as const

    for (const rule of rules) {
      expect(rule.properties.basedOn.metadataTarget).toEqual({
        kind: "object",
        allowedObjectPaths: commonBasedOnObjectPaths,
      })
    }
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/metadataTargets/basedOn.test.ts --no-isolate
```

Expected: FAIL with an import error for `commonBasedOnObjectPaths`, because `basedOn.ts` does not exist yet.

- [ ] **Step 3: Create the shared constant**

Create `packages/core/metadata/commonObjects/metadataTargets/basedOn.ts` with:

```ts
export const commonBasedOnObjectPaths = [
  ["ChartOfAccounts"],
  ["ExternalDataSource", "Table"],
  ["ExchangePlan"],
  ["Catalog"],
  ["Document"],
  ["ChartOfCharacteristicTypes"],
  ["BusinessProcess"],
  ["ChartOfCalculationTypes"],
  ["Task"],
] as const
```

- [ ] **Step 4: Export the shared constant**

Modify `packages/core/metadata/commonObjects/metadataTargets/index.ts` to:

```ts
export * from "./basedOn"
export * from "./format"
export * from "./parse"
export * from "./roots"
export * from "./schema"
export * from "./types"
```

- [ ] **Step 5: Run the test and confirm the next failure**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/metadataTargets/basedOn.test.ts --no-isolate
```

Expected: FAIL in `is used by every basedOn rule in scope`, because most rules do not have the shared `metadataTarget` yet.

### Task 2: Apply Shared basedOn Targets To Rules

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataCatalog/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataDocument/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataExchangePlan/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataTask/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataBusinessProcess/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataChartOfAccounts/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataChartOfCharacteristicTypes/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataChartOfCalculationTypes/rules.ts`
- Modify: `packages/core/metadata/commonObjects/metadataExternalDataSourceTable/rules.ts`
- Test: `packages/core/metadata/commonObjects/metadataTargets/basedOn.test.ts`

- [ ] **Step 1: Update Catalog import and remove its local list**

In `packages/core/metadata/appliedObjects/metadataCatalog/rules.ts`, add:

```ts
import { commonBasedOnObjectPaths } from "~/metadata/commonObjects/metadataTargets"
```

Remove the local block:

```ts
const basedOnObjectPaths = [
  ["ChartOfAccounts"],
  ["ExternalDataSource", "Table"],
  ["ExchangePlan"],
  ["Catalog"],
  ["Document"],
  ["ChartOfCharacteristicTypes"],
  ["BusinessProcess"],
  ["ChartOfCalculationTypes"],
  ["Task"],
] as const
```

Change the `basedOn` rule to:

```ts
    basedOn: {
      yaml: "ВводитсяНаОсновании",
      type: "MetadataObjectRefCollection",
      xmlParents: ["Properties"],
      metadataTarget: { kind: "object", allowedObjectPaths: commonBasedOnObjectPaths },
      defaultValueXMLRaw: {},
    },
```

- [ ] **Step 2: Update Document**

In `packages/core/metadata/appliedObjects/metadataDocument/rules.ts`, add:

```ts
import { commonBasedOnObjectPaths } from "~/metadata/commonObjects/metadataTargets"
```

Change the `basedOn` rule to:

```ts
    basedOn: {
      yaml: "ВводитсяНаОсновании",
      type: "MetadataItemLinks",
      metadataTarget: { kind: "object", allowedObjectPaths: commonBasedOnObjectPaths },
      xmlParents: documentProperties,
      defaultValueXMLRaw: {},
    },
```

- [ ] **Step 3: Update ExchangePlan**

In `packages/core/metadata/appliedObjects/metadataExchangePlan/rules.ts`, add:

```ts
import { commonBasedOnObjectPaths } from "~/metadata/commonObjects/metadataTargets"
```

Change the `basedOn` rule to:

```ts
    basedOn: {
      yaml: "ОснованНа",
      type: "MetadataItemLinks",
      metadataTarget: { kind: "object", allowedObjectPaths: commonBasedOnObjectPaths },
      xmlParents: properties,
      defaultValue: emptyCollection,
      defaultValueXMLEmpty: emptyCollection,
      defaultValueXMLRaw: "",
    },
```

- [ ] **Step 4: Update Task**

In `packages/core/metadata/appliedObjects/metadataTask/rules.ts`, add:

```ts
import { commonBasedOnObjectPaths } from "~/metadata/commonObjects/metadataTargets"
```

Change the `basedOn` rule to:

```ts
    basedOn: {
      yaml: "ВводитсяНаОсновании",
      type: "MetadataItemLinks",
      metadataTarget: { kind: "object", allowedObjectPaths: commonBasedOnObjectPaths },
      xmlParents: properties,
      defaultValueXMLRaw: {},
    },
```

- [ ] **Step 5: Update BusinessProcess**

In `packages/core/metadata/appliedObjects/metadataBusinessProcess/rules.ts`, add:

```ts
import { commonBasedOnObjectPaths } from "~/metadata/commonObjects/metadataTargets"
```

Change the `basedOn` rule to:

```ts
    basedOn: {
      yaml: "ВводитсяНаОсновании",
      type: "MetadataItemLinks",
      metadataTarget: { kind: "object", allowedObjectPaths: commonBasedOnObjectPaths },
      xmlParents: properties,
      defaultValueXMLRaw: {},
    },
```

- [ ] **Step 6: Update ChartOfAccounts**

In `packages/core/metadata/appliedObjects/metadataChartOfAccounts/rules.ts`, add:

```ts
import { commonBasedOnObjectPaths } from "~/metadata/commonObjects/metadataTargets"
```

Change the compact `basedOn` rule to:

```ts
    basedOn: {
      yaml: "ВводитсяНаОсновании",
      type: "MetadataItemLinks",
      metadataTarget: { kind: "object", allowedObjectPaths: commonBasedOnObjectPaths },
      xmlParents: properties,
      defaultValueXMLRaw: {},
    },
```

- [ ] **Step 7: Update ChartOfCharacteristicTypes**

In `packages/core/metadata/appliedObjects/metadataChartOfCharacteristicTypes/rules.ts`, add:

```ts
import { commonBasedOnObjectPaths } from "~/metadata/commonObjects/metadataTargets"
```

Change the compact `basedOn` rule to:

```ts
    basedOn: {
      yaml: "ВводитсяНаОсновании",
      type: "MetadataItemLinks",
      metadataTarget: { kind: "object", allowedObjectPaths: commonBasedOnObjectPaths },
      xmlParents: properties,
      defaultValueXMLRaw: {},
    },
```

- [ ] **Step 8: Update ChartOfCalculationTypes**

In `packages/core/metadata/appliedObjects/metadataChartOfCalculationTypes/rules.ts`, add:

```ts
import { commonBasedOnObjectPaths } from "~/metadata/commonObjects/metadataTargets"
```

Change the `basedOn` rule to:

```ts
    basedOn: {
      yaml: "ВводитсяНаОсновании",
      type: "MetadataItemLinks",
      metadataTarget: { kind: "object", allowedObjectPaths: commonBasedOnObjectPaths },
      xmlParents: properties,
      defaultValueXMLRaw: {},
    },
```

Do not change `baseCalculationTypes`; it is not `basedOn` and is outside the spec.

- [ ] **Step 9: Update ExternalDataSource.Table**

In `packages/core/metadata/commonObjects/metadataExternalDataSourceTable/rules.ts`, add:

```ts
import { commonBasedOnObjectPaths } from "~/metadata/commonObjects/metadataTargets"
```

Change the `basedOn` rule to:

```ts
  basedOn: {
    yaml: "ВводитсяНаОсновании",
    xml: "BasedOn",
    type: "MetadataItemLinks",
    metadataTarget: { kind: "object", allowedObjectPaths: commonBasedOnObjectPaths },
    xmlParents: properties,
    defaultValueXMLRaw: "",
  },
```

- [ ] **Step 10: Run the focused test**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/metadataTargets/basedOn.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 11: Commit shared rules change**

Run:

```bash
git add packages/core/metadata/commonObjects/metadataTargets/basedOn.ts packages/core/metadata/commonObjects/metadataTargets/index.ts packages/core/metadata/commonObjects/metadataTargets/basedOn.test.ts packages/core/metadata/appliedObjects/metadataCatalog/rules.ts packages/core/metadata/appliedObjects/metadataDocument/rules.ts packages/core/metadata/appliedObjects/metadataExchangePlan/rules.ts packages/core/metadata/appliedObjects/metadataTask/rules.ts packages/core/metadata/appliedObjects/metadataBusinessProcess/rules.ts packages/core/metadata/appliedObjects/metadataChartOfAccounts/rules.ts packages/core/metadata/appliedObjects/metadataChartOfCharacteristicTypes/rules.ts packages/core/metadata/appliedObjects/metadataChartOfCalculationTypes/rules.ts packages/core/metadata/commonObjects/metadataExternalDataSourceTable/rules.ts
git commit -m "feat: :sparkles: ограничить basedOn общим списком"
```

Expected: commit created.

### Task 3: Add Import-Level Regression Coverage

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataDocument/fromYAML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataExchangePlan/fromYAML.test.ts`
- Test: `packages/core/metadata/appliedObjects/metadataDocument/fromYAML.test.ts`
- Test: `packages/core/metadata/appliedObjects/metadataExchangePlan/fromYAML.test.ts`

- [ ] **Step 1: Add Document YAML import regression**

Append this test inside `describe("import MetadataDocument from YAML", () => { ... })` in `packages/core/metadata/appliedObjects/metadataDocument/fromYAML.test.ts`:

```ts
  it("should apply common basedOn object restrictions", () => {
    const result = testImportAppliedObjectFromYAML<MetadataDocument>({
      rule: MetadataDocumentRules,
      yaml: {
        ВводитсяНаОсновании: ["Справочник.Номенклатура"],
      },
      name: "ЗаказПокупателя",
    })

    expect(result?.basedOn).toEqual(["Catalog.Номенклатура"])

    expect(() =>
      testImportAppliedObjectFromYAML<MetadataDocument>({
        rule: MetadataDocumentRules,
        yaml: {
          ВводитсяНаОсновании: ["Перечисление.Статусы"],
        },
        name: "ЗаказПокупателя",
      })
    ).toThrow('Вид цели "Enum" не разрешён')
  })
```

- [ ] **Step 2: Inspect ExchangePlan test imports**

Run:

```bash
sed -n '1,140p' packages/core/metadata/appliedObjects/metadataExchangePlan/fromYAML.test.ts
```

Expected: file imports `testImportAppliedObjectFromYAML`, `MetadataExchangePlanRules`, and `MetadataExchangePlan` or equivalent local helpers. Use the existing helper names in the next step.

- [ ] **Step 3: Add ExchangePlan YAML import regression**

Append this test inside the existing `describe` block in `packages/core/metadata/appliedObjects/metadataExchangePlan/fromYAML.test.ts`. If the file uses a different imported type name, keep the file's existing type name and only copy the YAML and expectations:

```ts
  it("should apply common basedOn object restrictions", () => {
    const result = testImportAppliedObjectFromYAML<MetadataExchangePlan>({
      rule: MetadataExchangePlanRules,
      yaml: {
        ОснованНа: ["Документ.ЗаказПокупателя"],
      },
      name: "ПланОбмена1",
    })

    expect(result?.basedOn).toEqual(["Document.ЗаказПокупателя"])

    expect(() =>
      testImportAppliedObjectFromYAML<MetadataExchangePlan>({
        rule: MetadataExchangePlanRules,
        yaml: {
          ОснованНа: ["ВнешнийИсточникДанных.ВнешнийИсточникДанныхВсеСвойства.Куб.КубВсеСвойства"],
        },
        name: "ПланОбмена1",
      })
    ).toThrow("не разрешён")
  })
```

- [ ] **Step 4: Run import-level tests**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/appliedObjects/metadataDocument/fromYAML.test.ts metadata/appliedObjects/metadataExchangePlan/fromYAML.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 5: Commit regression tests**

Run:

```bash
git add packages/core/metadata/appliedObjects/metadataDocument/fromYAML.test.ts packages/core/metadata/appliedObjects/metadataExchangePlan/fromYAML.test.ts
git commit -m "test: :white_check_mark: покрыть ограничения basedOn"
```

Expected: commit created.

### Task 4: Verification

**Files:**
- No code changes expected.
- Verify: metadata target tests, touched fromYAML tests, full project tests.

- [ ] **Step 1: Run metadata target tests**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/metadataTargets/parse.test.ts metadata/commonObjects/metadataTargets/basedOn.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 2: Run touched YAML tests**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/appliedObjects/metadataCatalog/fromYAML.test.ts metadata/appliedObjects/metadataDocument/fromYAML.test.ts metadata/appliedObjects/metadataExchangePlan/fromYAML.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 3: Run full project tests**

Run from `/home/nikita/git/nkdk`:

```bash
pnpm test
```

Expected: all package tests PASS.

- [ ] **Step 4: Inspect git state**

Run:

```bash
git status --short
git log --oneline -3
```

Expected: working tree clean; recent commits include:

```text
test: :white_check_mark: покрыть ограничения basedOn
feat: :sparkles: ограничить basedOn общим списком
docs: :memo: описать общий список basedOn
```

## Self-Review

- Spec coverage: covered shared constant, all eight newly scoped objects, `Catalog` migration from local list, unchanged XML/YAML field names, invalid target rejection, and full `pnpm test`.
- Placeholder scan: no `TBD`, `TODO`, "implement later", or unspecified test steps remain in this plan.
- Type consistency: the shared export is named `commonBasedOnObjectPaths` in all snippets; every rule uses `metadataTarget: { kind: "object", allowedObjectPaths: commonBasedOnObjectPaths }`; `ExternalDataSource.Table` keeps `type: "MetadataItemLinks"` and `xml: "BasedOn"`.
