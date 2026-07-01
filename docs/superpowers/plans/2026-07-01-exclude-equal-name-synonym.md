# Exclude Equal Name Synonym Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `excludeIfEqualNameYAML` a single contract for YAML export, project validation, and concrete-file JSON Schema hints.

**Architecture:** Keep object-specific knowledge in rules and project resources. Add a small shared helper that understands `I8nText` and `FormattedI8nText`, then call it from validation traversal and JSON Schema export when the current item name is known. Treat empty `Свойства.yaml` as `{}` only for metadata object property files, not for `Конфигурация.yaml`.

**Tech Stack:** TypeScript, Vitest, TypeBox, yaml, existing `metadata/validation` and `metadata/orchestration` layers.

---

## File Structure

- Create `packages/core/metadata/helpers/excludeIfEqualNameYAML.ts`
  - Owns all value/schema logic for `excludeIfEqualNameYAML`.
  - Knows only about `I8nText`, `FormattedI8nText`, `defaultLanguage`, and `canConvertToPascalCase`.
- Create `packages/core/metadata/helpers/excludeIfEqualNameYAML.test.ts`
  - Unit tests for plain, multilingual, formatted, disabled-rule, and schema behavior.
- Modify `packages/core/metadata/context/types.ts`
  - Add optional `currentItemName` to `JSONSchemaExportContext`.
- Modify `packages/core/metadata/project/projectSpecRegistry.ts`
  - Allow project schema exporters to receive the current item name.
- Modify `packages/core/metadata/project/projectSpecHelpers.ts`
  - Pass the name into metadata item schema export.
- Modify `packages/core/metadata/orchestration/metadataItem/toJSONSchema.ts`
  - Accept the current item name and pass it to property schema export.
- Modify `packages/core/metadata/orchestration/property/toJSONSchema.ts`
  - Apply name-aware `excludeIfEqualNameYAML` schema restrictions to supported text properties.
- Modify `packages/core/metadata/validation/projectFileSchema.ts`
  - Pass `resource.owner.name` into properties schema export.
- Modify `packages/core/metadata/validation/validateProject.ts`
  - Normalize empty properties YAML to `{}`.
  - Cache schemas by metadata kind and current name.
  - Run semantic `excludeIfEqualNameYAML` validation after import succeeds.
- Create `packages/core/metadata/validation/excludeIfEqualNameYAML.ts`
  - Traverses parsed YAML by `rules.ts`, including registered collection item rules.
- Create `packages/core/metadata/validation/excludeIfEqualNameYAML.test.ts`
  - Unit tests for root and nested collection traversal.
- Modify `packages/core/metadata/forms/clientApplicationForm/validate.ts`
  - Run the same semantic validation for `Форма.yaml`.
- Modify `packages/core/metadata/validation/validateProject.test.ts`
  - Integration tests for empty files, object synonym, configuration boundary, nested form title, and multilingual values.
- Modify `packages/core/metadata/validation/projectFileSchema.test.ts`
  - Integration tests for concrete-file schema restrictions.

## Task 1: Shared `excludeIfEqualNameYAML` Helper

**Files:**
- Create: `packages/core/metadata/helpers/excludeIfEqualNameYAML.ts`
- Create: `packages/core/metadata/helpers/excludeIfEqualNameYAML.test.ts`

- [ ] **Step 1: Write the failing helper tests**

Create `packages/core/metadata/helpers/excludeIfEqualNameYAML.test.ts`:

