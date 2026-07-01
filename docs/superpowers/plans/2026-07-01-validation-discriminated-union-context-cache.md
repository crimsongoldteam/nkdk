# Validation Discriminated Union Context Cache Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cache discriminated-union expansion context per compiled TypeBox `TypeCheck` so full YAML validation does not repeatedly traverse the same large schema for every invalid file.

**Architecture:** Keep the optimization local to `packages/core/metadata/validation/discriminatedUnionErrors.ts`. Add a `WeakMap<TypeCheck<TSchema>, ExpansionContext>` and small test-only counters, then keep `validateProject`, schema export, YAML import, and diagnostic formatting unchanged.

**Tech Stack:** TypeScript, TypeBox `TypeCompiler`/`TypeCheck`, Vitest, existing `@nakidka/core` validation tests.

---

### Task 1: Add a Failing Cache Regression Test

**Files:**
- Modify: `packages/core/metadata/validation/validateFile.test.ts`

- [ ] **Step 1: Extend the discriminated-union import surface used by the test**

Add this import after the existing `typeboxErrorsToDiagnostics` import:

```ts
import {
  expandDiscriminatedUnionErrors,
  getDiscriminatedUnionExpansionContextBuildCountForTests,
  resetDiscriminatedUnionExpansionContextCacheForTests,
} from "./discriminatedUnionErrors"
```

- [ ] **Step 2: Add the failing test**

Add this test inside the existing `describe("validateFile", () => { ... })` block, after the test named `раскрывает discriminantKey union с Type.Ref из корневой схемы`:

```ts
  it("кэширует контекст ссылок для повторного раскрытия одной TypeCheck-схемы", () => {
    resetDiscriminatedUnionExpansionContextCacheForTests()
    const parsed = parseMetadataYaml(
      `Элементы:\n  Группа1:\n    Вид: Группа\n    Элементы:\n      Надпись1:\n        Вид: Надпись\n        Заголовок: 123\n`
    )
    const errors = [...referencedNestedDiscriminatedUnionSchema.Errors(parsed.data)]

    const first = expandDiscriminatedUnionErrors(errors, referencedNestedDiscriminatedUnionSchema)
    const second = expandDiscriminatedUnionErrors(errors, referencedNestedDiscriminatedUnionSchema)

    expect(second).toEqual(first)
    expect(getDiscriminatedUnionExpansionContextBuildCountForTests()).toBe(1)
  })
```

- [ ] **Step 3: Run the focused test and confirm it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/validateFile.test.ts --no-isolate
```

Expected: FAIL because `./discriminatedUnionErrors` does not yet export `getDiscriminatedUnionExpansionContextBuildCountForTests` and `resetDiscriminatedUnionExpansionContextCacheForTests`.

### Task 2: Cache ExpansionContext by TypeCheck

**Files:**
- Modify: `packages/core/metadata/validation/discriminatedUnionErrors.ts`
- Test: `packages/core/metadata/validation/validateFile.test.ts`

- [ ] **Step 1: Add cache state near `unionSchemaCache`**

Replace:

```ts
const unionSchemaCache = new WeakMap<TSchema, Map<string, BranchCache>>()
```

with:

```ts
const emptyExpansionContext: ExpansionContext = { references: [], referenceKey: "" }
const unionSchemaCache = new WeakMap<TSchema, Map<string, BranchCache>>()
let expansionContextCache = new WeakMap<TypeCheck<TSchema>, ExpansionContext>()
let expansionContextBuildCountForTests = 0
```

- [ ] **Step 2: Add cached context helpers before `expandDiscriminatedUnionErrors`**

Insert this block after `isSchema`:

```ts
function getExpansionContext(schema?: TypeCheck<TSchema>): ExpansionContext {
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

  return {
    references,
    referenceKey: references.map((reference) => reference.$id).filter((id): id is string => typeof id === "string").join("\u0000"),
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

- [ ] **Step 3: Replace context creation in `expandDiscriminatedUnionErrors`**

Replace the whole function:

```ts
export function expandDiscriminatedUnionErrors(errors: ValueError[], schema?: TypeCheck<TSchema>): ValueError[] {
  const references = schema === undefined ? [] : collectSchemaReferences(schema.Schema(), schema.References())
  const context = {
    references,
    referenceKey: references.map((reference) => reference.$id).filter((id): id is string => typeof id === "string").join("\u0000"),
  }

  return expandDiscriminatedUnionErrorsWithContext(errors, context)
}
```

with:

```ts
export function expandDiscriminatedUnionErrors(errors: ValueError[], schema?: TypeCheck<TSchema>): ValueError[] {
  return expandDiscriminatedUnionErrorsWithContext(errors, getExpansionContext(schema))
}
```

- [ ] **Step 4: Run the focused validation test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/validateFile.test.ts --no-isolate
```

Expected: PASS. The new test should prove that two calls with the same `TypeCheck` build the expansion context once.

- [ ] **Step 5: Commit the focused implementation**

Run:

```bash
git add packages/core/metadata/validation/discriminatedUnionErrors.ts packages/core/metadata/validation/validateFile.test.ts
git commit -m "perf: :zap: кэшировать контекст validation union"
```

### Task 3: Verify Behavior and Measure the Effect

**Files:**
- No code changes expected.

- [ ] **Step 1: Run the wider validation tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/validateFile.test.ts metadata/validation/validateProject.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 2: Run the core type check**

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
/usr/bin/time -p pnpm --filter @nakidka/cli dev validate /Users/nikita/git/nkdk-yaml >/tmp/nkdk-validation-context-cache.log 2>&1
```

Expected: command exits with validation errors for the project, not a process crash. `/tmp/nkdk-validation-context-cache.log` should end with `summary: 49533 error, 0 warning` or a nearby count if the fixture project changed. Compare `real` with the previous baseline around `478.89` seconds for normal validate and `532.85` seconds for CPU-profiled validate.

- [ ] **Step 5: Report the result**

In the final response, mention:

```text
Implemented WeakMap cache for discriminated-union expansion context.
Focused validation tests: PASS.
Core type-check: PASS.
Full pnpm test: PASS.
Full /Users/nikita/git/nkdk-yaml validate: completed; real time taken from /usr/bin/time output.
```
