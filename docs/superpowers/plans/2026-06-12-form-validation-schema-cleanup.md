# Form Validation Schema Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Убрать три подтверждённых источника шума validation YAML-форм: пустые `ЗапретитьИспользование: {}`, `ПроизвольныйЗапрос: Ложь`, и DCS-массивы, которые JSON Schema ошибочно ждёт как объекты.

**Architecture:** Уже реализованный слой rule-based `exportToJSONSchema` не трогаем. Исправления остаются в существующих границах: YAML-экспорт `UserVisible`, общий фильтр `defaultValueYAML` в orchestration, и schema export коллекций/ручных DCS-массивов. Validation остаётся строгой: не добавляем `unknown`, не принимаем мусорный YAML, не меняем XML-фикстуры. `defaultValueYAML` работает только на стороне YAML-export/schema и не подставляется при `YAML -> модель`: отсутствующий YAML-ключ должен оставаться отсутствующим свойством модели.
Если правило использовало общий `defaultValue` только ради восстановления XML-default, это значение нужно перенести на `defaultValueXML`, чтобы сокращённый YAML не достраивал модель.

**Tech Stack:** TypeScript, Vitest, TypeBox `TypeCompiler`, metadata orchestration registries, pnpm.

---

## File Structure

- Modify: `packages/core/metadata/commonObjects/userVisible/toYAML.ts`
  - Не выгружает allow/deny-ключи, если `UserVisible.values` пустой.
- Modify: `packages/core/metadata/commonObjects/userVisible/toYAML.test.ts`
  - Проверяет новый контракт для обычного и deprecated экспортёров.
- Modify: `packages/core/metadata/orchestration/property/toYAML.ts`
  - Отсекает `defaultValueYAML` до преобразования значения в YAML или сравнивает с YAML-представлением default.
- Modify: `packages/core/metadata/orchestration/property/fromYAML.ts`
  - Не подставляет `defaultValueYAML` при импорте отсутствующего YAML-ключа.
- Modify: `packages/core/metadata/orchestration/property/types.ts`
  - Не содержит отдельного флага восстановления `defaultValueYAML` при YAML-import.
- Modify: `packages/core/metadata/orchestration/property/fromYAML.test.ts`
  - Фиксирует, что `defaultValueYAML` не создаёт модельное значение при YAML-import.
- Modify: `packages/core/metadata/forms/clientApplicationForm/rules.ts`
  - Убирает восстановление report-form `Auto` default из отсутствующих YAML-ключей.
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromYAML.test.ts`
  - Проверяет, что отсутствующие report-form `Auto` ключи не создают поля модели.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/conditionalAppearance/rules.ts`
  - Хранит XML-default `QuickAccess` как `defaultValueXML`, а не как модельный `defaultValue`.
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/toYAML.test.ts`
  - Фиксирует, что `customQuery: false` не даёт `ПроизвольныйЗапрос: Ложь`, даже при `queryText`.
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/fromYAML.test.ts`
  - Фиксирует, что `.query` не вычисляет `customQuery`.
- Modify: `packages/core/metadata/orchestration/metadataCollection/ruleFactory.ts`
  - Для `yamlAsArray: true` экспортирует JSON Schema как `Type.Array(itemSchema)`.
