# Form DataPath Element Type Compatibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Проверять совместимость основного `ПутьКДанным` управляемой формы с видом элемента, сохранять успешно разрешённый несовместимый XML через `!xml` и точно восстанавливать исходный `DataPath`.

**Architecture:** Существующий resolver продолжает отвечать за обход пути и получает только недостающий точный список конечных ветвей. Нейтральный слой `validation/dataPath` нормализует ветви и применяет переданную из `rules.ts` политику, а validation и XML-import используют один результат совместимости. Контекст формы отвечает за определение основного пути элемента, `КартинкаЗначений` и транспортный тег `!xml`.

**Tech Stack:** TypeScript, Vitest, js-yaml scalar tags, существующие `rules.ts`, project-state binary store, pnpm.

## Global Constraints

- Проверяются только файлы управляемых форм и только основной `ПутьКДанным` покрытых матрицей элементов.
- Матрица допустимых типов остаётся декларацией конкретных элементов в их `rules.ts`; нейтральные слои не содержат `switch` по `elementType`.
- Новые поля в `BasePropertyRule`, `PropertyRule` и параметры построителей правил не добавляются.
- `CatalogRef.Номенклатура` нормализуется в `CatalogRef.*`, а общий `CatalogRef` остаётся `CatalogRef`; правило применяется ко всем именованным семействам.
- Составной тип допускают только `InputField`, `TableInputField`, `LabelField` и `TableLabelField`; совпадение одной ветви не разрешает составной тип другому элементу.
- `CheckBoxField` и `TableCheckBoxField` принимают только одиночные `boolean` и `decimal`; найденные XML-примеры `string`, `dateTime`, `EnumRef.*` считаются ошибочными.
- `PictureField` и `TablePictureField` принимают одиночные `Picture`, `string`, `decimal`, `boolean`, `EnumRef.*`, `ValueStorage`; `ValueTable` разрешён только при `КартинкаЗначений`.
- Новое применение `!xml` согласовано только для успешно разрешённых несовместимых сочетаний основного `ПутьКДанным`; неразрешимый путь и неизвестный конечный тип тег не получают.
- Tagged-путь хранит исходную XML/internal-строку, разрешается в режиме `internal`, участвует в зависимостях и переименованиях; YAML → XML удаляет тег без повторного перевода имён.
- `Button`, `CommandBarButton`, дополнительные свойства путей и неисследованные основные элементы не получают проверку совместимости.
- Существующие XML-фикстуры не изменяются; новые тестовые XML создаются отдельными минимальными фикстурами или строками внутри тестов.
- После каждого законченного слоя выполняется `pnpm duplicates -- --base df2bf639cb563ac58c1732a4c794906aebd66788`.

---

## File Structure

- Create: `packages/core/metadata/validation/dataPath/terminalTypes.ts`
  - Нормализует точные конечные ветви resolver в группы матрицы и отличает известный `<any>` от недостатка данных.
- Create: `packages/core/metadata/validation/dataPath/terminalTypes.test.ts`
  - Покрывает примитивы, общие и именованные ссылки, табличные части, наборы записей, стандартные перечисления и составность.
- Modify: `packages/core/metadata/ruleRuntime/dataPath/types.ts`
  - Добавляет необязательные точные `terminalTypes` к `DataPathTypeInfo` без изменения алгоритма resolver.
- Modify: `packages/core/metadata/validation/dataPath/typeDescription.ts`
  - Заполняет `terminalTypes` из `TypeDescriptionView` до сведения типов к широким traversal-категориям.
- Modify: `packages/core/metadata/validation/dataPath/coreResolver.ts`
  - Сливает эффективные ветви раскрытого DefinedType, не считая имя объявления отдельной ветвью.
- Modify: `packages/core/metadata/validation/dataPath/standardMembers.ts`
  - Указывает точные конечные типы стандартных реквизитов там, где `sourceText` описывает происхождение, а не тип.
- Modify: `packages/core/metadata/appliedObjects/dataPathCommon/register.ts`
  - Передаёт точные типы виртуальных и табличных стандартных полей.
- Modify: `packages/core/metadata/ruleRuntime/property/types.ts`
  - Заменяет старый широкий `DataPathAllowedKind` на точные группы матрицы и шаблоны `Family.*`.
- Modify: `packages/core/metadata/validation/dataPath/policies.ts`
  - Возвращает единый результат `compatible | incompatible | notResolved | notConfigured`, строит предметную diagnostic и учитывает tagged-режим.
- Modify: `packages/core/metadata/validation/dataPath/policies.test.ts`
  - Проверяет строгие одиночные и составные политики, ошибочные флажки и узкое исключение картинки.
- Modify: `packages/core/metadata/forms/elements/*/rules.ts`
  - Задаёт подтверждённые `allowedKinds` и `allowComposite` для всех покрытых основных элементов; удаляет политику с дополнительных путей.
- Create: `packages/core/metadata/forms/elements/dataPathPolicies.test.ts`
  - Проверяет декларации `rules.ts` как одну таблицу и отсутствие политики у исключённых элементов/свойств.
- Modify: `packages/core/metadata/validation/dataPath/formTraversal.ts`
- Modify: `packages/core/metadata/validation/dataPath/formYamlTraversal.ts`
  - Переносит признак `!xml`, исходный payload и режим имён вместе с occurrence основного пути.
- Modify: `packages/core/metadata/validation/dataPath/resolver.ts`
  - Принимает `nameMode: "yaml" | "internal"`, по умолчанию сохраняя нынешний `yaml`.
- Modify: `packages/core/metadata/validation/yamlFactExtractor.ts`
- Modify: `packages/core/metadata/validation/projectValidationPendingChecks.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/validate.ts`
  - Передаёт tagged-флаг, выбирает режим имён и подавляет только согласованную ошибку несовместимости.
- Modify: `packages/core/metadata/projectState/contracts/fileUpdate.ts`
- Modify: `packages/core/metadata/projectState/fileUpdate.ts`
- Modify: `packages/core/metadata/projectState/fileUpdateValidation.ts`
- Modify: `packages/core/metadata/projectState/binary/fragment.ts`
- Modify: `packages/core/metadata/projectState/binary/typedReader.ts`
  - Сохраняет tagged-флаг DataPath в существующем байте `reserved`, не меняя layout и версию состояния.
- Create: `packages/core/metadata/forms/clientApplicationForm/importDataPathCompatibility.ts`
  - После получения owner cache помечает несовместимые импортированные основные пути, восстанавливая original XML/internal payload.
