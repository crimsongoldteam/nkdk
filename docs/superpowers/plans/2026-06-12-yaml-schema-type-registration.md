# YAML Schema Type Registration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Register JSON Schema exporters for YAML-importable metadata property types that currently disappear from owner schemas and produce false `Unexpected property` validation errors.

**Architecture:** Add narrow `exportToJSONSchema` registrations beside the existing type implementations. Rule-backed types delegate to `exportMetadataItemToJSONSchema`; hand-written YAML importers get hand-written schemas that match their current YAML contract, without accepting new syntax.

**Tech Stack:** TypeScript, TypeBox, Vitest, `@nakidka/core` metadata orchestration.

---

## Required Reading

- `.agents/knowledge/metadata/INDEX.md`
- `.agents/knowledge/metadata/sources-of-truth.md`
- `.agents/knowledge/metadata/yaml-contract.md`
- `.agents/knowledge/metadata/round-trip-cycle.md`
- `.agents/knowledge/metadata/registries.md`
- `docs/superpowers/specs/2026-06-12-yaml-schema-type-registration-design.md`

Do not modify XML fixtures.

## File Structure

- Create `packages/core/metadata/commonObjects/metadataCommandGroup/toJSONSchema.ts`: schema for command group YAML scalar.
- Modify `packages/core/metadata/commonObjects/index.ts`: import the new command group schema registration.
- Modify `packages/core/metadata/appliedObjects/metadataCommand/fromYAML.test.ts`: prove object command YAML with `Группа` is accepted by JSON Schema.
- Create `packages/core/metadata/commonObjects/metadataValue/associatedTableToJSONSchema.ts`: schema for `AssociatedTable`.
- Modify `packages/core/metadata/commonObjects/index.ts`: import associated table schema registration.
- Create `packages/core/metadata/commonObjects/styleItemValue/toJSONSchema.ts`: schema for style value object.
- Modify `packages/core/metadata/commonObjects/index.ts`: import style item value schema registration.
- Create `packages/core/metadata/commonObjects/dataCompositionSystem/structureItemGroup/toJSONSchema.ts`: rule-backed schemas for DCS grouping item types.
- Modify `packages/core/metadata/commonObjects/index.ts`: import DCS grouping schema registration.
- Create `packages/core/metadata/commonObjects/dataCompositionSystem/availableValues/toJSONSchema.ts`: schema for `DcsAvailableValues`.
- Modify `packages/core/metadata/commonObjects/index.ts`: import available values schema registration.
- Create `packages/core/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/toJSONSchema.ts`: schema for settings parameter maps.
- Modify `packages/core/metadata/commonObjects/index.ts`: import settings collection schema registration.
- Create `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toJSONSchema.ts`: schema for `DcsMetadataTypedValue`.
- Modify `packages/core/metadata/commonObjects/index.ts`: import DCS typed value schema registration.
- Create `packages/core/metadata/commonObjects/childSubsystemNames/toJSONSchema.ts`: schema for child subsystem name maps.
- Modify `packages/core/metadata/commonObjects/index.ts`: import child subsystem schema registration.
- Create `packages/core/metadata/commonObjects/commonAttributeContent/toJSONSchema.ts`: schema for common attribute content.
- Modify `packages/core/metadata/commonObjects/index.ts`: import common attribute content schema registration.
- Create `packages/core/metadata/validation/yamlTypeSchemaRegistration.test.ts`: inventory test for `importFromYAML` registrations used by YAML rules.

## Task 1: MetadataCommandGroup Schema

**Files:**
- Create: `packages/core/metadata/commonObjects/metadataCommandGroup/toJSONSchema.ts`
- Modify: `packages/core/metadata/commonObjects/index.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataCommand/fromYAML.test.ts`

- [ ] **Step 1: Add failing schema test for command group property**

In `packages/core/metadata/appliedObjects/metadataCommand/fromYAML.test.ts`, add the missing schema registration import and this test:

```ts
import "~/metadata/commonObjects/metadataCommandGroup/toJSONSchema"

it("accepts command group property in JSON Schema", () => {
  const schema = TypeCompiler.Compile(
    exportMetadataItemToJSONSchema({ context: mockContext, rule: MetadataCommandRules })
  )

  expect(schema.Check({ Группа: "ПанельНавигацииВажное" })).toBe(true)
  expect(schema.Check({ Группа: "CommandGroup.ГруппаКомандПоУмолчанию" })).toBe(true)
})
```

