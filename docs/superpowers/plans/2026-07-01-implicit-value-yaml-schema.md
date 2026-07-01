# implicitValueYAML JSON Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Runtime-валидация YAML через JSON Schema должна запрещать явное значение, заданное в `implicitValueYAML`, и не должна смотреть на `defaultValue`.

**Architecture:** Изменение находится в общем экспорте property-схемы: `packages/core/metadata/orchestration/property/toJSONSchema.ts`. Для перечислимых схем с `anyOf` и `const` запрещенный вариант удаляется из перечисления; для свободных `number` и `string` исходная схема дополняется `not: { const: ... }` через `Type.Intersect`.

**Tech Stack:** TypeScript, TypeBox, Vitest, существующие `PropertyRule` и `registerTypeRule`.

---

### Task 1: Property Schema Tests

**Files:**
- Create: `packages/core/metadata/orchestration/property/toJSONSchemaImplicitValue.test.ts`
- Modify: none
- Test: `packages/core/metadata/orchestration/property/toJSONSchemaImplicitValue.test.ts`

- [ ] **Step 1: Write failing tests for implicit YAML exclusions**

Create `packages/core/metadata/orchestration/property/toJSONSchemaImplicitValue.test.ts` with this content:

```ts
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { describe, expect, it } from "vitest"
import "~/metadata/commonObjects/boolean/toJSONSchema"
import "~/metadata/commonObjects/number/toJSONSchema"
import "~/metadata/commonObjects/string/toJSONSchema"
import "~/metadata/systemEnumerations/toJSONSchema"
import { mockContext } from "~/tests/mockContext"
import { exportPropertyToJSONSchema } from "./toJSONSchema"

describe("exportPropertyToJSONSchema implicitValueYAML", () => {
  it("excludes implicit boolean YAML value from an enum-like schema", () => {
    const schema = exportPropertyToJSONSchema({
      context: mockContext,
      rule: { type: "boolean", implicitValueYAML: true },
      value: undefined,
    })

    if (schema === undefined) throw new Error("Expected JSON schema")
    const check = TypeCompiler.Compile(schema)

    expect(check.Check("Истина")).toBe(false)
    expect(check.Check("Ложь")).toBe(true)
  })

  it("excludes implicit SystemEnumeration YAML value from an enum-like schema", () => {
    const schema = exportPropertyToJSONSchema({
      context: mockContext,
      rule: { type: "SystemEnumeration", typeSE: "ModalityUseMode", implicitValueYAML: "Use" },
      value: undefined,
    })

    if (schema === undefined) throw new Error("Expected JSON schema")
    const check = TypeCompiler.Compile(schema)

    expect(check.Check("Use")).toBe(false)
    expect(check.Check("DontUse")).toBe(true)
  })

  it("excludes implicit number YAML value from a free number schema", () => {
    const schema = exportPropertyToJSONSchema({
      context: mockContext,
      rule: { type: "number", implicitValueYAML: 9 },
      value: undefined,
    })

    if (schema === undefined) throw new Error("Expected JSON schema")
    const check = TypeCompiler.Compile(schema)

    expect(check.Check(9)).toBe(false)
    expect(check.Check(8)).toBe(true)
    expect(check.Check("9")).toBe(false)
  })

  it("excludes implicit string YAML value from a free string schema, including empty string", () => {
    const schema = exportPropertyToJSONSchema({
      context: mockContext,
      rule: { type: "string", implicitValueYAML: "" },
      value: undefined,
    })

    if (schema === undefined) throw new Error("Expected JSON schema")
    const check = TypeCompiler.Compile(schema)

    expect(check.Check("")).toBe(false)
    expect(check.Check("значение")).toBe(true)
    expect(check.Check(0)).toBe(false)
  })

  it("does not exclude defaultValue when implicitValueYAML is absent", () => {
    const schema = exportPropertyToJSONSchema({
      context: mockContext,
      rule: { type: "boolean", defaultValue: true },
      value: undefined,
    })

    if (schema === undefined) throw new Error("Expected JSON schema")
    const check = TypeCompiler.Compile(schema)

    expect(check.Check("Истина")).toBe(true)
    expect(check.Check("Ложь")).toBe(true)
  })

  it("does not exclude function implicitValueYAML because it needs item context", () => {
    const schema = exportPropertyToJSONSchema({
      context: mockContext,
      rule: { type: "string", implicitValueYAML: ({ name }: { name?: string }) => name ?? "" },
      value: undefined,
    })

    if (schema === undefined) throw new Error("Expected JSON schema")
    const check = TypeCompiler.Compile(schema)

    expect(check.Check("")).toBe(true)
    expect(check.Check("Документ")).toBe(true)
  })
})
```

