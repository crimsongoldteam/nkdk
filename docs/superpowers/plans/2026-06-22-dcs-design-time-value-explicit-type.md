# DCS DesignTimeValue Explicit Type Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `SettingsParameterValue` with `valueType: DesignTimeValue` use an explicit YAML `Тип` for localized, formatted localized, and field values, while plain `xs:string` stays the default when `Тип` is absent.

**Architecture:** Keep the change inside DCS value handling. Add a model shape for `v8:LocalFormattedStringType`, extend DCS XML/YAML import/export for `DesignTimeValue`, and adapt `SettingsParameterValue` YAML wrapping so `Тип` sits beside `Значение` at the parameter level. Do not change the global YAML parser or generic XML exporter.

**Tech Stack:** TypeScript, Vitest, existing metadata orchestration and DCS type-rule registry.

---

## File Structure

- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/types.ts`
  - Add model and YAML types for `v8:LocalFormattedStringType`.
  - Extend explicit `DesignTimeValue` YAML union with `МногоязычнаяСтрока`, `МногоязычнаяФорматированнаяСтрока`, and `Поле`.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.ts`
  - Import `v8:LocalFormattedStringType` into the new model shape.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.ts`
  - Export the new model shape as `v8:LocalFormattedStringType`.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toYAML.ts`
  - Return explicit value YAML for localized, formatted localized, and field values.
  - Keep primitive `{ type: "string" }` exported as a plain YAML string for `DesignTimeValue`.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.ts`
  - Import explicit `Тип` values deterministically.
  - Treat absent `Тип` in `DesignTimeValue` as plain string.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toYAML.ts`
  - Flatten explicit DCS value YAML from `{ Значение: { Тип, Значение } }` to `{ Тип, Значение }` for `DesignTimeValue`.
  - Keep nil wrappers without `Значение`.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.ts`
  - Recognize wrappers with `Тип` as expanded `SettingsParameterValue` YAML.
  - Pass `{ Тип, Значение }` to `MetadataDcsMetadataValue` importer instead of only the nested `Значение`.
- Modify tests:
  - `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.test.ts`
  - `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.test.ts`
  - `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.test.ts`
  - `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toYAML.test.ts`
  - `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.test.ts`
  - `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toYAML.test.ts`
  - `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toXML.test.ts`

## Task 1: Model And XML Support For LocalFormattedStringType

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/types.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.ts`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.test.ts`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.test.ts`

- [ ] **Step 1: Write failing XML import test**

Add to `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.test.ts`:

```ts
it("imports LocalFormattedStringType DesignTimeValue", () => {
  const result = testImportPropertyFromXML({
    rule: { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "value" },
    xmlRootTag: "dcscor:value",
    xmlString: `<dcscor:value xsi:type="v8:LocalFormattedStringType">
\t<v8:lws>
\t\t<v8:item>
\t\t\t<v8:lang>ru</v8:lang>
\t\t\t<v8:content>Многоязычная форматированная строка</v8:content>
\t\t</v8:item>
\t</v8:lws>
\t<v8:formatted>true</v8:formatted>
</dcscor:value>`,
  })

  expect(result).toEqual({
    type: "LocalFormattedStringType",
    value: {
      formatted: true,
      items: { ru: "Многоязычная форматированная строка" },
    },
  })
})
```

- [ ] **Step 2: Write failing XML export test**

Add to `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.test.ts`:

```ts
it("exports LocalFormattedStringType DesignTimeValue", () => {
  expect(
    exportDcsMetadataValueToXML(
      mockContextToXML(),
      { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "value" },
      {
        type: "LocalFormattedStringType",
        value: {
          formatted: true,
          items: { ru: "Многоязычная форматированная строка" },
        },
      }
    )
  ).toEqual({
    "_xsi:type": "v8:LocalFormattedStringType",
    "v8:lws": {
      "v8:item": [
        {
          "v8:lang": "ru",
          "v8:content": "Многоязычная форматированная строка",
        },
      ],
    },
    "v8:formatted": true,
  })
})
```