- Modify: `packages/core/metadata/orchestration/metadataCollection/ruleFactory.test.ts`
  - Проверяет array schema и сохранение record schema.
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/availableFields/toJSONSchema.ts`
  - Регистрирует точную схему `AvailableFields`.
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/availableFields/toJSONSchema.test.ts`
  - Проверяет массив строк и объектов `{ Поле, ... }`.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/index.ts`
  - Подключает `availableFields/toJSONSchema`.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/types.ts`
  - Передаёт ручный `toJSONSchema` в `registerMetadataItemCollectionRule`.
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.ts`
  - Экспортирует массив union `FilterItemComparison | FilterItemGroup` с рекурсивным guard.
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.test.ts`
  - Проверяет сравнения и группы с вложенными `Элементы`.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/orderItemFields/types.ts`
  - Передаёт ручный `toJSONSchema` в `registerMetadataItemCollectionRule`.
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/orderItemFields/toJSONSchema.ts`
  - Экспортирует массив union `OrderItemField | "[Авто]"`.
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/orderItemFields/toJSONSchema.test.ts`
  - Проверяет поле и literal `"[Авто]"`.
- Modify: `packages/core/metadata/validation/schemaRegistry.test.ts`
  - Интеграционно проверяет inline `ClientApplicationForm` для DynamicList с DCS-массивами и запретом `ПроизвольныйЗапрос: Ложь`.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/conditionalAppearance/fromYAML.test.ts`
  - Ожидает отсутствие `viewMode`, если `РежимОтображения` не задан в YAML.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem/fromYAML.test.ts`
  - Ожидает отсутствие `comparisonType`, если `ВидСравнения` не задан в YAML.

## Task 1: Empty UserVisible YAML

**Files:**
- Modify: `packages/core/metadata/commonObjects/userVisible/toYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/userVisible/toYAML.ts`

- [x] **Step 1: Write failing tests for empty UserVisible**

Add these tests inside `describe("exportUserVisibleToYAML", ...)` in `packages/core/metadata/commonObjects/userVisible/toYAML.test.ts`:

```ts
  it("does not export empty deny usage", () => {
    const use: UserVisible = {
      common: false,
      values: [],
    }

    const result = exportUserVisibleToYAML(mockContext, userVisibleRule, use)

    expect(result).toBeUndefined()
  })

  it("does not export empty allow usage", () => {
    const use: UserVisible = {
      common: true,
      values: [],
    }

    const result = exportUserVisibleToYAML(mockContext, userVisibleRule, use)

    expect(result).toBeUndefined()
  })

  it("deprecated exporter does not export empty deny usage", () => {
    const use: UserVisible = {
      common: false,
      values: [],
    }

    const result = exportUserVisibleToYAMLDeprecated(mockContext, mockRule, use, {
      allow: UserVisibleKeysYAML.Allow,
      deny: UserVisibleKeysYAML.Deny,
    })

    expect(result).toBeUndefined()
  })
```

- [x] **Step 2: Run tests to verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/userVisible/toYAML.test.ts
```

Expected: tests for empty usage fail because current exporters return `{ ЗапретитьИспользование: {} }` or `{ РазрешитьИспользование: {} }`.

- [x] **Step 3: Implement minimal UserVisible export guard**

Modify both exporters in `packages/core/metadata/commonObjects/userVisible/toYAML.ts` after the `if (!userVisible) return undefined` check:

```ts
  if (userVisible.values.length === 0) return undefined
```

The beginning of `exportUserVisibleToYAMLDeprecated` should look like:

```ts
export const exportUserVisibleToYAMLDeprecated = <AllowKey extends string, DenyKey extends string>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  userVisible: UserVisible | undefined,
  keys: { allow: AllowKey; deny: DenyKey }
): Partial<Record<AllowKey | DenyKey, UserVisibleYAML>> | undefined => {
  if (!userVisible) return undefined
  if (userVisible.values.length === 0) return undefined

  const values: UserVisibleYAML = {}
```

The beginning of `exportUserVisibleToYAML` should look like:

```ts
export const exportUserVisibleToYAML = (
  context: ConfigurationContext,
  rule: UserVisiblePropertyRule,
  userVisible: UserVisible | undefined
): Partial<Record<string, UserVisibleYAML>> | undefined => {
  if (!userVisible) return undefined
  if (userVisible.values.length === 0) return undefined
  if (!rule.yaml) throw new Error("UserVisiblePropertyRule must have yaml property")

  const values: UserVisibleYAML = {}
```