- Create: `packages/core/metadata/forms/clientApplicationForm/importDataPathCompatibility.test.ts`
  - Проверяет три исхода import: compatible, incompatible, notResolved.
- Modify: `packages/core/metadata/importFromXml/worker.ts`
  - Вызывает form-specific финализацию между обычным форматированием путей и сериализацией YAML.
- Modify: `packages/core/metadata/commonObjects/metadataPath/fromYAML.ts`
  - Для tagged DataPath возвращает payload без преобразования стандартных имён.
- Modify: `packages/core/metadata/commonObjects/metadataPath/toYAML.ts`
  - Не форматирует уже tagged payload повторно.
- Modify: `packages/core/metadata/ruleRuntime/property/toJSONSchema.ts`
  - Разрешает `!xml <payload>` в validation-схеме только для основного DataPath с закрытой политикой и не показывает его в схеме подсказок.
- Modify: `packages/core/metadata/operations/dataPathReferences.ts`
  - Разрешает tagged-путь в internal-режиме и сохраняет тег при переименовании.
- Modify: `.agents/restrictions.md`
  - Фиксирует исключённые элементы и дополнительные свойства путей.
- Modify: integration tests under `packages/core/metadata/forms/clientApplicationForm`, `packages/core/metadata/importFromXml`, `packages/core/metadata/validation`, and `packages/core/metadata/operations`.

---

### Task 1: Exact terminal type contract and normalizer

**Files:**
- Create: `packages/core/metadata/validation/dataPath/terminalTypes.ts`
- Test: `packages/core/metadata/validation/dataPath/terminalTypes.test.ts`
- Modify: `packages/core/metadata/ruleRuntime/dataPath/types.ts`
- Modify: `packages/core/metadata/validation/dataPath/typeDescription.ts`
- Modify: `packages/core/metadata/validation/dataPath/typeDescription.test.ts`
- Modify: `packages/core/metadata/validation/dataPath/coreResolver.ts`
- Modify: `packages/core/metadata/validation/dataPath/resolver.test.ts`
- Modify: `packages/core/metadata/validation/dataPath/standardMembers.ts`
- Modify: `packages/core/metadata/appliedObjects/dataPathCommon/register.ts`
- Modify: `packages/core/metadata/ruleRuntime/property/types.ts`

**Interfaces:**
- Produces: `DataPathTypeInfo.terminalTypes?: readonly string[]` — точные **эффективные** ветви до сведения в traversal-категории; имя объявления DefinedType остаётся в существующем `definedTypes` и не считается отдельной ветвью.
- Produces: `normalizeDataPathTerminalType(typeInfo: DataPathTypeInfo): NormalizedDataPathTerminalType`.
- Produces: `NormalizedDataPathTerminalType = { status: "resolved"; groups: readonly DataPathAllowedKind[]; composite: boolean; display: string } | { status: "notResolved"; display: string }`.
- Consumes later: `evaluateDataPathCompatibility` in Task 2.

- [ ] **Step 1: Write failing normalization tests**

Create `terminalTypes.test.ts` with a table that proves exact grouping instead of broad `scalar/object/tableSource` matching:

```ts
import { describe, expect, it } from "vitest"
import { normalizeDataPathTerminalType } from "./terminalTypes"

describe("normalizeDataPathTerminalType", () => {
  it.each([
    ["string", "string"],
    ["decimal", "decimal"],
    ["boolean", "boolean"],
    ["dateTime", "dateTime"],
    ["CatalogRef.Номенклатура", "CatalogRef.*"],
    ["CatalogRef", "CatalogRef"],
    ["CatalogTabularSection.Номенклатура.Товары", "CatalogTabularSection.*"],
    ["CalculationRegisterRecordSet.Начисления", "CalculationRegisterRecordSet.*"],
  ] as const)("normalizes %s to %s", (source, expected) => {
    expect(normalizeDataPathTerminalType({
      kinds: ["object"], nextTypes: [], terminalTypes: [source], sourceText: source,
    })).toMatchObject({ status: "resolved", groups: [expected], composite: false })
  })

  it("keeps all branches of a composite type", () => {
    expect(normalizeDataPathTerminalType({
      kinds: ["scalar", "boolean"], nextTypes: [],
      terminalTypes: ["string", "boolean"], isComposite: true,
    })).toEqual({
      status: "resolved", groups: ["string", "boolean"], composite: true,
      display: "string | boolean",
    })
  })

  it("distinguishes known any from unavailable terminal details", () => {
    expect(normalizeDataPathTerminalType({ kinds: ["any"], nextTypes: [], terminalTypes: ["<any>"] }))
      .toMatchObject({ status: "resolved", groups: ["<any>"] })
    expect(normalizeDataPathTerminalType({ kinds: ["unknown"], nextTypes: [] }))
      .toMatchObject({ status: "notResolved" })
  })
})
```

Also add cases for `DocumentRef.*`, `EnumRef.*`, `ChartOfAccountsTabularSection.*`, every `*RegisterRecordSet.*`, `DefinedType.*`, bare reference families, `ValueTable`, and one registered standard enumeration mapped to `<standard-enum>`.

- [ ] **Step 2: Run the tests and verify the intended failure**

Run:

```bash
pnpm --filter @nakidka/core test -- terminalTypes.test.ts typeDescription.test.ts
```

Expected: FAIL because `terminalTypes.ts` and `DataPathTypeInfo.terminalTypes` do not exist.

- [ ] **Step 3: Add exact terminal branches at the type-description boundary**

Extend the existing type without changing its current fields:

```ts
export interface DataPathTypeInfo {
  kinds: readonly DataPathValueKind[]
  nextTypes: readonly OwnerTypeRef[]
  terminalTypes?: readonly string[]
  definedTypes?: readonly string[]
  table?: DataPathTableInfo
  isComposite?: boolean
  sourceText?: string
}
```

In `typeDescriptionToDataPathTypeInfo`, preserve non-DefinedType input branches. A `DefinedType.*` entry stays in `definedTypes` until owner-cache expansion supplies its effective branches:

```ts
return {
  kinds,
  nextTypes,
  terminalTypes: types.filter((type) => !type.startsWith("DefinedType.")),
  ...(definedTypes.length > 0 ? { definedTypes } : {}),
  ...(table !== undefined ? { table } : {}),
  ...(types.length > 1 ? { isComposite: true } : {}),
  sourceText: types.join(" | "),
}
```

