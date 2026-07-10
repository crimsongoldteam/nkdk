# Universal Exclude Equal Name Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Вернуть универсальные JSON Schema для `excludeIfEqualNameYAML`, сохранив подсказку в `description` и строгую кодовую validation.

**Architecture:** JSON Schema больше не строит имя-зависимый `not`; она только добавляет универсальный `description` к полям с `excludeIfEqualNameYAML`. Запрет остаётся в `validateExcludedEqualNameYAML`, где известно имя объекта или элемента. `validateProject` кэширует скомпилированные схемы по стабильному ключу spec, поэтому два объекта одного вида используют одну schema.

**Tech Stack:** TypeScript, TypeBox, Vitest, pnpm, `@nakidka/core`, `@nakidka/cli`.

---

## File Structure

- `packages/core/metadata/helpers/excludeIfEqualNameYAML.ts`  
  Оставляет поиск равного значения для кодовой validation и меняет JSON Schema helper: вместо запрета добавляет универсальный `description`.

- `packages/core/metadata/helpers/excludeIfEqualNameYAML.test.ts`  
  Фиксирует, что helper schema добавляет подсказку и не запрещает конкретное значение.

- `packages/core/metadata/orchestration/property/toJSONSchema.ts`  
  Продолжает применять helper к каждому YAML-свойству, но больше не передаёт имя объекта в schema-правило.

- `packages/core/metadata/orchestration/metadataItem/toJSONSchema.ts`  
  Убирает прокидывание имени объекта в property schema export.

- `packages/core/metadata/project/projectSpecHelpers.ts`  
  Убирает `currentItemName` из JSON Schema export context.

- `packages/core/metadata/appliedObjects/metadataCatalog/toJSONSchema.ts`
- `packages/core/metadata/appliedObjects/metadataCatalog/register.ts`
- `packages/core/metadata/appliedObjects/metadataDocument/toJSONSchema.ts`
- `packages/core/metadata/appliedObjects/metadataDocument/register.ts`
- `packages/core/metadata/appliedObjects/metadataEnumeration/toJSONSchema.ts`
- `packages/core/metadata/appliedObjects/metadataEnumeration/register.ts`  
  Убирают специальное прокидывание имени объекта в schema export для объектов, где schema exporter был переопределён вручную.

- `packages/core/metadata/context/types.ts`  
  Удаляет поле `currentItemName` из `JSONSchemaExportContext`, чтобы имя объекта не было частью договора schema export.

- `packages/core/metadata/validation/projectFileSchema.test.ts`  
  Проверяет, что schema конкретного файла содержит универсальную подсказку и не содержит имя-зависимого запрета.

- `packages/core/metadata/validation/validateProject.ts`  
  Кэширует schema для свойств по spec, а не по имени объекта.

- `packages/core/metadata/validation/validateProject.test.ts`  
  Фиксирует уменьшение числа компиляций: два справочника должны использовать одну schema.

---

### Task 1: Universal schema description for `excludeIfEqualNameYAML`

**Files:**
- Modify: `packages/core/metadata/helpers/excludeIfEqualNameYAML.test.ts`
- Modify: `packages/core/metadata/validation/projectFileSchema.test.ts`
- Modify: `packages/core/metadata/helpers/excludeIfEqualNameYAML.ts`
- Modify: `packages/core/metadata/orchestration/property/toJSONSchema.ts`

- [ ] **Step 1: Write failing helper tests**

Replace the `describe("applyExcludedEqualNameYAMLToJSONSchema", ...)` block in `packages/core/metadata/helpers/excludeIfEqualNameYAML.test.ts` with:

```ts
describe("applyExcludedEqualNameYAMLToJSONSchema", () => {
  it("adds a universal description to I8nText rules without rejecting concrete values", () => {
    const schema = applyExcludedEqualNameYAMLToJSONSchema({
      rule: { type: "I8nText", yaml: "Синоним", excludeIfEqualNameYAML: true },
      schema: I8nTextJSONSchema,
    })

    expect((schema as { description?: string }).description).toBe(EXCLUDE_IF_EQUAL_NAME_YAML_DESCRIPTION)

    const compiled = TypeCompiler.Compile(schema)
    expect(compiled.Check("Какое то поле")).toBe(true)
    expect(compiled.Check({ ru: "Какое то поле", en: "Some field" })).toBe(true)
    expect(compiled.Check({ en: "Some field" })).toBe(true)
  })

  it("adds a universal description to FormattedI8nText rules without rejecting concrete values", () => {
    const schema = applyExcludedEqualNameYAMLToJSONSchema({
      rule: { type: "FormattedI8nText", yaml: "Заголовок", excludeIfEqualNameYAML: true },
      schema: FormattedI8nTextJSONSchema,
    })

    expect((schema as { description?: string }).description).toBe(EXCLUDE_IF_EQUAL_NAME_YAML_DESCRIPTION)

    const compiled = TypeCompiler.Compile(schema)
    expect(compiled.Check({ Текст: "Какое то поле" })).toBe(true)
    expect(compiled.Check({ Текст: { ru: "Какое то поле", en: "Some field" } })).toBe(true)
    expect(compiled.Check({ Форматированный: "Истина", Текст: { en: "Some field" } })).toBe(true)
  })

  it("keeps schemas without excludeIfEqualNameYAML unchanged", () => {
    const schema = applyExcludedEqualNameYAMLToJSONSchema({
      rule: { type: "I8nText", yaml: "Синоним" },
      schema: I8nTextJSONSchema,
    })

    expect(schema).toBe(I8nTextJSONSchema)
  })
})
```

Update the import from `./excludeIfEqualNameYAML` in the same file:

```ts
import {
  EXCLUDE_IF_EQUAL_NAME_YAML_DESCRIPTION,
  applyExcludedEqualNameYAMLToJSONSchema,
  findExcludedEqualNameYAMLOccurrence,
} from "./excludeIfEqualNameYAML"
```

- [ ] **Step 2: Write failing project schema test**

In `packages/core/metadata/validation/projectFileSchema.test.ts`, add this import:

```ts
import { EXCLUDE_IF_EQUAL_NAME_YAML_DESCRIPTION } from "~/metadata/helpers/excludeIfEqualNameYAML"
```

Replace the test named `"rejects equal object synonym in a concrete properties file schema"` with:

```ts
  it("describes equal-name exclusion without making the schema name-dependent", () => {
    const schema = exportJSONSchemaForProjectFile({
      context,
      filePath: "Справочник/КакоеТоПоле/Свойства.yaml",
      mode: "inline",
    })
    const synonymSchema = propertySchema(schema, "Синоним")

    expect(synonymSchema.description).toBe(EXCLUDE_IF_EQUAL_NAME_YAML_DESCRIPTION)
    expect(JSON.stringify(synonymSchema)).not.toContain("Какое то поле")
    expect(JSON.stringify(synonymSchema)).not.toContain('"not"')

    const compiled = TypeCompiler.Compile(schema)
    expect(
      validateFile({
        filePath: "Справочник/КакоеТоПоле/Свойства.yaml",
        schema: compiled,
        text: "Синоним: Какое то поле\n",
      })
    ).toEqual([])
  })
```

Add this helper near the bottom of `projectFileSchema.test.ts`, before `describe("exportJSONSchemaForSchemaName", ...)` if that describe exists, or before the last helper functions:

```ts
function propertySchema(schema: unknown, key: string): { description?: string } {
  const properties = (schema as { properties?: Record<string, unknown> }).properties
  const property = properties?.[key]
  if (typeof property !== "object" || property === null) {
    throw new Error(`Expected schema property "${key}"`)
  }

  return property as { description?: string }
}
```

- [ ] **Step 3: Run schema tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/helpers/excludeIfEqualNameYAML.test.ts metadata/validation/projectFileSchema.test.ts --no-isolate
```

Expected: FAIL. The helper test should report missing `description` or rejected equal values. The project schema test should fail because the current schema still contains the name-dependent `not`.

- [ ] **Step 4: Implement universal description helper**

Replace the top import and `ApplyExcludedEqualNameYAMLToJSONSchemaParams` / `applyExcludedEqualNameYAMLToJSONSchema` section in `packages/core/metadata/helpers/excludeIfEqualNameYAML.ts` with this shape:

```ts
import type { TSchema } from "@sinclair/typebox"
import type { ConfigurationContext } from "~/metadata/context/types"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { canConvertToPascalCase } from "./canConvertToPascalCase"
```

Add the exported description constant after `type YamlPath`:

```ts
export const EXCLUDE_IF_EQUAL_NAME_YAML_DESCRIPTION =
  "Не указывайте это поле, если значение совпадает с именем объекта/элемента после нормализации пробелов и PascalCase."