- [ ] **Step 3: Run tests and confirm they fail**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.test.ts
```

Expected: fail because `v8:LocalFormattedStringType` is unsupported.

- [ ] **Step 4: Add model types**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/types.ts`, import formatted text type:

```ts
import type { FormattedI8nText, FormattedI8nTextValueYAML } from "~/metadata/commonObjects/formattedI8nText/types"
```

Add model and YAML types near existing explicit DCS text types:

```ts
export type MetadataDcsLocalFormattedStringTypeValue = {
  type: "LocalFormattedStringType"
  value: FormattedI8nText
}

export type MetadataDcsLocalStringTypeValueYAML = {
  Тип: "МногоязычнаяСтрока"
  Значение: I8nTextYAML
}

export type MetadataDcsLocalFormattedStringTypeValueYAML = {
  Тип: "МногоязычнаяФорматированнаяСтрока"
  Значение: FormattedI8nTextValueYAML
}
```

Add `MetadataDcsLocalFormattedStringTypeValue` to `MetadataDcsMetadataSingleValue`.

- [ ] **Step 5: Implement XML import**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.ts`, add imports:

```ts
import { importFormattedI8nTextFromXML } from "~/metadata/commonObjects/formattedI8nText/fromXML"
import { FormattedI8nTextXML } from "~/metadata/commonObjects/formattedI8nText/types"
```

Add this branch after the `v8:LocalStringType` branch:

```ts
if (xsi === "v8:LocalFormattedStringType") {
  const formatted = importFormattedI8nTextFromXML(
    context,
    { type: "FormattedI8nText" },
    {
      _formatted: (root as Record<string, unknown>)["v8:formatted"] as never,
      "v8:item": (root as Record<string, unknown>)["v8:lws"] !== undefined
        ? ((root as Record<string, unknown>)["v8:lws"] as Record<string, unknown>)["v8:item"]
        : undefined,
    } as FormattedI8nTextXML
  )

  if (formatted === undefined) {
    throw new Error("DCS MetadataValue: invalid LocalFormattedStringType")
  }

  return {
    type: "LocalFormattedStringType",
    value: formatted,
  }
}
```

- [ ] **Step 6: Implement XML export**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.ts`, add imports:

```ts
import { exportFormattedI8nTextToXML } from "~/metadata/commonObjects/formattedI8nText/toXML"
import type { FormattedI8nText } from "~/metadata/commonObjects/formattedI8nText/types"
```

Add a guard:

```ts
const isLocalFormattedStringTypeValue = (
  data: MetadataDcsMetadataValue
): data is { type: "LocalFormattedStringType"; value: FormattedI8nText } =>
  data !== null &&
  typeof data === "object" &&
  !Array.isArray(data) &&
  (data as Record<string, unknown>).type === "LocalFormattedStringType" &&
  typeof (data as Record<string, unknown>).value === "object" &&
  (data as Record<string, unknown>).value !== null
```

Inside `case "DesignTimeValue"`, before generic `"type" in data && "value" in data`, add:

```ts
if (isLocalFormattedStringTypeValue(data)) {
  const formattedXml = exportFormattedI8nTextToXML({
    context,
    rule: { type: "FormattedI8nText" },
    value: data.value,
  })

  const { _formatted, "v8:item": items } = formattedXml ?? {}
  return {
    "dcscor:value": {
      "_xsi:type": "v8:LocalFormattedStringType",
      ...(items !== undefined ? { "v8:lws": { "v8:item": items } } : {}),
      "v8:formatted": _formatted ?? data.value.formatted,
    },
  }
}
```

- [ ] **Step 7: Run XML tests**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.test.ts
```

Expected: the new tests pass; no existing DCS metadata value XML tests regress.

- [ ] **Step 8: Commit Task 1**

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/types.ts packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.ts packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.ts packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.test.ts
git commit -m "feat: :sparkles: добавить DCS LocalFormattedStringType"
```