Update `mergeResolvedDefinedTypeInfo` in `coreResolver.ts` as part of this step: merge `terminalTypes` from ordinary source branches and all resolved DefinedType items, preserve `source.definedTypes`, and derive `isComposite` from the count of effective terminal branches. Do not count `DefinedType.*` itself as an additional branch. Thus a DefinedType resolving to one `CatalogRef.*` remains single and may match a policy that explicitly allows `DefinedType.*`; a DefinedType resolving to `string | boolean` is composite and follows the universal composite rule.

For standard members and registered virtual fields whose current `sourceText` is an origin such as `ValueList.Value` or `RegisterRecordSet.Period`, add the actual primitive in `terminalTypes`, for example `{ kinds: ["scalar"], terminalTypes: ["decimal"], ... }`. Do not infer exact types from arbitrary diagnostic `sourceText`; return `notResolved` when neither `terminalTypes`, table metadata nor an unambiguous owner reference supplies a terminal group.

- [ ] **Step 4: Implement normalization and exact allowed-kind types**

Use literal primitives plus template-literal families:

```ts
export type DataPathNamedFamily =
  | "DocumentRef" | "CatalogRef" | "EnumRef" | "TaskRef"
  | "BusinessProcessRef" | "ExchangePlanRef"
  | "ChartOfAccountsRef" | "ChartOfCharacteristicTypesRef"
  | "ChartOfCalculationTypesRef" | "AccumulationRegisterRef"
  | "AccountingRegisterRef" | "InformationRegisterRef"
  | "CalculationRegisterRef" | "BusinessProcessRoutePointRef"
  | "Characteristic" | "DefinedType"
  | "DocumentTabularSection" | "CatalogTabularSection"
  | "DataProcessorTabularSection" | "ReportTabularSection"
  | "ExchangePlanTabularSection" | "BusinessProcessTabularSection"
  | "TaskTabularSection" | "ChartOfAccountsTabularSection"
  | "ChartOfCharacteristicTypesTabularSection"
  | "ChartOfCalculationTypesTabularSection"
  | "ChartOfAccountsExtDimensionTypes"
  | "InformationRegisterRecordSet" | "AccumulationRegisterRecordSet"
  | "AccountingRegisterRecordSet" | "CalculationRegisterRecordSet"

export type DataPathAllowedKind =
  | `${DataPathNamedFamily}.*`
  | DataPathNamedFamily
  | "string" | "decimal" | "boolean" | "dateTime" | "UUID" | "Null" | "<any>"
  | "<standard-enum>" | "Picture" | "Color" | "Font" | "ValueStorage"
  | "TypeDescription" | "ValueTable" | "ValueTree" | "ValueListType"
  | "DynamicList" | "GanttChart" | "FormattedString" | "StandardPeriod"
  | "StandardBeginningDate" | "AnyIBRef" | "SpreadsheetDocument"
  | "TextDocument" | "FormattedDocument" | "Chart" | "FlowchartContextType"
  | "PDFDocument" | "Planner" | "GeographicalSchema"
  | "DataCompositionComparisonType" | "ComparisonType" | "DataCompositionGroupType"
  | "DataCompositionSortDirection" | "DataCompositionPeriodAdditionType"
  | "Field" | "Filter" | "HorizontalAlign" | "VerticalAlign"
```

Implement `normalizeDataPathTerminalType` with three ordered sources: exact effective `terminalTypes`; structural `table/nextTypes`; otherwise `notResolved`. Add `DefinedType.*` as a declaration group only when `definedTypes` is non-empty, but compute `composite` solely from effective `terminalTypes`/resolved branches. A name after the first dot becomes `Base.*`; no dot preserves the bare family. Use the registered system-enumeration lookup to return `<standard-enum>` only for a genuinely registered platform enumeration.

- [ ] **Step 5: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core test -- terminalTypes.test.ts typeDescription.test.ts standardMembers.coverage.test.ts resolver.test.ts
```

Expected: PASS; existing resolver behavior and diagnostics remain unchanged.

- [ ] **Step 6: Check duplicates and commit the terminal-type layer**

```bash
pnpm duplicates -- --base df2bf639cb563ac58c1732a4c794906aebd66788
git add packages/core/metadata/ruleRuntime/dataPath/types.ts packages/core/metadata/ruleRuntime/property/types.ts packages/core/metadata/validation/dataPath/terminalTypes.ts packages/core/metadata/validation/dataPath/terminalTypes.test.ts packages/core/metadata/validation/dataPath/typeDescription.ts packages/core/metadata/validation/dataPath/typeDescription.test.ts packages/core/metadata/validation/dataPath/coreResolver.ts packages/core/metadata/validation/dataPath/resolver.test.ts packages/core/metadata/validation/dataPath/standardMembers.ts packages/core/metadata/appliedObjects/dataPathCommon/register.ts
git commit -m "feat: :sparkles: нормализовать конечные типы пути формы"
```

---

### Task 2: Shared compatibility result and exact element policies

**Files:**
- Modify: `packages/core/metadata/validation/dataPath/policies.ts`
- Modify: `packages/core/metadata/validation/dataPath/policies.test.ts`
- Create: `packages/core/metadata/forms/elements/dataPathPolicies.test.ts`
- Modify: `packages/core/metadata/forms/elements/inputField/rules.ts`
- Modify: `packages/core/metadata/forms/elements/labelField/rules.ts`
- Modify: `packages/core/metadata/forms/elements/checkBoxField/rules.ts`
- Modify: `packages/core/metadata/forms/elements/pictureField/rules.ts`
- Modify: `packages/core/metadata/forms/elements/radioButtonField/rules.ts`
- Modify: `packages/core/metadata/forms/elements/table/rules.ts`
- Modify: `packages/core/metadata/forms/elements/{spreadSheetDocumentField,htmlDocumentField,textDocumentField,progressBarField,trackBarField,formattedDocumentField,chartField,calendarField,graphicalSchemaField,pdfDocumentField,ganttChartField,plannerField,geographicalSchemaField}/rules.ts`

**Interfaces:**
- Consumes: `normalizeDataPathTerminalType` from Task 1.
- Produces: `evaluateDataPathCompatibility(params): DataPathCompatibilityResult`.
- Produces: `DataPathCompatibilityResult = { status: "notConfigured" | "notResolved" | "compatible" } | { status: "incompatible"; actual: string; expected: readonly DataPathAllowedKind[]; reason: "kind" | "composite" }`.
- Keeps: `validateResolvedDataPathPolicy` as the diagnostic adapter used by all validation paths.

- [ ] **Step 1: Replace permissive policy tests with the agreed contract**

Delete assertions that allow a composite when one broad kind matches. Add explicit tests:

```ts
it.each([
  ["InputField", ["string", "boolean"]],
  ["LabelField", ["Picture", "string"]],
] as const)("allows composite for %s", (elementType, terminalTypes) => {
  expect(evaluateCompatibility({ elementType, terminalTypes, allowComposite: true })).toMatchObject({ status: "compatible" })
})

