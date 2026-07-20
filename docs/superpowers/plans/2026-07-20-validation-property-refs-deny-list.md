# Validation Property Refs Deny-List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make validation JSON Schema property refs the default for all reusable property types, leaving inline only for explicit exceptions.

**Architecture:** Keep public `externalRefs`/`inline` schema export behavior unchanged. In `validationPropertyRefs: true` mode, `exportPropertyToJSONSchema` first builds the completed property schema, then `jsonSchemaRefs` either stores it under a validation `$ref` key or leaves it inline when the rule is an explicit inline exception. Special type-level key functions remain for `boolean`, `SystemEnumeration`, and DCS wrappers; the shared fallback creates stable `<type>/base` and `without-*` keys for ordinary property types.

**Tech Stack:** TypeScript, TypeBox, AJV 2020 standalone, Vitest, pnpm.

## Global Constraints

- Изменение касается только схем validation. Публичные режимы `nkdk schema --inline` и MCP `mode=inline` не меняются.
- В validation-режиме `validationPropertyRefs: true` отсутствие специальной регистрации больше не означает inline.
- Inline остаются только как явные исключения: `DataPath`, `Events`, metadata-target/link/field-подобные свойства, `MetadataValue`, `TypeDescription` с `allowedTypes`.
- `SettingsParameterValue` сохраняет YAML-имя в ключе; не-ASCII сегменты URI-кодируются, а не заменяются хэшем.
- URI-кодирование YAML-сегмента применяется и для public schema names с slash-сегментами, иначе AJV не разрешает refs с кириллицей. `encodeValidationSchemaKey` должен быть idempotent, чтобы validation rewrite не кодировал `%` повторно.
- `DcsExplicitSystemEnumerationValue` временно должен быть `Any` и не проверять структуру значения через JSON Schema.
- `inlineRefs: false` остаётся в standalone-генераторе.
- Перед завершением реализации выполняются точечные тесты validation и полный `pnpm test`.
- Память измеряется через compiled standalone path командой `node .agents/skills/validation-profile/validation-profile.mjs packages/core/metadata/validation/__fixtures__/project-with-form --runs 5 --timing`.

---

## File Structure

- Modify `packages/core/metadata/orchestration/jsonSchemaRefs.ts`
  - Owns validation ref key encoding, validation schema registration, default ref fallback, and inline exception detection.
- Modify `packages/core/metadata/orchestration/property/toJSONSchema.ts`
  - Keeps property schema construction order: override/external refs for public mode, type export, implicit value exclusion, equal-name description, then validation ref decision.
- Modify `packages/core/metadata/systemEnumerations/toJSONSchema.ts`
  - Keep existing `SystemEnumeration` special key; update only if helper signatures change.
- Modify `packages/core/metadata/commonObjects/boolean/toJSONSchema.ts`
  - Keep existing `boolean` special key; update only if helper signatures change.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toJSONSchema.ts`
  - Change DCS explicit system enumeration schema to `Type.Any()`.
  - Update `MetadataDcsMetadataValue` key format from underscore names to slash-separated ASCII-safe validation keys.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toJSONSchema.ts`
  - Update `SettingsParameterValue` key format to keep the URI-encoded YAML segment in public and validation keys, while keeping a separate local TypeBox `$defs` key for cyclic schemas.
- Modify `packages/core/metadata/orchestration/jsonSchemaRefs.test.ts`
  - Unit tests for default validation ref fallback, inline exceptions, URI encoding, and `string`/`number` implicit keys.
- Modify `packages/core/metadata/validation/schemaRegistry.test.ts`
  - Integration tests against real form schemas: `Color`, `Font`, `Picture`, `I8nText`, `number`, `string`, `DataPath`, `Events`, and `SettingsParameterValue`.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toJSONSchema.test.ts`
  - Tests that explicit DCS system enumeration objects are accepted as `Any`.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toJSONSchema.test.ts`
  - Tests for `SettingsParameterValue` validation ref key including URI-encoded YAML name.
- Modify `docs/superpowers/specs/2026-07-20-validation-external-property-schemas-design.md`
  - Append final measurement results after implementation.

---

### Task 1: Default validation ref fallback and inline exception contract

**Files:**
- Modify: `packages/core/metadata/orchestration/jsonSchemaRefs.ts`
- Modify: `packages/core/metadata/orchestration/property/toJSONSchema.ts`
- Test: `packages/core/metadata/orchestration/jsonSchemaRefs.test.ts`