```ts
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { describe, expect, it } from "vitest"
import { I8nTextJSONSchema } from "~/metadata/commonObjects/i8nText/types"
import { FormattedI8nTextJSONSchema } from "~/metadata/commonObjects/formattedI8nText/types"
import {
  applyExcludedEqualNameYAMLToJSONSchema,
  findExcludedEqualNameYAMLOccurrence,
} from "./excludeIfEqualNameYAML"

const context = {
  defaultLanguage: "ru",
  version: "2.20",
} as const

describe("findExcludedEqualNameYAMLOccurrence", () => {
  it("detects a default-language I8nText string equal to the item name", () => {
    expect(
      findExcludedEqualNameYAMLOccurrence({
        context,
        rule: { type: "I8nText", yaml: "Синоним", excludeIfEqualNameYAML: true },
        value: "Какое то поле",
        name: "КакоеТоПоле",
        path: ["Синоним"],
      })
    ).toEqual({ path: ["Синоним"], value: "Какое то поле" })
  })

  it("detects only the default language in multilingual I8nText", () => {
    expect(
      findExcludedEqualNameYAMLOccurrence({
        context,
        rule: { type: "I8nText", yaml: "Синоним", excludeIfEqualNameYAML: true },
        value: { ru: "Какое то поле", en: "Some field" },
        name: "КакоеТоПоле",
        path: ["Синоним"],
      })
    ).toEqual({ path: ["Синоним", "ru"], value: "Какое то поле" })

    expect(
      findExcludedEqualNameYAMLOccurrence({
        context,
        rule: { type: "I8nText", yaml: "Синоним", excludeIfEqualNameYAML: true },
        value: { en: "Какое то поле" },
        name: "КакоеТоПоле",
        path: ["Синоним"],
      })
    ).toBeUndefined()
  })

  it("detects a default-language FormattedI8nText text equal to the item name", () => {
    expect(
      findExcludedEqualNameYAMLOccurrence({
        context,
        rule: { type: "FormattedI8nText", yaml: "Заголовок", excludeIfEqualNameYAML: true },
        value: {
          Форматированный: "Истина",
          Текст: { ru: "Какое то поле", en: "Some field" },
        },
        name: "КакоеТоПоле",
        path: ["Заголовок"],
      })
    ).toEqual({ path: ["Заголовок", "Текст", "ru"], value: "Какое то поле" })
  })

  it("ignores rules without excludeIfEqualNameYAML", () => {
    expect(
      findExcludedEqualNameYAMLOccurrence({
        context,
        rule: { type: "I8nText", yaml: "Синоним" },
        value: "Какое то поле",
        name: "КакоеТоПоле",
        path: ["Синоним"],
      })
    ).toBeUndefined()
  })
})

describe("applyExcludedEqualNameYAMLToJSONSchema", () => {
  it("rejects equal I8nText string and default-language map values", () => {
    const schema = TypeCompiler.Compile(
      applyExcludedEqualNameYAMLToJSONSchema({
        context,
        rule: { type: "I8nText", yaml: "Синоним", excludeIfEqualNameYAML: true },
        schema: I8nTextJSONSchema,
        name: "КакоеТоПоле",
      })
    )

    expect(schema.Check("Какое то поле")).toBe(false)
    expect(schema.Check({ ru: "Какое то поле", en: "Some field" })).toBe(false)
    expect(schema.Check({ en: "Some field" })).toBe(true)
    expect(schema.Check("Другое поле")).toBe(true)
  })

  it("rejects equal FormattedI8nText default-language text values", () => {
    const schema = TypeCompiler.Compile(
      applyExcludedEqualNameYAMLToJSONSchema({
        context,
        rule: { type: "FormattedI8nText", yaml: "Заголовок", excludeIfEqualNameYAML: true },
        schema: FormattedI8nTextJSONSchema,
        name: "КакоеТоПоле",
      })
    )

    expect(schema.Check({ Текст: "Какое то поле" })).toBe(false)
    expect(schema.Check({ Текст: { ru: "Какое то поле", en: "Some field" } })).toBe(false)
    expect(schema.Check({ Форматированный: "Истина", Текст: { en: "Some field" } })).toBe(true)
    expect(schema.Check({ Текст: "Другое поле" })).toBe(true)
  })
})
```

- [ ] **Step 2: Run the helper test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/helpers/excludeIfEqualNameYAML.test.ts
```

Expected: FAIL because `./excludeIfEqualNameYAML` does not exist.

- [ ] **Step 3: Implement the helper**

Create `packages/core/metadata/helpers/excludeIfEqualNameYAML.ts`:

```ts
import { Type, type TSchema } from "@sinclair/typebox"
import type { ConfigurationContext } from "~/metadata/context/types"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { canConvertToPascalCase, splitPascalCase } from "./canConvertToPascalCase"

type YamlPath = readonly (string | number)[]

export interface ExcludedEqualNameYAMLOccurrence {
  path: YamlPath
  value: string
}

export interface FindExcludedEqualNameYAMLOccurrenceParams {
  context: Pick<ConfigurationContext, "defaultLanguage">
  rule: PropertyRule
  value: unknown
  name: string | undefined
  path: YamlPath
}

export interface ApplyExcludedEqualNameYAMLToJSONSchemaParams {
  context: Pick<ConfigurationContext, "defaultLanguage">
  rule: PropertyRule
  schema: TSchema
  name: string | undefined
}

export function isExcludeIfEqualNameYAMLTextRule(rule: PropertyRule): boolean {
  return (
    rule.excludeIfEqualNameYAML === true &&
    (rule.type === "I8nText" || rule.type === "FormattedI8nText")
  )
}

export function findExcludedEqualNameYAMLOccurrence(
  params: FindExcludedEqualNameYAMLOccurrenceParams
): ExcludedEqualNameYAMLOccurrence | undefined {
  const { context, rule, value, name, path } = params
  if (!name || !isExcludeIfEqualNameYAMLTextRule(rule)) return undefined

  if (rule.type === "FormattedI8nText") {
    const record = asRecord(value)
    if (!record) return undefined

    return findI8nTextOccurrence({
      context,
      value: record["Текст"],
      name,
      path: [...path, "Текст"],
    })
  }

  return findI8nTextOccurrence({ context, value, name, path })
}

export function applyExcludedEqualNameYAMLToJSONSchema(
  params: ApplyExcludedEqualNameYAMLToJSONSchemaParams
): TSchema {
  const { context, rule, schema, name } = params
  if (!name || !isExcludeIfEqualNameYAMLTextRule(rule)) return schema

  const excludedText = splitPascalCase(name)
  const forbiddenText = forbiddenI8nTextSchema(context.defaultLanguage, excludedText)

  const forbiddenValue =
    rule.type === "FormattedI8nText"
      ? Type.Object({ Текст: forbiddenText }, { additionalProperties: true })
      : forbiddenText

  return Type.Intersect([schema, Type.Not(forbiddenValue)])
}