it.each(["CheckBoxField", "PictureField", "RadioButtonField"] as const)(
  "rejects composite for %s even when one branch is allowed",
  (elementType) => {
    expect(evaluateCompatibility({
      elementType, terminalTypes: ["boolean", "string"],
      allowedKinds: ["boolean"], allowComposite: false,
    })).toMatchObject({ status: "incompatible", reason: "composite" })
  }
)

it.each(["string", "dateTime", "EnumRef.Состояния"])("rejects invalid checkbox XML type %s", (type) => {
  expect(evaluateCompatibility({ allowedKinds: ["boolean", "decimal"], terminalTypes: [type] }))
    .toMatchObject({ status: "incompatible", reason: "kind" })
})
```

Add the narrow picture exception test: `ValueTable + hasValuesPicture` is compatible; `ValueTree + hasValuesPicture` and `ValueTable` without the picture are incompatible.

- [ ] **Step 2: Run policy tests and verify failure**

```bash
pnpm --filter @nakidka/core test -- policies.test.ts
```

Expected: FAIL because current policy uses `some()` over broad kinds and treats `any` as unresolved.

- [ ] **Step 3: Implement one compatibility evaluator**

Implement the flow exactly:

```ts
export function evaluateDataPathCompatibility(params: {
  rule: DataPathPolicyInput
  target: ResolvedDataPathTarget | undefined
  hasValuesPicture?: boolean
}): DataPathCompatibilityResult {
  if (params.rule.allowedKinds === undefined) return { status: "notConfigured" }
  if (params.target === undefined) return { status: "notResolved" }
  const normalized = normalizeDataPathTerminalType(params.target.typeInfo)
  if (normalized.status === "notResolved") return normalized
  if (normalized.composite) {
    return params.rule.allowComposite === true
      ? { status: "compatible" }
      : { status: "incompatible", reason: "composite", actual: normalized.display, expected: params.rule.allowedKinds }
  }
  if (isValuesPictureValueTable(params, normalized.groups)) return { status: "compatible" }
  return normalized.groups.length === 1 && params.rule.allowedKinds.includes(normalized.groups[0]!)
    ? { status: "compatible" }
    : { status: "incompatible", reason: "kind", actual: normalized.display, expected: params.rule.allowedKinds }
}
```

The picture exception must inspect only `rule.yaml === "ПутьКДанным"`, `hasValuesPicture === true`, and normalized group `ValueTable`; it must not inspect `elementType` in this neutral function. The fact that only picture rules can activate the exception is expressed by passing the context only from those rule declarations/form occurrences.

`validateResolvedDataPathPolicy` converts only `incompatible` into an error. `notResolved` yields no second diagnostic because resolver already owns that outcome.

- [ ] **Step 4: Declare the exact matrix in rules.ts**

Add local readonly constants in `inputField/rules.ts` and `labelField/rules.ts` so table variants reuse exactly the same lists. Set `allowComposite: true` only on these four rules. Use these exact declarations, including bare reference families separately from `Family.*`:

```ts
const inputFieldDataPathKinds = [
  "string", "decimal", "boolean", "dateTime", "UUID", "Null", "<any>",
  "Picture", "Color", "Font", "ValueStorage", "TypeDescription",
  "ValueTable", "ValueListType", "StandardPeriod", "StandardBeginningDate",
  "DocumentRef.*", "CatalogRef.*", "EnumRef.*", "TaskRef.*",
  "BusinessProcessRef.*", "ExchangePlanRef.*", "ChartOfAccountsRef.*",
  "ChartOfCharacteristicTypesRef.*", "ChartOfCalculationTypesRef.*",
  "AccumulationRegisterRef.*", "AccountingRegisterRef.*", "InformationRegisterRef.*",
  "BusinessProcessRoutePointRef.*", "Characteristic.*", "DefinedType.*",
  "DocumentRef", "CatalogRef", "EnumRef", "TaskRef", "BusinessProcessRef",
  "ExchangePlanRef", "ChartOfAccountsRef", "ChartOfCharacteristicTypesRef",
  "ChartOfCalculationTypesRef", "BusinessProcessRoutePointRef", "AnyIBRef",
  "CatalogTabularSection.*", "<standard-enum>", "DataCompositionComparisonType",
  "ComparisonType", "DataCompositionGroupType", "DataCompositionSortDirection",
  "DataCompositionPeriodAdditionType", "Field", "Filter", "HorizontalAlign", "VerticalAlign",
] as const satisfies readonly DataPathAllowedKind[]