- [x] **Step 4: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/userVisible/toYAML.test.ts
```

Expected: all tests in `toYAML.test.ts` pass.

- [x] **Step 5: Commit Task 1**

```bash
git add packages/core/metadata/commonObjects/userVisible/toYAML.ts packages/core/metadata/commonObjects/userVisible/toYAML.test.ts
git commit -m "fix: :bug: не выгружать пустой UserVisible"
```

## Task 2: DynamicList Custom Query Default

**Files:**
- Modify: `packages/core/metadata/orchestration/property/toYAML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/toYAML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/fromYAML.test.ts`
- Modify: `packages/core/metadata/validation/schemaRegistry.test.ts`

- [x] **Step 1: Write failing DynamicList export tests**

In `packages/core/metadata/forms/commonObjects/dynamicList/toYAML.test.ts`, replace the existing test named `"exports explicit ManualQuery false when queryText is absent"` with:

```ts
  it("omits ManualQuery false because it is YAML default", () => {
    const result = exportPropertyToYAML({
      context: mockContextToTypedYAML,
      rule,
      value: {
        customQuery: false,
        dynamicDataRead: true,
        itemType: "DynamicList",
        mainTable: "Catalog.РеестрПартийЗЕРНО",
      },
    })

    expect(result).toEqual({
      ДинамическийСписок: {
        ДинамическоеСчитываниеДанных: "Истина",
        ОсновнаяТаблица: "Catalog.РеестрПартийЗЕРНО",
      },
    })
  })
```

Also add this test after it:

```ts
  it("does not emit ManualQuery false when queryText is present", () => {
    const externalFilesCollector: { relativePath: string; content: string }[] = []

    const result = exportPropertyToYAML({
      context: {
        ...mockContextToTypedYAML,
        exportToYAML: {
          ...mockContextToTypedYAML.exportToYAML!,
          externalFilesCollector,
        },
      },
      rule,
      value: {
        customQuery: false,
        dynamicDataRead: true,
        itemType: "DynamicList",
        mainTable: "Catalog.РеестрПартийЗЕРНО",
        queryText: queryTextWithManualQueryFalseText,
      },
      name: "Список",
    })

    expect(result).toEqual({
      ДинамическийСписок: {
        ДинамическоеСчитываниеДанных: "Истина",
        ОсновнаяТаблица: "Catalog.РеестрПартийЗЕРНО",
      },
    })
    expect(externalFilesCollector).toEqual([
      {
        relativePath: "ДинамическийСписок/Список.query",
        content: queryTextWithManualQueryFalseText,
      },
    ])
  })
```

- [x] **Step 2: Write failing import test for no `.query` coupling**

In `packages/core/metadata/forms/commonObjects/dynamicList/fromYAML.test.ts`, add an import if needed:

```ts
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { importPropertyFromYAML } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"
```

Add this test inside the existing DynamicList YAML import `describe`:

```ts
  it("does not derive ManualQuery from external query file", () => {
    const formDir = mkdtempSync(join(tmpdir(), "nkdk-dynamic-list-"))
    mkdirSync(join(formDir, "ДинамическийСписок"))
    writeFileSync(join(formDir, "ДинамическийСписок", "Список.query"), "ВЫБРАТЬ 1")

    const result = importPropertyFromYAML({
      context: {
        ...mockContext,
        importFromYAML: {
          formDir,
          parent: { name: "Список" },
        },
      },
      rule,
      value: {
        ДинамическоеСчитываниеДанных: "Истина",
        ОсновнаяТаблица: "Catalog.Справочник1",
      },
      name: "Список",
    })

    expect(result).toMatchObject({
      itemType: "DynamicList",
      mainTable: "Catalog.Справочник1",
      queryText: "ВЫБРАТЬ 1",
    })
    expect(result).not.toHaveProperty("customQuery")
  })
```

- [x] **Step 3: Write validation schema regression**

In `packages/core/metadata/validation/schemaRegistry.test.ts`, add this test near existing DynamicList schema tests:

```ts
  it("rejects ManualQuery false in inline client form schemas", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "ClientApplicationForm", mode: "inline" })
    const compiled = TypeCompiler.Compile(schema)
    const value = {
      Реквизиты: {
        Список: {
          Тип: "ДинамическийСписок",
          ДинамическийСписок: {
            ПроизвольныйЗапрос: "Ложь",
          },
        },
      },
    }

    expect(compiled.Check(value)).toBe(false)
    expect([...compiled.Errors(value)].map((error) => `${error.path}: ${error.message}`)).toContain(
      "/Реквизиты/Список/ДинамическийСписок/ПроизвольныйЗапрос: Expected 'Истина'"
    )
  })
```

- [x] **Step 4: Run tests to verify failures**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/commonObjects/dynamicList/toYAML.test.ts metadata/forms/commonObjects/dynamicList/fromYAML.test.ts metadata/validation/schemaRegistry.test.ts
```