- [ ] **Step 2: Run the new tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/orchestration/property/toJSONSchemaImplicitValue.test.ts --no-isolate
```

Expected: FAIL. The boolean, number, string, and `defaultValue` checks fail because `toJSONSchema.ts` still excludes `defaultValue` and only handles `anyOf` by default value.

- [ ] **Step 3: Commit the failing tests**

Run:

```bash
git add packages/core/metadata/orchestration/property/toJSONSchemaImplicitValue.test.ts
git commit -m "test: 🧪 зафиксировать схему implicitValueYAML"
```

### Task 2: Property Schema Implementation

**Files:**
- Modify: `packages/core/metadata/orchestration/property/toJSONSchema.ts`
- Test: `packages/core/metadata/orchestration/property/toJSONSchemaImplicitValue.test.ts`

- [ ] **Step 1: Replace defaultValue YAML extraction with implicitValueYAML extraction**

In `packages/core/metadata/orchestration/property/toJSONSchema.ts`, replace `getDefaultValueYAML` with this helper:

```ts
/**
 * Возвращает YAML-представление implicitValueYAML.
 * Только для литеральных значений: функции зависят от контекста объекта.
 */
function getImplicitValueYAML(rule: PropertyRule): string | number | undefined {
  const v = rule.implicitValueYAML
  if (v === undefined || typeof v === "function") return undefined
  if (rule.type === "boolean" && typeof v === "boolean") return v ? "Истина" : "Ложь"
  if (rule.type === "number" && typeof v === "number") return v
  if (rule.type === "string" && typeof v === "string") return v
  if (rule.type === "SystemEnumeration" && typeof v === "string") return v
  return undefined
}
```

- [ ] **Step 2: Replace anyOf-only exclusion with const exclusion for enum-like and free schemas**

In the same file, replace `excludeDefaultFromSchema` with this helper:

```ts
/**
 * Исключает неявное YAML-значение из схемы.
 * Для anyOf/const удаляет конкретный вариант, для свободных схем добавляет not/const.
 */
function excludeImplicitValueFromSchema(schema: TSchema, implicitYAML: string | number): TSchema {
  const s = schema as { anyOf?: TSchema[] }
  if (Array.isArray(s.anyOf)) {
    const rest = s.anyOf.filter((opt) => (opt as { const?: unknown }).const !== implicitYAML)
    if (rest.length === 0) return Type.Never()
    if (rest.length < s.anyOf.length) {
      if (rest.length === 1) return rest[0]
      return Type.Union(rest as [TSchema, TSchema, ...TSchema[]])
    }
  }

  return Type.Intersect([schema, Type.Not(Type.Literal(implicitYAML))])
}
```

- [ ] **Step 3: Use implicitValueYAML in exportPropertyToJSONSchema**

In `exportPropertyToJSONSchema`, replace the old block:

```ts
  const defaultYAML = getDefaultValueYAML(rule)
  if (defaultYAML !== undefined && exportedValue !== undefined) {
    return excludeDefaultFromSchema(exportedValue, defaultYAML)
  }
```

with:

```ts
  const implicitYAML = getImplicitValueYAML(rule)
  if (implicitYAML !== undefined && exportedValue !== undefined) {
    return excludeImplicitValueFromSchema(exportedValue, implicitYAML)
  }