const labelFieldDataPathKinds = [
  "string", "decimal", "boolean", "dateTime", "UUID", "Null", "<any>",
  "Picture", "FormattedString", "ValueStorage", "TypeDescription",
  "ValueTable", "ValueTree", "ValueListType", "StandardPeriod",
  "DocumentRef.*", "CatalogRef.*", "EnumRef.*", "TaskRef.*",
  "BusinessProcessRef.*", "ExchangePlanRef.*", "ChartOfAccountsRef.*",
  "ChartOfCharacteristicTypesRef.*", "ChartOfCalculationTypesRef.*",
  "AccumulationRegisterRef.*", "AccountingRegisterRef.*", "InformationRegisterRef.*",
  "CalculationRegisterRef.*", "Characteristic.*", "DefinedType.*",
  "DocumentRef", "CatalogRef", "EnumRef", "TaskRef", "BusinessProcessRef",
  "ExchangePlanRef", "ChartOfAccountsRef", "ChartOfCharacteristicTypesRef",
  "ChartOfCalculationTypesRef", "BusinessProcessRoutePointRef", "AnyIBRef",
  "<standard-enum>", "DataCompositionSortDirection",
] as const satisfies readonly DataPathAllowedKind[]
```

Use `allowedKinds: ["boolean", "decimal"]` with `allowComposite: false` for both checkbox rules. Use this exact picture list for both picture rules:

```ts
allowedKinds: ["Picture", "string", "decimal", "boolean", "EnumRef.*", "ValueStorage"],
allowComposite: false,
```

Use this exact radio-button list:

```ts
allowedKinds: [
  "string", "decimal", "CatalogRef.*", "DefinedType.*", "EnumRef.*",
  "FormattedString", "ChartOfAccountsRef.*", "ChartOfCharacteristicTypesRef.*",
  "<standard-enum>",
],
allowComposite: false,
```

For `Table`, use exactly:

```ts
allowedKinds: [
  "DynamicList", "ValueTable", "ValueTree", "ValueListType", "GanttChart",
  "DocumentTabularSection.*", "CatalogTabularSection.*", "DataProcessorTabularSection.*",
  "ReportTabularSection.*", "ExchangePlanTabularSection.*", "BusinessProcessTabularSection.*",
  "TaskTabularSection.*", "ChartOfAccountsTabularSection.*",
  "ChartOfCharacteristicTypesTabularSection.*", "ChartOfCalculationTypesTabularSection.*",
  "ChartOfAccountsExtDimensionTypes.*", "InformationRegisterRecordSet.*",
  "AccumulationRegisterRecordSet.*", "AccountingRegisterRecordSet.*",
  "CalculationRegisterRecordSet.*",
],
allowComposite: false,
```

For specialized fields, set the exact declarations below with `allowComposite: false` in every case:

```ts
const specializedPolicies = {
  SpreadSheetDocumentField: ["SpreadsheetDocument", "ValueTable"],
  HTMLDocumentField: ["string"],
  TextDocumentField: ["string", "TextDocument"],
  ProgressBarField: ["decimal"],
  TrackBarField: ["decimal"],
  FormattedDocumentField: ["FormattedDocument"],
  ChartField: ["Chart"],
  CalendarField: ["dateTime"],
  GraphicalSchemaField: ["FlowchartContextType"],
  PDFDocumentField: ["PDFDocument"],
  GanttChartField: ["GanttChart"],
  PlannerField: ["Planner"],
  GeographicalSchemaField: ["GeographicalSchema"],
} as const satisfies Readonly<Record<string, readonly DataPathAllowedKind[]>>
```

This object is documentation for the plan, not a new runtime registry: write each list into its element's existing `dataPathRule` in `rules.ts`. Remove `allowedKinds` and `allowComposite` from `TableRules.properties.rowPictureDataPath`; it is an explicitly excluded additional path.

- [ ] **Step 5: Add a declaration-level matrix test**

In `dataPathPolicies.test.ts`, read each exported rule and assert its `dataPath` declaration. The test table must cover all confirmed elements, both table field variants, both confirmed Table hypotheses, and these negative cases:

```ts
expect(ButtonRules.properties.dataPath.allowedKinds).toBeUndefined()
expect(CommandBarButtonRules.properties.dataPath.allowedKinds).toBeUndefined()
expect(TableRules.properties.rowPictureDataPath.allowedKinds).toBeUndefined()
expect(DendrogramFieldRules.properties.dataPath.allowedKinds).toBeUndefined()
expect(PeriodFieldRules.properties.dataPath.allowedKinds).toBeUndefined()
```

- [ ] **Step 6: Run rules and policy tests**

```bash
pnpm --filter @nakidka/core test -- policies.test.ts dataPathPolicies.test.ts toJSONSchema.test.ts
```

Expected: PASS; the matrix is fully represented without policy on exclusions.

- [ ] **Step 7: Check duplicates and commit the policy layer**

```bash
pnpm duplicates -- --base df2bf639cb563ac58c1732a4c794906aebd66788
git add packages/core/metadata/validation/dataPath/policies.ts packages/core/metadata/validation/dataPath/policies.test.ts packages/core/metadata/forms/elements
git commit -m "feat: :sparkles: задать допустимые типы пути элементов формы"
```

---

### Task 3: Tagged DataPath validation and resolver name mode

**Files:**
- Modify: `packages/core/metadata/validation/dataPath/formTraversal.ts`
- Modify: `packages/core/metadata/validation/dataPath/formYamlTraversal.ts`
- Modify: `packages/core/metadata/validation/dataPath/formYamlTraversal.test.ts`
- Modify: `packages/core/metadata/validation/dataPath/resolver.ts`
- Modify: `packages/core/metadata/validation/dataPath/resolver.test.ts`
- Modify: `packages/core/metadata/validation/projectValidationPendingChecks.ts`
- Modify: `packages/core/metadata/validation/projectValidationPendingChecks.test.ts`
- Modify: `packages/core/metadata/validation/yamlFactExtractor.ts`
- Modify: `packages/core/metadata/validation/yamlFactExtractor.form.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/validate.ts`

**Interfaces:**
- Produces: `FormDataPathOccurrence.tagged?: boolean` and `nameMode?: "yaml" | "internal"`.
- Produces: `ResolveDataPathParams.nameMode?: DataPathNameMode`, defaulting to `yaml`.
- Produces: `DataPathValidationPendingCheck.tagged: boolean`.
- Consumes: compatibility result from Task 2.

- [ ] **Step 1: Write failing tagged-validation tests**

Parse real YAML tags rather than constructing strings manually:

```ts
const parsed = parseMetadataYaml(`
Элементы:
  Флаг:
    Вид: ПолеФлажка
    ПутьКДанным: !xml Объект.InvalidFlag
`)
```

Assert four behaviors:

- tagged + resolved incompatible → no compatibility diagnostic;
- tagged + resolved compatible → diagnostic `!xml допустим только для несовместимого ПутьКДанным`;
- tagged + missing target → original resolver diagnostic remains;
- ordinary + resolved incompatible → one diagnostic at `ПутьКДанным` containing element type, actual and expected groups.

Add a resolver test where internal standard segment succeeds only with `{ nameMode: "internal" }` and returns the same canonical target used by ordinary YAML spelling.

- [ ] **Step 2: Run focused tests and verify failure**

```bash
pnpm --filter @nakidka/core test -- formYamlTraversal.test.ts projectValidationPendingChecks.test.ts yamlFactExtractor.form.test.ts resolver.test.ts
```

Expected: FAIL because DataPath occurrences and pending checks do not retain scalar-tag state and resolver is hard-coded to YAML names.

- [ ] **Step 3: Carry tag state from the parsed YAML object**

In both YAML occurrence collectors, derive the tag from the owning object and the rule's YAML key:

```ts
const tagged = yamlScalarTagAt(record, propertyRule.yaml) === "xml"
const dataPathValue = tagged ? xmlScalarTagPayload(value) : value
```

Store `value: dataPathValue`, `tagged`, and `nameMode: tagged ? "internal" : "yaml"`. Keep `setValue` writing through the same parent/key so the existing WeakMap mark survives rename operations.

Do not mark a value tagged merely because its text begins with `!xml`; the YAML scalar tag is the authority.

- [ ] **Step 4: Add name mode to the resolver adapter**

Change only the adapter default:

```ts
export type ResolveDataPathParams = {
  value: string
  nameMode?: DataPathNameMode
  // existing fields
}