Expected: export tests fail because `ПроизвольныйЗапрос: "Ложь"` is still emitted. Import test may also fail if `customQuery` is derived from the external query file.

- [x] **Step 5: Fix default filtering before YAML conversion**

Modify `packages/core/metadata/orchestration/property/toYAML.ts`.

In `exportPropertyToYAML`, before the `const typeExportFn = getTypeRule(...)` line, add:

```ts
  if ("defaultValueYAML" in rule && value === (rule as any).defaultValueYAML) return undefined
```

Then remove the same model-default comparison from `getExportToYAMLResult`:

```ts
  if ("defaultValueYAML" in rule && value === (rule as any).defaultValueYAML) return undefined
```

Keep this existing source-based guard in `getExportToYAMLResult`:

```ts
  if (
    rule.omitDefaultValueYAMLBySource === true &&
    "defaultValueYAML" in rule &&
    sourceValue === (rule as any).defaultValueYAML
  ) {
    return undefined
  }
```

- [x] **Step 6: Remove `.query` coupling for derived fields**

In `packages/core/metadata/orchestration/property/fromYAML.ts`, remove only the block that computes a `derivedFrom.externalFile` property from `externalFileValues`:

```ts
    // Свойства с derivedFrom: вычисляем значение из наличия внешнего файла, если YAML не задал значение явно
    if ("derivedFrom" in curRule && (curRule as any).derivedFrom?.externalFile) {
      const yamlKey = curRule.yaml as keyof ToYAML<Rule["itemType"]>
      const hasExplicitYAMLValue =
        yaml !== undefined && yamlKey !== undefined && Object.prototype.hasOwnProperty.call(yaml, yamlKey)

      if (!hasExplicitYAMLValue) {
        const referencedKey = (curRule as any).derivedFrom.externalFile as string
        if (referencedKey in externalFileValues) {
          result[key] = (externalFileValues[referencedKey] !== undefined) as any
          continue
        }
      }
      // Если externalFileValues не заполнен или YAML содержит явное значение — fallthrough к обычной обработке
    }
```

Leave the preliminary external file reading intact, so `queryText` still reads from `.query`.

In `packages/core/metadata/orchestration/property/toXML.ts`, remove only this block:

```ts
      // derivedFrom: вычисляем значение из наличия связанного свойства, если в модели нет явного значения
      if ("derivedFrom" in ruleProp && (ruleProp as any).derivedFrom?.externalFile && !metadataHasOwnKey) {
        const referencedKey = (ruleProp as any).derivedFrom.externalFile as string
        const referencedValue = metadata !== undefined ? (metadata as any)[referencedKey] : undefined
        valueToExport = referencedValue !== undefined
      }
```

This keeps `ПроизвольныйЗапрос` independent from `.query` for both YAML import and XML export.

- [x] **Step 7: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/commonObjects/dynamicList/toYAML.test.ts metadata/forms/commonObjects/dynamicList/fromYAML.test.ts metadata/validation/schemaRegistry.test.ts
```

Expected: all selected tests pass.

- [x] **Step 8: Commit Task 2**

```bash
git add packages/core/metadata/orchestration/property/toYAML.ts packages/core/metadata/orchestration/property/fromYAML.ts packages/core/metadata/orchestration/property/toXML.ts packages/core/metadata/forms/commonObjects/dynamicList/toYAML.test.ts packages/core/metadata/forms/commonObjects/dynamicList/fromYAML.test.ts packages/core/metadata/validation/schemaRegistry.test.ts
git commit -m "fix: :bug: не выгружать ManualQuery false"
```

## Task 3: DCS Array JSON Schemas

**Files:**
- Modify: `packages/core/metadata/orchestration/metadataCollection/ruleFactory.ts`
- Modify: `packages/core/metadata/orchestration/metadataCollection/ruleFactory.test.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/availableFields/toJSONSchema.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/availableFields/toJSONSchema.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/index.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/types.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/orderItemFields/toJSONSchema.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/orderItemFields/toJSONSchema.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/orderItemFields/types.ts`
- Modify: `packages/core/metadata/validation/schemaRegistry.test.ts`

- [x] **Step 1: Add failing collection factory schema tests**

Modify imports in `packages/core/metadata/orchestration/metadataCollection/ruleFactory.test.ts`:

```ts
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { exportPropertyToJSONSchema, importPropertyFromXML, PropertyRule } from "~/metadata/orchestration"
```

Register an array collection after the existing `TestCollection` registration:

```ts
registerMetadataItemCollectionRule({
  propertyType: "TestArrayCollection" as any,
  itemRule: TestCollectionItemRules,
  xmlElement: "Item",
  yamlAsArray: true,
})