function findI8nTextOccurrence(params: {
  context: Pick<ConfigurationContext, "defaultLanguage">
  value: unknown
  name: string
  path: YamlPath
}): ExcludedEqualNameYAMLOccurrence | undefined {
  const { context, value, name, path } = params

  if (typeof value === "string") {
    return canConvertToPascalCase(value, name) ? { path, value } : undefined
  }

  const record = asRecord(value)
  if (!record) return undefined

  const defaultLanguageValue = record[context.defaultLanguage]
  if (typeof defaultLanguageValue !== "string") return undefined

  return canConvertToPascalCase(defaultLanguageValue, name)
    ? { path: [...path, context.defaultLanguage], value: defaultLanguageValue }
    : undefined
}

function forbiddenI8nTextSchema(defaultLanguage: string, excludedText: string): TSchema {
  return Type.Union([
    Type.Literal(excludedText),
    Type.Object(
      {
        [defaultLanguage]: Type.Literal(excludedText),
      },
      { additionalProperties: true }
    ),
  ])
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}
```

- [ ] **Step 4: Run the helper test and verify it passes**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/helpers/excludeIfEqualNameYAML.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 1**

```bash
git add packages/core/metadata/helpers/excludeIfEqualNameYAML.ts packages/core/metadata/helpers/excludeIfEqualNameYAML.test.ts
git commit -m "feat: :sparkles: добавить договор равного имени для i8n"
```

## Task 2: Empty `Свойства.yaml` As Empty Object

**Files:**
- Modify: `packages/core/metadata/validation/validateProject.ts`
- Test: `packages/core/metadata/validation/validateProject.test.ts`

- [ ] **Step 1: Add failing validation tests for empty files**

Add these tests near the other `validateProject` properties tests in `packages/core/metadata/validation/validateProject.test.ts`:

```ts
  it("accepts an empty properties YAML file as an empty object", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Договоры/Свойства.yaml", "")

    const diagnostics = validateProject({
      projectDir,
      filePath: "Справочник/Договоры/Свойства.yaml",
      context: mockContext,
    }).diagnostics

    expect(diagnostics).toEqual([])
  })

  it("keeps an empty root configuration YAML invalid because Имя is required", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Конфигурация.yaml", "")

    const diagnostics = validateProject({
      projectDir,
      filePath: "Конфигурация.yaml",
      context: mockContext,
    }).diagnostics

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filePath: join(projectDir, "Конфигурация.yaml"),
          source: "structure",
          severity: "error",
        }),
      ])
    )
  })
```

- [ ] **Step 2: Run the focused tests and verify the first test fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/validateProject.test.ts -t "empty"
```

Expected: FAIL for `accepts an empty properties YAML file as an empty object`; diagnostics include `Expected object` before the implementation.

- [ ] **Step 3: Normalize empty properties parsed data in project validation**

Modify `packages/core/metadata/validation/validateProject.ts`.

Add this helper near `validateProjectFileSchema`:

```ts
function parsedForProjectFile(file: ValidationProjectFile, parsed: ParsedYaml): ParsedYaml {
  if (file.kind === "properties" && parsed.doc.errors.length === 0 && parsed.data === undefined) {
    return { ...parsed, data: {} }
  }

  return parsed
}
```

Change `validateProjectProperties` to compute and use normalized parsed data:

```ts
function validateProjectProperties(params: {
  file: ValidationProjectFile
  cache: ProjectYamlCache
  context: ConfigurationContext
  metadataResolver: ProjectMetadataResolver
  schemaCache: ValidationSchemaCache
}): Diagnostic[] {
  const entry = params.cache.get(params.file.absolutePath)
  if ("error" in entry) {
    return validateProjectFileSchema({
      file: params.file,
      cache: params.cache,
      schema: params.schemaCache.properties(params.file.owner.spec),
    })
  }

  const parsed = parsedForProjectFile(params.file, entry.parsed)
  const diagnostics = validateProjectFileSchema({
    file: params.file,
    cache: params.cache,
    schema: params.schemaCache.properties(params.file.owner.spec),
    parsed,
  })

  if (entry.parsed.doc.errors.length > 0) return diagnostics

  const requiredDiagnostics = validateRegisteredProjectFileValidators({
    file: params.file,
    parsed,
  })
  if (requiredDiagnostics.length > 0) return [...diagnostics, ...requiredDiagnostics]

  const imported = importPropertiesModel({
    spec: params.file.owner.spec,
    context: params.context,
    parsed,
    name: params.file.owner.name,
    filePath: params.file.absolutePath,
  })
  if ("diagnostic" in imported) return [...diagnostics, imported.diagnostic]

  const ownerRoot = rootFromYAML[params.file.owner.dir]
  const owner = ownerRoot ? { root: ownerRoot, objectName: params.file.owner.name } : undefined

  return [
    ...diagnostics,
    ...validateUniqueNameScopes({
      filePath: params.file.absolutePath,
      parsed,
      model: imported.model,
      rule: params.file.owner.spec.rule,
    }),
    ...validateMetadataTargetsInModel({
      filePath: params.file.absolutePath,
      parsed,
      model: imported.model,
      rule: params.file.owner.spec.rule,
      resolver: params.metadataResolver,
      owner,
    }),
  ]
}
```

Change `validateProjectFileSchema` to accept the file and optional parsed override:

```ts
function validateProjectFileSchema(params: {
  file: ValidationProjectFile
  cache: ProjectYamlCache
  schema: CompiledSchema
  parsed?: ParsedYaml
}): Diagnostic[] {
  const entry = params.cache.get(params.file.absolutePath)
  if ("error" in entry) {
    return [
      {
        filePath: entry.filePath,
        line: 1,
        col: 1,
        severity: "error",
        source: "external-file",
        message: `Не удалось прочитать YAML-файл: ${entry.error.message}`,
      },
    ]
  }

  return validateParsedFile({
    filePath: entry.filePath,
    parsed: params.parsed ?? entry.parsed,
    schema: params.schema,
  })
}
```

Update the two call sites:

```ts
const schemaDiagnostics = validateProjectFileSchema({
  file: params.file,
  cache: params.cache,
  schema: params.schemaCache.form(),
})
```

and use the updated `validateProjectProperties` body shown above.

- [ ] **Step 4: Run the focused empty-file tests and verify they pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/validateProject.test.ts -t "empty"
```

Expected: PASS.

- [ ] **Step 5: Commit Task 2**

```bash
git add packages/core/metadata/validation/validateProject.ts packages/core/metadata/validation/validateProject.test.ts
git commit -m "fix: :bug: считать пустой properties yaml пустым объектом"
```

## Task 3: Semantic Validation For `excludeIfEqualNameYAML`

**Files:**
- Create: `packages/core/metadata/validation/excludeIfEqualNameYAML.ts`
- Create: `packages/core/metadata/validation/excludeIfEqualNameYAML.test.ts`
- Modify: `packages/core/metadata/validation/validateProject.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/validate.ts`
- Test: `packages/core/metadata/validation/validateProject.test.ts`

- [ ] **Step 1: Write failing traversal unit tests**

Create `packages/core/metadata/validation/excludeIfEqualNameYAML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import { parseMetadataYaml } from "~/yaml/parseMetadataYaml"
import { validateExcludedEqualNameYAML } from "./excludeIfEqualNameYAML"

const context = {
  defaultLanguage: "ru",
  version: "2.20",
} as const

describe("validateExcludedEqualNameYAML", () => {
  it("reports a root I8nText value equal to the current item name", () => {
    const parsed = parseMetadataYaml("Синоним: Какое то поле\n")
    const rule: MetadataItemRule = {
      itemType: "MetadataCatalog",
      properties: {
        synonym: { type: "I8nText", yaml: "Синоним", excludeIfEqualNameYAML: true },
      },
    } as never

    const diagnostics = validateExcludedEqualNameYAML({
      context,
      filePath: "/tmp/Свойства.yaml",
      parsed,
      rule,
      name: "КакоеТоПоле",
    })

    expect(diagnostics).toEqual([
      expect.objectContaining({
        source: "structure",
        severity: "error",
        path: "/Синоним",
        message: 'Поле "Синоним" не нужно указывать, если его значение совпадает с именем "КакоеТоПоле"',
      }),
    ])
  })

  it("uses record keys as names for nested collection items", () => {
    const parsed = parseMetadataYaml(["Реквизиты:", "  КакоеТоПоле:", "    Заголовок: Какое то поле"].join("\n"))
    const testCollectionType = "__ExcludeEqualNameCollectionUnit" as never
    const itemRule: MetadataItemRule = {
      itemType: "FormAttribute",
      properties: {
        title: { type: "I8nText", yaml: "Заголовок", excludeIfEqualNameYAML: true },
      },
    } as never
    const rootRule: MetadataItemRule = {
      itemType: "ClientApplicationForm",
      properties: {
        attributes: { type: testCollectionType, yaml: "Реквизиты" },
      },
    } as never

    registerTypeRule(testCollectionType, "collectionItemRule", { itemRule })

    const diagnostics = validateExcludedEqualNameYAML({
      context,
      filePath: "/tmp/Форма.yaml",
      parsed,
      rule: rootRule,
      name: "ФормаЭлемента",
    })

    expect(diagnostics).toEqual([
      expect.objectContaining({
        path: "/Реквизиты/КакоеТоПоле/Заголовок",
      }),
    ])
  })

  it("reports formatted default-language values at the nested text path", () => {
    const parsed = parseMetadataYaml(
      [
        "Реквизиты:",
        "  КакоеТоПоле:",
        "    Заголовок:",
        "      Форматированный: Истина",
        "      Текст:",
        "        ru: Какое то поле",
        "        en: Some field",
      ].join("\n")
    )
    const testCollectionType = "__ExcludeEqualNameFormattedCollectionUnit" as never
    const itemRule: MetadataItemRule = {
      itemType: "FormattedItem",
      properties: {
        title: { type: "FormattedI8nText", yaml: "Заголовок", excludeIfEqualNameYAML: true },
      },
    } as never
    const rootRule: MetadataItemRule = {
      itemType: "ClientApplicationForm",
      properties: {
        attributes: { type: testCollectionType, yaml: "Реквизиты" },
      },
    } as never

    registerTypeRule(testCollectionType, "collectionItemRule", { itemRule })

    const diagnostics = validateExcludedEqualNameYAML({
      context,
      filePath: "/tmp/Форма.yaml",
      parsed,
      rule: rootRule,
      name: "ФормаЭлемента",
    })

    expect(diagnostics).toEqual([
      expect.objectContaining({
        path: "/Реквизиты/КакоеТоПоле/Заголовок/Текст/ru",
      }),
    ])
  })
})
```

- [ ] **Step 2: Run traversal tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/excludeIfEqualNameYAML.test.ts
```

