# Form Elements Discriminated Union Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `nkdk validate` report precise branch errors for form child item unions selected by `Вид`, while `nkdk schema --json-schema` exposes the same discriminator contract.

**Architecture:** Keep TypeBox as the only validation dependency. Export child item unions with `discriminantKey: "Вид"`, then expand TypeBox `Union` errors in the diagnostic layer by compiling and caching only the branch whose `Вид` const matches the YAML node.

**Tech Stack:** TypeScript, TypeBox `TypeCompiler`, Vitest, existing `@nakidka/core` metadata validation.

---

## File Structure

- Modify `packages/core/metadata/forms/commonObjects/childItems/toJSONSchema.ts`
  - Add `discriminantKey: "Вид"` to generic child item `Type.Union(...)`.
  - Keep single-branch schemas unchanged.
- Create `packages/core/metadata/validation/discriminatedUnionErrors.ts`
  - Encapsulate detection and expansion of TypeBox `Union` errors for schemas carrying `discriminantKey`.
  - Own the lazy `WeakMap` cache from union schema object to branch validator registry.
- Modify `packages/core/metadata/validation/typeboxErrorsToDiagnostics.ts`
  - Run discriminated-union expansion before converting TypeBox errors to `Diagnostic`.
  - Preserve existing coordinate lookup and message conversion for non-discriminated errors.
- Modify `packages/core/metadata/validation/schemaRegistry.test.ts`
  - Assert form child item unions carry `discriminantKey: "Вид"` in inline JSON Schema.
- Modify `packages/core/metadata/validation/validateFile.test.ts`
  - Add focused tests for branch-specific diagnostics and ordinary union fallback.

---