- [ ] **Step 2: Run the test and verify it fails before implementation**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/metadataCommand/fromYAML.test.ts
```

Expected before implementation: the new test fails because `MetadataCommandGroup` has no schema exporter, or the added import points to a missing file.

- [ ] **Step 3: Implement command group schema exporter**

Create `packages/core/metadata/commonObjects/metadataCommandGroup/toJSONSchema.ts`:

```ts
import { Type } from "@sinclair/typebox"
import { registerTypeRule } from "~/metadata/orchestration"

export const exportMetadataCommandGroupToJSONSchema = () => Type.String()

registerTypeRule("MetadataCommandGroup", "exportToJSONSchema", exportMetadataCommandGroupToJSONSchema)
```

In `packages/core/metadata/commonObjects/index.ts`, add:

```ts
import "./metadataCommandGroup/toJSONSchema"
```

- [ ] **Step 4: Run the command group test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/metadataCommand/fromYAML.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/commonObjects/metadataCommandGroup/toJSONSchema.ts packages/core/metadata/commonObjects/index.ts packages/core/metadata/appliedObjects/metadataCommand/fromYAML.test.ts
git commit -m "fix: :bug: добавить schema группы команды"
```

## Task 2: Simple Hand-Written Scalar Schemas

**Files:**
- Create: `packages/core/metadata/commonObjects/metadataValue/associatedTableToJSONSchema.ts`
- Create: `packages/core/metadata/commonObjects/childSubsystemNames/toJSONSchema.ts`
- Create: `packages/core/metadata/commonObjects/commonAttributeContent/toJSONSchema.ts`
- Modify: `packages/core/metadata/commonObjects/index.ts`
- Test: `packages/core/metadata/validation/yamlTypeSchemaRegistration.test.ts`

- [ ] **Step 1: Write failing tests for simple schemas**

Create `packages/core/metadata/validation/yamlTypeSchemaRegistration.test.ts` with:

```ts
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { describe, expect, it } from "vitest"
import { getTypeRule } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"
import "~/metadata/commonObjects"

const schemaFor = (type: string) => {
  const exportToJSONSchema = getTypeRule(type, "exportToJSONSchema")
  expect(exportToJSONSchema).toBeDefined()
  return TypeCompiler.Compile(exportToJSONSchema!({ context: mockContext, rule: { type } as never, value: undefined }))
}

describe("YAML type JSON Schema registrations", () => {
  it("accepts simple hand-written YAML types", () => {
    expect(schemaFor("AssociatedTable").Check("Товары")).toBe(true)
    expect(schemaFor("ChildSubsystemNames").Check(["Подсистема1", "Подсистема2"])).toBe(true)
    expect(
      schemaFor("CommonAttributeContent").Check([
        { Объект: "Документ.ЗаказКлиента", Использование: "Использовать" },
      ])
    ).toBe(true)
  })
})
```

- [ ] **Step 2: Run the new test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/yamlTypeSchemaRegistration.test.ts
```

Expected before implementation: FAIL for missing schema exporters.

- [ ] **Step 3: Implement `AssociatedTable` schema**

Create `packages/core/metadata/commonObjects/metadataValue/associatedTableToJSONSchema.ts`:

```ts
import { Type } from "@sinclair/typebox"
import { registerTypeRule } from "~/metadata/orchestration"

export const exportAssociatedTableToJSONSchema = () => Type.String()

registerTypeRule("AssociatedTable", "exportToJSONSchema", exportAssociatedTableToJSONSchema)
```

- [ ] **Step 4: Implement `ChildSubsystemNames` schema**

Create `packages/core/metadata/commonObjects/childSubsystemNames/toJSONSchema.ts`:

```ts
import { Type } from "@sinclair/typebox"
import { registerTypeRule } from "~/metadata/orchestration"

export const exportChildSubsystemNamesToJSONSchema = () => Type.Array(Type.String())

registerTypeRule("ChildSubsystemNames", "exportToJSONSchema", exportChildSubsystemNamesToJSONSchema)
```

- [ ] **Step 5: Implement `CommonAttributeContent` schema**

Create `packages/core/metadata/commonObjects/commonAttributeContent/toJSONSchema.ts`:

```ts
import { Type } from "@sinclair/typebox"
import { registerTypeRule } from "~/metadata/orchestration"
import { exportSystemEnumerationToJSONSchema } from "~/metadata/systemEnumerations/toJSONSchema"