Expected: FAIL because `./excludeIfEqualNameYAML` does not exist.

- [ ] **Step 3: Implement traversal validation**

Create `packages/core/metadata/validation/excludeIfEqualNameYAML.ts`:

```ts
import { findExcludedEqualNameYAMLOccurrence } from "~/metadata/helpers/excludeIfEqualNameYAML"
import { getTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import type { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import type { ConfigurationContext } from "~/metadata/context/types"
import type { ParsedYaml } from "~/yaml/parseMetadataYaml"
import type { Diagnostic } from "./types"
import { diagnosticAtYamlPath, type YamlPath } from "./yamlLocations"

export interface ValidateExcludedEqualNameYAMLParams {
  context: ConfigurationContext
  filePath: string
  parsed: ParsedYaml
  rule: MetadataItemRule
  name: string | undefined
}

export function validateExcludedEqualNameYAML(params: ValidateExcludedEqualNameYAMLParams): Diagnostic[] {
  return validateObject({
    ...params,
    value: params.parsed.data,
    yamlPath: [],
  })
}

function validateObject(
  params: ValidateExcludedEqualNameYAMLParams & {
    value: unknown
    yamlPath: YamlPath
  }
): Diagnostic[] {
  const record = asRecord(params.value)
  if (!record) return []

  const diagnostics: Diagnostic[] = []
  for (const propRule of Object.values(params.rule.properties)) {
    if (typeof propRule.yaml !== "string") continue

    const yamlValue = record[propRule.yaml]
    if (yamlValue === undefined) continue

    const propertyPath = [...params.yamlPath, propRule.yaml]
    const occurrence = findExcludedEqualNameYAMLOccurrence({
      context: params.context,
      rule: propRule,
      value: yamlValue,
      name: params.name,
      path: propertyPath,
    })

    if (occurrence) {
      diagnostics.push(
        diagnosticAtYamlPath({
          filePath: params.filePath,
          parsed: params.parsed,
          path: occurrence.path,
          severity: "error",
          source: "structure",
          message: equalNameMessage(propRule, params.name),
        })
      )
    }

    const itemRule = nestedItemRule(propRule)
    if (!itemRule) continue

    diagnostics.push(
      ...validateNestedItems({
        ...params,
        value: yamlValue,
        itemRule,
        yamlPath: propertyPath,
      })
    )
  }

  return diagnostics
}

function validateNestedItems(
  params: ValidateExcludedEqualNameYAMLParams & {
    value: unknown
    itemRule: MetadataItemRule
    yamlPath: YamlPath
  }
): Diagnostic[] {
  if (Array.isArray(params.value)) {
    return params.value.flatMap((item, index) =>
      validateObject({
        ...params,
        rule: params.itemRule,
        value: item,
        name: itemNameFromYAML(params.itemRule, item),
        yamlPath: [...params.yamlPath, index],
      })
    )
  }

  const record = asRecord(params.value)
  if (!record) return []

  return Object.entries(record).flatMap(([key, item]) =>
    validateObject({
      ...params,
      rule: params.itemRule,
      value: item,
      name: key,
      yamlPath: [...params.yamlPath, key],
    })
  )
}

function nestedItemRule(propRule: PropertyRule): MetadataItemRule | undefined {
  const collectionItemRule = getTypeRule(propRule.type, "collectionItemRule")
  if (collectionItemRule?.itemRule) return collectionItemRule.itemRule

  if ("itemRule" in propRule && propRule.itemRule !== undefined) {
    return propRule.itemRule as MetadataItemRule
  }

  return undefined
}

function itemNameFromYAML(rule: MetadataItemRule, value: unknown): string | undefined {
  const record = asRecord(value)
  if (!record) return undefined

  const nameRule = rule.properties.name
  const nameYamlKey = typeof nameRule?.yaml === "string" ? nameRule.yaml : undefined
  if (nameYamlKey !== undefined && typeof record[nameYamlKey] === "string") return record[nameYamlKey] as string

  return typeof record.name === "string" ? record.name : undefined
}

function equalNameMessage(rule: PropertyRule, name: string | undefined): string {
  const yamlName = typeof rule.yaml === "string" ? rule.yaml : "Поле"
  return name
    ? `Поле "${yamlName}" не нужно указывать, если его значение совпадает с именем "${name}"`
    : `Поле "${yamlName}" не нужно указывать, если его значение совпадает с именем элемента`
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}
```

