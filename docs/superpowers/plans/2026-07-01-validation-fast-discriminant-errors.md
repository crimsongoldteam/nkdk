# Fast Discriminant Errors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ускорить генерацию schema-диагностик для невалидных YAML-форм, выбирая ветку `discriminantKey` до полного `schema.Errors`.

**Architecture:** `validateParsedFile` сохраняет быстрый выход через `schema.Check`, а при неуспехе сначала пробует новый быстрый сборщик ошибок. Сборщик проходит по нейтральной JSON Schema, поддерживает объекты, массивы, записи, `$ref` и `anyOf` с `discriminantKey`, а при неподдержанном случае возвращает `fallback` на прежний TypeBox-путь.

**Tech Stack:** TypeScript, TypeBox `TypeCompiler`/`TypeCheck`, Vitest, существующий слой `packages/core/metadata/validation`.

---

## File Structure

- Create: `packages/core/metadata/validation/discriminatedUnionShared.ts`
  - Общие помощники для старого раскрытия union и нового быстрого сборщика: контекст ссылок, JSON Pointer, поиск ветки по discriminator, совместимое сообщение неизвестного discriminator, пометка additional property как ошибки ключа.
- Create: `packages/core/metadata/validation/fastDiscriminatedUnionErrors.ts`
  - Быстрый сборщик `tryCollectFastDiscriminatedUnionErrors`. Он не знает о metadata-типах, папках и `itemType`; работает только с JSON Schema и значением.
- Modify: `packages/core/metadata/validation/discriminatedUnionErrors.ts`
  - Перенести общие функции в `discriminatedUnionShared.ts`, оставить публичное поведение `expandDiscriminatedUnionErrors` прежним.
- Modify: `packages/core/metadata/validation/typeboxErrorsToDiagnostics.ts`
  - Добавить настройку, позволяющую не раскрывать `discriminantKey` повторно, когда ошибки уже собраны быстрым путём.
- Modify: `packages/core/metadata/validation/validateFile.ts`
  - Подключить быстрый путь между `schema.Check` и старым `schema.Errors`.
- Modify: `packages/core/metadata/validation/validateFile.test.ts`
  - Добавить падающие тесты на быстрый путь, возврат к старому пути и отсутствие полного `schema.Errors` на поддержанной `discriminantKey`-схеме.

## Task 1: Add Failing Fast-Path Tests

**Files:**
- Modify: `packages/core/metadata/validation/validateFile.test.ts`

- [ ] **Step 1: Extend the Vitest import**

Replace:

```ts
import { describe, expect, it } from "vitest"
```

with:

```ts
import { describe, expect, it, vi } from "vitest"
```

- [ ] **Step 2: Add a discriminant union that the fast path must reject**

Add this schema after `const discriminatedUnionSchema = ...`:

```ts
const unsupportedDiscriminatedUnionSchema = TypeCompiler.Compile(
  Type.Union(
    [
      Type.Object({ Вид: Type.String(), Поле: Type.String() }, { additionalProperties: false }),
      Type.Object({ Вид: Type.Literal("Второй"), Число: Type.Number() }, { additionalProperties: false }),
    ],
    { discriminantKey: "Вид" }
  )
)
```

- [ ] **Step 3: Prove a root discriminant union avoids root `schema.Errors`**

Add this test after `раскрывает discriminantKey union по Вид и возвращает ошибку выбранной ветки`:

```ts
  it("быстрый путь раскрывает корневый discriminantKey union без полного schema.Errors", () => {
    const text = `Вид: Второй\nЧисло: не-число\nЛишнее: значение\n`
    const errorsSpy = vi.spyOn(discriminatedUnionSchema, "Errors")

    try {
      const result = validateFile({ filePath: "test.yaml", text, schema: discriminatedUnionSchema })

      expect(errorsSpy).not.toHaveBeenCalled()
      expect(result.some((diagnostic) => diagnostic.message === "Expected union value")).toBe(false)
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            filePath: "test.yaml",
            line: 2,
            col: 8,
            path: "/Число",
            source: "structure",
            severity: "error",
          }),
          expect.objectContaining({
            filePath: "test.yaml",
            line: 3,
            col: 1,
            path: "/Лишнее",
            source: "structure",
            severity: "error",
          }),
        ])
      )
    } finally {
      errorsSpy.mockRestore()
    }
  })
```

- [ ] **Step 4: Prove the fast path reaches nested `Type.Ref` records**

Add this test after `раскрывает discriminantKey union с Type.Ref из корневой схемы`:

```ts
  it("быстрый путь проходит через объект, запись и Type.Ref до вложенного discriminantKey", () => {
    const text = `Элементы:\n  Группа1:\n    Вид: Группа\n    Элементы:\n      Надпись1:\n        Вид: Надпись\n        Заголовок: 123\n`
    const errorsSpy = vi.spyOn(referencedNestedDiscriminatedUnionSchema, "Errors")

    try {
      const result = validateFile({ filePath: "test.yaml", text, schema: referencedNestedDiscriminatedUnionSchema })

      expect(errorsSpy).not.toHaveBeenCalled()
      expect(result.some((diagnostic) => diagnostic.message === "Expected union value")).toBe(false)
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            filePath: "test.yaml",
            line: 7,
            col: 20,
            path: "/Элементы/Группа1/Элементы/Надпись1/Заголовок",
            source: "structure",
            severity: "error",
            message: "Expected string",
          }),
        ])
      )
    } finally {
      errorsSpy.mockRestore()
    }
  })
```

- [ ] **Step 5: Prove unknown `Вид` also avoids root `schema.Errors`**

Add this test after `для неизвестного Вид возвращает targeted discriminator diagnostic`:

```ts
  it("быстрый путь строит targeted diagnostic для неизвестного Вид без полного schema.Errors", () => {
    const text = `Вид: Третий\n`
    const errorsSpy = vi.spyOn(discriminatedUnionSchema, "Errors")

    try {
      const result = validateFile({ filePath: "test.yaml", text, schema: discriminatedUnionSchema })

      expect(errorsSpy).not.toHaveBeenCalled()
      expect(result).toEqual([
        expect.objectContaining({
          filePath: "test.yaml",
          line: 1,
          col: 6,
          path: "/Вид",
          source: "structure",
          severity: "error",
          message: 'Неизвестное значение дискриминатора "Вид": "Третий". Ожидается одно из: Первый, Второй',
        }),
      ])
    } finally {
      errorsSpy.mockRestore()
    }
  })
```

- [ ] **Step 6: Prove unsupported discriminant branches fall back**

Add this test before `оставляет обычный union без discriminantKey как TypeBox Union error`:

```ts
  it("возвращается к TypeBox, если ветка discriminantKey не имеет уникального const", () => {
    const text = `Вид: Второй\nЧисло: не-число\n`
    const errorsSpy = vi.spyOn(unsupportedDiscriminatedUnionSchema, "Errors")

    try {
      const result = validateFile({ filePath: "test.yaml", text, schema: unsupportedDiscriminatedUnionSchema })

      expect(errorsSpy).toHaveBeenCalledTimes(1)
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: "Expected union value",
            source: "structure",
            severity: "error",
          }),
        ])
      )
    } finally {
      errorsSpy.mockRestore()
    }
  })
```

- [ ] **Step 7: Strengthen the existing plain union fallback test**

Inside `оставляет обычный union без discriminantKey как TypeBox Union error`, replace the body with:

```ts
    const text = `Вид: Второй\nЧисло: не-число\n`
    const errorsSpy = vi.spyOn(plainUnionSchema, "Errors")

    try {
      const result = validateFile({ filePath: "test.yaml", text, schema: plainUnionSchema })

      expect(errorsSpy).toHaveBeenCalledTimes(1)
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: "Expected union value",
            source: "structure",
            severity: "error",
          }),
        ])
      )
      expect([...plainUnionSchema.Errors({ Вид: "Второй", Число: "не-число" })][0]?.type).toBe(ValueErrorType.Union)
    } finally {
      errorsSpy.mockRestore()
    }
```

- [ ] **Step 8: Run the focused test and confirm it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/validateFile.test.ts --no-isolate
```

Expected: FAIL. At least the new spy checks should fail because `validateParsedFile` still calls `schema.Errors(parsed.data)` for every invalid schema.

## Task 2: Extract Shared Discriminant Helpers

**Files:**
- Create: `packages/core/metadata/validation/discriminatedUnionShared.ts`
- Modify: `packages/core/metadata/validation/discriminatedUnionErrors.ts`
- Test: `packages/core/metadata/validation/validateFile.test.ts`

- [ ] **Step 1: Create the shared helper file**

Create `packages/core/metadata/validation/discriminatedUnionShared.ts`:

```ts
import { TSchema } from "@sinclair/typebox"
import { TypeCheck, TypeCompiler, ValueError, ValueErrorType } from "@sinclair/typebox/compiler"

export interface DiscriminatedUnionSchema extends TSchema {
  anyOf: TSchema[]
  discriminantKey: string
}

export interface BranchSchema extends TSchema {
  properties?: Record<string, { const?: unknown }>
}