### Task 1: Export `discriminantKey` on Form Child Item Unions

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/childItems/toJSONSchema.ts`
- Test: `packages/core/metadata/validation/schemaRegistry.test.ts`

- [ ] **Step 1: Write the failing schema export test**

Append this test in `packages/core/metadata/validation/schemaRegistry.test.ts` near the existing form element schema tests:

```ts
it("exports form child item unions with Вид discriminantKey", () => {
  const schema = exportJSONSchemaForSchemaName({ context, name: "UsualGroup", mode: "inline" }) as {
    properties?: {
      Элементы?: {
        additionalProperties?: {
          anyOf?: Array<{ properties?: { Вид?: { const?: string } } }>
          discriminantKey?: string
        }
      }
    }
  }

  const childItemSchema = schema.properties?.Элементы?.additionalProperties

  expect(childItemSchema).toMatchObject({
    discriminantKey: "Вид",
  })
  expect(childItemSchema?.anyOf?.some((branch) => branch.properties?.Вид?.const === "Группа")).toBe(true)
  expect(childItemSchema?.anyOf?.some((branch) => branch.properties?.Вид?.const === "ПолеВвода")).toBe(true)
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm --dir packages/core test -- metadata/validation/schemaRegistry.test.ts -t "exports form child item unions with Вид discriminantKey"
```

Expected: FAIL because `childItemSchema.discriminantKey` is `undefined`.

- [ ] **Step 3: Add `discriminantKey` to multi-branch child item unions**

In `packages/core/metadata/forms/commonObjects/childItems/toJSONSchema.ts`, replace the `itemSchema` construction in `exportGenericChildItemsDefinitionToJSONSchema` with:

```ts
  const itemSchema =
    childSchemas.length === 1
      ? childSchemas[0]
      : Type.Union(childSchemas as [TSchema, TSchema, ...TSchema[]], { discriminantKey: "Вид" })
```

Do not change the single-branch path.

- [ ] **Step 4: Run the focused schema export test and verify it passes**

Run:

```bash
pnpm --dir packages/core test -- metadata/validation/schemaRegistry.test.ts -t "exports form child item unions with Вид discriminantKey"
```

Expected: PASS.

- [ ] **Step 5: Run nearby schema tests**

Run:

```bash
pnpm --dir packages/core test -- metadata/validation/schemaRegistry.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/forms/commonObjects/childItems/toJSONSchema.ts packages/core/metadata/validation/schemaRegistry.test.ts
git commit -m "feat: :sparkles: добавить дискриминатор элементов формы"
```

---

### Task 2: Add Discriminated Union Error Expansion

**Files:**
- Create: `packages/core/metadata/validation/discriminatedUnionErrors.ts`
- Test: `packages/core/metadata/validation/validateFile.test.ts`

- [ ] **Step 1: Write failing unit tests for discriminated union diagnostics**

In `packages/core/metadata/validation/validateFile.test.ts`, extend the top import:

```ts
import { ValueErrorType } from "@sinclair/typebox/compiler"
```

Then add these schemas near `requiredSchema`:

```ts
const plainUnionSchema = TypeCompiler.Compile(
  Type.Union([
    Type.Object({ Вид: Type.Literal("Первый"), Поле: Type.String() }, { additionalProperties: false }),
    Type.Object({ Вид: Type.Literal("Второй"), Число: Type.Number() }, { additionalProperties: false }),
  ]),
)

const discriminatedUnionSchema = TypeCompiler.Compile(
  Type.Union(
    [
      Type.Object({ Вид: Type.Literal("Первый"), Поле: Type.String() }, { additionalProperties: false }),
      Type.Object({ Вид: Type.Literal("Второй"), Число: Type.Number() }, { additionalProperties: false }),
    ],
    { discriminantKey: "Вид" },
  ),
)
```

Add these tests inside `describe("validateFile", ...)`:

```ts
it("раскрывает discriminantKey union по Вид и возвращает ошибку выбранной ветки", () => {
  const text = `Вид: Второй\nЧисло: не-число\nЛишнее: значение\n`

  const result = validateFile({ filePath: "test.yaml", text, schema: discriminatedUnionSchema })

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
    ]),
  )
})
```

```ts
it("для неизвестного Вид возвращает targeted discriminator diagnostic", () => {
  const text = `Вид: Третий\n`

  const result = validateFile({ filePath: "test.yaml", text, schema: discriminatedUnionSchema })

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
})
```

```ts
it("оставляет обычный union без discriminantKey как TypeBox Union error", () => {
  const text = `Вид: Второй\nЧисло: не-число\n`

  const result = validateFile({ filePath: "test.yaml", text, schema: plainUnionSchema })

  expect(result).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        message: "Expected union value",
        source: "structure",
        severity: "error",
      }),
    ]),
  )
  expect([...plainUnionSchema.Errors({ Вид: "Второй", Число: "не-число" })][0]?.type).toBe(ValueErrorType.Union)
})
```

- [ ] **Step 2: Run the focused tests and verify they fail**

Run:

```bash
pnpm --dir packages/core test -- metadata/validation/validateFile.test.ts -t "discriminantKey union|unknown Вид|обычный union"
```

Expected: the first two tests FAIL because diagnostics still contain `Expected union value`; the ordinary union test should PASS or fail only because of import placement mistakes.

- [ ] **Step 3: Create `discriminatedUnionErrors.ts`**

Create `packages/core/metadata/validation/discriminatedUnionErrors.ts`:

```ts
import type { TSchema } from "@sinclair/typebox"
import { TypeCompiler, ValueError, ValueErrorType, type TypeCheck } from "@sinclair/typebox/compiler"

type UnionSchemaWithDiscriminator = TSchema & {
  anyOf?: TSchema[]
  discriminantKey?: string
}

const branchRegistryCache = new WeakMap<TSchema, Map<string, TypeCheck<TSchema>>>()

export function expandDiscriminatedUnionErrors(errors: ValueError[]): ValueError[] {
  const result: ValueError[] = []

  for (const error of errors) {
    const expanded = expandDiscriminatedUnionError(error)
    if (expanded.length === 0) {
      result.push(error)
    } else {
      result.push(...expanded)
    }
  }

  return result
}

function expandDiscriminatedUnionError(error: ValueError): ValueError[] {
  if (error.type !== ValueErrorType.Union) return []

  const schema = error.schema as UnionSchemaWithDiscriminator
  const discriminantKey = schema.discriminantKey
  if (discriminantKey === undefined || !Array.isArray(schema.anyOf)) return []
  if (!isRecord(error.value)) return [createDiscriminatorError(error, discriminantKey, undefined, allowedValues(schema))]

  const value = error.value[discriminantKey]
  if (typeof value !== "string") {
    return [createDiscriminatorError(error, discriminantKey, value, allowedValues(schema))]
  }

  const registry = getBranchRegistry(schema, discriminantKey)
  const branch = registry.get(value)
  if (branch === undefined) {
    return [createDiscriminatorError(error, discriminantKey, value, [...registry.keys()])]
  }

  return [...branch.Errors(error.value)].map((branchError) => prefixErrorPath(branchError, error.path))
}