**Interfaces:**
- Consumes:
  - `PropertyRule` from `packages/core/metadata/orchestration/property/types.ts`
  - `TSchema` from `typebox`
  - existing `getTypeRule(rule.type, "validationSchemaRef")`
- Produces:
  - `exportValidationPropertyRefSchema(params: { context: ConfigurationContext; rule: PropertyRule; schema: TSchema }): TSchema | undefined`
  - `isValidationInlinePropertyRule(rule: PropertyRule): boolean`
  - `defaultValidationSchemaRefKey(params: { rule: PropertyRule }): string | undefined`
  - `validationSchemaRefName(context: ConfigurationContext, key: string): string` remains private and continues URI-encoding slash-separated key segments.

- [ ] **Step 1: Write failing tests for default refs and inline exceptions**

Append these tests to `packages/core/metadata/orchestration/jsonSchemaRefs.test.ts` inside `describe("jsonSchemaRefs", () => { ... })`:

```ts
  it("exports default validation refs for reusable property types without opt-in registration", () => {
    registerTypeRule("TestReusableProperty" as any, "exportToJSONSchema", () =>
      Type.Object({
        Значение: Type.String(),
      })
    )

    const context = createJSONSchemaExportContext(baseContext, "inline", {
      validationPropertyRefs: true,
    })
    const schema = exportPropertyToJSONSchema({
      context,
      rule: { type: "TestReusableProperty" as any },
      value: undefined,
    })

    expect(schema).toEqual({ $ref: "nkdk://schema/validation/2.20/ru/TestReusableProperty/base" })
    expect(attachCollectedSchemaRefs(context, Type.Object({}))).toMatchObject({
      "x-nkdk-schemaRefs": ["nkdk://schema/validation/2.20/ru/TestReusableProperty/base"],
    })
    expect(getValidationSchemaRef("nkdk://schema/validation/2.20/ru/TestReusableProperty/base")).toEqual({
      type: "object",
      properties: {
        Значение: { type: "string" },
      },
      required: ["Значение"],
    })
  })

  it("keeps explicit validation inline exceptions inline", () => {
    registerTypeRule("DataPath", "exportToJSONSchema", () => Type.String({ pattern: "^.*$" }))
    registerTypeRule("Events", "exportToJSONSchema", () =>
      Type.Object(
        {
          ПриОткрытии: Type.Optional(Type.String()),
        },
        { additionalProperties: false }
      )
    )

    const context = createJSONSchemaExportContext(baseContext, "inline", {
      validationPropertyRefs: true,
    })

    expect(
      exportPropertyToJSONSchema({
        context,
        rule: { type: "DataPath", yaml: "ПутьКДанным" },
        value: undefined,
      })
    ).toEqual({ type: "string", pattern: "^.*$" })
    expect(
      exportPropertyToJSONSchema({
        context,
        rule: { type: "Events", yaml: "События" },
        value: undefined,
      })
    ).toEqual({
      type: "object",
      properties: {
        ПриОткрытии: { type: "string" },
      },
      additionalProperties: false,
    })
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @nkdk/core test -- metadata/orchestration/jsonSchemaRefs.test.ts
```

Expected: the first new test fails because `TestReusableProperty` remains inline; the second may pass for the wrong reason until default fallback is implemented.

- [ ] **Step 3: Implement the inline exception predicate**

In `packages/core/metadata/orchestration/jsonSchemaRefs.ts`, add this function near `exportValidationPropertyRefSchema`:

```ts
export function isValidationInlinePropertyRule(rule: PropertyRule): boolean {
  if (rule.type === "DataPath" || rule.type === "Events") return true

  if (
    rule.type === "MetadataItemLink" ||
    rule.type === "MetadataItemLinks" ||
    rule.type === "MetadataField" ||
    rule.type === "MetadataFields" ||
    rule.type === "MetadataObjectRefCollection" ||
    rule.type === "MetadataValue"
  ) {
    return true
  }

  if (rule.type === "string" && rule.metadataTarget !== undefined) return true
  if (rule.type === "TypeDescription" && rule.allowedTypes !== undefined) return true

  return false
}
```

- [ ] **Step 4: Implement default validation ref keys**

In `packages/core/metadata/orchestration/jsonSchemaRefs.ts`, add:

```ts
export function defaultValidationSchemaRefKey(params: { rule: PropertyRule }): string | undefined {
  const { rule } = params
  if (typeof rule.type !== "string" || rule.type.length === 0) return undefined
  return `${rule.type}/base`
}
```

Then replace `exportValidationPropertyRefSchema` with:

```ts
export function exportValidationPropertyRefSchema(params: {
  context: ConfigurationContext
  rule: PropertyRule
  schema: TSchema
}): TSchema | undefined {
  const { context, rule, schema } = params
  if (context.exportToJSONSchema?.validationPropertyRefs !== true) return undefined
  if (isValidationInlinePropertyRule(rule)) return undefined

  const validationSchemaRef = getTypeRule(rule.type, "validationSchemaRef")
  const key = validationSchemaRef?.(params) ?? defaultValidationSchemaRefKey({ rule })
  if (key === undefined) return undefined

  const name = validationSchemaRefName(context, key)
  validationSchemas.set(name, schema)
  collectSchemaRefsToContext(context, rawJSONSchema({ $ref: name }))
  return rawJSONSchema({ $ref: name })
}
```

- [ ] **Step 5: Run tests to verify task passes**

Run:

```bash
pnpm --filter @nkdk/core test -- metadata/orchestration/jsonSchemaRefs.test.ts
```