export interface DiagnosticLocationSchema extends TSchema {
  diagnosticLocation?: "key"
}

export interface BranchEntry {
  schema: TSchema
  compiled?: TypeCheck<TSchema>
}

export interface BranchCache {
  branches: Map<string, BranchEntry>
  expectedValues: string[]
}

export interface ExpansionContext {
  references: TSchema[]
  referenceKey: string
  referencesById: Map<string, TSchema>
}

const emptyExpansionContext: ExpansionContext = {
  references: [],
  referenceKey: "",
  referencesById: new Map(),
}
const unionSchemaCache = new WeakMap<TSchema, Map<string, BranchCache>>()
let expansionContextCache = new WeakMap<TypeCheck<TSchema>, ExpansionContext>()
let expansionContextBuildCountForTests = 0

export function isDiscriminatedUnionSchema(schema: TSchema): schema is DiscriminatedUnionSchema {
  return typeof schema.discriminantKey === "string" && Array.isArray(schema.anyOf)
}

export function escapeJsonPointerSegment(segment: string): string {
  return segment.replace(/~/g, "~0").replace(/\//g, "~1")
}

export function prefixJsonPointer(parentPath: string, childPath: string): string {
  if (!parentPath) return childPath
  if (!childPath) return parentPath
  return `${parentPath}${childPath}`
}

export function getObjectProperty(value: unknown, key: string): unknown {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined
  return (value as Record<string, unknown>)[key]
}

function getUnionSchemaCacheKey(context: ExpansionContext, strict: boolean): string {
  return `${strict ? "strict" : "loose"}\u0000${context.referenceKey}`
}

export function getBranchCache(
  schema: DiscriminatedUnionSchema,
  context: ExpansionContext,
  options: { strict?: boolean } = {}
): BranchCache | undefined {
  const strict = options.strict === true
  const cacheKey = getUnionSchemaCacheKey(context, strict)
  const cachedByReferences = unionSchemaCache.get(schema)
  const cached = cachedByReferences?.get(cacheKey)
  if (cached !== undefined) return cached

  const branches = new Map<string, BranchEntry>()
  const expectedValues: string[] = []

  for (const branch of schema.anyOf) {
    const branchSchema = branch as BranchSchema
    const discriminatorValue = branchSchema.properties?.[schema.discriminantKey]?.const
    if (typeof discriminatorValue !== "string") {
      if (strict) return undefined
      continue
    }
    if (branches.has(discriminatorValue)) {
      if (strict) return undefined
      continue
    }

    branches.set(discriminatorValue, { schema: branch })
    expectedValues.push(discriminatorValue)
  }

  if (strict && branches.size !== schema.anyOf.length) return undefined

  const cache = { branches, expectedValues }
  if (cachedByReferences === undefined) {
    unionSchemaCache.set(schema, new Map([[cacheKey, cache]]))
  } else {
    cachedByReferences.set(cacheKey, cache)
  }

  return cache
}

export function getCompiledBranch(entry: BranchEntry, context: ExpansionContext): TypeCheck<TSchema> | undefined {
  if (entry.compiled !== undefined) return entry.compiled

  try {
    entry.compiled = TypeCompiler.Compile(entry.schema, context.references)
    return entry.compiled
  } catch {
    return undefined
  }
}

function formatDiscriminatorValue(value: unknown): string {
  return typeof value === "string" ? `"${value}"` : "не задано"
}

export function createUnknownDiscriminatorError(params: {
  schema: TSchema
  path: string
  discriminantKey: string
  expectedValues: string[]
  value: unknown
}): ValueError {
  const { schema, path, discriminantKey, expectedValues, value } = params
  return {
    type: ValueErrorType.Union,
    schema,
    path: prefixJsonPointer(path, `/${escapeJsonPointerSegment(discriminantKey)}`),
    value,
    message: `Неизвестное значение дискриминатора "${discriminantKey}": ${formatDiscriminatorValue(
      value
    )}. Ожидается одно из: ${expectedValues.join(", ")}`,
    errors: [],
  }
}

export function markAdditionalPropertyAtKey(error: ValueError): ValueError {
  if (error.type !== ValueErrorType.ObjectAdditionalProperties) return error

  const schema: DiagnosticLocationSchema = {
    ...error.schema,
    diagnosticLocation: "key",
  }

  return { ...error, schema }
}

function collectSchemaReferences(schema: TSchema, references: TSchema[]): TSchema[] {
  const result = [...references]
  const seen = new WeakSet<object>()
  const knownIds = new Set(result.map((reference) => reference.$id).filter((id): id is string => typeof id === "string"))

  function visit(value: unknown): void {
    if (typeof value !== "object" || value === null || seen.has(value)) return
    seen.add(value)

    if (isSchema(value)) {
      const id = value.$id
      if (typeof id === "string" && !knownIds.has(id)) {
        result.push(value)
        knownIds.add(id)
      }
    }

    if (Array.isArray(value)) {
      value.forEach(visit)
      return
    }

    Object.values(value).forEach(visit)
  }

  visit(schema)

  return result
}

function isSchema(value: object): value is TSchema {
  return "$id" in value || "type" in value || "anyOf" in value || "$ref" in value
}

export function getDiscriminatedUnionExpansionContext(schema?: TypeCheck<TSchema>): ExpansionContext {
  if (schema === undefined) return emptyExpansionContext

  const cached = expansionContextCache.get(schema)
  if (cached !== undefined) return cached

  const context = createExpansionContext(schema)
  expansionContextCache.set(schema, context)

  return context
}

function createExpansionContext(schema: TypeCheck<TSchema>): ExpansionContext {
  expansionContextBuildCountForTests += 1
  const references = collectSchemaReferences(schema.Schema(), schema.References())
  const referencesById = new Map<string, TSchema>()

  for (const reference of references) {
    if (typeof reference.$id === "string") {
      referencesById.set(reference.$id, reference)
    }
  }

  return {
    references,
    referencesById,
    referenceKey: references
      .map((reference) => reference.$id)
      .filter((id): id is string => typeof id === "string")
      .join("\u0000"),
  }
}

export function resetDiscriminatedUnionExpansionContextCacheForTests(): void {
  expansionContextCache = new WeakMap<TypeCheck<TSchema>, ExpansionContext>()
  expansionContextBuildCountForTests = 0
}

export function getDiscriminatedUnionExpansionContextBuildCountForTests(): number {
  return expansionContextBuildCountForTests
}
```

- [ ] **Step 2: Replace helper definitions in `discriminatedUnionErrors.ts` with imports**

In `packages/core/metadata/validation/discriminatedUnionErrors.ts`, replace all local helper/interface definitions before `function expandDiscriminatedUnionError` with:

```ts
import { TSchema } from "@sinclair/typebox"
import { TypeCheck, ValueError, ValueErrorType } from "@sinclair/typebox/compiler"
import {
  createUnknownDiscriminatorError,
  ExpansionContext,
  getBranchCache,
  getCompiledBranch,
  getDiscriminatedUnionExpansionContext,
  getDiscriminatedUnionExpansionContextBuildCountForTests,
  getObjectProperty,
  isDiscriminatedUnionSchema,
  markAdditionalPropertyAtKey,
  prefixJsonPointer,
  resetDiscriminatedUnionExpansionContextCacheForTests,
} from "./discriminatedUnionShared"
```

Keep these exports at the bottom of `discriminatedUnionErrors.ts` so existing tests and callers do not change:

```ts
export {
  getDiscriminatedUnionExpansionContextBuildCountForTests,
  resetDiscriminatedUnionExpansionContextCacheForTests,
}
```

- [ ] **Step 3: Update `expandDiscriminatedUnionError` to use the shared unknown-discriminator helper**

Replace the unknown discriminator block:

```ts
    return [
      createUnknownDiscriminatorError(error, error.schema.discriminantKey, cache.expectedValues, discriminantValue),
    ]
```

with:

```ts
    return [
      createUnknownDiscriminatorError({
        schema: error.schema,
        path: error.path,
        discriminantKey: error.schema.discriminantKey,
        expectedValues: cache.expectedValues,
        value: discriminantValue,
      }),
    ]
```

- [ ] **Step 4: Update `expandDiscriminatedUnionErrors` to use the shared context**

Keep this implementation:

```ts
export function expandDiscriminatedUnionErrors(errors: ValueError[], schema?: TypeCheck<TSchema>): ValueError[] {
  return expandDiscriminatedUnionErrorsWithContext(errors, getDiscriminatedUnionExpansionContext(schema))
}
```

- [ ] **Step 5: Run the focused test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/validateFile.test.ts --no-isolate
```

Expected: tests added in Task 1 still FAIL because the fast path is not connected yet. Existing discriminated-union behavior must still PASS.

- [ ] **Step 6: Commit the refactor**

Run:

```bash
git add packages/core/metadata/validation/discriminatedUnionErrors.ts packages/core/metadata/validation/discriminatedUnionShared.ts packages/core/metadata/validation/validateFile.test.ts
git commit -m "refactor: :recycle: выделить помощники discriminantKey validation"
```

## Task 3: Implement the Fast Discriminant Error Collector

**Files:**
- Create: `packages/core/metadata/validation/fastDiscriminatedUnionErrors.ts`
- Test: `packages/core/metadata/validation/validateFile.test.ts`

- [ ] **Step 1: Create `fastDiscriminatedUnionErrors.ts`**

Create `packages/core/metadata/validation/fastDiscriminatedUnionErrors.ts`:

```ts
import { TSchema } from "@sinclair/typebox"
import { TypeCheck, TypeCompiler, ValueError, ValueErrorType } from "@sinclair/typebox/compiler"
import {
  createUnknownDiscriminatorError,
  escapeJsonPointerSegment,
  ExpansionContext,
  getBranchCache,
  getDiscriminatedUnionExpansionContext,
  getObjectProperty,
  isDiscriminatedUnionSchema,
  markAdditionalPropertyAtKey,
  prefixJsonPointer,
} from "./discriminatedUnionShared"

export type FastDiscriminatedUnionErrorsResult =
  | { status: "handled"; errors: ValueError[] }
  | { status: "fallback" }

interface RefSchema extends TSchema {
  $ref: string
}

interface ObjectLikeSchema extends TSchema {
  type?: string
  properties?: Record<string, TSchema>
  required?: string[]
  additionalProperties?: boolean | TSchema
  patternProperties?: Record<string, TSchema>
}

interface ArrayLikeSchema extends TSchema {
  type?: string
  items?: TSchema | TSchema[]
}

type CollectResult = FastDiscriminatedUnionErrorsResult

const compiledSchemaCache = new WeakMap<TSchema, Map<string, TypeCheck<TSchema>>>()
const unsupportedObjectKeywords = [
  "minProperties",
  "maxProperties",
  "propertyNames",
  "dependentRequired",
  "dependentSchemas",
  "dependencies",
  "unevaluatedProperties",
]
const unsupportedArrayKeywords = ["minItems", "maxItems", "uniqueItems", "contains", "minContains", "maxContains"]

export function tryCollectFastDiscriminatedUnionErrors(
  schema: TypeCheck<TSchema>,
  value: unknown
): FastDiscriminatedUnionErrorsResult {
  try {
    const context = getDiscriminatedUnionExpansionContext(schema)
    return collectErrors(schema.Schema(), value, "", context)
  } catch {
    return { status: "fallback" }
  }
}

function collectErrors(schema: TSchema, value: unknown, path: string, context: ExpansionContext): CollectResult {
  const resolvedSchema = resolveSchema(schema, context)
  if (resolvedSchema === undefined) return { status: "fallback" }

  if (isDiscriminatedUnionSchema(resolvedSchema)) {
    return collectDiscriminatedUnionErrors(resolvedSchema, value, path, context)
  }

  if (Array.isArray(resolvedSchema.anyOf)) {
    return { status: "fallback" }
  }

  if (isObjectLikeSchema(resolvedSchema)) {
    return collectObjectErrors(resolvedSchema, value, path, context)
  }

  if (isArrayLikeSchema(resolvedSchema)) {
    return collectArrayErrors(resolvedSchema, value, path, context)
  }

  return collectTypeBoxErrors(resolvedSchema, value, path, context)
}

function resolveSchema(schema: TSchema, context: ExpansionContext): TSchema | undefined {
  let current: TSchema = schema
  const seenRefs = new Set<string>()

  while (isRefSchema(current)) {
    if (seenRefs.has(current.$ref)) return undefined
    seenRefs.add(current.$ref)

    const resolved = context.referencesById.get(current.$ref)
    if (resolved === undefined) return undefined
    current = resolved
  }

  return current
}

function isRefSchema(schema: TSchema): schema is RefSchema {
  return typeof schema.$ref === "string"
}

function collectDiscriminatedUnionErrors(
  schema: TSchema,
  value: unknown,
  path: string,
  context: ExpansionContext
): CollectResult {
  if (!isDiscriminatedUnionSchema(schema)) return { status: "fallback" }

  const cache = getBranchCache(schema, context, { strict: true })
  if (cache === undefined) return { status: "fallback" }

  const discriminantValue = getObjectProperty(value, schema.discriminantKey)
  const branchEntry = typeof discriminantValue === "string" ? cache.branches.get(discriminantValue) : undefined

  if (branchEntry === undefined) {
    return {
      status: "handled",
      errors: [
        createUnknownDiscriminatorError({
          schema,
          path,
          discriminantKey: schema.discriminantKey,
          expectedValues: cache.expectedValues,
          value: discriminantValue,
        }),
      ],
    }
  }

  return collectErrors(branchEntry.schema, value, path, context)
}

function isObjectLikeSchema(schema: TSchema): schema is ObjectLikeSchema {
  return schema.type === "object" || schema.properties !== undefined || schema.patternProperties !== undefined
}

function collectObjectErrors(
  schema: ObjectLikeSchema,
  value: unknown,
  path: string,
  context: ExpansionContext
): CollectResult {
  if (hasUnsupportedKeyword(schema, unsupportedObjectKeywords)) return { status: "fallback" }

  if (!isPlainRecord(value)) {
    return collectTypeBoxErrors(schema, value, path, context)
  }

  const errors: ValueError[] = []
  const properties = schema.properties ?? {}
  const required = schema.required ?? []

  for (const requiredProperty of required) {
    if (!Object.prototype.hasOwnProperty.call(value, requiredProperty)) {
      errors.push(createRequiredPropertyError(schema, path, requiredProperty))
    }
  }

  for (const [key, childValue] of Object.entries(value)) {
    const knownProperty = properties[key]
    if (knownProperty !== undefined) {
      const childResult = collectErrors(knownProperty, childValue, childPath(path, key), context)
      if (childResult.status === "fallback") return childResult
      errors.push(...childResult.errors)
      continue
    }

    const patternSchemas = getMatchingPatternSchemas(schema, key)
    if (patternSchemas.length > 0) {
      for (const patternSchema of patternSchemas) {
        const childResult = collectErrors(patternSchema, childValue, childPath(path, key), context)
        if (childResult.status === "fallback") return childResult
        errors.push(...childResult.errors)
      }
      continue
    }

    if (schema.additionalProperties === false) {
      errors.push(createAdditionalPropertyError(schema, path, key, childValue))
      continue
    }

    if (typeof schema.additionalProperties === "object" && schema.additionalProperties !== null) {
      const childResult = collectErrors(schema.additionalProperties, childValue, childPath(path, key), context)
      if (childResult.status === "fallback") return childResult
      errors.push(...childResult.errors)
    }
  }

  return { status: "handled", errors }
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function getMatchingPatternSchemas(schema: ObjectLikeSchema, key: string): TSchema[] {
  const patternProperties = schema.patternProperties
  if (patternProperties === undefined) return []

  return Object.entries(patternProperties)
    .filter(([pattern]) => new RegExp(pattern).test(key))
    .map(([_pattern, patternSchema]) => patternSchema)
}

function isArrayLikeSchema(schema: TSchema): schema is ArrayLikeSchema {
  return schema.type === "array" || schema.items !== undefined
}

function collectArrayErrors(
  schema: ArrayLikeSchema,
  value: unknown,
  path: string,
  context: ExpansionContext
): CollectResult {
  if (hasUnsupportedKeyword(schema, unsupportedArrayKeywords)) return { status: "fallback" }

  if (!Array.isArray(value)) {
    return collectTypeBoxErrors(schema, value, path, context)
  }

  if (schema.items === undefined) {
    return { status: "handled", errors: [] }
  }

  if (Array.isArray(schema.items)) {
    return { status: "fallback" }
  }

  const errors: ValueError[] = []
  for (const [index, itemValue] of value.entries()) {
    const childResult = collectErrors(schema.items, itemValue, childPath(path, String(index)), context)
    if (childResult.status === "fallback") return childResult
    errors.push(...childResult.errors)
  }

  return { status: "handled", errors }
}

function collectTypeBoxErrors(
  schema: TSchema,
  value: unknown,
  path: string,
  context: ExpansionContext
): CollectResult {
  const compiled = getCompiledSchema(schema, context)
  if (compiled === undefined) return { status: "fallback" }

  return {
    status: "handled",
    errors: [...compiled.Errors(value)].map((error) =>
      markAdditionalPropertyAtKey({
        ...error,
        path: prefixJsonPointer(path, error.path),
      })
    ),
  }
}

function getCompiledSchema(schema: TSchema, context: ExpansionContext): TypeCheck<TSchema> | undefined {
  const cachedByReferenceKey = compiledSchemaCache.get(schema)
  const cached = cachedByReferenceKey?.get(context.referenceKey)
  if (cached !== undefined) return cached

  try {
    const compiled = TypeCompiler.Compile(schema, context.references)
    if (cachedByReferenceKey === undefined) {
      compiledSchemaCache.set(schema, new Map([[context.referenceKey, compiled]]))
    } else {
      cachedByReferenceKey.set(context.referenceKey, compiled)
    }
    return compiled
  } catch {
    return undefined
  }
}

function hasUnsupportedKeyword(schema: TSchema, keywords: string[]): boolean {
  return keywords.some((keyword) => keyword in schema)
}

function childPath(path: string, key: string): string {
  return prefixJsonPointer(path, `/${escapeJsonPointerSegment(key)}`)
}

function createRequiredPropertyError(schema: TSchema, path: string, property: string): ValueError {
  return {
    type: ValueErrorType.ObjectRequiredProperty,
    schema,
    path: childPath(path, property),
    value: undefined,
    message: "Expected required property",
    errors: [],
  }
}

function createAdditionalPropertyError(schema: TSchema, path: string, property: string, value: unknown): ValueError {
  return markAdditionalPropertyAtKey({
    type: ValueErrorType.ObjectAdditionalProperties,
    schema,
    path: childPath(path, property),
    value,
    message: "Unexpected property",
    errors: [],
  })
}
```

- [ ] **Step 2: Run the focused test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/validateFile.test.ts --no-isolate
```

Expected: tests added in Task 1 still FAIL because the collector exists but is not connected to `validateParsedFile`.

- [ ] **Step 3: Run type-check for the new file**

Run:

```bash
pnpm --filter @nakidka/core type-check
```

Expected: PASS. If TypeScript complains about `ValueError` object construction, keep the cast inside named helper functions only, for example `return { ... } as ValueError`, and do not spread `as any` through the caller code.

- [ ] **Step 4: Commit the collector**

Run:

```bash
git add packages/core/metadata/validation/fastDiscriminatedUnionErrors.ts
git commit -m "feat: :sparkles: добавить быстрый сборщик ошибок discriminantKey"
```

## Task 4: Wire the Fast Path into Diagnostics

**Files:**
- Modify: `packages/core/metadata/validation/typeboxErrorsToDiagnostics.ts`
- Modify: `packages/core/metadata/validation/validateFile.ts`
- Test: `packages/core/metadata/validation/validateFile.test.ts`

- [ ] **Step 1: Add an option to skip duplicate discriminant expansion**

In `packages/core/metadata/validation/typeboxErrorsToDiagnostics.ts`, add this interface before `typeboxErrorsToDiagnostics`:

```ts
export interface TypeboxErrorsToDiagnosticsOptions {
  expandDiscriminatedUnions?: boolean
}
```

Then replace the function signature:

```ts
export function typeboxErrorsToDiagnostics(
  errors: ValueError[],
  parsed: ParsedYaml,
  filePath: string,
  schema?: TypeCheck<TSchema>
): Diagnostic[] {
```

with:

```ts
export function typeboxErrorsToDiagnostics(
  errors: ValueError[],
  parsed: ParsedYaml,
  filePath: string,
  schema?: TypeCheck<TSchema>,
  options: TypeboxErrorsToDiagnosticsOptions = {}
): Diagnostic[] {
```

Replace:

```ts
  const expandedErrors = expandDiscriminatedUnionErrors(errors, schema)
```

with:

```ts
  const expandedErrors =
    options.expandDiscriminatedUnions === false ? errors : expandDiscriminatedUnionErrors(errors, schema)
```

- [ ] **Step 2: Connect the fast collector in `validateFile.ts`**

Add the import:

```ts
import { tryCollectFastDiscriminatedUnionErrors } from "./fastDiscriminatedUnionErrors"
```

Replace the structural validation block:

```ts
  if (!schema.Check(parsed.data)) {
    const errors = [...schema.Errors(parsed.data)]
    return typeboxErrorsToDiagnostics(errors, parsed, filePath, schema)
  }
```

with:

```ts
  if (!schema.Check(parsed.data)) {
    const fastErrors = tryCollectFastDiscriminatedUnionErrors(schema, parsed.data)
    if (fastErrors.status === "handled") {
      return typeboxErrorsToDiagnostics(fastErrors.errors, parsed, filePath, schema, {
        expandDiscriminatedUnions: false,
      })
    }

    const errors = [...schema.Errors(parsed.data)]
    return typeboxErrorsToDiagnostics(errors, parsed, filePath, schema)
  }
```

- [ ] **Step 3: Run the focused test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/validateFile.test.ts --no-isolate
```

Expected: PASS. The new spy tests should prove supported `discriminantKey` schemas avoid root `schema.Errors`, and unsupported/plain unions still call it once.

- [ ] **Step 4: Commit the wiring**

Run:

```bash
git add packages/core/metadata/validation/typeboxErrorsToDiagnostics.ts packages/core/metadata/validation/validateFile.ts packages/core/metadata/validation/validateFile.test.ts
git commit -m "perf: :zap: обходить полный schema.Errors для discriminantKey"
```

## Task 5: Broaden Regression Coverage

**Files:**
- Modify: `packages/core/metadata/validation/validateFile.test.ts`
- Test: `packages/core/metadata/validation/validateFile.test.ts`

- [ ] **Step 1: Add a nested additional-property check**

Add this test after `быстрый путь проходит через объект, запись и Type.Ref до вложенного discriminantKey`:

```ts
  it("быстрый путь оставляет additional property diagnostic на YAML-ключе во вложенной ветке", () => {
    const text = `Элементы:\n  Группа1:\n    Вид: Группа\n    Элементы:\n      Надпись1:\n        Вид: Надпись\n        Заголовок: ok\n        Лишнее: значение\n`
    const errorsSpy = vi.spyOn(referencedNestedDiscriminatedUnionSchema, "Errors")

    try {
      const result = validateFile({ filePath: "test.yaml", text, schema: referencedNestedDiscriminatedUnionSchema })

      expect(errorsSpy).not.toHaveBeenCalled()
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            filePath: "test.yaml",
            line: 8,
            col: 9,
            path: "/Элементы/Группа1/Элементы/Надпись1/Лишнее",
            source: "structure",
            severity: "error",
          }),
        ])
      )
    } finally {
      errorsSpy.mockRestore()
    }
  })
```

- [ ] **Step 2: Add a required-property check inside the chosen branch**

Add this test after `для отсутствующего Вид возвращает targeted discriminator diagnostic с не задано`:

```ts
  it("быстрый путь сообщает обязательное поле выбранной ветки на родительском узле", () => {
    const text = `Вид: Первый\n`
    const errorsSpy = vi.spyOn(discriminatedUnionSchema, "Errors")

    try {
      const result = validateFile({ filePath: "test.yaml", text, schema: discriminatedUnionSchema })

      expect(errorsSpy).not.toHaveBeenCalled()
      expect(result).toEqual([
        expect.objectContaining({
          filePath: "test.yaml",
          line: 1,
          col: 1,
          path: "/Поле",
          source: "structure",
          severity: "error",
          message: 'Отсутствует обязательное свойство "Поле"',
        }),
      ])
    } finally {
      errorsSpy.mockRestore()
    }
  })
```

- [ ] **Step 3: Run the focused test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/validateFile.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 4: Commit the extra coverage**

Run:

```bash
git add packages/core/metadata/validation/validateFile.test.ts
git commit -m "test: :white_check_mark: закрепить diagnostics быстрого discriminantKey"
```

## Task 6: Verify the Whole Change and Measure

**Files:**
- No code changes expected.

- [ ] **Step 1: Run focused validation tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/validateFile.test.ts metadata/validation/validateProject.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 2: Run core type-check**

Run:

```bash
pnpm --filter @nakidka/core type-check
```

Expected: PASS.

- [ ] **Step 3: Run the full repository test suite**

Run from repository root:

```bash
pnpm test
```

Expected: PASS across all packages.

- [ ] **Step 4: Measure full YAML validation**

Run from repository root:

```bash
/usr/bin/time -p pnpm --filter @nakidka/cli dev validate /Users/nikita/git/nkdk-yaml >/tmp/nkdk-validation-fast-discriminant.log 2>&1
```

Expected: command may exit with validation errors from `/Users/nikita/git/nkdk-yaml`; that is acceptable if the process completes and `/tmp/nkdk-validation-fast-discriminant.log` ends with a validation summary. Compare `real` with the current baseline around 70 seconds for CLI validation on this branch.

- [ ] **Step 5: Capture the result in the final report**

Report these exact points:

```text
Focused validation tests: PASS.
Core type-check: PASS.
Full pnpm test: PASS.
Full /Users/nikita/git/nkdk-yaml validation: completed; real time N seconds; diagnostics summary from the log.
Fallback remains active for ordinary unions and unsupported discriminant branches.
```

## Self-Review Checklist

- The plan keeps `schema.Check` as the first structural step for valid files.
- The plan does not change JSON Schema generation or YAML schema hints.
- The new fast collector is generic and does not know metadata object names, folders, forms or `itemType`.
- Unknown, missing and non-string `Вид` keep the existing targeted diagnostic text.
- Already expanded fast-path errors skip the old `expandDiscriminatedUnionErrors` pass, preventing duplicate `/Вид/Вид` paths.
- Unsupported schemas return to the old `schema.Errors` path instead of producing partial diagnostics.
- Verification includes focused tests, type-check, full `pnpm test`, and a real-project validation measurement.