## Task 2: Explicit YAML Value Types In MetadataDcsMetadataValue

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/types.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toYAML.ts`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.test.ts`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toYAML.test.ts`

- [ ] **Step 1: Write failing YAML import tests**

Add to `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.test.ts`:

```ts
it("imports explicit localized DesignTimeValue", () => {
  expect(
    testImportPropertyFromYAML({
      rule: { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "value" },
      value: {
        Тип: "МногоязычнаяСтрока",
        Значение: "1",
      },
    })
  ).toEqual({ items: { ru: "1" } })
})

it("imports explicit formatted localized DesignTimeValue", () => {
  expect(
    testImportPropertyFromYAML({
      rule: { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "value" },
      value: {
        Тип: "МногоязычнаяФорматированнаяСтрока",
        Значение: {
          Форматированный: "Истина",
          Текст: "Многоязычная форматированная строка",
        },
      },
    })
  ).toEqual({
    type: "LocalFormattedStringType",
    value: {
      formatted: true,
      items: { ru: "Многоязычная форматированная строка" },
    },
  })
})

it("imports missing explicit DesignTimeValue type as xs:string", () => {
  expect(
    testImportPropertyFromYAML({
      rule: { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "value" },
      value: "Все полномочия",
    })
  ).toEqual({ type: "string", value: "Все полномочия" })
})
```

- [ ] **Step 2: Write failing YAML export tests**

Add to `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toYAML.test.ts`:

```ts
it("exports localized DesignTimeValue with explicit type", () => {
  expect(
    testExportPropertyToYAML({
      rule: { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "value" },
      value: { items: { ru: "1" } },
    })
  ).toEqual({
    value: {
      Тип: "МногоязычнаяСтрока",
      Значение: "1",
    },
  })
})

it("exports formatted localized DesignTimeValue with explicit type", () => {
  expect(
    testExportPropertyToYAML({
      rule: { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "value" },
      value: {
        type: "LocalFormattedStringType",
        value: {
          formatted: true,
          items: { ru: "Многоязычная форматированная строка" },
        },
      },
    })
  ).toEqual({
    value: {
      Тип: "МногоязычнаяФорматированнаяСтрока",
      Значение: {
        Форматированный: "Истина",
        Текст: "Многоязычная форматированная строка",
      },
    },
  })
})

it("exports primitive string DesignTimeValue without explicit type", () => {
  expect(
    testExportPropertyToYAML({
      rule: { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "value" },
      value: { type: "string", value: "Все полномочия" },
    })
  ).toEqual({
    value: "Все полномочия",
  })
})
```

- [ ] **Step 3: Run tests and confirm they fail**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toYAML.test.ts
```

Expected: fail because localized values export as plain scalar and plain strings import as `I8nText`.

- [ ] **Step 4: Extend YAML types**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/types.ts`, extend `MetadataDcsExplicitTextValueYAML` to include existing field and project-time values plus the new localized values:

```ts
export type MetadataDcsExplicitTextValueYAML =
  | {
      Тип: "Поле"
      Значение: string
    }
  | {
      Тип: "ЗначениеВремениПроектирования"
      Значение: string
    }
  | MetadataDcsLocalStringTypeValueYAML
  | MetadataDcsLocalFormattedStringTypeValueYAML
```

Keep `MetadataDcsPrimitiveStringValueYAML` for the existing `Field` context only; do not use `Тип: "Строка"` for `DesignTimeValue`.

- [ ] **Step 5: Implement explicit YAML import**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.ts`, import formatted text YAML function:

```ts
import { importFormattedI8nTextFromYAML } from "~/metadata/commonObjects/formattedI8nText/fromYAML"
```

Replace `importExplicitTextValueFromYAML` with:

```ts
const importExplicitTextValueFromYAML = (
  context: ConfigurationContext,
  data: unknown
): MetadataDcsMetadataValue | undefined => {
  if (!hasExplicitTextType(data)) return undefined

  if (data["Тип"] === "Поле" && typeof data["Значение"] === "string") {
    return { type: "Field", value: data["Значение"] }
  }

  if (data["Тип"] === "ЗначениеВремениПроектирования" && typeof data["Значение"] === "string") {
    return { type: "DesignTimeValue", value: data["Значение"] }
  }

  if (data["Тип"] === "МногоязычнаяСтрока" && "Значение" in data) {
    return importI8nTextFromYAML({
      context,
      rule: { type: "I8nText" },
      value: data["Значение"] as I8nTextYAML,
    })!
  }

  if (data["Тип"] === "МногоязычнаяФорматированнаяСтрока" && "Значение" in data) {
    const value = importFormattedI8nTextFromYAML({
      context,
      rule: { type: "FormattedI8nText" },
      value: data["Значение"] as never,
    })

    if (value === undefined) {
      throw new Error("MetadataDcsMetadataValue YAML: invalid formatted localized text value")
    }

    return {
      type: "LocalFormattedStringType",
      value,
    }
  }

  throw new Error("MetadataDcsMetadataValue YAML: invalid explicit text value")
}
```

Inside `case "DesignTimeValue"`, call it as `importExplicitTextValueFromYAML(context, data)`.

Then change absent `Тип` behavior in `case "DesignTimeValue"`:

```ts
if (isExplicitYAMLString(data)) {
  return importMetadataValueFromYAML(context, undefined, data as any) as MetadataDcsMetadataValue
}
if (typeof data === "string") {
  return { type: "string", value: data }
}
if (typeof data === "object" && data !== null && "type" in data && "value" in data) {
  return importMetadataValueFromYAML(context, undefined, data as any) as MetadataDcsMetadataValue
}
return importI8nTextFromYAML({
  context,
  rule: { type: "I8nText" },
  value: data as I8nTextYAML,
})!
```

This keeps object language-map YAML readable as `I8nText`, but makes scalar-without-`Тип` a plain `xs:string`.

- [ ] **Step 6: Implement explicit YAML export**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toYAML.ts`, import formatted text YAML helper:

```ts
import type { FormattedI8nText } from "~/metadata/commonObjects/formattedI8nText/types"
import { exportFormattedI8nTextToYAML } from "~/metadata/commonObjects/formattedI8nText/toYAML"
```

Add guard:

```ts
const isLocalFormattedStringTypeValue = (
  data: MetadataDcsMetadataValue
): data is { type: "LocalFormattedStringType"; value: FormattedI8nText } =>
  data !== null &&
  typeof data === "object" &&
  !Array.isArray(data) &&
  (data as Record<string, unknown>).type === "LocalFormattedStringType" &&
  typeof (data as Record<string, unknown>).value === "object" &&
  (data as Record<string, unknown>).value !== null
```

In `case "DesignTimeValue"`, use this order:

```ts
case "DesignTimeValue":
  if (isLocalFormattedStringTypeValue(data)) {
    const exported = exportFormattedI8nTextToYAML({
      context,
      rule: { type: "FormattedI8nText", yaml: "Значение" },
      value: data.value,
    }) as { Значение?: unknown }

    return {
      Тип: "МногоязычнаяФорматированнаяСтрока",
      Значение: exported.Значение,
    } as MetadataDcsMetadataValueYAML
  }
  if (data !== null && typeof data === "object" && "type" in (data as object) && "value" in (data as object)) {
    if ((data as { type?: unknown }).type === "string") {
      return exportMetadataValueToYAML(context, undefined, data as any) as MetadataDcsMetadataValueYAML
    }
    return exportMetadataValueToYAML(context, undefined, data as any) as MetadataDcsMetadataValueYAML
  }
  if (typeof data === "string") return data as unknown as MetadataDcsMetadataValueYAML
  return {
    Тип: "МногоязычнаяСтрока",
    Значение: exportI8nTextToYAML({ context, rule: { type: "I8nText" }, value: data as I8nText }),
  } as MetadataDcsMetadataValueYAML
```

Keep the existing `isExplicitTextValue` branch before the switch so `type: "Field"` still exports as `{ Тип: "Поле", Значение }`.

- [ ] **Step 7: Run YAML tests**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toYAML.test.ts
```