Expected: all tests in `jsonSchemaRefs.test.ts` pass.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/orchestration/jsonSchemaRefs.ts packages/core/metadata/orchestration/jsonSchemaRefs.test.ts
git commit -m "feat: :sparkles: добавить refs validation-свойств по умолчанию"
```

---

### Task 2: Stable validation keys for implicit scalar exclusions

**Files:**
- Modify: `packages/core/metadata/commonObjects/boolean/toJSONSchema.ts`
- Modify: `packages/core/metadata/commonObjects/number/toJSONSchema.ts`
- Modify: `packages/core/metadata/commonObjects/string/toJSONSchema.ts`
- Test: `packages/core/metadata/orchestration/jsonSchemaRefs.test.ts`
- Test: `packages/core/metadata/validation/schemaRegistry.test.ts`

**Interfaces:**
- Consumes:
  - `ValidationSchemaRefFn` receives the completed schema after implicit exclusion.
- Produces:
  - `numberValidationSchemaRef({ rule }): "number/base" | "number/without-<number>"`
  - `stringValidationSchemaRef({ rule }): "string/base" | "string/without-empty" | undefined`
  - existing `booleanValidationSchemaRef` continues returning `boolean/base`, `boolean/without-true`, `boolean/without-false`.

- [ ] **Step 1: Write failing unit tests for scalar keys**

Append to `packages/core/metadata/orchestration/jsonSchemaRefs.test.ts`:

```ts
  it("uses stable scalar validation keys for implicit values", () => {
    const context = createJSONSchemaExportContext(baseContext, "inline", {
      excludeImplicitValueYAML: true,
      validationPropertyRefs: true,
    })

    const numberSchema = exportPropertyToJSONSchema({
      context,
      rule: { type: "number", implicitValueYAML: 0 },
      value: undefined,
    })
    const stringSchema = exportPropertyToJSONSchema({
      context,
      rule: { type: "string", implicitValueYAML: "" },
      value: undefined,
    })

    expect(numberSchema).toEqual({ $ref: "nkdk://schema/validation/2.20/ru/number/without-0" })
    expect(stringSchema).toEqual({ $ref: "nkdk://schema/validation/2.20/ru/string/without-empty" })
    expect(getValidationSchemaRef("nkdk://schema/validation/2.20/ru/number/without-0")).toMatchObject({
      allOf: [{ type: "number" }, { not: { type: "number", const: 0 } }],
    })
    expect(getValidationSchemaRef("nkdk://schema/validation/2.20/ru/string/without-empty")).toMatchObject({
      allOf: [{ type: "string" }, { not: { type: "string", const: "" } }],
    })
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @nkdk/core test -- metadata/orchestration/jsonSchemaRefs.test.ts
```

Expected: fails because `number` and `string` currently use fallback `number/base` and `string/base` or remain inline.

- [ ] **Step 3: Add `number` validationSchemaRef**

In `packages/core/metadata/commonObjects/number/toJSONSchema.ts`, add after the existing `registerTypeRule("number", "exportToJSONSchema", exportNumberToJSONSchema)`:

```ts
registerTypeRule("number", "validationSchemaRef", ({ rule }) => {
  const implicit = rule.implicitValueYAML
  return typeof implicit === "number" ? `number/without-${implicit}` : "number/base"
})
```

- [ ] **Step 4: Add `string` validationSchemaRef**

In `packages/core/metadata/commonObjects/string/toJSONSchema.ts`, add after the existing `registerTypeRule("string", "exportToJSONSchema", exportStringToJSONSchema)`:

```ts
registerTypeRule("string", "validationSchemaRef", ({ rule }) => {
  if (rule.metadataTarget !== undefined) return undefined
  return rule.implicitValueYAML === "" ? "string/without-empty" : "string/base"
})
```

- [ ] **Step 5: Add integration assertions for real schemas**

In `packages/core/metadata/validation/schemaRegistry.test.ts`, update `it("uses validation refs only for reusable schemas", () => { ... })` to assert scalar refs:

```ts
    const inputFieldWithScalars = graph.schemas[`${prefix}InputField`] as {
      properties?: {
        Высота?: { $ref?: string }
        Маска?: { $ref?: string }
      }
    }

    expect(inputFieldWithScalars.properties?.Высота).toMatchObject({ $ref: `${prefix}number/without-0` })
    expect(inputFieldWithScalars.properties?.Маска).toMatchObject({ $ref: `${prefix}string/base` })
    expect(graph.schemas[`${prefix}number/without-0`]).toMatchObject({ $id: `${prefix}number/without-0` })
    expect(graph.schemas[`${prefix}string/base`]).toMatchObject({ $id: `${prefix}string/base` })
```

- [ ] **Step 6: Run tests to verify task passes**

Run:

```bash
pnpm --filter @nkdk/core test -- metadata/orchestration/jsonSchemaRefs.test.ts metadata/validation/schemaRegistry.test.ts
```

Expected: both test files pass.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/commonObjects/number/toJSONSchema.ts packages/core/metadata/commonObjects/string/toJSONSchema.ts packages/core/metadata/orchestration/jsonSchemaRefs.test.ts packages/core/metadata/validation/schemaRegistry.test.ts
git commit -m "feat: :sparkles: добавить ключи refs для scalar validation"
```

---

### Task 3: Reusable form property refs and real inline exceptions

**Files:**
- Modify: `packages/core/metadata/validation/schemaRegistry.test.ts`
- Modify only if tests reveal a missing exception: `packages/core/metadata/orchestration/jsonSchemaRefs.ts`

**Interfaces:**
- Consumes:
  - default ref fallback from Task 1
  - scalar special keys from Task 2
- Produces:
  - Real form schemas use refs for `Color`, `Font`, `Picture`, `I8nText`, `UserVisible`, `ChoiceList`, `Border`.
  - Real form schemas keep inline for `DataPath` and `Events`.

- [ ] **Step 1: Write failing integration test for reusable form property refs**

Append to `packages/core/metadata/validation/schemaRegistry.test.ts`:

```ts
  it("exports reusable form property types as validation refs by default", () => {
    const graph = exportJSONSchemaGraph({
      context,
      validationPropertyRefs: true,
      roots: [{ key: "commonForm", name: "MetadataCommonForm" }],
    })
    const prefix = "nkdk://schema/validation/2.20/ru/"
    const inputField = graph.schemas[`${prefix}InputField`] as {
      properties?: Record<string, { $ref?: string }>
    }

    expect(inputField.properties?.ЦветФона).toMatchObject({ $ref: `${prefix}Color/base` })
    expect(inputField.properties?.ЦветТекста).toMatchObject({ $ref: `${prefix}Color/base` })
    expect(inputField.properties?.Шрифт).toMatchObject({ $ref: `${prefix}Font/base` })
    expect(inputField.properties?.КартинкаКнопкиВыбора).toMatchObject({ $ref: `${prefix}Picture/base` })
    expect(inputField.properties?.Заголовок).toMatchObject({ $ref: `${prefix}I8nText/base` })
    expect(inputField.properties?.Использование).toMatchObject({ $ref: `${prefix}UserVisible/base` })
    expect(inputField.properties?.СписокВыбора).toMatchObject({ $ref: `${prefix}ChoiceList/base` })

    expect(graph.schemas[`${prefix}Color/base`]).toMatchObject({ $id: `${prefix}Color/base` })
    expect(graph.schemas[`${prefix}Font/base`]).toMatchObject({ $id: `${prefix}Font/base` })
    expect(graph.schemas[`${prefix}Picture/base`]).toMatchObject({ $id: `${prefix}Picture/base` })
    expect(graph.schemas[`${prefix}I8nText/base`]).toMatchObject({ $id: `${prefix}I8nText/base` })
  })

  it("keeps DataPath and Events inline in validation schemas", () => {
    const graph = exportJSONSchemaGraph({
      context,
      validationPropertyRefs: true,
      roots: [{ key: "commonForm", name: "MetadataCommonForm" }],
    })
    const prefix = "nkdk://schema/validation/2.20/ru/"
    const clientForm = graph.schemas[`${prefix}ClientApplicationForm`] as {
      properties?: { События?: { $ref?: string } }
    }
    const inputField = graph.schemas[`${prefix}InputField`] as {
      properties?: { ПутьКДанным?: { $ref?: string } }
    }

    expect(clientForm.properties?.События?.$ref).toBeUndefined()
    expect(inputField.properties?.ПутьКДанным?.$ref).toBeUndefined()
    expect(JSON.stringify(inputField.properties?.ПутьКДанным)).toContain("type")
    expect(JSON.stringify(clientForm.properties?.События)).toContain("properties")
  })
```

- [ ] **Step 2: Run tests to verify they fail before Task 1/2 or pass after them**

Run:

```bash
pnpm --filter @nkdk/core test -- metadata/validation/schemaRegistry.test.ts
```

Expected before implementation: reusable property assertions fail because `Color`, `Font`, `Picture`, etc. are inline. Expected after Tasks 1-2: pass or expose a missing inline exception.

- [ ] **Step 3: If a metadata-target/link-like type became ref incorrectly, add it to inline exceptions**

If the test output or schema graph shows refs for one of the agreed inline groups, update `isValidationInlinePropertyRule` in `packages/core/metadata/orchestration/jsonSchemaRefs.ts` so it contains this exact body:

```ts
export function isValidationInlinePropertyRule(rule: PropertyRule): boolean {
  if (rule.type === "DataPath" || rule.type === "Events") return true

  if (
    rule.type === "MetadataItemLink" ||
    rule.type === "MetadataItemLinks" ||
    rule.type === "MetadataField" ||
    rule.type === "MetadataFields" ||
    rule.type === "MetadataObjectRefCollection" ||
    rule.type === "MetadataValue"
  ) {
    return true
  }

  if (rule.type === "string" && rule.metadataTarget !== undefined) return true
  if (rule.type === "TypeDescription" && rule.allowedTypes !== undefined) return true

  return false
}
```

- [ ] **Step 4: Run tests to verify task passes**

Run:

```bash
pnpm --filter @nkdk/core test -- metadata/validation/schemaRegistry.test.ts
```

Expected: `schemaRegistry.test.ts` passes.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/validation/schemaRegistry.test.ts packages/core/metadata/orchestration/jsonSchemaRefs.ts
git commit -m "test: :white_check_mark: покрыть refs свойств форм validation"
```

---

### Task 4: DCS validation keys and temporary Any for explicit system enumeration

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toJSONSchema.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toJSONSchema.ts`
- Test: `packages/core/metadata/validation/schemaRegistry.test.ts`

**Interfaces:**
- Consumes:
  - `schemaRef(name: string): TSchema`
  - `registerProjectJSONSchema(name: string, exporter: SchemaExporter): void`
  - URI segment encoding from `encodeValidationSchemaKey`
- Produces:
  - `dcsMetadataValueSchemaName(rule: DcsMetadataValuePropertyRule): string`
  - `settingsParameterValueSchemaKey(rule: SettingsParameterValuePropertyRule): string`
  - `DcsExplicitSystemEnumerationValue` registered as `Type.Any()`.

- [ ] **Step 1: Write failing validation graph test for DCS explicit system enumeration Any**

In `packages/core/metadata/validation/schemaRegistry.test.ts`, assert `DcsExplicitSystemEnumerationValue` is materialized as `Any` only in validation graph:

```ts
expect(graph.schemas[`${prefix}DcsExplicitSystemEnumerationValue`]).toEqual({
  $id: `${prefix}DcsExplicitSystemEnumerationValue`,
})
```

Keep the existing inline `dcsMetadataValue/toJSONSchema.test.ts` strict; this change is validation-only.

- [ ] **Step 2: Write failing integration test for URI-encoded SettingsParameterValue validation key**

Add or update an assertion in `packages/core/metadata/validation/schemaRegistry.test.ts` that checks the rewritten validation graph contains:

```ts
const visibilitySchemaName =
  "SettingsParameterValue/Primitive/yaml/%D0%92%D0%B8%D0%B4%D0%B8%D0%BC%D0%BE%D1%81%D1%82%D1%8C"

expect(graph.schemas[`${prefix}${visibilitySchemaName}`]).toMatchObject({ $id: `${prefix}${visibilitySchemaName}` })
```

Do not require public `externalRefs` output to be URI-encoded; public schema export behavior remains unchanged.

- [ ] **Step 3: Run tests to verify they fail**

Run:

```bash
pnpm --filter @nkdk/core test -- metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toJSONSchema.test.ts metadata/validation/schemaRegistry.test.ts
```

Expected: Settings integration assertion fails because the current validation key is underscore/sanitized; DCS explicit assertion fails because the current validation schema is strict.

- [ ] **Step 4: Make DcsExplicitSystemEnumerationValue Any**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toJSONSchema.ts`, replace:

```ts
registerProjectJSONSchema(DCS_EXPLICIT_SYSTEM_ENUMERATION_SCHEMA_NAME, ({ context }) =>
  explicitDcsSystemEnumerationValueJSONSchema(context)
)
```

with:

```ts
registerProjectJSONSchema(DCS_EXPLICIT_SYSTEM_ENUMERATION_SCHEMA_NAME, ({ context }) =>
  context.exportToJSONSchema?.validationPropertyRefs === true
    ? Type.Any()
    : explicitDcsSystemEnumerationValueJSONSchema(context)
)
```

Keep `explicitDcsSystemEnumerationValueJSONSchema` in place if other tests or future work still import it; remove it only if TypeScript reports it is unused and no export depends on it.

- [ ] **Step 5: Update DcsMetadataValue key format**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toJSONSchema.ts`, replace `dcsMetadataValueSchemaName` with:

```ts
export function dcsMetadataValueSchemaName(rule: DcsMetadataValuePropertyRule): string {
  return ["DcsMetadataValue", rule.valueType, "typeSE" in rule ? rule.typeSE : undefined]
    .filter(Boolean)
    .join("/")
}
```

- [ ] **Step 6: Update SettingsParameterValue key format**

In `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toJSONSchema.ts`, replace `settingsParameterValueSchemaKey` with:

```ts
const settingsParameterValueSchemaKey = (rule: SettingsParameterValuePropertyRule): string =>
  ["SettingsParameterValue", rule.valueType, rule.typeSE, "yaml", encodeURIComponent(rule.yaml)].filter(Boolean).join("/")
```

Use a separate local TypeBox cyclic key without `/` for `Type.Ref(...)`/`Type.Cyclic(...)`; slash-separated external schema names must not be reused as local `$defs` keys.

- [ ] **Step 7: Add integration assertions for rewritten validation graph keys**

In `packages/core/metadata/validation/schemaRegistry.test.ts`, update the existing `uses validation refs only for reusable schemas` test:

```ts
    const visibilitySchemaName =
      "SettingsParameterValue/Primitive/yaml/%D0%92%D0%B8%D0%B4%D0%B8%D0%BC%D0%BE%D1%81%D1%82%D1%8C"

    expect(graph.schemas[`${prefix}${visibilitySchemaName}`]).toMatchObject({ $id: `${prefix}${visibilitySchemaName}` })
```

Remove the old `AppearanceSettingsParameterValue_Primitive__u0412...` assertion.

- [ ] **Step 8: Run tests to verify task passes**

Run:

```bash
pnpm --filter @nkdk/core test -- metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toJSONSchema.test.ts metadata/validation/schemaRegistry.test.ts
```

Expected: all listed tests pass.

- [ ] **Step 9: Commit**

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toJSONSchema.ts packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toJSONSchema.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toJSONSchema.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toJSONSchema.test.ts packages/core/metadata/validation/schemaRegistry.test.ts
git commit -m "feat: :sparkles: уточнить refs DCS validation-свойств"
```

---

### Task 5: Standalone generation, memory measurement, and spec update

**Files:**
- Modify: `docs/superpowers/specs/2026-07-20-validation-external-property-schemas-design.md`
- Generated during build: `packages/core/dist/projectValidationAjvStandalone.js`
- Test: `packages/core/metadata/validation/schemaRegistry.test.ts`
- Test: full project via `pnpm test`

**Interfaces:**
- Consumes:
  - `createProjectValidationStandaloneSchemaSet(defaultStandaloneValidationContext)`
  - `generateProjectValidationAjvStandalone({ outfile })`
  - validation profile script `.agents/skills/validation-profile/validation-profile.mjs`
- Produces:
  - Measured generated standalone size, cold time, peak RSS, per-run RSS, diagnostics count.
  - Spec memory section updated with final numbers.

- [ ] **Step 1: Add a regression test that large known inline types are gone**

Append to `packages/core/metadata/validation/schemaRegistry.test.ts`:

```ts
  it("does not leave large reusable property schemas inline in InputField validation schema", () => {
    const graph = exportJSONSchemaGraph({
      context,
      validationPropertyRefs: true,
      roots: [{ key: "commonForm", name: "MetadataCommonForm" }],
    })
    const prefix = "nkdk://schema/validation/2.20/ru/"
    const inputField = graph.schemas[`${prefix}InputField`] as {
      properties?: Record<string, unknown>
    }
    const inputFieldJson = JSON.stringify(inputField)

    expect(inputFieldJson).not.toContain("ЦветФонаПодсказки")
    expect(inputFieldJson).not.toContain("ШрифтТекста")
    expect(inputField.properties?.ЦветФона).toEqual({ $ref: `${prefix}Color/base` })
    expect(inputField.properties?.Шрифт).toEqual({ $ref: `${prefix}Font/base` })
  })
```

- [ ] **Step 2: Run targeted validation tests**

Run:

```bash
pnpm --filter @nkdk/core test -- metadata/validation/schemaRegistry.test.ts metadata/orchestration/jsonSchemaRefs.test.ts
```

Expected: pass.

- [ ] **Step 3: Build core standalone**

Run:

```bash
pnpm --filter @nkdk/core build
```

Expected: build exits with code 0 and creates `packages/core/dist/projectValidationAjvStandalone.js`.

- [ ] **Step 4: Record generated standalone size**

Run:

```bash
wc -c packages/core/dist/projectValidationAjvStandalone.js
ls -lh packages/core/dist/projectValidationAjvStandalone.js
```

Expected: output includes byte size and human-readable size. Record both values for the spec.

- [ ] **Step 5: Run compiled standalone memory profile**

Run:

```bash
node .agents/skills/validation-profile/validation-profile.mjs packages/core/metadata/validation/__fixtures__/project-with-form --runs 5 --timing
```

Expected: output reports `diagnostics=0`, `errors=0`, `warnings=0`, `Cold`, `Peak RSS`, and five run RSS values. Record all values.

- [ ] **Step 6: Update memory section in spec**

In `docs/superpowers/specs/2026-07-20-validation-external-property-schemas-design.md`, append one paragraph after the current `code` options table. The paragraph must include these real measured values from Steps 4-5: worker count, cold time, peak RSS, five run RSS values, diagnostics count, generated standalone byte size, generated standalone human-readable size, delta from the previous worktree peak RSS 1208 MiB, delta from the previous worktree generated JS size 87153877 bytes, and delta from the fresh develop peak RSS 746 MiB.

The committed paragraph must be ordinary prose with real numbers only. Do not write symbolic names or angle-bracket tokens in the spec.

- [ ] **Step 7: Run full test suite**

Run:

```bash
pnpm test
```

Expected: all packages pass. If any test fails, fix the implementation or tests in the smallest relevant file and re-run the failing command before re-running `pnpm test`.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/validation/schemaRegistry.test.ts docs/superpowers/specs/2026-07-20-validation-external-property-schemas-design.md
git commit -m "perf: :zap: сократить standalone validation refs"
```

---

## Self-Review

- Spec coverage: Tasks 1-3 implement `$ref` by default with inline deny-list; Task 2 covers scalar implicit keys; Task 4 covers DCS keys and temporary `Any`; Task 5 covers standalone build, profile, and spec measurement update.
- Placeholder scan: The plan contains no unfinished sections; measurement values are collected during Task 5 and written as real numbers before that task's commit.
- Type consistency: The plan consistently uses `exportValidationPropertyRefSchema`, `isValidationInlinePropertyRule`, `defaultValidationSchemaRefKey`, `dcsMetadataValueSchemaName`, and `settingsParameterValueSchemaKey`.
- Scope check: The plan is a single cohesive validation-schema change and does not include unrelated validation diagnostics, round-trip behavior, or public `nkdk schema --inline` changes.