export const exportCommonAttributeContentToJSONSchema = ({ context }: Parameters<typeof exportSystemEnumerationToJSONSchema>[0]) =>
  Type.Array(
    Type.Object({
      Объект: Type.String(),
      Использование: exportSystemEnumerationToJSONSchema({
        context,
        rule: { type: "SystemEnumeration", typeSE: "CommonAttributeUse" },
        value: undefined,
      })!,
      УсловноеРазделение: Type.Optional(Type.String()),
    })
  )

registerTypeRule("CommonAttributeContent", "exportToJSONSchema", exportCommonAttributeContentToJSONSchema)
```

- [ ] **Step 6: Register imports in commonObjects index**

In `packages/core/metadata/commonObjects/index.ts`, add:

```ts
import "./metadataValue/associatedTableToJSONSchema"
import "./childSubsystemNames/toJSONSchema"
import "./commonAttributeContent/toJSONSchema"
```

- [ ] **Step 7: Run simple schema tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/yamlTypeSchemaRegistration.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/commonObjects/metadataValue/associatedTableToJSONSchema.ts packages/core/metadata/commonObjects/childSubsystemNames/toJSONSchema.ts packages/core/metadata/commonObjects/commonAttributeContent/toJSONSchema.ts packages/core/metadata/commonObjects/index.ts packages/core/metadata/validation/yamlTypeSchemaRegistration.test.ts
git commit -m "fix: :bug: добавить schema простых YAML типов"
```

## Task 3: Compact DCS Grouping Schemas