Expected: the new YAML tests pass.

- [ ] **Step 8: Commit Task 2**

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/types.ts packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.ts packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toYAML.ts packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toYAML.test.ts
git commit -m "feat: :sparkles: добавить явные YAML-типы DCS DesignTimeValue"
```

## Task 3: Flatten Explicit Types In SettingsParameterValue YAML

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toYAML.ts`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.test.ts`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toYAML.test.ts`

- [ ] **Step 1: Write failing export tests**

Add to `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toYAML.test.ts`:

```ts
it("exports DesignTimeValue LocalStringType with explicit type at parameter level", () => {
  const result = testExportPropertyToYAML({
    rule: { type: "SettingsParameterValue", valueType: "DesignTimeValue", yaml: "Текст" } as PropertyRule,
    value: {
      parameter: "Текст",
      use: false,
      value: { items: { ru: "1" } },
    },
  })

  expect(result).toEqual({
    Текст: {
      Использовать: "Ложь",
      Тип: "МногоязычнаяСтрока",
      Значение: "1",
    },
  })
})

it("exports DesignTimeValue field with explicit type at parameter level", () => {
  const result = testExportPropertyToYAML({
    rule: { type: "SettingsParameterValue", valueType: "DesignTimeValue", yaml: "Текст" } as PropertyRule,
    value: {
      parameter: "Текст",
      value: { type: "Field", value: "Реквизит1" },
    },
  })

  expect(result).toEqual({
    Текст: {
      Тип: "Поле",
      Значение: "Реквизит1",
    },
  })
})

it("exports DesignTimeValue primitive string without explicit type", () => {
  const result = testExportPropertyToYAML({
    rule: { type: "SettingsParameterValue", valueType: "DesignTimeValue", yaml: "Текст" } as PropertyRule,
    value: {
      parameter: "Текст",
      value: { type: "string", value: "Все полномочия" },
    },
  })

  expect(result).toEqual({
    Текст: {
      Значение: "Все полномочия",
    },
  })
})

it("exports nil DesignTimeValue wrapper without value", () => {
  const result = testExportPropertyToYAML({
    rule: { type: "SettingsParameterValue", valueType: "DesignTimeValue", yaml: "Текст" } as PropertyRule,
    value: {
      parameter: "Текст",
      use: false,
    },
  })

  expect(result).toEqual({
    Текст: {
      Использовать: "Ложь",
    },
  })
})
```

- [ ] **Step 2: Write failing import tests**

Add to `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.test.ts`:

```ts
it("imports DesignTimeValue LocalStringType with explicit type at parameter level", () => {
  const result = testImportPropertyFromYAML({
    rule: { type: "SettingsParameterValue", valueType: "DesignTimeValue", yaml: "Текст" } as PropertyRule,
    value: {
      Использовать: "Ложь",
      Тип: "МногоязычнаяСтрока",
      Значение: "1",
    },
  })

  expect(result).toEqual({
    parameter: "Текст",
    use: false,
    value: { items: { ru: "1" } },
  })
})

it("imports DesignTimeValue formatted LocalStringType with explicit type at parameter level", () => {
  const result = testImportPropertyFromYAML({
    rule: { type: "SettingsParameterValue", valueType: "DesignTimeValue", yaml: "Текст" } as PropertyRule,
    value: {
      Тип: "МногоязычнаяФорматированнаяСтрока",
      Значение: {
        Форматированный: "Истина",
        Текст: "Многоязычная форматированная строка",
      },
    },
  })

  expect(result).toEqual({
    parameter: "Текст",
    value: {
      type: "LocalFormattedStringType",
      value: {
        formatted: true,
        items: { ru: "Многоязычная форматированная строка" },
      },
    },
  })
})

it("imports DesignTimeValue primitive string when type is absent", () => {
  const result = testImportPropertyFromYAML({
    rule: { type: "SettingsParameterValue", valueType: "DesignTimeValue", yaml: "Текст" } as PropertyRule,
    value: {
      Значение: "Все полномочия",
    },
  })

  expect(result).toEqual({
    parameter: "Текст",
    value: { type: "string", value: "Все полномочия" },
  })
})
```