- [ ] **Step 4: Run traversal tests and verify they pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/excludeIfEqualNameYAML.test.ts
```

Expected: PASS.

- [ ] **Step 5: Add project/form integration tests**

Add these tests to `packages/core/metadata/validation/validateProject.test.ts`:

```ts
  it("rejects an explicit object synonym equal to the object name", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/КакоеТоПоле/Свойства.yaml", ["Синоним: Какое то поле"])

    const diagnostics = validateProject({
      projectDir,
      filePath: "Справочник/КакоеТоПоле/Свойства.yaml",
      context: mockContext,
    }).diagnostics

    expect(diagnostics).toEqual([
      expect.objectContaining({
        filePath: join(projectDir, "Справочник", "КакоеТоПоле", "Свойства.yaml"),
        source: "structure",
        severity: "error",
        path: "/Синоним",
        message: expect.stringContaining('Поле "Синоним" не нужно указывать'),
      }),
    ])
  })

  it("allows only non-default languages when the default synonym equals the object name", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/КакоеТоПоле/Свойства.yaml", [
      "Синоним:",
      "  en: Some field",
    ])

    const diagnostics = validateProject({
      projectDir,
      filePath: "Справочник/КакоеТоПоле/Свойства.yaml",
      context: mockContext,
    }).diagnostics

    expect(diagnostics).toEqual([])
  })

  it("rejects only the default language when a multilingual synonym equals the object name", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/КакоеТоПоле/Свойства.yaml", [
      "Синоним:",
      "  ru: Какое то поле",
      "  en: Some field",
    ])

    const diagnostics = validateProject({
      projectDir,
      filePath: "Справочник/КакоеТоПоле/Свойства.yaml",
      context: mockContext,
    }).diagnostics

    expect(diagnostics).toEqual([
      expect.objectContaining({
        path: "/Синоним/ru",
      }),
    ])
  })

  it("rejects a nested form attribute title equal to the attribute name", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", "")
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", [
      "Реквизиты:",
      "  КакоеТоПоле:",
      "    Заголовок: Какое то поле",
    ])

    const diagnostics = validateProject({
      projectDir,
      filePath: "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
      context: mockContext,
    }).diagnostics

    expect(diagnostics).toEqual([
      expect.objectContaining({
        filePath: join(projectDir, "Справочник", "Товары", "Формы", "ФормаЭлемента", "Форма.yaml"),
        source: "structure",
        severity: "error",
        path: "/Реквизиты/КакоеТоПоле/Заголовок",
        message: expect.stringContaining('Поле "Заголовок" не нужно указывать'),
      }),
    ])
  })
```

- [ ] **Step 6: Run integration tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/validateProject.test.ts -t "synonym|title|languages"
```

Expected: FAIL because the new validator is not called yet.

- [ ] **Step 7: Integrate the validator into project and form validation**

Modify imports in `packages/core/metadata/validation/validateProject.ts`:

```ts
import { validateExcludedEqualNameYAML } from "./excludeIfEqualNameYAML"
```

In `validateProjectProperties`, after `owner` is computed, add the new diagnostics before unique-name and metadata-target checks:

```ts
  const equalNameValidationName =
    params.file.kind === "configuration" && typeof (imported.model as { name?: unknown }).name === "string"
      ? ((imported.model as { name: string }).name)
      : params.file.kind === "properties"
        ? params.file.owner.name
        : undefined

  return [
    ...diagnostics,
    ...validateExcludedEqualNameYAML({
      filePath: params.file.absolutePath,
      parsed,
      rule: params.file.owner.spec.rule,
      context: params.context,
      name: equalNameValidationName,
    }),
    ...validateUniqueNameScopes({
      filePath: params.file.absolutePath,
      parsed,
      model: imported.model,
      rule: params.file.owner.spec.rule,
    }),
    ...validateMetadataTargetsInModel({
      filePath: params.file.absolutePath,
      parsed,
      model: imported.model,
      rule: params.file.owner.spec.rule,
      resolver: params.metadataResolver,
      owner,
    }),
  ]
```

Modify imports in `packages/core/metadata/forms/clientApplicationForm/validate.ts`:

```ts
import { validateExcludedEqualNameYAML } from "~/metadata/validation/excludeIfEqualNameYAML"
import { ClientApplicationFormRules } from "./rules"
```

In `validateClientApplicationForm`, start diagnostics with the equal-name diagnostics after form import succeeds:

```ts
  const diagnostics = [
    ...validateExcludedEqualNameYAML({
      filePath: entry.filePath,
      parsed: entry.parsed,
      rule: ClientApplicationFormRules,
      context,
      name: params.formName,
    }),
    ...index.duplicateDiagnostics,
  ]
```

This replaces the current line:

```ts
  const diagnostics = [...index.duplicateDiagnostics]
```

- [ ] **Step 8: Run validation tests and verify they pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/excludeIfEqualNameYAML.test.ts metadata/validation/validateProject.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit Task 3**

```bash
git add packages/core/metadata/validation/excludeIfEqualNameYAML.ts packages/core/metadata/validation/excludeIfEqualNameYAML.test.ts packages/core/metadata/validation/validateProject.ts packages/core/metadata/forms/clientApplicationForm/validate.ts packages/core/metadata/validation/validateProject.test.ts
git commit -m "feat: :sparkles: запретить явный равный синоним"
```

## Task 4: Concrete File JSON Schema Hints

**Files:**
- Modify: `packages/core/metadata/context/types.ts`
- Modify: `packages/core/metadata/project/projectSpecRegistry.ts`
- Modify: `packages/core/metadata/project/projectSpecHelpers.ts`
- Modify: `packages/core/metadata/orchestration/metadataItem/toJSONSchema.ts`
- Modify: `packages/core/metadata/orchestration/property/toJSONSchema.ts`
- Modify: `packages/core/metadata/validation/projectFileSchema.ts`
- Modify: `packages/core/metadata/validation/validateProject.ts`
- Test: `packages/core/metadata/validation/projectFileSchema.test.ts`