const arrayRule: PropertyRule = { type: "TestArrayCollection" as any }
```

Add a new describe block:

```ts
describe("registerMetadataItemCollectionRule default toJSONSchema", () => {
  const context = {
    defaultLanguage: "ru",
    version: "2.20",
  } as const

  it("exports record schema for record YAML collections", () => {
    const schema = exportPropertyToJSONSchema({ context, rule, value: undefined })
    const compiled = TypeCompiler.Compile(schema!)

    expect(compiled.Check({ A: { name: "A" } })).toBe(true)
    expect(compiled.Check([{ name: "A" }])).toBe(false)
  })

  it("exports array schema for yamlAsArray collections", () => {
    const schema = exportPropertyToJSONSchema({ context, rule: arrayRule, value: undefined })
    const compiled = TypeCompiler.Compile(schema!)

    expect(compiled.Check([{ name: "A" }])).toBe(true)
    expect(compiled.Check({ A: { name: "A" } })).toBe(false)
  })
})
```

- [x] **Step 2: Run factory test to verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/metadataCollection/ruleFactory.test.ts
```

Expected: `exports array schema for yamlAsArray collections` fails because schema is currently a record.

- [x] **Step 3: Implement yamlAsArray schema in collection factory**

Modify `toJSONSchemaDefault` in `packages/core/metadata/orchestration/metadataCollection/ruleFactory.ts`.

Replace:

```ts
    return Type.Record(Type.String(), itemSchema)
```

with:

```ts
    if (params.yamlAsArray) return Type.Array(itemSchema)
    return Type.Record(Type.String(), itemSchema)
```

- [x] **Step 4: Run factory tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/metadataCollection/ruleFactory.test.ts
```

Expected: all rule factory tests pass.

- [x] **Step 5: Add AvailableFields schema**

Create `packages/core/metadata/commonObjects/dataCompositionSystem/availableFields/toJSONSchema.ts`:

```ts
import { Type } from "@sinclair/typebox"
import { BooleanJSONSchema } from "~/metadata/commonObjects/boolean/types"
import { exportI8nTextToJSONSchema } from "~/metadata/commonObjects/i8nText/toJSONSchema"
import { registerTypeRule } from "~/metadata/orchestration"
import { ExportToJSONSchemaFn } from "~/metadata/orchestration/property/fn"
import { exportSystemEnumerationToJSONSchema } from "~/metadata/systemEnumerations/toJSONSchema"

export const exportAvailableFieldsToJSONSchema: ExportToJSONSchemaFn = ({ context }) => {
  const availableFieldItemObjectSchema = Type.Object(
    {
      Поле: Type.String(),
      Использование: Type.Optional(BooleanJSONSchema),
      Заголовок: Type.Optional(exportI8nTextToJSONSchema({ context, rule: { type: "I8nText" }, value: undefined })),
      МногоязычныйЗаголовок: Type.Optional(
        exportI8nTextToJSONSchema({ context, rule: { type: "I8nText" }, value: undefined })
      ),
      РежимОтображения: Type.Optional(
        exportSystemEnumerationToJSONSchema({
          context,
          rule: { type: "SystemEnumeration", typeSE: "DataCompositionSettingsItemViewMode" },
          value: undefined,
        })
      ),
    },
    { additionalProperties: false }
  )

  return Type.Array(Type.Union([Type.String(), availableFieldItemObjectSchema]))
}