- [ ] **Step 3: Run tests and confirm they fail**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toYAML.test.ts
```

Expected: fail because explicit DCS YAML is nested under `Значение` and wrappers with only `Тип` are not considered expanded settings shapes.

- [ ] **Step 4: Treat `Тип` as an expanded wrapper key**

In `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.ts`, update `hasSettingsParameterValueWrapperKey`:

```ts
const hasSettingsParameterValueWrapperKey = (x: Record<string, unknown>): boolean =>
  "Использовать" in x ||
  "Тип" in x ||
  "Элементы" in x ||
  x["РежимОтображения"] !== undefined ||
  x["ИдентификаторПользовательскойНастройки"] !== undefined ||
  x["ПредставлениеПользовательскойНастройки"] !== undefined
```

- [ ] **Step 5: Build raw explicit value from parameter-level `Тип`**

In `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.ts`, replace raw value calculation with:

```ts
const hasParameterLevelType = y !== undefined && "Тип" in y
const explicitTypedValue =
  hasParameterLevelType && hasExplicitValue
    ? {
        Тип: y["Тип"],
        Значение: normalizeExplicitRawValue(rule.valueType, y, "Значение", y["Значение"]),
      }
    : undefined
const rawValueBase =
  explicitTypedValue !== undefined
    ? explicitTypedValue
    : rule.valueType === "Color" && yamlToParse === null
      ? undefined
      : hasExplicitValue
        ? normalizeExplicitRawValue(rule.valueType, y, "Значение", y["Значение"])
        : isExpandedSpvShape
          ? undefined
          : yamlToParse
```

This preserves double-quoted scalar markers inside `Значение` and sends `{ Тип, Значение }` to the DCS value importer.

- [ ] **Step 6: Flatten explicit DCS YAML during export**

In `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toYAML.ts`, add helper:

```ts
const isExplicitDesignTimeValueYAML = (value: unknown): value is { Тип: string; Значение: unknown } =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  typeof (value as Record<string, unknown>).Тип === "string" &&
  Object.prototype.hasOwnProperty.call(value, "Значение")
```

After `значение` is computed, derive parameter-level type:

```ts
const explicitDesignTimeValue =
  rule.valueType === "DesignTimeValue" && isExplicitDesignTimeValueYAML(значение) ? значение : undefined
const valueForYAML = explicitDesignTimeValue !== undefined ? explicitDesignTimeValue.Значение : значение
const hasValue = valueForYAML !== undefined
```

Then update `base`:

```ts
const base: Record<string, unknown> = {
  ...(hasUse ? { Использовать: "Ложь" as const } : {}),
  ...(explicitDesignTimeValue !== undefined ? { Тип: explicitDesignTimeValue.Тип } : {}),
  ...(hasValue ? { Значение: valueForYAML } : {}),
  ...(hasElements ? { Элементы: elements } : {}),
}
```

Remove the old `const hasValue = значение !== undefined` line.

- [ ] **Step 7: Run parameter value YAML tests**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toYAML.test.ts
```

Expected: new wrapper-level explicit type tests pass.

- [ ] **Step 8: Commit Task 3**

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toYAML.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toYAML.test.ts
git commit -m "feat: :sparkles: вынести тип DCS значения в YAML параметра"
```

## Task 4: Round-Trip Regression Tests For Observed Diffs

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toYAML.test.ts`

- [ ] **Step 1: Add XML round-trip tests for the three observed values**

Add to `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toXML.test.ts`:

```ts
it.each(["1", "-", "0.00"])("keeps LocalStringType text %s through explicit YAML model", (text) => {
  const { result } = testExportPropertyToXML({
    rule: { type: "SettingsParameterValue", valueType: "DesignTimeValue" },
    value: {
      parameter: "Текст",
      use: text === "-" ? undefined : false,
      value: { items: { ru: text } },
    },
    xmlRootTag: "dcscor:item",
  })

  expect(result).toContain('<dcscor:value xsi:type="v8:LocalStringType">')
  expect(result).toContain(`<v8:content>${text}</v8:content>`)
  expect(result).not.toContain('xsi:type="xs:string"')
})
```

