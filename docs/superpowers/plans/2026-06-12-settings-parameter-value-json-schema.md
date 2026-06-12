# SettingsParameterValue JSON Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить строгую JSON Schema для DCS `SettingsParameterValue`, чтобы validation принимала реальный YAML оформления форм без ослабления `additionalProperties: false`.

**Architecture:** Схема строится в два слоя. `MetadataDcsMetadataValue` описывает YAML-значение по `valueType` и переиспользует существующие схемы базовых типов. `SettingsParameterValue` поверх него принимает компактное значение или полную форму с ограниченным набором ключей.

**Tech Stack:** TypeScript, Vitest, TypeBox `Type` / `TypeCompiler`, metadata orchestration `registerTypeRule`, pnpm.

---

## File Structure

- Modify: `packages/core/metadata/commonObjects/color/types.ts`
  - Синхронизирует `ColorJSONSchema` с реальным YAML-циклом цвета: style, windows, web, `ЭлементСтиля.<Имя>`, `#RRGGBB`, raw-ref.
- Create: `packages/core/metadata/commonObjects/color/toJSONSchema.test.ts`
  - Проверяет, что схема цвета принимает реальные значения из validation-ошибок.
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toJSONSchema.ts`
  - Регистрирует `exportToJSONSchema` для `MetadataDcsMetadataValue`.
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toJSONSchema.test.ts`
  - Проверяет схемы `Color`, `Font`, `DesignTimeValue`, `Primitive`, `SystemEnumeration`, `Field`.
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toJSONSchema.ts`
  - Регистрирует `exportToJSONSchema` для `SettingsParameterValue`.
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toJSONSchema.test.ts`
  - Проверяет компактную форму, полную форму, рекурсию `Элементы` и строгие отказы.
- Modify: `packages/core/metadata/commonObjects/index.ts`
  - Подключает `dcsMetadataValue/toJSONSchema` и `parameterValue/toJSONSchema` рядом с существующими YAML/XML обработчиками.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/index.ts`
  - Подключает `parameterValue/toJSONSchema` для сценариев, где импортируется только DCS entrypoint.
- Modify: `packages/core/metadata/validation/schemaRegistry.test.ts`
  - Добавляет интеграционный тест inline `ClientApplicationForm` с `Оформление`.

## Task 1: Color YAML Schema

**Files:**
- Modify: `packages/core/metadata/commonObjects/color/types.ts`
- Create: `packages/core/metadata/commonObjects/color/toJSONSchema.test.ts`

- [ ] **Step 1: Write failing Color schema tests**

Create `packages/core/metadata/commonObjects/color/toJSONSchema.test.ts`:

```ts
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { describe, expect, it } from "vitest"
import { ColorJSONSchema } from "./types"

const errorsFor = (value: unknown): string[] => {
  const compiled = TypeCompiler.Compile(ColorJSONSchema)
  return [...compiled.Errors(value)].map((error) => `${error.path}: ${error.message}`)
}