registerTypeRule("AvailableFields", "exportToJSONSchema", exportAvailableFieldsToJSONSchema)
```

Modify `packages/core/metadata/commonObjects/dataCompositionSystem/index.ts` to import it near other `availableFields` imports:

```ts
import "./availableFields/toJSONSchema"
```

- [x] **Step 6: Add AvailableFields schema tests**

Create `packages/core/metadata/commonObjects/dataCompositionSystem/availableFields/toJSONSchema.test.ts`:

```ts
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { describe, expect, it } from "vitest"
import { exportPropertyToJSONSchema } from "~/metadata/orchestration"
import "./toJSONSchema"

const context = {
  defaultLanguage: "ru",
  version: "2.20",
} as const

describe("AvailableFields JSON Schema", () => {
  it("accepts strings and object items", () => {
    const schema = exportPropertyToJSONSchema({
      context,
      rule: { type: "AvailableFields", yaml: "ДоступныеПоляОтбора" },
      value: undefined,
    })
    const compiled = TypeCompiler.Compile(schema!)

    expect(compiled.Check(["Документ", { Поле: "Документ", Использование: "Ложь" }])).toBe(true)
  })

  it("rejects record-shaped values", () => {
    const schema = exportPropertyToJSONSchema({
      context,
      rule: { type: "AvailableFields", yaml: "ДоступныеПоляОтбора" },
      value: undefined,
    })
    const compiled = TypeCompiler.Compile(schema!)

    expect(compiled.Check({ Документ: { Поле: "Документ" } })).toBe(false)
  })
})
```

- [x] **Step 7: Add OrderItemFields schema**

Create `packages/core/metadata/commonObjects/dataCompositionSystem/orderItemFields/toJSONSchema.ts`:

```ts
import { Type } from "@sinclair/typebox"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import { ExportToJSONSchemaFn } from "~/metadata/orchestration/property/fn"
import { OrderItemFieldRules } from "./rules"

export const exportOrderItemFieldsToJSONSchema: ExportToJSONSchemaFn = ({ context }) =>
  Type.Array(
    Type.Union([
      Type.Literal("[Авто]"),
      exportMetadataItemToJSONSchema({
        context,
        rule: OrderItemFieldRules,
      }),
    ])
  )
```

Modify `packages/core/metadata/commonObjects/dataCompositionSystem/orderItemFields/types.ts`:

```ts
import { exportOrderItemFieldsToJSONSchema } from "./toJSONSchema"
```

Then add the option to the existing registration:

```ts
  toJSONSchema: exportOrderItemFieldsToJSONSchema,
```

- [x] **Step 8: Add OrderItemFields schema tests**

Create `packages/core/metadata/commonObjects/dataCompositionSystem/orderItemFields/toJSONSchema.test.ts`:

```ts
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { describe, expect, it } from "vitest"
import { exportPropertyToJSONSchema } from "~/metadata/orchestration"
import "./types"

const context = {
  defaultLanguage: "ru",
  version: "2.20",
} as const

describe("OrderItemFields JSON Schema", () => {
  it("accepts order field items and auto marker", () => {
    const schema = exportPropertyToJSONSchema({
      context,
      rule: { type: "OrderItemFields", yaml: "Элементы" },
      value: undefined,
    })
    const compiled = TypeCompiler.Compile(schema!)

    expect(compiled.Check([{ Поле: "Дата" }, "[Авто]"])).toBe(true)
  })

  it("rejects record-shaped values", () => {
    const schema = exportPropertyToJSONSchema({
      context,
      rule: { type: "OrderItemFields", yaml: "Элементы" },
      value: undefined,
    })
    const compiled = TypeCompiler.Compile(schema!)

    expect(compiled.Check({ Дата: { Поле: "Дата" } })).toBe(false)
  })
})
```

- [x] **Step 9: Add FilterItem schema**

Create `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.ts`:

```ts
import { Type } from "@sinclair/typebox"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import { ExportToJSONSchemaFn } from "~/metadata/orchestration/property/fn"
import { FilterItemComparisonRules, FilterItemGroupRules } from "./rules"