```

- [ ] **Step 4: Run property schema tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/orchestration/property/toJSONSchemaImplicitValue.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 5: Run neighboring property tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/orchestration/property/toJSONSchemaRequired.test.ts packages/core/metadata/orchestration/jsonSchemaRefs.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 6: Commit implementation**

Run:

```bash
git add packages/core/metadata/orchestration/property/toJSONSchema.ts
git commit -m "fix: 🐛 исключить implicitValueYAML из JSON Schema"
```

### Task 3: Validation Regression Tests

**Files:**
- Modify: `packages/core/metadata/validation/validateProject.test.ts`
- Test: `packages/core/metadata/validation/validateProject.test.ts`

- [ ] **Step 1: Add document validation tests**

In `packages/core/metadata/validation/validateProject.test.ts`, after the test named `"validates every top-level metadata object with YAML directory"`, add:

```ts
  it("rejects explicit document implicit YAML boolean value", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Документ/ПоступлениеТоваровУслуг/Свойства.yaml", ["Автонумерация: Истина"])

    const diagnostics = validateProject({
      projectDir,
      filePath: "Документ/ПоступлениеТоваровУслуг/Свойства.yaml",
      context: mockContext,
    }).diagnostics

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filePath: join(projectDir, "Документ", "ПоступлениеТоваровУслуг", "Свойства.yaml"),
          path: "/Автонумерация",
          source: "structure",
          severity: "error",
        }),
      ])
    )
  })

  it("accepts explicit document non-implicit YAML boolean value", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Документ/ПоступлениеТоваровУслуг/Свойства.yaml", ["Автонумерация: Ложь"])

    const diagnostics = validateProject({
      projectDir,
      filePath: "Документ/ПоступлениеТоваровУслуг/Свойства.yaml",
      context: mockContext,
    }).diagnostics

    expect(diagnostics).toEqual([])
  })
```

- [ ] **Step 2: Run validation tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/validateProject.test.ts --no-isolate
```

Expected: PASS. The first new test must report a structure diagnostic on `/Автонумерация`; the second must return no diagnostics.

- [ ] **Step 3: Commit validation tests**

Run:

```bash
git add packages/core/metadata/validation/validateProject.test.ts
git commit -m "test: 🧪 проверить implicitValueYAML при валидации проекта"
```

### Task 4: Verification

**Files:**
- Modify: none
- Test: full repository

- [ ] **Step 1: Validate the reproduced project**

Run:

```bash
pnpm --filter @nakidka/cli dev validate /Users/nikita/git/test-yaml
```

Expected: FAIL with a structure error for `/Users/nikita/git/test-yaml/Документ/ПоступлениеТоваровУслуг/Свойства.yaml` at `/Автонумерация`.

- [ ] **Step 2: Run all tests from repository root**

Run:

```bash
pnpm test
```

Expected: PASS for all packages.

- [ ] **Step 3: Inspect final diff**

Run:

```bash
git diff --stat HEAD~3..HEAD
git diff HEAD~3..HEAD -- packages/core/metadata/orchestration/property/toJSONSchema.ts packages/core/metadata/orchestration/property/toJSONSchemaImplicitValue.test.ts packages/core/metadata/validation/validateProject.test.ts
```

Expected: only the schema exclusion implementation and the two focused test files changed.

---

## Self-Review

**Spec coverage:** План покрывает boolean, number, string including `""`, SystemEnumeration, function `implicitValueYAML`, отсутствие fallback на `defaultValue`, и пользовательский пример `Автонумерация: Истина`.

**Placeholder scan:** В плане нет `TBD`, `TODO`, `implement later`, расплывчатого "add validation" или ссылок "similar to". Каждый шаг с изменением кода содержит конкретный код.

**Type consistency:** Везде используются существующие `PropertyRule`, `TSchema`, `Type`, `exportPropertyToJSONSchema`, `validateProject`, `mockContext`. Имена помощников совпадают между шагами: `getImplicitValueYAML` и `excludeImplicitValueFromSchema`.