describe("ColorJSONSchema", () => {
  it("accepts style color names", () => {
    expect(errorsFor("ЦветФонаПодсказки")).toEqual([])
  })

  it("accepts custom style item refs", () => {
    expect(errorsFor("ЭлементСтиля.ТекстЗапрещеннойЯчейкиЦвет")).toEqual([])
  })

  it("accepts web colors and absolute colors", () => {
    expect(errorsFor("Красный")).toEqual([])
    expect(errorsFor("#1C55AE")).toEqual([])
  })

  it("accepts raw refs", () => {
    expect(errorsFor("0")).toEqual([])
    expect(errorsFor("0:00000000-0000-0000-0000-000000000000")).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/color/toJSONSchema.test.ts
```

Expected: fails for `ЦветФонаПодсказки` and `ЭлементСтиля.ТекстЗапрещеннойЯчейкиЦвет`.

- [ ] **Step 3: Expand ColorJSONSchema**

Modify `packages/core/metadata/commonObjects/color/types.ts`:

```ts
import { Static, TSchema, Type } from "@sinclair/typebox"
import {
  ColorType,
  StyleColorsFromYAML,
  WebColorsFromYAML,
  WindowsColorsFromYAML,
} from "~/metadata/systemEnumerations/types"
```

Replace the current `webColors` / schema block with:

```ts
const literalSchemas = (values: string[]): TSchema[] => values.map((key) => Type.Literal(key))

const colorNameSchemas = literalSchemas([
  ...Object.keys(StyleColorsFromYAML),
  ...Object.keys(WindowsColorsFromYAML),
  ...Object.keys(WebColorsFromYAML),
])

export const AbsoluteColorJSONSchema = Type.String({ pattern: "^#[0-9A-Fa-f]{6}$" })
export const RawColorRefJSONSchema = Type.String({ pattern: rawColorRefPattern.source })
export const CustomStyleColorJSONSchema = Type.String({ pattern: "^ЭлементСтиля\\..+$" })
export const ColorJSONSchema = Type.Union(
  [...colorNameSchemas, CustomStyleColorJSONSchema, AbsoluteColorJSONSchema, RawColorRefJSONSchema] as [
    TSchema,
    TSchema,
    ...TSchema[],
  ]
)
```

- [ ] **Step 4: Run focused Color test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/color/toJSONSchema.test.ts
```

Expected: all tests in `toJSONSchema.test.ts` pass.

- [ ] **Step 5: Commit Task 1**

```bash
git add packages/core/metadata/commonObjects/color/types.ts packages/core/metadata/commonObjects/color/toJSONSchema.test.ts
git commit -m "fix: :bug: расширить schema YAML-цветов"
```

## Task 2: MetadataDcsMetadataValue Schema

**Files:**
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toJSONSchema.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toJSONSchema.test.ts`

- [ ] **Step 1: Write failing DCS value schema tests**

Create `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toJSONSchema.test.ts`:

```ts
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { describe, expect, it } from "vitest"
import { exportPropertyToJSONSchema } from "~/metadata/orchestration/property/toJSONSchema"
import { mockContext } from "~/tests/mockContext"
import type { DcsMetadataValuePropertyRule } from "./types"
import "./toJSONSchema"

const schemaFor = (rule: DcsMetadataValuePropertyRule) => {
  const schema = exportPropertyToJSONSchema({ context: mockContext, rule, value: undefined })
  if (schema === undefined) throw new Error("schema is undefined")
  return TypeCompiler.Compile(schema)
}

const errorsFor = (rule: DcsMetadataValuePropertyRule, value: unknown): string[] =>
  [...schemaFor(rule).Errors(value)].map((error) => `${error.path}: ${error.message}`)

describe("MetadataDcsMetadataValue exportToJSONSchema", () => {
  it("accepts Color YAML values", () => {
    const rule = { type: "MetadataDcsMetadataValue", valueType: "Color", yaml: "Цвет" } as const

    expect(errorsFor(rule, "ЭлементСтиля.ТекстЗапрещеннойЯчейкиЦвет")).toEqual([])
    expect(errorsFor(rule, "ЦветФонаПодсказки")).toEqual([])
    expect(errorsFor(rule, "#1C55AE")).toEqual([])
  })

  it("accepts Font YAML object", () => {
    const rule = { type: "MetadataDcsMetadataValue", valueType: "Font", yaml: "Шрифт" } as const

    expect(errorsFor(rule, { Вид: "ШрифтТекста", Размер: 10, Полужирный: "Истина" })).toEqual([])
  })

  it("accepts DesignTimeValue compact and explicit text values", () => {
    const rule = { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "Формат" } as const

    expect(errorsFor(rule, '"ЧДЦ=1"')).toEqual([])
    expect(errorsFor(rule, { ru: "Текст" })).toEqual([])
    expect(errorsFor(rule, { Тип: "Поле", Значение: "СписокФайлов.Представление" })).toEqual([])
    expect(errorsFor(rule, { Тип: "ЗначениеВремениПроектирования", Значение: "Перечисление.X.Y" })).toEqual([])
  })

  it("accepts Primitive values and explicit DCS system enumeration", () => {
    const rule = { type: "MetadataDcsMetadataValue", valueType: "Primitive", yaml: "Видимость" } as const

    expect(errorsFor(rule, "Ложь")).toEqual([])
    expect(errorsFor(rule, 123)).toEqual([])
    expect(
      errorsFor(rule, {
        Тип: "СистемноеПеречисление",
        Имя: "HorizontalAlign",
        Значение: "Лево",
      })
    ).toEqual([])
  })

  it("accepts SystemEnumeration values from rule.typeSE", () => {
    const rule = {
      type: "MetadataDcsMetadataValue",
      valueType: "SystemEnumeration",
      typeSE: "HorizontalAlign",
      yaml: "ГоризонтальноеПоложение",
    } as const

    expect(errorsFor(rule, "Лево")).toEqual([])
    expect(schemaFor(rule).Check("НетТакогоПоложения")).toBe(false)
  })

  it("accepts Field explicit primitive string", () => {
    const rule = { type: "MetadataDcsMetadataValue", valueType: "Field", yaml: "Поле" } as const

    expect(errorsFor(rule, { Тип: "Строка", Значение: "" })).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toJSONSchema.test.ts
```

Expected: fails because `MetadataDcsMetadataValue` has no `exportToJSONSchema` handler.

- [ ] **Step 3: Add DCS value schema exporter**

Create `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toJSONSchema.ts`:

```ts
import { TSchema, Type } from "@sinclair/typebox"
import { ColorJSONSchema } from "~/metadata/commonObjects/color/types"
import { FontJSONSchema } from "~/metadata/commonObjects/font/types"
import { I8nTextJSONSchema } from "~/metadata/commonObjects/i8nText/types"
import { MetadataFieldJSONSchema } from "~/metadata/commonObjects/metadataField/types"
import { MetadataValueJSONSchema } from "~/metadata/commonObjects/metadataValue/types"
import { TypeLinkJSONSchema } from "~/metadata/commonObjects/typeLink/types"
import { ChoiceParameterLinksJSONSchema } from "~/metadata/commonObjects/сhoiceParameterLinks/types"
import { ChoiceParametersJSONSchema } from "~/metadata/commonObjects/сhoiceParameters/types"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { exportSystemEnumerationToJSONSchema } from "~/metadata/systemEnumerations/toJSONSchema"
import type { SystemEnumerationPropertyRule } from "~/metadata/systemEnumerations/types"
import type { DcsMetadataValuePropertyRule } from "./types"

const ExplicitTextValueJSONSchema = Type.Union([
  Type.Object(
    {
      Тип: Type.Literal("Поле"),
      Значение: Type.String(),
    },
    { additionalProperties: false }
  ),
  Type.Object(
    {
      Тип: Type.Literal("ЗначениеВремениПроектирования"),
      Значение: Type.String(),
    },
    { additionalProperties: false }
  ),
])

const ExplicitPrimitiveStringValueJSONSchema = Type.Object(
  {
    Тип: Type.Literal("Строка"),
    Значение: Type.String(),
  },
  { additionalProperties: false }
)

const ExplicitDcsSystemEnumerationValueJSONSchema = Type.Object(
  {
    Тип: Type.Literal("СистемноеПеречисление"),
    Имя: Type.String(),
    Значение: Type.String(),
  },
  { additionalProperties: false }
)

const Nullable = (schema: TSchema): TSchema => Type.Union([Type.Null(), schema])

export const exportDcsMetadataValueToJSONSchema: ExportToJSONSchemaFn = ({ context, rule }): TSchema => {
  const dcsRule = rule as DcsMetadataValuePropertyRule

  switch (dcsRule.valueType) {
    case "Color":
      return Nullable(ColorJSONSchema)
    case "Font":
      return Nullable(FontJSONSchema)
    case "Field":
      return Nullable(
        Type.Union([
          MetadataFieldJSONSchema,
          MetadataValueJSONSchema,
          ExplicitPrimitiveStringValueJSONSchema,
          ExplicitDcsSystemEnumerationValueJSONSchema,
        ])
      )
    case "Parameter":
      return Nullable(ChoiceParametersJSONSchema)
    case "DesignTimeValue":
      return Nullable(Type.Union([I8nTextJSONSchema, MetadataValueJSONSchema, ExplicitTextValueJSONSchema]))
    case "Primitive":
      return Nullable(Type.Union([MetadataValueJSONSchema, ExplicitDcsSystemEnumerationValueJSONSchema]))
    case "TypeLink":
      return Nullable(TypeLinkJSONSchema)
    case "ChoiceParameterLinks":
      return Nullable(ChoiceParameterLinksJSONSchema)
    case "SystemEnumeration":
      return Nullable(
        exportSystemEnumerationToJSONSchema({
          context,
          rule: { type: "SystemEnumeration", typeSE: dcsRule.typeSE } as SystemEnumerationPropertyRule,
          value: undefined,
        })
      )
    default:
      throw new Error("MetadataDcsMetadataValue JSON Schema: unsupported valueType")
  }
}

registerTypeRule("MetadataDcsMetadataValue", "exportToJSONSchema", exportDcsMetadataValueToJSONSchema)
```

- [ ] **Step 4: Run focused DCS value tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toJSONSchema.test.ts
```

Expected: all tests in `toJSONSchema.test.ts` pass.

- [ ] **Step 5: Commit Task 2**

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toJSONSchema.ts packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toJSONSchema.test.ts
git commit -m "feat: :sparkles: добавить schema DCS-значений"
```

## Task 3: SettingsParameterValue Schema

**Files:**
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toJSONSchema.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toJSONSchema.test.ts`

- [ ] **Step 1: Write failing SettingsParameterValue schema tests**

Create `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toJSONSchema.test.ts`:

```ts
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { describe, expect, it } from "vitest"
import { exportPropertyToJSONSchema } from "~/metadata/orchestration/property/toJSONSchema"
import { mockContext } from "~/tests/mockContext"
import type { SettingsParameterValuePropertyRule } from "./types"
import "./toJSONSchema"

const schemaFor = (rule: SettingsParameterValuePropertyRule) => {
  const schema = exportPropertyToJSONSchema({ context: mockContext, rule, value: undefined })
  if (schema === undefined) throw new Error("schema is undefined")
  return TypeCompiler.Compile(schema)
}

const errorsFor = (rule: SettingsParameterValuePropertyRule, value: unknown): string[] =>
  [...schemaFor(rule).Errors(value)].map((error) => `${error.path}: ${error.message}`)

describe("SettingsParameterValue exportToJSONSchema", () => {
  it("accepts compact YAML values", () => {
    expect(errorsFor({ type: "SettingsParameterValue", valueType: "Color", yaml: "ЦветТекста" }, "#1C55AE")).toEqual(
      []
    )
    expect(errorsFor({ type: "SettingsParameterValue", valueType: "Primitive", yaml: "Видимость" }, "Ложь")).toEqual(
      []
    )
    expect(
      errorsFor(
        {
          type: "SettingsParameterValue",
          valueType: "SystemEnumeration",
          typeSE: "HorizontalAlign",
          yaml: "ГоризонтальноеПоложение",
        },
        "Лево"
      )
    ).toEqual([])
  })

  it("accepts full YAML object", () => {
    const rule = { type: "SettingsParameterValue", valueType: "Color", yaml: "ЦветФона" } as const

    expect(
      errorsFor(rule, {
        Использовать: "Ложь",
        Значение: "ЦветФонаПодсказки",
        РежимОтображения: "Обычный",
        ИдентификаторПользовательскойНастройки: "BackColor",
        ПредставлениеПользовательскойНастройки: { ru: "Цвет фона" },
        Элементы: [{ Значение: "#FFFFFF" }],
      })
    ).toEqual([])
  })

  it("accepts full object with array value", () => {
    const rule = { type: "SettingsParameterValue", valueType: "DesignTimeValue", yaml: "Текст" } as const

    expect(errorsFor(rule, { Использовать: "Ложь", Значение: ["Перечисление.X.Y", "Перечисление.X.Z"] })).toEqual([])
  })

  it("rejects explicit true use flag", () => {
    const rule = { type: "SettingsParameterValue", valueType: "Primitive", yaml: "Видимость" } as const

    expect(schemaFor(rule).Check({ Использовать: "Истина" })).toBe(false)
  })

  it("rejects parameter key and unknown keys", () => {
    const rule = { type: "SettingsParameterValue", valueType: "Primitive", yaml: "Видимость" } as const

    expect(schemaFor(rule).Check({ Параметр: "Видимость", Значение: "Ложь" })).toBe(false)
    expect(schemaFor(rule).Check({ Значение: "Ложь", ЛишнийКлюч: "x" })).toBe(false)
  })

  it("rejects empty objects, including object-valued compact types", () => {
    expect(schemaFor({ type: "SettingsParameterValue", valueType: "Primitive", yaml: "Видимость" }).Check({})).toBe(
      false
    )
    expect(schemaFor({ type: "SettingsParameterValue", valueType: "Font", yaml: "Шрифт" }).Check({})).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/dataCompositionSystem/parameterValue/toJSONSchema.test.ts
```

Expected: fails because `SettingsParameterValue` has no `exportToJSONSchema` handler.

- [ ] **Step 3: Add SettingsParameterValue schema exporter**

Create `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toJSONSchema.ts`:

```ts
import { TSchema, Type } from "@sinclair/typebox"
import { I8nTextJSONSchema } from "~/metadata/commonObjects/i8nText/types"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { exportSystemEnumerationToJSONSchema } from "~/metadata/systemEnumerations/toJSONSchema"
import type { SystemEnumerationPropertyRule } from "~/metadata/systemEnumerations/types"
import { exportDcsMetadataValueToJSONSchema } from "../dcsMetadataValue/toJSONSchema"
import { toDcsMetadataValueRule } from "./dcsValueRule"
import type { SettingsParameterValuePropertyRule } from "./types"

const nonEmptyObjectGuard = {
  not: {
    type: "object",
    maxProperties: 0,
  },
} as TSchema

const valueOrArray = (valueSchema: TSchema): TSchema => Type.Union([valueSchema, Type.Array(valueSchema)])

export const exportSettingsParameterValueToJSONSchema: ExportToJSONSchemaFn = ({ context, rule }): TSchema => {
  const settingsRule = rule as SettingsParameterValuePropertyRule
  const valueSchema = exportDcsMetadataValueToJSONSchema({
    context,
    rule: toDcsMetadataValueRule(settingsRule),
    value: undefined,
  })
  const expandedValueSchema = valueOrArray(valueSchema)
  const viewModeSchema = exportSystemEnumerationToJSONSchema({
    context,
    rule: {
      type: "SystemEnumeration",
      typeSE: "DataCompositionSettingsItemViewMode",
    } as SystemEnumerationPropertyRule,
    value: undefined,
  })

  const schema = Type.Recursive((This) =>
    Type.Union([
      valueSchema,
      Type.Object(
        {
          Использовать: Type.Optional(Type.Literal("Ложь")),
          Значение: Type.Optional(expandedValueSchema),
          РежимОтображения: Type.Optional(viewModeSchema),
          ИдентификаторПользовательскойНастройки: Type.Optional(Type.String()),
          ПредставлениеПользовательскойНастройки: Type.Optional(I8nTextJSONSchema),
          Элементы: Type.Optional(Type.Array(This)),
        },
        { additionalProperties: false, minProperties: 1 }
      ),
    ])
  )

  return Type.Intersect([schema, nonEmptyObjectGuard])
}

registerTypeRule("SettingsParameterValue", "exportToJSONSchema", exportSettingsParameterValueToJSONSchema)
```

- [ ] **Step 4: Run focused SettingsParameterValue tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/dataCompositionSystem/parameterValue/toJSONSchema.test.ts
```

Expected: all tests in `toJSONSchema.test.ts` pass.

- [ ] **Step 5: Commit Task 3**

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toJSONSchema.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toJSONSchema.test.ts
git commit -m "feat: :sparkles: добавить schema SettingsParameterValue"
```

## Task 4: Registration And Appearance Integration

**Files:**
- Modify: `packages/core/metadata/commonObjects/index.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/index.ts`
- Modify: `packages/core/metadata/validation/schemaRegistry.test.ts`

- [ ] **Step 1: Write failing validation integration test**

In `packages/core/metadata/validation/schemaRegistry.test.ts`, add this test after `"accepts dynamic list conditional appearance in inline client form schemas"`:

```ts
  it("accepts appearance SettingsParameterValue fields in inline client form schemas", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "ClientApplicationForm", mode: "inline" })
    const compiled = TypeCompiler.Compile(schema)
    const value = {
      УсловноеОформлениеРеквизитов: {
        Элементы: [
          {
            Оформление: {
              ЦветТекста: "ЭлементСтиля.ТекстЗапрещеннойЯчейкиЦвет",
              ЦветФона: "ЦветФонаПодсказки",
              Шрифт: {
                Вид: "ШрифтТекста",
              },
              ГоризонтальноеПоложение: "Лево",
              Формат: '"ЧДЦ=1"',
              Видимость: "Ложь",
            },
          },
        ],
      },
    }

    expect([...compiled.Errors(value)].map((error) => `${error.path}: ${error.message}`)).toEqual([])
  })
```

- [ ] **Step 2: Run integration test to verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/schemaRegistry.test.ts
```

Expected: new test fails before registration because `SettingsParameterValue` schema is not available through normal entrypoints.

- [ ] **Step 3: Register new schema exporters**

In `packages/core/metadata/commonObjects/index.ts`, add:

```ts
import "./dataCompositionSystem/dcsMetadataValue/toJSONSchema"
```

near the existing `dcsMetadataValue` imports, and add:

```ts
import "./dataCompositionSystem/parameterValue/toJSONSchema"
```

near the existing `parameterValue` imports.

In `packages/core/metadata/commonObjects/dataCompositionSystem/index.ts`, add:

```ts
import "./parameterValue/toJSONSchema"
```

near `import "./parameterValue/types"`.

- [ ] **Step 4: Run integration test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/schemaRegistry.test.ts
```

Expected: all tests in `schemaRegistry.test.ts` pass.

- [ ] **Step 5: Commit Task 4**

```bash
git add packages/core/metadata/commonObjects/index.ts packages/core/metadata/commonObjects/dataCompositionSystem/index.ts packages/core/metadata/validation/schemaRegistry.test.ts
git commit -m "test: :white_check_mark: покрыть schema оформления форм"
```

## Task 5: Validation Run And Final Verification

**Files:**
- No source files expected.

- [ ] **Step 1: Run focused test group**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/color/toJSONSchema.test.ts metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toJSONSchema.test.ts metadata/commonObjects/dataCompositionSystem/parameterValue/toJSONSchema.test.ts metadata/validation/schemaRegistry.test.ts
```

Expected: all listed tests pass.

- [ ] **Step 2: Run project validation on ERP YAML**

Run from repository root:

```bash
pnpm --filter @nakidka/cli exec tsx src/cli.ts validate /home/nikita/git/temp-yaml
```

Expected: command can exit with code `1` while other validation errors remain. In the output, the `Оформление / SettingsParameterValue schema` subgroup is gone or materially reduced. Remaining errors should be from other documented groups: `Команды`, `ДополнительныеКолонки`, `Значение` реквизита формы, or smaller dynamic-list tails.

- [ ] **Step 3: Run package tests**

Run:

```bash
pnpm --filter @nakidka/core test
```

Expected: package tests pass.

- [ ] **Step 4: Run full project tests before closing**

Run from repository root:

```bash
pnpm test
```

Expected: full project test suite passes.

- [ ] **Step 5: Commit validation notes only if files changed**

If implementation changed no files after Task 4, do not create a commit. If a validation report or plan checkbox update was intentionally saved, commit only those files:

```bash
git add docs/superpowers/plans/2026-06-12-settings-parameter-value-json-schema.md
git commit -m "docs: :memo: отметить проверку schema SettingsParameterValue"
```

## Self-Review Checklist

- Spec coverage: Task 1 covers real color YAML; Task 2 covers `MetadataDcsMetadataValue`; Task 3 covers compact and full `SettingsParameterValue`; Task 4 covers `AppearanceFields` through form validation; Task 5 covers ERP validation and full tests.
- Strictness: the plan keeps `additionalProperties: false`, rejects `Использовать: Истина`, rejects `Параметр`, rejects unknown keys, rejects empty object.
- YAML contract: the plan describes schema for YAML export, not every historical import fallback.
- XML fixtures: the plan does not modify XML fixtures.