export const exportFilterItemToJSONSchema: ExportToJSONSchemaFn = ({ context }) => {
  const schemaStack = context.exportToJSONSchema?.schemaStack ?? []
  if (schemaStack.includes("FilterItem")) return Type.Array(Type.Unknown())

  const nextContext = {
    ...context,
    exportToJSONSchema: {
      mode: context.exportToJSONSchema?.mode ?? "inline",
      refs: context.exportToJSONSchema?.refs ?? new Set(),
      propertySchemaOverrides: context.exportToJSONSchema?.propertySchemaOverrides,
      schemaStack: [...schemaStack, "FilterItem"],
    },
  }

  return Type.Array(
    Type.Union([
      exportMetadataItemToJSONSchema({
        context: nextContext,
        rule: FilterItemComparisonRules,
      }),
      exportMetadataItemToJSONSchema({
        context: nextContext,
        rule: FilterItemGroupRules,
      }),
    ])
  )
}
```

Modify `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/types.ts`:

```ts
import { exportFilterItemToJSONSchema } from "./toJSONSchema"
```

Then add the option to the existing registration:

```ts
  toJSONSchema: exportFilterItemToJSONSchema,
```

- [x] **Step 10: Add FilterItem schema tests**

Create `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.test.ts`:

```ts
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { describe, expect, it } from "vitest"
import { exportPropertyToJSONSchema } from "~/metadata/orchestration"
import "./types"

const context = {
  defaultLanguage: "ru",
  version: "2.20",
} as const

describe("FilterItem JSON Schema", () => {
  it("accepts comparison items", () => {
    const schema = exportPropertyToJSONSchema({
      context,
      rule: { type: "FilterItem", yaml: "Элементы" },
      value: undefined,
    })
    const compiled = TypeCompiler.Compile(schema!)

    expect(compiled.Check([{ ЛевоеЗначение: ".ХозяйственнаяОперация", Использование: "Ложь" }])).toBe(true)
  })

  it("accepts group items with nested elements", () => {
    const schema = exportPropertyToJSONSchema({
      context,
      rule: { type: "FilterItem", yaml: "Элементы" },
      value: undefined,
    })
    const compiled = TypeCompiler.Compile(schema!)

    expect(
      compiled.Check([
        {
          ТипГруппы: "ГруппаИли",
          Элементы: [{ ЛевоеЗначение: ".ХозяйственнаяОперация" }],
        },
      ])
    ).toBe(true)
  })

  it("rejects record-shaped values", () => {
    const schema = exportPropertyToJSONSchema({
      context,
      rule: { type: "FilterItem", yaml: "Элементы" },
      value: undefined,
    })
    const compiled = TypeCompiler.Compile(schema!)

    expect(compiled.Check({ item: { ЛевоеЗначение: ".ХозяйственнаяОперация" } })).toBe(false)
  })
})
```

- [x] **Step 11: Add integration schema test for DynamicList DCS arrays**

In `packages/core/metadata/validation/schemaRegistry.test.ts`, add:

```ts
  it("accepts dynamic list DCS arrays in inline client form schemas", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "ClientApplicationForm", mode: "inline" })
    const compiled = TypeCompiler.Compile(schema)
    const value = {
      Реквизиты: {
        Список: {
          Тип: "ДинамическийСписок",
          ДинамическийСписок: {
            ПроизвольныйЗапрос: "Истина",
            ДинамическоеСчитываниеДанных: "Истина",
            Поля: [
              {
                Вид: "ПолеНабораДанныхСхемыКомпоновкиДанных",
                ПутьКДанным: "КоличествоДокументов",
                Поле: "КоличествоДокументов",
              },
            ],
            Порядок: {
              Элементы: [{ Поле: "ДатаВходящегоДокумента" }],
            },
            Отбор: {
              Элементы: [{ ЛевоеЗначение: ".ХозяйственнаяОперация", Использование: "Ложь" }],
            },
          },
        },
      },
    }

    expect([...compiled.Errors(value)].map((error) => `${error.path}: ${error.message}`)).toEqual([])
  })
```

- [x] **Step 12: Run DCS schema tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/metadataCollection/ruleFactory.test.ts metadata/commonObjects/dataCompositionSystem/availableFields/toJSONSchema.test.ts metadata/commonObjects/dataCompositionSystem/orderItemFields/toJSONSchema.test.ts metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.test.ts metadata/validation/schemaRegistry.test.ts
```

Expected: all selected tests pass.

- [x] **Step 13: Commit Task 3**