- [ ] **Step 1: Write failing schema tests**

Add these tests to `packages/core/metadata/validation/projectFileSchema.test.ts`:

```ts
  it("rejects equal object synonym in a concrete properties file schema", () => {
    const schema = TypeCompiler.Compile(
      exportJSONSchemaForProjectFile({
        context,
        filePath: "Справочник/КакоеТоПоле/Свойства.yaml",
        mode: "inline",
      })
    )

    expect(
      validateFile({
        filePath: "Справочник/КакоеТоПоле/Свойства.yaml",
        schema,
        text: "Синоним: Какое то поле\n",
      })
    ).toEqual([expect.objectContaining({ source: "structure", severity: "error", path: "/Синоним" })])

    expect(
      validateFile({
        filePath: "Справочник/КакоеТоПоле/Свойства.yaml",
        schema,
        text: ["Синоним:", "  en: Some field"].join("\n"),
      })
    ).toEqual([])
  })

  it("keeps generic schema by type name free from concrete object-name restrictions", () => {
    const schema = TypeCompiler.Compile(
      exportJSONSchemaForSchemaName({
        context,
        name: "MetadataCatalog",
        mode: "inline",
      })
    )

    expect(
      validateFile({
        filePath: "Свойства.yaml",
        schema,
        text: "Синоним: Какое то поле\n",
      })
    ).toEqual([])
  })
```

- [ ] **Step 2: Run schema tests and verify the concrete-file test fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectFileSchema.test.ts -t "synonym|generic schema"
```

Expected: FAIL for the concrete-file schema test because schema does not yet know the item name.

- [ ] **Step 3: Add name plumbing to schema export types**

Modify `packages/core/metadata/context/types.ts`:

```ts
export interface JSONSchemaExportContext {
  mode: JSONSchemaExportMode
  refs: Set<string>
  propertySchemaOverrides?: Partial<Record<PropertyRuleType, TSchema>>
  schemaStack?: PropertyRuleType[]
  currentItemName?: string
}
```

Modify `packages/core/metadata/project/projectSpecRegistry.ts`:

```ts
export interface RegisteredProjectSpec {
  dir: string
  kind: string
  rule: MetadataItemRule
  exportSchema: (params: { context: ConfigurationContext; mode?: JSONSchemaExportMode; name?: string }) => TSchema
  importModel: (params: { context: ConfigurationContext; parsed: ParsedYaml; name: string }) => MetadataItem | undefined
  nesting?: ProjectSpecNesting
}
```

- [ ] **Step 4: Pass names through metadata item schema export**

Modify `packages/core/metadata/project/projectSpecHelpers.ts`:

```ts
export function createMetadataItemProjectSchemaExporter(rule: MetadataItemRule): RegisteredProjectSpec["exportSchema"] {
  return createProjectSchemaExporter(({ context, name }) => exportMetadataItemToJSONSchema({ context, rule, name }))
}