const core = resolveDataPathCore({
  value: params.value,
  nameMode: params.nameMode ?? "yaml",
  // existing fields
})
```

Pass occurrence/check `nameMode` from all three validation entry points. Do not change `resolveDataPathCore` traversal.

- [ ] **Step 5: Apply tagged compatibility semantics**

Extend the diagnostic adapter with `tagged: boolean`:

```ts
const compatibility = evaluateDataPathCompatibility(...)
if (params.tagged) {
  return compatibility.status === "compatible"
    ? [diagnostic("!xml допустим только для несовместимого ПутьКДанным")]
    : []
}
return compatibility.status === "incompatible" ? [incompatibilityDiagnostic(...)] : []
```

Resolver diagnostics are appended before this call and therefore never suppressed. `notConfigured` does not authorize `!xml`; schema admission in Task 5 prevents the tag on excluded properties.

- [ ] **Step 6: Run validation tests**

```bash
pnpm --filter @nakidka/core test -- formYamlTraversal.test.ts projectValidationPendingChecks.test.ts yamlFactExtractor.form.test.ts resolver.test.ts clientApplicationForm/validate.test.ts
```

Expected: PASS.

- [ ] **Step 7: Check duplicates and commit tagged validation**

```bash
pnpm duplicates -- --base df2bf639cb563ac58c1732a4c794906aebd66788
git add packages/core/metadata/validation packages/core/metadata/forms/clientApplicationForm/validate.ts
git commit -m "feat: :sparkles: проверять tagged путь формы в internal режиме"
```

---

### Task 4: Persist tagged DataPath in existing project-state layout

**Files:**
- Modify: `packages/core/metadata/projectState/contracts/fileUpdate.ts`
- Modify: `packages/core/metadata/projectState/fileUpdate.ts`
- Modify: `packages/core/metadata/projectState/fileUpdateValidation.ts`
- Modify: `packages/core/metadata/projectState/fileUpdate.test.ts`
- Modify: `packages/core/metadata/projectState/binary/fragment.ts`
- Modify: `packages/core/metadata/projectState/binary/fragment.test.ts`
- Modify: `packages/core/metadata/projectState/binary/typedReader.ts`
- Modify: `packages/core/metadata/projectState/binary/readSession.test.ts`
- Modify: `packages/core/metadata/validation/projectStateDependencyValidation.ts`
- Modify: `packages/core/metadata/validation/projectStateDependencyValidation.test.ts`

**Interfaces:**
- Consumes: `DataPathValidationPendingCheck.tagged` from Task 3.
- Produces: `ProjectStatePendingDependencyCheck` DataPath branch with required `tagged: boolean`.
- Encoding: existing `pendingChecks.reserved` byte stores `0 = ordinary`, `1 = tagged`; layout and version remain unchanged.

- [ ] **Step 1: Write failing contract and binary round-trip tests**

Add `tagged: true` to the DataPath fixture and assert:

```ts
expect(read.pendingChecks[0]).toMatchObject({
  kind: "dataPath",
  value: "Объект.InvalidFlag",
  tagged: true,
})
```

Also verify an old/default row with `reserved: 0` reads as `tagged: false`, and malformed portable updates reject non-boolean `tagged`.

- [ ] **Step 2: Run state tests and verify failure**

```bash
pnpm --filter @nakidka/core test -- fileUpdate.test.ts fragment.test.ts readSession.test.ts projectStateDependencyValidation.test.ts
```

Expected: FAIL because tagged is absent from the DataPath state contract.

- [ ] **Step 3: Thread the required boolean through portable contracts**

Add `tagged: boolean` beside `value` in all DataPath pending-check shapes, validate it with the existing exact-key validator, and copy it in `projectStatePendingCheck`.

Write/read it without a new table:

```ts
// fragment writer
reserved: booleanFlag(check.tagged),