```

Change the schema params interface:

```ts
export interface ApplyExcludedEqualNameYAMLToJSONSchemaParams {
  rule: PropertyRule
  schema: TSchema
}
```

Replace `applyExcludedEqualNameYAMLToJSONSchema` with:

```ts
export function applyExcludedEqualNameYAMLToJSONSchema(
  params: ApplyExcludedEqualNameYAMLToJSONSchemaParams
): TSchema {
  const { rule, schema } = params
  if (!isExcludeIfEqualNameYAMLTextRule(rule)) return schema

  return withDescription(schema, EXCLUDE_IF_EQUAL_NAME_YAML_DESCRIPTION)
}
```

Remove the old `forbiddenI8nTextSchema` function and add:

```ts
function withDescription(schema: TSchema, description: string): TSchema {
  const currentDescription = (schema as { description?: unknown }).description
  if (typeof currentDescription === "string") {
    if (currentDescription.includes(description)) return schema

    return { ...schema, description: `${currentDescription}\n\n${description}` } as TSchema
  }

  return { ...schema, description } as TSchema
}
```

In `packages/core/metadata/orchestration/property/toJSONSchema.ts`, change the final call to:

```ts
  return applyExcludedEqualNameYAMLToJSONSchema({
    rule,
    schema: schemaWithDefaults,
  })
```

- [ ] **Step 5: Run schema tests and verify they pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/helpers/excludeIfEqualNameYAML.test.ts metadata/validation/projectFileSchema.test.ts --no-isolate
```

Expected: PASS. Equal concrete values are accepted by JSON Schema, and `description` is present.

- [ ] **Step 6: Commit schema description change**

Run:

```bash
git add packages/core/metadata/helpers/excludeIfEqualNameYAML.ts packages/core/metadata/helpers/excludeIfEqualNameYAML.test.ts packages/core/metadata/orchestration/property/toJSONSchema.ts packages/core/metadata/validation/projectFileSchema.test.ts
git commit -m "fix: :bug: вернуть универсальную schema equal name"
```

---

### Task 2: Stable validation schema cache

**Files:**
- Modify: `packages/core/metadata/validation/validateProject.test.ts`
- Modify: `packages/core/metadata/validation/validateProject.ts`
- Modify: `packages/core/metadata/context/types.ts`
- Modify: `packages/core/metadata/project/projectSpecHelpers.ts`
- Modify: `packages/core/metadata/orchestration/metadataItem/toJSONSchema.ts`
- Modify: `packages/core/metadata/orchestration/property/toJSONSchema.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataCatalog/toJSONSchema.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataCatalog/register.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataDocument/toJSONSchema.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataDocument/register.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataEnumeration/toJSONSchema.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataEnumeration/register.ts`

- [ ] **Step 1: Update the compile-count test**

In `packages/core/metadata/validation/validateProject.test.ts`, change the final assertion in `"compiles each validation schema once per project validation run"`:

```ts
    expect(compile).toHaveBeenCalledTimes(3)
```

This fixture has two catalog properties files, one document properties file, and two form files. Expected compiles after the fix: catalog schema once, document schema once, form schema once.

- [ ] **Step 2: Run the validation cache test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/validateProject.test.ts --no-isolate -t "compiles each validation schema once per project validation run"
```

Expected: FAIL with 4 calls instead of 3, because the current cache key includes the object name.

- [ ] **Step 3: Change `validateProject` cache key to spec-only**

In `packages/core/metadata/validation/validateProject.ts`, change the cache interface:

```ts
interface ValidationSchemaCache {
  form: () => CompiledSchema
  properties: (spec: ValidationProjectSpec) => CompiledSchema
}
```

Replace the `properties` method in `createValidationSchemaCache`:

```ts
    properties(spec) {
      const key = spec.dir
      const existing = propertiesSchemas.get(key)
      if (existing) return existing

      const compiled = TypeCompiler.Compile(spec.exportSchema({ context, mode: "inline" }))
      propertiesSchemas.set(key, compiled)

      return compiled
    },