```bash
git add packages/core/metadata/orchestration/metadataCollection/ruleFactory.ts packages/core/metadata/orchestration/metadataCollection/ruleFactory.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/availableFields/toJSONSchema.ts packages/core/metadata/commonObjects/dataCompositionSystem/availableFields/toJSONSchema.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/index.ts packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.ts packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/types.ts packages/core/metadata/commonObjects/dataCompositionSystem/orderItemFields/toJSONSchema.ts packages/core/metadata/commonObjects/dataCompositionSystem/orderItemFields/toJSONSchema.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/orderItemFields/types.ts packages/core/metadata/validation/schemaRegistry.test.ts
git commit -m "fix: :bug: валидировать DCS-массивы как массивы"
```

## Task 4: Verification And Error Count

**Files:**
- No planned code files.
- Read generated validation output under `/tmp`.

- [x] **Step 1: Run focused validation and form tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation metadata/forms/commonObjects/dynamicList metadata/commonObjects/userVisible metadata/commonObjects/dataCompositionSystem
```

Expected: all selected tests pass.

- [x] **Step 2: Run full core metadata tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata
```

Expected: all metadata tests pass.

- [x] **Step 3: Run full project tests**

Run:

```bash
pnpm test
```

Expected: all package test suites pass.

- [x] **Step 4: Run project validation against temp-yaml**

Run validation on:

```bash
pnpm --filter @nakidka/cli exec tsx src/cli.ts validate /home/nikita/git/temp-yaml > /tmp/nkdk-validation-after-schema-cleanup.txt
```

Expected: command may exit with code `1` because unrelated validation errors remain. This is acceptable if the targeted groups drop.

- [x] **Step 5: Count targeted groups**

Run:

```bash
rg -c "Expected object" /tmp/nkdk-validation-after-schema-cleanup.txt
rg -c "Expected 'Истина'" /tmp/nkdk-validation-after-schema-cleanup.txt
rg -c "Expected union value" /tmp/nkdk-validation-after-schema-cleanup.txt
rg -c "ЗапретитьИспользование: \\{\\}" /home/nikita/git/temp-yaml
```

Expected:

- `Expected object` is lower than `2799`.
- `Expected 'Истина'` is lower than `2122`.
- `Expected union value` is lower than `6574` or has shifted to more specific remaining causes.
- After regenerating YAML from XML, `ЗапретитьИспользование: {}` should be absent from generated forms.

- [x] **Step 6: Commit verification note only if files changed**

If no files changed, do not commit. If test snapshots or docs were intentionally updated, inspect the exact paths and commit only those files:

```bash
git status --short
git add packages/core/metadata/validation/schemaRegistry.test.ts
git commit -m "test: :white_check_mark: обновить проверки validation"
```

## Self-Review

- Spec coverage: Task 1 covers empty `UserVisible`; Task 2 covers `ПроизвольныйЗапрос: Ложь` and removal of `.query` coupling; Task 3 covers `yamlAsArray` and manual DCS schemas; Task 4 covers focused tests, full tests, and validation recount.
- Placeholder scan: служебных заглушек и отложенных шагов нет.
- Type consistency: all planned hooks use existing `registerTypeRule`, `registerMetadataItemCollectionRule`, `exportPropertyToJSONSchema`, `exportMetadataItemToJSONSchema`, and TypeBox `TypeCompiler` patterns already present in the repository.

## Verification Results

- `pnpm --filter @nakidka/core exec vitest run metadata/validation metadata/forms/commonObjects/dynamicList metadata/commonObjects/userVisible metadata/commonObjects/dataCompositionSystem`: 673 passed, 4 skipped.
- `pnpm --filter @nakidka/core exec vitest run metadata`: 4390 passed, 5 skipped. In sandbox the same command failed only on `spawnSync node EPERM`, then passed outside sandbox.
- `pnpm test`: graph 89 passed, core 4426 passed / 5 skipped, cli 81 passed.
- `/home/nikita/git/temp-yaml` regenerated from `/home/nikita/git/round-trip/erp`: 25372 succeeded, 0 failed.
- Validation after regeneration: `summary: 23479 error, 36173 warning`.
- Targeted groups after regeneration: `Expected object` 24, `Expected 'Истина'` 0, `Expected union value` 4353, `ЗапретитьИспользование: {}` 0.