// typed reader
tagged: value.reserved === 1,
```

Assert `reserved` is ternary/boolean storage in `factTables.ts` if that validator currently covers the field. Do not change `layouts.ts`, magic numbers or format version.

- [ ] **Step 4: Resolve project-state checks in the stored name mode**

In `resolveProjectStateDataPathReferenceBatch`, call resolver with:

```ts
nameMode: check.check.tagged ? "internal" : "yaml"
```

Then pass `tagged` to `validatePendingChecks`. This keeps canonical dependency targets identical for ordinary and tagged representations.

- [ ] **Step 5: Run state and dependency tests**

```bash
pnpm --filter @nakidka/core test -- fileUpdate.test.ts fragment.test.ts readSession.test.ts projectStateDependencyValidation.test.ts projectValidationPendingChecks.test.ts
```

Expected: PASS, including old zero-valued rows.

- [ ] **Step 6: Check duplicates and commit binary state support**

```bash
pnpm duplicates -- --base df2bf639cb563ac58c1732a4c794906aebd66788
git add packages/core/metadata/projectState packages/core/metadata/validation/projectStateDependencyValidation.ts packages/core/metadata/validation/projectStateDependencyValidation.test.ts
git commit -m "feat: :sparkles: сохранить tagged путь в состоянии проекта"
```

---

### Task 5: Mark incompatible XML imports and emit exact tagged payload

**Files:**
- Create: `packages/core/metadata/forms/clientApplicationForm/importDataPathCompatibility.ts`
- Test: `packages/core/metadata/forms/clientApplicationForm/importDataPathCompatibility.test.ts`
- Modify: `packages/core/metadata/importFromXml/worker.ts`
- Modify: `packages/core/metadata/importFromXml/worker.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataPath/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataPath/toYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataPath/fromYAML.ts`
- Create or modify test: `packages/core/metadata/commonObjects/metadataPath/fromYAML.test.ts`
- Modify: `packages/core/metadata/ruleRuntime/property/toJSONSchema.ts`
- Modify: `packages/core/metadata/ruleRuntime/property/toJSONSchemaExplicitXML.test.ts`

**Interfaces:**
- Produces: `finalizeImportedFormDataPathCompatibility(params): void`.
- Consumes: original internal occurrences captured before standard-name formatting, finalized YAML occurrences, owner cache, form index and Task 2 evaluator.
- Produces serialized YAML `ПутьКДанным: !xml <original-internal-path>` only for `incompatible`.

- [ ] **Step 1: Write failing import finalization tests**

Construct a minimal form tree and exact form index in the test. Cover:

```ts
it.each([
  ["CheckBoxField", "boolean", false],
  ["CheckBoxField", "string", true],
  ["PictureField", "decimal", false],
] as const)("classifies imported %s -> %s", (elementType, terminalType, expectsTag) => {
  // run finalizer
  expect(yamlScalarTagAt(element, "ПутьКДанным") === "xml").toBe(expectsTag)
})
```

Add an internal standard-member path whose finalized YAML spelling differs. For the incompatible case assert both:

```ts
expect(element.ПутьКДанным).toBe("Объект.Owner") // original internal payload in memory
expect(serializeYAMLDocument(form).text).toContain("ПутьКДанным: !xml Объект.Owner")
```

For unresolved target assert no tag and exactly the existing `unresolved_data_path` warning.

- [ ] **Step 2: Run import tests and verify failure**

```bash
pnpm --filter @nakidka/core test -- importDataPathCompatibility.test.ts worker.test.ts toYAML.test.ts fromYAML.test.ts
```

Expected: FAIL because import currently formats standard names but never compares the element policy.

- [ ] **Step 3: Implement form-specific import classification**

Before `finalizeImportedYamlValues`, collect main DataPath occurrences and retain `{ occurrence, originalInternalValue }`. Run existing standard-name finalization. Then `finalizeImportedFormDataPathCompatibility` resolves the finalized ordinary value in YAML mode, evaluates the rule, and for `incompatible` performs both actions:

```ts
occurrence.setValue(originalInternalValue)
occurrence.markTag("xml")
```

For `compatible`, leave the formatted YAML value. For `notResolved`/resolver error, leave existing value and warning. Only occurrences whose rule has `allowedKinds` participate, so buttons, additional paths and uncovered elements remain untouched.

Call this form-specific helper in `writePreparedYamlToOutput` and the base-form candidate path after owner cache is available but before serialization and first-pass validation.

- [ ] **Step 4: Admit transport syntax only for closed main policies**

In DataPath JSON-schema generation, validation mode may accept `^!xml(?: .+)?$` only when all are true:

- property rule is `type: "DataPath"`;
- `rule.yaml === "ПутьКДанным"`;
- `rule.allowedKinds !== undefined`.

Keep the external hint schema as the ordinary DataPath schema, matching the existing explicit-XML behavior. Add negative tests for `Button.dataPath` and `Table.rowPictureDataPath`.

- [ ] **Step 5: Export tagged YAML to raw internal XML**

In the registered `DataPath` `importFromYAML` handler, inspect `yamlScalarTagAt(params.yaml, rule.yaml)`. When tagged, return `xmlScalarTagPayload(value)` immediately; otherwise keep `importDataPathStandardMembersFromYAML` unchanged. This ensures `!xml` never appears in XML and avoids a second dialect conversion of the internal payload.

In imported-YAML finalization, do not reformat a scalar already carrying the `xml` tag. Cover both empty and non-empty payload behavior; empty tagged DataPath must remain schema-invalid because it cannot resolve to a target.

- [ ] **Step 6: Add worker-level XML → YAML assertions**

Extend `worker.test.ts` with generated minimal inputs rather than modifying existing XML fixtures:

- incompatible checkbox/string is written with `!xml`;
- compatible checkbox/boolean is ordinary;
- unresolved path remains ordinary and reports warning;
- tagged internal standard segment preserves its exact XML spelling.

- [ ] **Step 7: Run import and schema tests**

```bash
pnpm --filter @nakidka/core test -- importDataPathCompatibility.test.ts worker.test.ts toYAML.test.ts fromYAML.test.ts toJSONSchemaExplicitXML.test.ts
```

Expected: PASS.

- [ ] **Step 8: Check duplicates and commit import transport**

```bash
pnpm duplicates -- --base df2bf639cb563ac58c1732a4c794906aebd66788
git add packages/core/metadata/forms/clientApplicationForm/importDataPathCompatibility.ts packages/core/metadata/forms/clientApplicationForm/importDataPathCompatibility.test.ts packages/core/metadata/importFromXml/worker.ts packages/core/metadata/importFromXml/worker.test.ts packages/core/metadata/commonObjects/metadataPath packages/core/metadata/ruleRuntime/property/toJSONSchema.ts packages/core/metadata/ruleRuntime/property/toJSONSchemaExplicitXML.test.ts
git commit -m "feat: :sparkles: сохранять несовместимый путь формы через !xml"
```

---

### Task 6: Preserve tagged dependencies, references, and renames

**Files:**
- Modify: `packages/core/metadata/operations/dataPathReferences.ts`
- Modify: `packages/core/metadata/operations/dataPathReferences.test.ts`
- Modify: `packages/core/metadata/validation/structuralReferences.ts` or the existing DataPath reference contributor selected by the test failure
- Modify: corresponding `structuralReferences` tests
- Modify: `packages/core/metadata/forms/clientApplicationForm/convertYAMLToXML.test.ts`

**Interfaces:**
- Consumes: occurrence `nameMode` and tag-preserving `setValue` from Task 3.
- Guarantees: tagged and ordinary spellings resolve to the same canonical dependency; rename changes only the matched payload segment and leaves the scalar tagged.

- [ ] **Step 1: Write failing tagged reference and rename tests**

Add an operation snapshot parsed from YAML with a genuine scalar tag. Assert:

```ts
expect(reference.target.source).toMatchObject({ kind: "objectField", name: "Owner" })
reference.setValue(rewriteDataPathSegments(reference.value, reference.target.segments, reference.segmentIndex, "NewOwner"))
expect(yamlScalarTagAt(element, "ПутьКДанным")).toBe("xml")
expect(element.ПутьКДанным).toBe("Объект.NewOwner")
```

Also assert dependency validation reports a missing referenced field inside `!xml`; the tag must not hide it.

- [ ] **Step 2: Run operation/reference tests and verify failure**

```bash
pnpm --filter @nakidka/core test -- dataPathReferences.test.ts structuralReferences.test.ts convertYAMLToXML.test.ts
```

Expected: FAIL where reference collection still resolves every occurrence in YAML mode or includes the textual `!xml` prefix.

- [ ] **Step 3: Use occurrence name mode in every reference consumer**

For each `collectFormDataPathOccurrencesFromYAML` consumer, pass:

```ts
value: occurrence.value,
nameMode: occurrence.nameMode,
```

Do not create a second parser for tagged paths. Continue using resolver `target.segments` for canonical dependency matching and `setValue` for mutation; because the parent/key is unchanged, the WeakMap scalar tag remains attached.

- [ ] **Step 4: Verify exact YAML → XML round-trip**

Add a form conversion test with `ПутьКДанным: !xml Объект.Owner` and assert generated XML contains `<DataPath>Объект.Owner</DataPath>` and does not contain `!xml`. Include a service/internal spelling that would otherwise be translated to prove the tagged branch bypasses conversion.

- [ ] **Step 5: Run operation and round-trip tests**

```bash
pnpm --filter @nakidka/core test -- dataPathReferences.test.ts structuralReferences.test.ts convertYAMLToXML.test.ts
```

Expected: PASS.

- [ ] **Step 6: Check duplicates and commit reference support**

```bash
pnpm duplicates -- --base df2bf639cb563ac58c1732a4c794906aebd66788
git add packages/core/metadata/operations packages/core/metadata/validation packages/core/metadata/forms/clientApplicationForm/convertYAMLToXML.test.ts
git commit -m "feat: :sparkles: сохранить ссылки tagged пути формы"
```

---

### Task 7: Document exclusions and add end-to-end compatibility cases

**Files:**
- Modify: `.agents/restrictions.md`
- Create: `packages/core/metadata/forms/clientApplicationForm/dataPathCompatibility.integration.test.ts`
- Modify: `packages/core/metadata/importFromXml/worker.test.ts`
- Modify: `packages/core/metadata/projectState/binary/format.test.ts`

**Interfaces:**
- Verifies the complete contract across rules → resolver → policy → YAML/import/state.
- Adds no runtime interfaces.

- [ ] **Step 1: Record the explicit restrictions**

Add a dated section to `.agents/restrictions.md` that states:

- `Button` and `CommandBarButton` main paths are command parameters and are excluded;
- `ПутьКДаннымПодвала`, `ПутьКДаннымКартинкиСтроки`, picture/representation/value paths for multiple values, header paths and every other additional DataPath remain existence-only checks;
- `DendrogramField`, `PeriodField` and uncovered main elements remain without a closed compatibility policy;
- a future policy requires separate research and must not be inferred from `defaultType` or XML frequency.

- [ ] **Step 2: Add matrix integration tests with real form YAML**

Create one table-driven test that builds form attributes and elements, runs the normal two-pass validator, and covers at least:

- `InputField` and `LabelField`: all four confirmed composites;
- `CheckBoxField`: boolean/decimal accepted, string/dateTime/EnumRef rejected;
- `PictureField`: six single types accepted, composite rejected, `ValueTable` conditional on `КартинкаЗначений`;
- `Table`: both `CalculationRegisterRecordSet.*` and `ChartOfAccountsTabularSection.*` accepted;
- every specialized field's listed type accepted and one adjacent type rejected;
- Button/additional/uncovered paths resolve but receive no compatibility diagnostic.

Each rejection must assert one error on the exact `ПутьКДанным` YAML path and message fragments for element type, actual and allowed types.

- [ ] **Step 3: Add complete import round-trip cases**

For an incompatible but resolvable form, execute XML → YAML → XML and assert:

```ts
expect(yamlText).toContain("ПутьКДанным: !xml InvalidFlag")
expect(outputFormXml).toContain("<DataPath>InvalidFlag</DataPath>")
expect(outputFormXml).not.toContain("!xml")
```

For compatible and unresolved controls, assert ordinary YAML and the existing resolver warning respectively.

- [ ] **Step 4: Assert binary format stability**

Keep the current format version expectation unchanged and add a round-trip case whose DataPath `reserved` byte is `1`. The test should fail if implementation changes layout/version instead of reusing the byte.

- [ ] **Step 5: Run the complete focused feature suite**

```bash
pnpm --filter @nakidka/core test -- dataPathCompatibility.integration.test.ts terminalTypes.test.ts policies.test.ts dataPathPolicies.test.ts importDataPathCompatibility.test.ts worker.test.ts projectStateDependencyValidation.test.ts dataPathReferences.test.ts format.test.ts
```

Expected: PASS.

- [ ] **Step 6: Check duplicates and commit restrictions/integration coverage**

```bash
pnpm duplicates -- --base df2bf639cb563ac58c1732a4c794906aebd66788
git add .agents/restrictions.md packages/core/metadata/forms/clientApplicationForm/dataPathCompatibility.integration.test.ts packages/core/metadata/importFromXml/worker.test.ts packages/core/metadata/projectState/binary/format.test.ts
git commit -m "test: :white_check_mark: покрыть совместимость пути формы"
```

---

### Task 8: Full verification and implementation handoff

**Files:**
- No planned source changes; fix only defects exposed by verification and commit each fix separately.

- [ ] **Step 1: Run type checking**

```bash
pnpm type-check
```

Expected: PASS.

- [ ] **Step 2: Run the full test suite**

```bash
pnpm test
```

Expected: PASS across every package under `packages/*`.

- [ ] **Step 3: Run rule and general architecture checks**

```bash
pnpm test:architecture:rules
pnpm test:architecture
```

Expected: both PASS; neutral layers do not depend on concrete form elements.

- [ ] **Step 4: Run the final duplicate check**

```bash
pnpm duplicates -- --base df2bf639cb563ac58c1732a4c794906aebd66788
```

Expected: PASS with no new duplication violation.

- [ ] **Step 5: Inspect the final diff and state**

```bash
git diff --check df2bf639cb563ac58c1732a4c794906aebd66788...HEAD
git status --short
git log --oneline df2bf639cb563ac58c1732a4c794906aebd66788..HEAD
```

Expected: no whitespace errors, clean worktree, and the planned layer commits are present.

- [ ] **Step 6: Request code review before PR work**

Use `superpowers:requesting-code-review`, resolve every blocking finding, and rerun Steps 1–4 after any change. Do not start `finish-pr-cycle` until the user separately asks to publish/merge.