```

Update both call sites in `validateProjectProperties`:

```ts
      schema: params.schemaCache.properties(params.file.owner.spec),
```

and:

```ts
    schema: params.schemaCache.properties(params.file.owner.spec),
```

- [ ] **Step 4: Remove the name channel from JSON Schema export context**

In `packages/core/metadata/context/types.ts`, remove this line from `JSONSchemaExportContext`:

```ts
  currentItemName?: string
```

In `packages/core/metadata/project/projectSpecHelpers.ts`, replace `createMetadataItemProjectSchemaExporter` and `createProjectSchemaExporter` with:

```ts
export function createMetadataItemProjectSchemaExporter(rule: MetadataItemRule): RegisteredProjectSpec["exportSchema"] {
  return createProjectSchemaExporter(({ context }) => exportMetadataItemToJSONSchema({ context, rule }))
}

export function createProjectSchemaExporter(
  exporter: (params: { context: ConfigurationContext }) => TSchema
): RegisteredProjectSpec["exportSchema"] {
  return ({ context, mode = "externalRefs" }) => {
    const schemaContext = createJSONSchemaExportContext(context, mode)
    const schema = exporter({ context: schemaContext })

    return mode === "externalRefs" ? attachCollectedSchemaRefs(schemaContext, schema) : schema
  }
}
```

In `packages/core/metadata/orchestration/metadataItem/toJSONSchema.ts`, remove `name` from the function params and calls:

```ts
export const exportMetadataItemToJSONSchema = <T extends MetadataItem>(params: {
  context: ConfigurationContext
  rule: MetadataItemRule
  value?: T
}): TSchema => {
  const { context, rule, value } = params

  const properties = exportPropertiesToJSONSchema({
    context,
    metadataItem: value,
    rule,
  })

  const objectSchema = Type.Object(
    {
      ...properties,
    },
    { additionalProperties: false }
  )

  const inline = findInlineProperty(rule)
  if (inline) {
    const inlineSchema = exportPropertyToJSONSchema({ context, rule: inline.prop, value: undefined })
    if (inlineSchema !== undefined) return inlineSchema
  }

  return objectSchema
}
```

In `packages/core/metadata/orchestration/property/toJSONSchema.ts`, remove `name` from `exportPropertiesToJSONSchema` params and from the nested call:

```ts
export const exportPropertiesToJSONSchema = <T extends MetadataItem>(params: {
  context: ConfigurationContext
  rule: MetadataItemRule
  metadataItem?: T
}): TSchema => {
  const { context, metadataItem, rule } = params
```

and:

```ts
    const exportedValue = exportPropertyToJSONSchema({
      context,
      rule: ruleProp,
      value,
    })
```

Also remove `name?: string` from `exportPropertyToJSONSchema` params:

```ts
export const exportPropertyToJSONSchema = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: any
}): TSchema | undefined => {
```

In `packages/core/metadata/appliedObjects/metadataCatalog/toJSONSchema.ts`, replace the exporter with:

```ts
export const exportMetadataCatalogToJSONSchema = (params: { context: ConfigurationContext }): TSchema => {
  const { context } = params

  return exportMetadataItemToJSONSchema({
    context,
    rule: MetadataCatalogRules,
  })
}
```

In `packages/core/metadata/appliedObjects/metadataDocument/toJSONSchema.ts`, replace the exporter with:

```ts
export const exportMetadataDocumentToJSONSchema = (params: { context: ConfigurationContext }): TSchema => {
  const { context } = params

  return exportMetadataItemToJSONSchema({
    context,
    rule: MetadataDocumentRules,
  })
}
```

In `packages/core/metadata/appliedObjects/metadataEnumeration/toJSONSchema.ts`, replace the exporter with:

```ts
export const exportMetadataEnumerationToJSONSchema = (params: { context: ConfigurationContext }): TSchema => {
  const { context } = params

  return exportMetadataItemToJSONSchema({
    context,
    rule: MetadataEnumerationRules,
  })
}
```

In `packages/core/metadata/appliedObjects/metadataCatalog/register.ts`, change the project spec exporter to:

```ts
  exportSchema: createProjectSchemaExporter(({ context }) => exportMetadataCatalogToJSONSchema({ context })),
```

In `packages/core/metadata/appliedObjects/metadataDocument/register.ts`, change the project spec exporter to:

```ts
  exportSchema: createProjectSchemaExporter(({ context }) => exportMetadataDocumentToJSONSchema({ context })),
```

In `packages/core/metadata/appliedObjects/metadataEnumeration/register.ts`, change the project spec exporter to:

```ts
  exportSchema: createProjectSchemaExporter(({ context }) => exportMetadataEnumerationToJSONSchema({ context })),
```

- [ ] **Step 5: Run validation cache test and verify it passes**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/validateProject.test.ts --no-isolate -t "compiles each validation schema once per project validation run"
```

Expected: PASS with exactly 3 calls to `TypeCompiler.Compile`.

- [ ] **Step 6: Run TypeScript check for core**

Run:

```bash
pnpm --filter @nakidka/core type-check
```

Expected: PASS. If TypeScript reports a remaining `name` or `currentItemName` reference, remove that reference and rerun this command.

- [ ] **Step 7: Commit validation cache change**

Run:

```bash
git add packages/core/metadata/context/types.ts packages/core/metadata/orchestration/metadataItem/toJSONSchema.ts packages/core/metadata/orchestration/property/toJSONSchema.ts packages/core/metadata/project/projectSpecHelpers.ts packages/core/metadata/validation/validateProject.ts packages/core/metadata/validation/validateProject.test.ts packages/core/metadata/appliedObjects/metadataCatalog/toJSONSchema.ts packages/core/metadata/appliedObjects/metadataCatalog/register.ts packages/core/metadata/appliedObjects/metadataDocument/toJSONSchema.ts packages/core/metadata/appliedObjects/metadataDocument/register.ts packages/core/metadata/appliedObjects/metadataEnumeration/toJSONSchema.ts packages/core/metadata/appliedObjects/metadataEnumeration/register.ts
git commit -m "perf: :zap: кэшировать validation schema по spec"
```

---

### Task 3: Regression verification

**Files:**
- No source files changed in this task.

- [ ] **Step 1: Run focused tests for changed behavior**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/helpers/excludeIfEqualNameYAML.test.ts metadata/validation/projectFileSchema.test.ts metadata/validation/validateProject.test.ts --no-isolate
```

Expected: PASS. This covers helper behavior, schema export behavior, code validation, and schema compile-count regression.

- [ ] **Step 2: Run core type check**

Run:

```bash
pnpm --filter @nakidka/core type-check
```

Expected: PASS.

- [ ] **Step 3: Run full project tests**

Run from repository root:

```bash
pnpm test
```

Expected: PASS for all packages.

- [ ] **Step 4: Run full validation against `/Users/nikita/git/nkdk-yaml` without heap increase**

Run:

```bash
/usr/bin/time -p pnpm --filter @nakidka/cli dev validate /Users/nikita/git/nkdk-yaml > /tmp/nkdk-validate-nkdk-yaml-universal-schema.log 2>&1
```

Expected: process exits normally with code `0` or `1`, and `/tmp/nkdk-validate-nkdk-yaml-universal-schema.log` contains `summary:`. The log must not contain `JavaScript heap out of memory`, `Ineffective mark-compacts near heap limit`, or `Exit status 134`.

If Codex sandbox reports `listen EPERM` for the `tsx` pipe, rerun the same command with escalated permissions. That is the known sandbox limitation from the earlier timing run, not a validation result.

- [ ] **Step 5: Inspect validation timing log**

Run:

```bash
rg -n "summary:|JavaScript heap out of memory|Ineffective mark-compacts|Exit status 134|real|user|sys" /tmp/nkdk-validate-nkdk-yaml-universal-schema.log
```

Expected: `summary:` plus `real`, `user`, and `sys` timing lines are present. No out-of-memory lines are present.