**Files:**
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/structureItemGroup/toJSONSchema.ts`
- Modify: `packages/core/metadata/commonObjects/index.ts`
- Modify: `packages/core/metadata/validation/yamlTypeSchemaRegistration.test.ts`

- [ ] **Step 1: Add failing tests for compact DCS group types**

Extend `packages/core/metadata/validation/yamlTypeSchemaRegistration.test.ts`:

```ts
it("accepts compact DCS grouping YAML", () => {
  expect(schemaFor("GroupItemAuto").Check("[Авто]")).toBe(true)
  expect(schemaFor("GroupItemAuto").Check("([Авто])")).toBe(true)
  expect(schemaFor("GroupItemField").Check("Номенклатура")).toBe(true)
  expect(schemaFor("GroupItemField").Check({ Поле: "Номенклатура", ТипГруппировки: "Элементы" })).toBe(true)
  expect(schemaFor("StructureItemGroup").Check(["Наименование", "[Авто]", { Поле: "ПометкаУдаления" }])).toBe(true)
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/yamlTypeSchemaRegistration.test.ts
```

Expected before implementation: FAIL for missing exporters.

- [ ] **Step 3: Implement compact exporters**

Create `packages/core/metadata/commonObjects/dataCompositionSystem/structureItemGroup/toJSONSchema.ts`:

```ts
import { Type } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { exportPropertyToJSONSchema } from "~/metadata/orchestration/property/toJSONSchema"
import { GroupItemFieldRules } from "./items/groupItemField/rules"

export const exportGroupItemAutoToJSONSchema: ExportToJSONSchemaFn = () =>
  Type.Union([Type.Literal("[Авто]"), Type.Literal("([Авто])")])

const GroupItemFieldShortJSONSchema = Type.String({ pattern: "^(?!\\(\\)$).+$" })

export const exportGroupItemFieldToJSONSchema: ExportToJSONSchemaFn = ({ context }) =>
  Type.Union([
    GroupItemFieldShortJSONSchema,
    Type.Object(
      {
        Поле: Type.String({ minLength: 1 }),
        Использование: Type.Optional(Type.Literal("Ложь")),
        ТипГруппировки: Type.Optional(
          exportPropertyToJSONSchema({
            context,
            rule: GroupItemFieldRules.properties.groupType,
            value: undefined,
          }) ?? Type.Never()
        ),
        ТипДополнения: Type.Optional(
          exportPropertyToJSONSchema({
            context,
            rule: GroupItemFieldRules.properties.periodAdditionType,
            value: undefined,
          }) ?? Type.Never()
        ),
        НачалоПериода: Type.Optional(
          exportPropertyToJSONSchema({
            context,
            rule: GroupItemFieldRules.properties.periodAdditionBegin,
            value: undefined,
          }) ?? Type.Never()
        ),
        КонецПериода: Type.Optional(
          exportPropertyToJSONSchema({
            context,
            rule: GroupItemFieldRules.properties.periodAdditionEnd,
            value: undefined,
          }) ?? Type.Never()
        ),
      },
      { additionalProperties: false }
    ),
  ])

export const exportStructureItemGroupCollectionToJSONSchema: ExportToJSONSchemaFn = ({ context }) =>
  Type.Array(
    Type.Union([
      exportGroupItemAutoToJSONSchema({ context, rule: { type: "GroupItemAuto" } as never, value: undefined }),
      exportGroupItemFieldToJSONSchema({ context, rule: { type: "GroupItemField" } as never, value: undefined }),
    ]),
    { minItems: 1 }
  )

export const exportStructureItemGroupToJSONSchema: ExportToJSONSchemaFn = exportStructureItemGroupCollectionToJSONSchema

registerTypeRule("GroupItemAuto", "exportToJSONSchema", exportGroupItemAutoToJSONSchema)
registerTypeRule("GroupItemField", "exportToJSONSchema", exportGroupItemFieldToJSONSchema)
registerTypeRule("StructureItemGroup", "exportToJSONSchema", exportStructureItemGroupToJSONSchema)
registerTypeRule("StructureItemGroupCollection", "exportToJSONSchema", exportStructureItemGroupCollectionToJSONSchema)
```

- [ ] **Step 4: Import registration**

In `packages/core/metadata/commonObjects/index.ts`, add:

```ts
import "./dataCompositionSystem/structureItemGroup/toJSONSchema"
```

- [ ] **Step 5: Run DCS grouping tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/yamlTypeSchemaRegistration.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/structureItemGroup/toJSONSchema.ts packages/core/metadata/commonObjects/index.ts packages/core/metadata/validation/yamlTypeSchemaRegistration.test.ts
git commit -m "fix: :bug: добавить schema DCS группировок"
```

## Task 4: StyleItemValue Schema

**Files:**
- Create: `packages/core/metadata/commonObjects/styleItemValue/toJSONSchema.ts`
- Modify: `packages/core/metadata/commonObjects/index.ts`
- Modify: `packages/core/metadata/validation/yamlTypeSchemaRegistration.test.ts`

- [ ] **Step 1: Add failing style schema tests**

Extend `packages/core/metadata/validation/yamlTypeSchemaRegistration.test.ts`:

```ts
it("accepts style item value YAML", () => {
  const schema = schemaFor("StyleItemValue")

  expect(schema.Check({ Вид: "Цвет", Значение: "#8A31E2" })).toBe(true)
  expect(schema.Check({ Вид: "Шрифт", Значение: { Имя: "Arial", Размер: 10 } })).toBe(true)
  expect(schema.Check({ Вид: "Рамка", Значение: "Нет" })).toBe(true)
  expect(schema.Check({ Вид: "Неизвестно", Значение: "x" })).toBe(false)
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/yamlTypeSchemaRegistration.test.ts
```

Expected before implementation: FAIL for missing `StyleItemValue` exporter.

- [ ] **Step 3: Implement style schema**

Create `packages/core/metadata/commonObjects/styleItemValue/toJSONSchema.ts`:

```ts
import { Type } from "@sinclair/typebox"
import { registerTypeRule } from "~/metadata/orchestration"

const StyleValueSchema = Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Object({}, { additionalProperties: true })])

export const exportStyleItemValueToJSONSchema = () =>
  Type.Object({
    Вид: Type.Union([Type.Literal("Шрифт"), Type.Literal("Цвет"), Type.Literal("Рамка")]),
    Значение: StyleValueSchema,
  })

registerTypeRule("StyleItemValue", "exportToJSONSchema", exportStyleItemValueToJSONSchema)
```

- [ ] **Step 4: Import registration**

In `packages/core/metadata/commonObjects/index.ts`, add:

```ts
import "./styleItemValue/toJSONSchema"
```

- [ ] **Step 5: Run style schema tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/yamlTypeSchemaRegistration.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/commonObjects/styleItemValue/toJSONSchema.ts packages/core/metadata/commonObjects/index.ts packages/core/metadata/validation/yamlTypeSchemaRegistration.test.ts
git commit -m "fix: :bug: добавить schema значения стиля"
```

## Task 5: DCS Value Schemas

**Files:**
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/availableValues/toJSONSchema.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/toJSONSchema.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toJSONSchema.ts`
- Modify: `packages/core/metadata/commonObjects/index.ts`
- Modify: `packages/core/metadata/validation/yamlTypeSchemaRegistration.test.ts`

- [ ] **Step 1: Add failing DCS value tests**

Extend `packages/core/metadata/validation/yamlTypeSchemaRegistration.test.ts`:

```ts
it("accepts DCS available values YAML", () => {
  const schema = schemaFor("DcsAvailableValues")

  expect(schema.Check([{ Значение: "Истина" }])).toBe(true)
  expect(schema.Check([{ Значение: "Документ.ЗаказКлиента", Представление: { ru: "Заказ клиента" } }])).toBe(true)
})

it("accepts DCS typed values YAML", () => {
  const schema = schemaFor("DcsMetadataTypedValue")

  expect(schema.Check("Порядок")).toBe(true)
  expect(schema.Check(".Поле")).toBe(true)
  expect(schema.Check("Истина")).toBe(true)
  expect(schema.Check(10)).toBe(true)
  expect(schema.Check("01.01.2026 00:00:00")).toBe(true)
})

it("accepts settings parameter value collection YAML", () => {
  const schema = schemaFor("SettingsParameterValueCollection")

  expect(schema.Check({ Параметр1: "Истина" })).toBe(true)
  expect(schema.Check({ Параметр1: { Значение: "Истина", Использовать: "Ложь" } })).toBe(true)
  expect(schema.Check({ Параметр1: null })).toBe(true)
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/yamlTypeSchemaRegistration.test.ts
```

Expected before implementation: FAIL for missing DCS exporters.

- [ ] **Step 3: Implement `DcsAvailableValues` schema**

Create `packages/core/metadata/commonObjects/dataCompositionSystem/availableValues/toJSONSchema.ts`:

```ts
import { Type } from "@sinclair/typebox"
import { registerTypeRule } from "~/metadata/orchestration"
import { exportDcsMetadataValueToJSONSchema } from "../dcsMetadataValue/toJSONSchema"
import { exportI8nTextToJSONSchema } from "~/metadata/commonObjects/i8nText/toJSONSchema"

export const exportDcsAvailableValuesToJSONSchema = ({ context }: Parameters<typeof exportDcsMetadataValueToJSONSchema>[0]) =>
  Type.Array(
    Type.Object({
      Значение: Type.Optional(exportDcsMetadataValueToJSONSchema({ context, rule: { type: "MetadataDcsMetadataValue", valueType: "Primitive" } as never, value: undefined })),
      Представление: Type.Optional(exportI8nTextToJSONSchema({ context, rule: { type: "I8nText" } as never, value: undefined })),
    })
  )

registerTypeRule("DcsAvailableValues", "exportToJSONSchema", exportDcsAvailableValuesToJSONSchema)
```

- [ ] **Step 4: Implement `DcsMetadataTypedValue` schema**

Create `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toJSONSchema.ts`:

```ts
import { Type } from "@sinclair/typebox"
import { registerTypeRule } from "~/metadata/orchestration"

const DcsTypedValueScalarSchema = Type.Union([
  Type.String(),
  Type.Number(),
  Type.Literal("Истина"),
  Type.Literal("Ложь"),
  Type.Literal("Порядок"),
  Type.Literal("СписокЗначений"),
])

export const exportDcsMetadataTypedValueToJSONSchema = () => DcsTypedValueScalarSchema

registerTypeRule("DcsMetadataTypedValue", "exportToJSONSchema", exportDcsMetadataTypedValueToJSONSchema)
```

- [ ] **Step 5: Implement `SettingsParameterValueCollection` schema**

Create `packages/core/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/toJSONSchema.ts`:

```ts
import { Type } from "@sinclair/typebox"
import { registerTypeRule } from "~/metadata/orchestration"
import { exportSettingsParameterValueToJSONSchema } from "../parameterValue/toJSONSchema"

export const exportSettingsParameterValueCollectionToJSONSchema = ({ context }: Parameters<typeof exportSettingsParameterValueToJSONSchema>[0]) => {
  const valueSchema = exportSettingsParameterValueToJSONSchema({
    context,
    rule: { type: "SettingsParameterValue" } as never,
    value: undefined,
  })

  return Type.Record(Type.String(), Type.Union([Type.Null(), valueSchema, Type.String(), Type.Number()]))
}

registerTypeRule("SettingsParameterValueCollection", "exportToJSONSchema", exportSettingsParameterValueCollectionToJSONSchema)
```

- [ ] **Step 6: Import DCS value registrations**

In `packages/core/metadata/commonObjects/index.ts`, add:

```ts
import "./dataCompositionSystem/availableValues/toJSONSchema"
import "./dataCompositionSystem/dscMetadataTypedValue/toJSONSchema"
import "./dataCompositionSystem/settingsParameterValueCollection/toJSONSchema"
```

- [ ] **Step 7: Run DCS value tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/yamlTypeSchemaRegistration.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/availableValues/toJSONSchema.ts packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toJSONSchema.ts packages/core/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/toJSONSchema.ts packages/core/metadata/commonObjects/index.ts packages/core/metadata/validation/yamlTypeSchemaRegistration.test.ts
git commit -m "fix: :bug: добавить schema DCS значений"
```

## Task 6: Registration Inventory Guard

**Files:**
- Modify: `packages/core/metadata/validation/yamlTypeSchemaRegistration.test.ts`

- [ ] **Step 1: Add failing inventory test**

Extend `packages/core/metadata/validation/yamlTypeSchemaRegistration.test.ts`. Reuse the existing `describe`, `expect`, `it`, and `getTypeRule` imports already created in Task 2; add only these constants and the new `describe` block:

```ts
const expectedYamlTypesWithDeferredSchema = [
  "ClientApplicationForm",
  "ClientApplicationInterfaceItems",
  "HomePageWorkAreaColumnItems",
  "HomePageWorkAreaCommandInterfaceDisplay",
  "HomePageWorkAreaTemplate",
  "MetadataEnumerationValues",
] as const

const expectedYamlTypesWithSchema = [
  "AssociatedTable",
  "ChildSubsystemNames",
  "CommonAttributeContent",
  "DcsAvailableValues",
  "DcsMetadataTypedValue",
  "GroupItemAuto",
  "GroupItemField",
  "MetadataCommandGroup",
  "SettingsParameterValueCollection",
  "StructureItemGroup",
  "StructureItemGroupCollection",
  "StyleItemValue",
] as const

describe("YAML type schema inventory", () => {
  it("keeps agreed YAML-importable types covered or explicitly deferred", () => {
    for (const type of expectedYamlTypesWithSchema) {
      expect(getTypeRule(type, "importFromYAML"), type).toBeDefined()
      expect(getTypeRule(type, "exportToJSONSchema"), type).toBeDefined()
    }

    for (const type of expectedYamlTypesWithDeferredSchema) {
      expect(getTypeRule(type, "importFromYAML"), type).toBeDefined()
      expect(getTypeRule(type, "exportToJSONSchema"), type).toBeUndefined()
    }
  })
})
```

- [ ] **Step 2: Run inventory test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/yamlTypeSchemaRegistration.test.ts
```

Expected: PASS after Tasks 1-5.

- [ ] **Step 3: Commit**

```bash
git add packages/core/metadata/validation/yamlTypeSchemaRegistration.test.ts
git commit -m "test: :white_check_mark: закрепить schema регистрации YAML типов"
```

## Task 7: Verification Against ERP Validation

**Files:**
- No source edits expected.

- [ ] **Step 1: Run focused core tests**

Run:

```bash
pnpm --filter @nakidka/core test
```

Expected: PASS.

- [ ] **Step 2: Run full project tests**

Run:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 3: Re-run project validation**

Run:

```bash
pnpm --filter @nakidka/cli dev validate /home/nikita/git/temp-yaml > /tmp/nkdk-validate-temp-yaml-after-schema-registration.log 2>&1
```

Expected: command exits with validation errors still present, but fixed groups disappear or decrease:

```bash
rg --count "Unexpected property" /tmp/nkdk-validate-temp-yaml-after-schema-registration.log
rg --count "Группа" /tmp/nkdk-validate-temp-yaml-after-schema-registration.log
rg --count "Таблица" /tmp/nkdk-validate-temp-yaml-after-schema-registration.log
```

Compare counts with `/tmp/nkdk-validate-temp-yaml.log`.

- [ ] **Step 4: Summarize remaining largest error groups**

Run a grouping command over `/tmp/nkdk-validate-temp-yaml-after-schema-registration.log` to list the next biggest diagnostics by message and YAML key. Include the top 10 in the final implementation report.