- [ ] **Step 2: Add YAML import/export regression for numeric-looking localized text**

Add to `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toYAML.test.ts`:

```ts
it.each(["1", "-", "0.00"])("exports localized text %s with explicit type", (text) => {
  const result = testExportPropertyToYAML({
    rule: { type: "SettingsParameterValue", valueType: "DesignTimeValue", yaml: "Текст" } as PropertyRule,
    value: {
      parameter: "Текст",
      use: text === "-" ? undefined : false,
      value: { items: { ru: text } },
    },
  })

  expect(result).toEqual({
    Текст: {
      ...(text === "-" ? {} : { Использовать: "Ложь" }),
      Тип: "МногоязычнаяСтрока",
      Значение: text,
    },
  })
})
```

Add to `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.test.ts`:

```ts
it.each(["1", "-", "0.00"])("imports localized text %s with explicit type", (text) => {
  const result = testImportPropertyFromYAML({
    rule: { type: "SettingsParameterValue", valueType: "DesignTimeValue", yaml: "Текст" } as PropertyRule,
    value: {
      Тип: "МногоязычнаяСтрока",
      Значение: text,
    },
  })

  expect(result).toEqual({
    parameter: "Текст",
    value: { items: { ru: text } },
  })
})
```

- [ ] **Step 3: Run regression tests**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toXML.test.ts
```

Expected: all regression tests pass.

- [ ] **Step 4: Commit Task 4**

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toXML.test.ts
git commit -m "test: :white_check_mark: покрыть явный тип текста DCS"
```

## Task 5: Full Verification And Round-Trip Check

**Files:**
- No source file edits in this task.

- [ ] **Step 1: Run full project tests**

Run:

```bash
pnpm test
```

Expected: all packages pass.

- [ ] **Step 2: Run YAML round-trip on acc**

Run from `/Users/nikita/git/nkdk` on a clean worktree:

```bash
./.agents/skills/round-trip-yaml/round-trip.sh /Users/nikita/git/round-trip/acc
```

Expected: the three previously discussed diffs where `v8:LocalStringType` became `xs:string` disappear. If the script requires a different invocation in this repository, read `/Users/nikita/git/nkdk/.agents/skills/round-trip-yaml/SKILL.md` and use its documented command.

- [ ] **Step 3: Inspect remaining round-trip diffs**

Run:

```bash
git -C /Users/nikita/git/round-trip/acc diff -- DataProcessors/СопоставлениеДанныхЕГАИС/Forms/СопоставлениеНоменклатуры/Ext/Form.xml Documents/ИнвентаризацияКассы/Forms/ФормаДокумента/Ext/Form.xml Documents/СведенияОДоходахСотрудникаДляСоцВыплат/Forms/ФормаДокумента/Ext/Form.xml
```

Expected: no `v8:LocalStringType` to `xs:string` changes remain in those files.

- [ ] **Step 4: Confirm verification left no repository edits**

Run:

```bash
git status --short
```

Expected: no new source edits from verification. If round-trip changed `/Users/nikita/git/round-trip/acc`, leave those external diffs for separate triage and do not commit them in `/Users/nikita/git/nkdk`.

## Self-Review

- Spec coverage: covered XML forms `xs:string`, `v8:LocalStringType`, `v8:LocalFormattedStringType`, `dcscor:Field`, and `xsi:nil="true"`.
- YAML contract: covered absent `Тип` as `xs:string`, explicit `Тип` for localized/formatted/field, and nil wrapper without `Значение`.
- Type consistency: new model type is consistently named `LocalFormattedStringType`; YAML labels are `МногоязычнаяСтрока`, `МногоязычнаяФорматированнаяСтрока`, and `Поле`.
- Verification: includes focused tests, full `pnpm test`, and acc round-trip diff inspection.