export function createProjectSchemaExporter(
  exporter: (params: { context: ConfigurationContext; name?: string }) => TSchema
): RegisteredProjectSpec["exportSchema"] {
  return ({ context, mode = "externalRefs", name }) => {
    const schemaContext = createJSONSchemaExportContext(context, mode)
    const namedSchemaContext =
      name === undefined
        ? schemaContext
        : {
            ...schemaContext,
            exportToJSONSchema: {
              ...schemaContext.exportToJSONSchema!,
              currentItemName: name,
            },
          }
    const schema = exporter({ context: namedSchemaContext, name })

    return mode === "externalRefs" ? attachCollectedSchemaRefs(namedSchemaContext, schema) : schema
  }
}
```

Modify `packages/core/metadata/orchestration/metadataItem/toJSONSchema.ts`:

```ts
export const exportMetadataItemToJSONSchema = <T extends MetadataItem>(params: {
  context: ConfigurationContext
  rule: MetadataItemRule
  value?: T
  name?: string
}): TSchema => {
  const { context, rule, value, name } = params

  const properties = exportPropertiesToJSONSchema({
    context,
    metadataItem: value,
    rule,
    name,
  })

  const objectSchema = Type.Object(
    {
      ...properties,
    },
    { additionalProperties: false }
  )

  const inline = findInlineProperty(rule)
  if (inline) {
    const inlineSchema = exportPropertyToJSONSchema({ context, rule: inline.prop, value: undefined, name })
    if (inlineSchema !== undefined) return inlineSchema
  }

  return objectSchema
}
```

Modify `packages/core/metadata/orchestration/property/toJSONSchema.ts`:

```ts
import { applyExcludedEqualNameYAMLToJSONSchema } from "~/metadata/helpers/excludeIfEqualNameYAML"
```

Update signatures and calls:

```ts
export const exportPropertiesToJSONSchema = <T extends MetadataItem>(params: {
  context: ConfigurationContext
  rule: MetadataItemRule
  metadataItem?: T
  name?: string
}): TSchema => {
  const { context, metadataItem, rule, name } = params
```

Inside the loop:

```ts
    const exportedValue = exportPropertyToJSONSchema({
      context,
      rule: ruleProp,
      value,
      name,
    })
```

Update `exportPropertyToJSONSchema`:

```ts
export const exportPropertyToJSONSchema = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: any
  name?: string
}): TSchema | undefined => {
```

At the end of `exportPropertyToJSONSchema`, replace the current final `return exportedValue` with:

```ts
  const schemaWithDefaults =
    defaultYAML !== undefined && exportedValue !== undefined ? excludeDefaultFromSchema(exportedValue, defaultYAML) : exportedValue

  if (schemaWithDefaults === undefined) return undefined

  return applyExcludedEqualNameYAMLToJSONSchema({
    context,
    rule,
    schema: schemaWithDefaults,
    name: params.name ?? context.exportToJSONSchema?.currentItemName,
  })
```

Keep the early `overrideSchema` and `externalRefSchema` returns unchanged; those schemas are generic and do not carry a concrete item name.

- [ ] **Step 5: Pass the project path owner name into concrete file schema export**

Modify `packages/core/metadata/validation/projectFileSchema.ts`.

Change the properties/configuration branch:

```ts
  if (resource.role === "configuration") {
    return resource.owner.spec.exportSchema({
      context: params.context,
      mode: params.mode,
    })
  }

  if (resource.role === "properties") {
    return resource.owner.spec.exportSchema({
      context: params.context,
      mode: params.mode,
      name: resource.owner.name,
    })
  }
```

Leave form schema export unchanged for now: nested record keys inside `Форма.yaml` are not known at schema construction time, so semantic validation covers them.

- [ ] **Step 6: Cache validation schemas by item name**

Modify `packages/core/metadata/validation/validateProject.ts`.

Change `ValidationSchemaCache`:

```ts
interface ValidationSchemaCache {
  form: () => CompiledSchema
  properties: (spec: ValidationProjectSpec, name: string) => CompiledSchema
}
```

Replace the `properties(spec)` method inside `createValidationSchemaCache`:

```ts
    properties(spec, name) {
      const key = `${spec.dir}\0${name}`
      const existing = propertiesSchemas.get(key)
      if (existing) return existing

      const compiled = TypeCompiler.Compile(spec.exportSchema({ context, mode: "inline", name }))
      propertiesSchemas.set(key, compiled)

      return compiled
    },
```

Update both `validateProjectProperties` calls to pass `params.file.owner.name`:

```ts
      schema: params.schemaCache.properties(params.file.owner.spec, params.file.owner.name),
```

and:

```ts
    schema: params.schemaCache.properties(params.file.owner.spec, params.file.owner.name),
```

- [ ] **Step 7: Run schema tests and verify they pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectFileSchema.test.ts metadata/helpers/excludeIfEqualNameYAML.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit Task 4**

```bash
git add packages/core/metadata/context/types.ts packages/core/metadata/project/projectSpecRegistry.ts packages/core/metadata/project/projectSpecHelpers.ts packages/core/metadata/orchestration/metadataItem/toJSONSchema.ts packages/core/metadata/orchestration/property/toJSONSchema.ts packages/core/metadata/validation/projectFileSchema.ts packages/core/metadata/validation/validateProject.ts packages/core/metadata/validation/projectFileSchema.test.ts
git commit -m "feat: :sparkles: подсказать запрет равного синонима в schema"
```

## Task 5: Full Verification And Cleanup

**Files:**
- Verify: `docs/superpowers/specs/2026-07-01-exclude-equal-name-synonym-design.md`
- Verify: all files changed in Tasks 1-4

- [ ] **Step 1: Run focused tests for the whole feature**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/helpers/excludeIfEqualNameYAML.test.ts metadata/validation/excludeIfEqualNameYAML.test.ts metadata/validation/validateProject.test.ts metadata/validation/projectFileSchema.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run the package validation-related test set**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation metadata/commonObjects/i8nText metadata/commonObjects/formattedI8nText
```

Expected: PASS.

- [ ] **Step 3: Run the full project test suite**

Run from the repository root:

```bash
pnpm test
```

Expected: PASS for all packages.

- [ ] **Step 4: Review changed files for accidental fixture edits**

Run:

```bash
git diff --stat
git diff --name-only
```

Expected: no XML fixture files are listed. Expected changed areas are helpers, validation, schema export, tests, and this plan.

- [ ] **Step 5: Commit final cleanup if any cleanup changes were needed**

If Step 4 shows only already committed task changes, skip this commit. If formatting or cleanup changes were made after Task 4, run:

```bash
git add packages/core/metadata docs/superpowers/plans/2026-07-01-exclude-equal-name-synonym.md
git commit -m "chore: :wrench: довести проверку равного синонима"
```

## Self-Review

- Spec coverage: Tasks 1, 3, and 4 cover `I8nText`, `FormattedI8nText`, YAML-key independence, default-language-only behavior, validation diagnostics, and concrete-file schema hints. Task 2 covers empty `Свойства.yaml` versus required `Конфигурация.yaml`. Task 5 covers focused and full verification.
- Scope check: one coherent subsystem, centered on `excludeIfEqualNameYAML` across export contract, validation, and schema. No unrelated metadata rules or XML fixtures are changed.
- Type consistency: helper function names are `findExcludedEqualNameYAMLOccurrence`, `applyExcludedEqualNameYAMLToJSONSchema`, and `validateExcludedEqualNameYAML` everywhere. The schema name field is `currentItemName` only inside `JSONSchemaExportContext`.