function getBranchRegistry(schema: UnionSchemaWithDiscriminator, discriminantKey: string): Map<string, TypeCheck<TSchema>> {
  const cached = branchRegistryCache.get(schema)
  if (cached !== undefined) return cached

  const registry = new Map<string, TypeCheck<TSchema>>()
  for (const branch of schema.anyOf ?? []) {
    const discriminantValue = readBranchDiscriminantValue(branch, discriminantKey)
    if (discriminantValue === undefined) continue
    registry.set(discriminantValue, TypeCompiler.Compile(branch))
  }
  branchRegistryCache.set(schema, registry)

  return registry
}

function readBranchDiscriminantValue(schema: TSchema, discriminantKey: string): string | undefined {
  const properties = (schema as { properties?: Record<string, { const?: unknown }> }).properties
  const value = properties?.[discriminantKey]?.const

  return typeof value === "string" ? value : undefined
}

function allowedValues(schema: UnionSchemaWithDiscriminator): string[] {
  return (schema.anyOf ?? [])
    .map((branch) => readBranchDiscriminantValue(branch, schema.discriminantKey ?? ""))
    .filter((value): value is string => value !== undefined)
}

function createDiscriminatorError(
  source: ValueError,
  discriminantKey: string,
  value: unknown,
  allowed: string[],
): ValueError {
  const printable = typeof value === "string" ? `"${value}"` : "не задано"
  const message = `Неизвестное значение дискриминатора "${discriminantKey}": ${printable}. Ожидается одно из: ${allowed.join(", ")}`

  return {
    ...source,
    path: joinPointer(source.path, encodeJsonPointerSegment(discriminantKey)),
    message,
  }
}

function prefixErrorPath(error: ValueError, prefix: string): ValueError {
  return {
    ...error,
    path: joinPointer(prefix, error.path),
  }
}

function joinPointer(prefix: string, path: string): string {
  if (prefix === "") return path
  if (path === "") return prefix
  return `${prefix}${path}`
}

function encodeJsonPointerSegment(segment: string): string {
  return segment.replace(/~/g, "~0").replace(/\//g, "~1")
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
```

- [ ] **Step 4: Wire expansion into `typeboxErrorsToDiagnostics.ts`**

Modify `packages/core/metadata/validation/typeboxErrorsToDiagnostics.ts`:

```ts
import { expandDiscriminatedUnionErrors } from "./discriminatedUnionErrors"
```

Then change the beginning of `typeboxErrorsToDiagnostics` from:

```ts
  const diagnostics: Diagnostic[] = []

  for (const error of errors) {
```

to:

```ts
  const diagnostics: Diagnostic[] = []
  const expandedErrors = expandDiscriminatedUnionErrors(errors)

  for (const error of expandedErrors) {
```

- [ ] **Step 5: Run focused validation tests and verify they pass**

Run:

```bash
pnpm --dir packages/core test -- metadata/validation/validateFile.test.ts -t "discriminantKey union|unknown Вид|обычный union"
```

Expected: PASS.

- [ ] **Step 6: Run all validateFile tests**

Run:

```bash
pnpm --dir packages/core test -- metadata/validation/validateFile.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/validation/discriminatedUnionErrors.ts packages/core/metadata/validation/typeboxErrorsToDiagnostics.ts packages/core/metadata/validation/validateFile.test.ts
git commit -m "feat: :sparkles: уточнить ошибки union по виду"
```

---

### Task 3: Verify Form Validation on an ERP Reproducer

**Files:**
- Modify: `packages/core/metadata/validation/schemaRegistry.test.ts`
- Test: `packages/core/metadata/validation/schemaRegistry.test.ts`

- [ ] **Step 1: Add a regression test for the observed search string branch**

Append this test to `packages/core/metadata/validation/schemaRegistry.test.ts` near the inline `ClientApplicationForm` tests:

```ts
it("reports selected branch errors for command bar search string additions", () => {
  const schema = exportJSONSchemaForSchemaName({ context, name: "ClientApplicationForm", mode: "inline" })
  const compiled = TypeCompiler.Compile(schema)
  const value = {
    Элементы: {
      Таблица: {
        Вид: "ТаблицаФормы",
        КоманднаяПанель: {
          Элементы: {
            СтрокаПоиска: {
              Вид: "ОтображениеСтрокиПоиска",
              Источник: "Таблица",
              Заголовок: {
                ru: "Строка поиска",
              },
            },
          },
        },
      },
    },
  }

  expect(compiled.Check(value)).toBe(false)
  expect([...compiled.Errors(value)].map((error) => `${error.path}: ${error.message}`)).toContain(
    "/Элементы/Таблица/КоманднаяПанель/Элементы/СтрокаПоиска: Expected union value",
  )
})
```

This test documents the current TypeBox behavior at the schema level. It should still pass after the diagnostic adapter lands because the adapter changes `validateFile` diagnostics, not raw TypeBox.

- [ ] **Step 2: Run the regression test**

Run:

```bash
pnpm --dir packages/core test -- metadata/validation/schemaRegistry.test.ts -t "reports selected branch errors for command bar search string additions"
```

Expected: PASS.

- [ ] **Step 3: Run CLI validation for the observed file and inspect the changed message**

Run:

```bash
pnpm -s --dir packages/cli exec tsx src/cli.ts validate /home/nikita/git/temp-yaml/erp --file Документ/АвансовыйОтчет/Формы/ФормаДокумента/Форма.yaml
```

Expected:

- the output should no longer contain `Документ/АвансовыйОтчет/Формы/ФормаДокумента/Форма.yaml:158:5 error: Expected union value`;
- the output should contain a deeper branch error under `/Источник` or an `Unexpected property` diagnostic for `Источник`, depending on the final TypeBox message text;
- existing `ПутьКДанным` diagnostics for the same file may remain.

- [ ] **Step 4: Commit**

```bash
git add packages/core/metadata/validation/schemaRegistry.test.ts
git commit -m "test: :white_check_mark: зафиксировать union search string"
```

---

### Task 4: Full Verification and ERP Count Check

**Files:**
- No planned source changes.
- Use `/tmp/nkdk-validate-erp-after-discriminant.log` for local validation output.

- [ ] **Step 1: Run core tests**

Run:

```bash
pnpm --dir packages/core test
```

Expected: PASS.

- [ ] **Step 2: Run CLI tests**

Run:

```bash
pnpm --dir packages/cli test
```

Expected: PASS.

- [ ] **Step 3: Run full project tests**

Run:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 4: Run ERP CLI validation and capture output**

Run:

```bash
pnpm -s --dir packages/cli exec tsx src/cli.ts validate /home/nikita/git/temp-yaml/erp > /tmp/nkdk-validate-erp-after-discriminant.log 2>&1
```

Expected: command exits with code `1` while remaining validation errors exist.

- [ ] **Step 5: Count remaining `Expected union value` diagnostics**

Run:

```bash
rg 'Expected union value' /tmp/nkdk-validate-erp-after-discriminant.log | wc -l
```

Expected: count is lower than the previous `1836`, and form child item cases selected by `Вид` are replaced by branch-specific messages.

- [ ] **Step 6: Spot-check branch-specific messages**

Run:

```bash
rg 'Источник|Неизвестное значение дискриминатора|Unexpected property' /tmp/nkdk-validate-erp-after-discriminant.log | head -40
```

Expected: output includes precise diagnostics around formerly hidden form element branches. It is acceptable for revealed errors to show missing JSON Schema support, because fixing those schemas is a later stage.

- [ ] **Step 7: Commit final verification notes if any source or docs changed**

If no files changed, skip this step. If verification caused an intentional docs update, run:

```bash
git add docs/superpowers/specs/2026-06-13-form-elements-discriminated-union-validation-design.md docs/superpowers/plans/2026-06-13-form-elements-discriminated-union-validation.md
git commit -m "docs: :memo: обновить план проверки дискриминатора"
```

---

## Self-Review

- Spec coverage:
  - Public `nkdk schema --json-schema` discriminator contract: Task 1.
  - No `typebox-validators` dependency: Task 2.
  - Cached branch routing by `Вид`: Task 2.
  - ERP validation comparison: Task 4.
- Placeholder scan:
  - No red-flag placeholder tokens or open-ended implementation steps.
- Type consistency:
  - Discriminator property is consistently named `discriminantKey`.
  - YAML discriminator key is consistently `Вид`.
  - New adapter module returns TypeBox `ValueError[]`, preserving existing `Diagnostic` conversion.
