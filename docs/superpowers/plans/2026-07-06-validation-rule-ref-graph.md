# Ref-граф validation-схем Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сделать так, чтобы validation worker компилировал все схемы при запуске и переиспользовал rule-backed схемы через `$ref`, начиная с форм и обычных зарегистрированных common-схем.

**Architecture:** Развиваем существующий `project/schemaRegistry.ts` и `orchestration/jsonSchemaRefs.ts`: корневые схемы собирают достижимые `nkdk://schema/...` ссылки, referenced schemas экспортируются один раз с `$id`, а validation cache компилирует root validators вместе с graph context. Worker получает отдельную init-фазу с `context`; first-pass не начинается, пока init не скомпилировал все validation-схемы.

**Tech Stack:** TypeScript, Vitest, AJV 2020, TypeBox, `node:worker_threads`, существующие `rules.ts`/schema registry.

---

## Baseline

Перед планом создан worktree `/Users/nikita/git/nkdk/.worktrees/validation-rule-ref-graph` на ветке `codex/validation-rule-ref-graph`.

`pnpm install` прошёл успешно.

`pnpm test` на baseline упал на уже существующих таймаутах:

- `metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/fromYAML.test.ts` — timeout `5000ms`;
- `metadata/validation/validateProject.test.ts` — timeout `90000ms`.

Реализация не должна маскировать эти таймауты. Перед завершением всё равно нужно добиться зелёного `pnpm test`.

## File Structure

- Modify: `packages/core/metadata/orchestration/jsonSchemaRefs.ts`
  - экспортировать сбор refs из схемы;
  - добавить helper для удаления служебного `x-nkdk-schemaRefs` перед компиляцией.
- Modify: `packages/core/metadata/project/schemaRegistry.ts`
  - добавлять `$id` к named schemas;
  - экспортировать graph builder для root schema и reachable referenced schemas.
- Modify: `packages/core/metadata/validation/projectFileSchema.ts`
  - реэкспортировать graph helpers на validation-level, если tests/consumers должны идти через validation facade.
- Modify: `packages/core/metadata/validation/compileValidationSchema.ts`
  - экспортировать `SchemaContext`;
  - добавить параметры компиляции AJV (`inlineRefs`) и eager fallback;
  - избегать ленивой TypeBox-компиляции при worker init.
- Modify: `packages/core/metadata/validation/projectValidationPasses.ts`
  - добавить `compileAll()`/`initialize()` в `ValidationSchemaCache`;
  - формовую схему компилировать через graph context вместо `stripExternalRefsForValidation`;
  - properties-схемы готовить через graph context там, где есть refs.
- Modify: `packages/core/metadata/validation/projectValidationWorker.ts`
  - добавить message `init`;
  - хранить `schemaCache` в worker state;
  - запретить first-pass без init.
- Modify: `packages/core/metadata/validation/projectValidationWorkerPool.ts`
  - изменить `start(context)` и протокол init;
  - добавить профиль `schemaCompileMs`/`workerInitMs`.
- Modify: `packages/core/metadata/validation/validateProject.ts`
  - передавать `context` в `pool.start(context)`;
  - логировать init/schema compile в профиле.
- Tests:
  - `packages/core/metadata/orchestration/jsonSchemaRefs.test.ts`
  - `packages/core/metadata/validation/schemaRegistry.test.ts`
  - `packages/core/metadata/validation/projectFileSchema.test.ts`
  - `packages/core/metadata/validation/compileValidationSchema.test.ts`
  - `packages/core/metadata/validation/projectValidationPasses.test.ts`
  - `packages/core/metadata/validation/projectValidationWorkerPool.test.ts`

## Task 1: Schema Ref Graph Helpers

**Files:**
- Modify: `packages/core/metadata/orchestration/jsonSchemaRefs.ts`
- Modify: `packages/core/metadata/project/schemaRegistry.ts`
- Test: `packages/core/metadata/orchestration/jsonSchemaRefs.test.ts`
- Test: `packages/core/metadata/validation/schemaRegistry.test.ts`

- [ ] **Step 1: Write tests for exported ref collection**

Add to `packages/core/metadata/orchestration/jsonSchemaRefs.test.ts`:

```ts
it("collects nested nkdk schema refs from arbitrary schema nodes", () => {
  expect(
    collectSchemaRefs({
      type: "object",
      properties: {
        Реквизиты: {
          type: "object",
          additionalProperties: { $ref: "nkdk://schema/MetadataAttribute" },
        },
        Inline: { $ref: "#/$defs/Local" },
      },
      "x-nkdk-schemaRefs": ["nkdk://schema/FormAttribute"],
    })
  ).toEqual(["nkdk://schema/FormAttribute", "nkdk://schema/MetadataAttribute"])
})

it("removes collected ref metadata without changing schema refs", () => {
  expect(
    stripCollectedSchemaRefs({
      type: "object",
      "x-nkdk-schemaRefs": ["nkdk://schema/FormAttribute"],
      properties: {
        Реквизиты: { $ref: "nkdk://schema/FormAttribute" },
      },
    })
  ).toEqual({
    type: "object",
    properties: {
      Реквизиты: { $ref: "nkdk://schema/FormAttribute" },
    },
  })
})
```

Expected before implementation: TypeScript/Vitest fails because `collectSchemaRefs` and `stripCollectedSchemaRefs` are not exported.

- [ ] **Step 2: Implement ref helpers**

In `packages/core/metadata/orchestration/jsonSchemaRefs.ts`, replace private `findSchemaRefs` usage with exported helpers:

```ts
const COLLECTED_SCHEMA_REFS_KEY = "x-nkdk-schemaRefs"

export function collectSchemaRefs(schema: unknown): string[] {
  return [...new Set(findSchemaRefs(schema))].sort()
}

export function stripCollectedSchemaRefs<const Schema>(schema: Schema): Schema {
  return stripCollectedSchemaRefsNode(schema) as Schema
}

function stripCollectedSchemaRefsNode(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripCollectedSchemaRefsNode)
  if (value === null || typeof value !== "object") return value

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key !== COLLECTED_SCHEMA_REFS_KEY)
      .map(([key, entry]) => [key, stripCollectedSchemaRefsNode(entry)])
  )
}
```

Update `attachCollectedSchemaRefs` to use `COLLECTED_SCHEMA_REFS_KEY` and `collectSchemaRefs`.

- [ ] **Step 3: Write tests for named schema graph export**

Add to `packages/core/metadata/validation/schemaRegistry.test.ts`:

```ts
it("exports named schema graph with stable ids for referenced schemas", () => {
  const graph = exportJSONSchemaGraph({
    context,
    roots: [{ key: "form", name: "ClientApplicationForm", includeNestedChildItems: true }],
  })

  expect(graph.roots.form).toMatchObject({
    type: "object",
    "x-nkdk-schemaRefs": expect.arrayContaining(["nkdk://schema/FormAttribute"]),
  })
  expect(graph.schemas["nkdk://schema/FormAttribute"]).toMatchObject({
    $id: "nkdk://schema/FormAttribute",
    type: "object",
  })
  expect(graph.schemas["nkdk://schema/InputField"]).toMatchObject({
    $id: "nkdk://schema/InputField",
    properties: expect.objectContaining({
      Вид: expect.objectContaining({ const: "ПолеВвода" }),
    }),
  })
})
```

Expected before implementation: fail because `exportJSONSchemaGraph` does not exist.

- [ ] **Step 4: Implement graph export in registry**

In `packages/core/metadata/project/schemaRegistry.ts`, add:

```ts
export interface JSONSchemaGraphRoot {
  key: string
  name: string
  includeNestedChildItems?: boolean
}

export interface JSONSchemaGraph {
  roots: Record<string, TSchema>
  schemas: Record<string, TSchema>
}

export function exportJSONSchemaGraph(params: {
  context: ConfigurationContext
  roots: readonly JSONSchemaGraphRoot[]
  mode?: JSONSchemaExportMode
}): JSONSchemaGraph {
  ensureJSONSchemaRegistry()

  const roots: Record<string, TSchema> = {}
  const schemas: Record<string, TSchema> = {}
  const pendingRefs: string[] = []

  for (const root of params.roots) {
    const schema = exportJSONSchemaForSchemaName({
      context: params.context,
      name: root.name,
      mode: params.mode ?? "externalRefs",
      includeNestedChildItems: root.includeNestedChildItems,
    })
    roots[root.key] = schema
    pendingRefs.push(...collectSchemaRefs(schema))
  }

  for (let index = 0; index < pendingRefs.length; index += 1) {
    const ref = pendingRefs[index]!
    if (schemas[ref] !== undefined) continue

    const name = schemaNameFromRef(ref)
    const schema = withSchemaId(
      ref,
      exportJSONSchemaForSchemaName({
        context: params.context,
        name,
        mode: params.mode ?? "externalRefs",
      })
    )
    schemas[ref] = schema
    pendingRefs.push(...collectSchemaRefs(schema))
  }

  return { roots, schemas }
}

export function schemaNameFromRef(ref: string): string {
  if (!ref.startsWith(JSON_SCHEMA_REF_PREFIX)) {
    throw new ProjectFileSchemaError(`Некорректная JSON Schema ссылка "${ref}"`)
  }
  return ref.slice(JSON_SCHEMA_REF_PREFIX.length)
}

function withSchemaId(ref: string, schema: TSchema): TSchema {
  return { ...stripCollectedSchemaRefs(schema), $id: ref } as TSchema
}
```

Import `collectSchemaRefs`, `stripCollectedSchemaRefs`, `JSON_SCHEMA_REF_PREFIX` from `jsonSchemaRefs.ts`.

- [ ] **Step 5: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/orchestration/jsonSchemaRefs.test.ts metadata/validation/schemaRegistry.test.ts
```

Expected: new tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/orchestration/jsonSchemaRefs.ts \
  packages/core/metadata/project/schemaRegistry.ts \
  packages/core/metadata/orchestration/jsonSchemaRefs.test.ts \
  packages/core/metadata/validation/schemaRegistry.test.ts
git commit -m "feat: :sparkles: добавить ref-граф validation-схем"
```

## Task 2: AJV Graph Compilation Boundary

**Files:**
- Modify: `packages/core/metadata/validation/compileValidationSchema.ts`
- Test: `packages/core/metadata/validation/compileValidationSchema.test.ts`

- [ ] **Step 1: Write tests for graph refs and eager fallback**

Add tests to `compileValidationSchema.test.ts`:

```ts
it("compiles root schema against external nkdk refs", () => {
  const child = Type.Object({ Имя: Type.String() }, { $id: "nkdk://schema/TestChild" })
  const root = Type.Object({
    Ребёнок: { $ref: "nkdk://schema/TestChild" } as unknown as TSchema,
  })

  const compiled = compileValidationSchema(
    { "nkdk://schema/TestChild": child },
    root,
    { inlineRefs: false }
  )

  expect(compiled.Check({ Ребёнок: { Имя: "Тест" } })).toBe(true)
  expect(compiled.Check({ Ребёнок: { Имя: 10 } })).toBe(false)
})

it("can compile TypeBox fallback eagerly for schemas with local defs", () => {
  const schema = Type.Object({
    Значение: Type.Ref("Local"),
    $defs: {
      Local: Type.String(),
    },
  } as never)

  const compiled = compileValidationSchema(schema, { eagerFallback: true })

  expect(compiled.Check({ Значение: "ok" })).toBe(true)
})
```

Expected before implementation: overload/type failure for third argument and `eagerFallback`.

- [ ] **Step 2: Extend compile overloads**

In `compileValidationSchema.ts`, export context and options:

```ts
export type SchemaContext = Record<string, TSchema>

export interface CompileValidationSchemaOptions {
  inlineRefs?: Options["inlineRefs"]
  eagerFallback?: boolean
}
```

Add overloads:

```ts
export function compileValidationSchema<const Type extends TSchema>(
  schema: Type,
  options?: CompileValidationSchemaOptions
): ValidationSchemaValidator<Type>
export function compileValidationSchema<Context extends SchemaContext, const Type extends TSchema>(
  context: Context,
  schema: Type,
  options?: CompileValidationSchemaOptions
): ValidationSchemaValidator<Type>
```

Parse arguments so existing calls remain valid.

- [ ] **Step 3: Apply AJV options and eager fallback**

Change `createAjv` signature:

```ts
function createAjv(
  context: SchemaContext,
  options: Pick<Options, "allErrors" | "inlineRefs">
): Ajv2020 {
  const ajv = new Ajv2020({ ...ajvOptions, ...options })
  addFormats(ajv)

  for (const [key, schema] of Object.entries(context)) {
    ajv.addSchema(prepareSchemaForAjv(schema, { keepRootId: true }), key)
  }

  return ajv
}
```

When `eagerFallback === true && useFallbackCheck === true`, initialize fallback immediately:

```ts
if (options.eagerFallback === true && useFallbackCheck) {
  fallback = createTypeboxFallback(context, schema, maybeSchema !== undefined)
}
```

- [ ] **Step 4: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/validation/compileValidationSchema.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/validation/compileValidationSchema.ts \
  packages/core/metadata/validation/compileValidationSchema.test.ts
git commit -m "feat: :sparkles: компилировать validation-схемы с ref-графом"
```

## Task 3: Validation Schema Cache Compiles All Schemas

**Files:**
- Modify: `packages/core/metadata/validation/projectValidationPasses.ts`
- Modify: `packages/core/metadata/validation/projectFileSchema.ts`
- Test: `packages/core/metadata/validation/projectValidationPasses.test.ts`
- Test: `packages/core/metadata/validation/projectFileSchema.test.ts`

- [ ] **Step 1: Write tests for graph-backed form validation**

Add to `projectValidationPasses.test.ts`:

```ts
it("compiles all validation schemas before validating files", () => {
  const cache = createValidationSchemaCache({ version: "2.20", defaultLanguage: "ru" })
  const result = cache.compileAll()

  expect(result.formMs).toBeGreaterThanOrEqual(0)
  expect(result.propertiesMs).toBeGreaterThanOrEqual(0)
  expect(cache.form().Check({ Элементы: {} })).toBe(true)
})
```

Add to `projectFileSchema.test.ts`:

```ts
it("exports form schema graph without replacing element refs with any", () => {
  const graph = exportJSONSchemaGraph({
    context,
    roots: [{ key: "form", name: "ClientApplicationForm", includeNestedChildItems: true }],
  })

  expect(JSON.stringify(graph.roots.form)).toContain("nkdk://schema/FormAttribute")
  expect(JSON.stringify(graph.schemas["nkdk://schema/FormAttribute"])).toContain('"Тип"')
})
```

Expected before implementation: `compileAll` missing and `exportJSONSchemaGraph` may not be re-exported from validation facade.

- [ ] **Step 2: Re-export graph helper from validation facade**

In `packages/core/metadata/validation/projectFileSchema.ts`, add:

```ts
export {
  exportJSONSchemaGraph,
  schemaNameFromRef,
  type JSONSchemaGraph,
  type JSONSchemaGraphRoot,
} from "../project/schemaRegistry"
```

- [ ] **Step 3: Extend ValidationSchemaCache**

In `projectValidationPasses.ts`, update interface:

```ts
export interface ValidationSchemaCacheCompileProfile {
  formMs: number
  propertiesMs: number
  totalMs: number
}

export interface ValidationSchemaCache {
  form: () => CompiledSchema
  properties: (spec: ValidationProjectSpec) => CompiledSchema
  compileAll: () => ValidationSchemaCacheCompileProfile
}
```

- [ ] **Step 4: Compile form through graph context**

Replace `compileRegisteredFormSchema` with graph-backed compilation:

```ts
function compileRegisteredFormSchema(context: ConfigurationContext): CompiledSchema {
  const cacheKey = `${context.version}:${context.defaultLanguage}`
  const cached = formSchemaCache.get(cacheKey)
  if (cached !== undefined) return cached

  const graph = exportJSONSchemaGraph({
    context,
    roots: [{ key: "form", name: "ClientApplicationForm", includeNestedChildItems: true }],
  })
  const compiled = compileValidationSchema(graph.schemas, graph.roots["form"]!, {
    inlineRefs: false,
    eagerFallback: true,
  })
  formSchemaCache.set(cacheKey, compiled)
  return compiled
}
```

Keep `stripExternalRefsForValidation` temporarily only if properties schemas still need it; remove it when no longer used.

- [ ] **Step 5: Add compileAll implementation**

Inside `createValidationSchemaCache` return object:

```ts
compileAll() {
  const startedAt = performance.now()
  const formStartedAt = performance.now()
  this.form()
  const formMs = performance.now() - formStartedAt

  const propertiesStartedAt = performance.now()
  for (const spec of validationProjectSpecs) {
    this.properties(spec)
  }
  this.properties(configurationValidationProjectSpec)
  const propertiesMs = performance.now() - propertiesStartedAt

  return {
    formMs,
    propertiesMs,
    totalMs: performance.now() - startedAt,
  }
}
```

Import `configurationValidationProjectSpec`, `validationProjectSpecs` from `projectSpecs.ts`.

- [ ] **Step 6: Keep properties conservative**

For this task, keep properties schemas on the existing `mode: "inline"` path unless a test proves a registered property ref already works with graph context. This respects the allowlist rollout: stage 1 starts with forms, while ordinary common objects are prepared by registry tests but not forced for every properties root yet.

- [ ] **Step 7: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate \
  metadata/validation/projectValidationPasses.test.ts \
  metadata/validation/projectFileSchema.test.ts \
  metadata/validation/schemaRegistry.test.ts
```

Expected: pass.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/validation/projectValidationPasses.ts \
  packages/core/metadata/validation/projectFileSchema.ts \
  packages/core/metadata/validation/projectValidationPasses.test.ts \
  packages/core/metadata/validation/projectFileSchema.test.ts
git commit -m "feat: :sparkles: компилировать кэш validation-схем целиком"
```

## Task 4: Worker Initialization Requires Schema Compilation

**Files:**
- Modify: `packages/core/metadata/validation/projectValidationWorker.ts`
- Modify: `packages/core/metadata/validation/projectValidationWorkerPool.ts`
- Modify: `packages/core/metadata/validation/validateProject.ts`
- Test: `packages/core/metadata/validation/projectValidationWorkerPool.test.ts`

- [ ] **Step 1: Write worker init tests**

Update `projectValidationWorkerPool.test.ts`:

```ts
it("requires context at worker start and compiles schemas before first pass", async () => {
  const pool = createProjectValidationWorkerPool({ concurrency: 1 })
  try {
    const init = await pool.start({
      version: "2.20",
      defaultLanguage: "ru",
      exportToYAML: { toTyped: false },
    })

    expect(pool.size()).toBe(1)
    expect(init.schemaCompileMs).toBeGreaterThanOrEqual(0)
  } finally {
    await pool.close()
  }
})
```

Update existing tests that call `pool.start()` to pass the context:

```ts
await pool.start({
  version: "2.20",
  defaultLanguage: "ru",
  exportToYAML: { toTyped: false },
})
```

Expected before implementation: type failure because `start` takes no context.

- [ ] **Step 2: Extend worker message protocol**

In `projectValidationWorker.ts`, add message variant:

```ts
| {
    id: number
    kind: "init"
    context: ConfigurationContext
  }
```

Add state:

```ts
let workerSchemaCache: ValidationSchemaCache | undefined
let workerSchemaContextKey: string | undefined
```

Add helper:

```ts
function contextKey(context: ConfigurationContext): string {
  return JSON.stringify({
    version: context.version,
    defaultLanguage: context.defaultLanguage,
    exportToYAML: context.exportToYAML,
  })
}
```

- [ ] **Step 3: Implement init handler**

In message handler:

```ts
if (message.kind === "init") {
  parentPort?.postMessage({ id: message.id, kind: "initResult", ...runInit(message) })
  return
}
```

Add:

```ts
function runInit(message: Extract<ValidationWorkerMessage, { kind: "init" }>): {
  schemaCompileMs: number
  formSchemaMs: number
  propertiesSchemaMs: number
} {
  const key = contextKey(message.context)
  if (workerSchemaCache !== undefined && workerSchemaContextKey === key) {
    return { schemaCompileMs: 0, formSchemaMs: 0, propertiesSchemaMs: 0 }
  }

  const startedAt = performance.now()
  const schemaCache = createValidationSchemaCache(message.context)
  const profile = schemaCache.compileAll()
  workerSchemaCache = schemaCache
  workerSchemaContextKey = key
  return {
    schemaCompileMs: performance.now() - startedAt,
    formSchemaMs: profile.formMs,
    propertiesSchemaMs: profile.propertiesMs,
  }
}
```

- [ ] **Step 4: Enforce init before first pass**

In `runFirstPass`, replace local schema cache:

```ts
if (workerSchemaCache === undefined || workerSchemaContextKey !== contextKey(message.context)) {
  throw new Error("Validation worker не инициализирован для переданного context")
}
const schemaCache = workerSchemaCache
```

Remove `const schemaCache = createValidationSchemaCache(message.context)` from `runFirstPass`.

- [ ] **Step 5: Update pool start contract**

In `projectValidationWorkerPool.ts`:

```ts
export interface WorkerInitResult {
  schemaCompileMs: number
  formSchemaMs: number
  propertiesSchemaMs: number
  workerInitMs: number
}

export interface ProjectValidationWorkerPool {
  start(context: ConfigurationContext): Promise<WorkerInitResult>
  close(): Promise<void>
  size(): number
  runFirstPass(params: FirstPassPoolParams): Promise<FirstPassPoolResult>
  runSecondPass(params: SecondPassPoolParams): Promise<SecondPassPoolResult>
}
```

Add `initResult` response variant:

```ts
| {
    kind: "initResult"
    schemaCompileMs: number
    formSchemaMs: number
    propertiesSchemaMs: number
  }
```

Implement `start(context)`:

```ts
async start(context) {
  while (workers.length < params.concurrency) workers.push(createWorker())
  const startedAt = performance.now()
  const results = await Promise.all(
    workers.map((worker) => request(worker, { kind: "init", context }))
  )
  for (const result of results) {
    if (result.kind !== "initResult") throw new Error("Worker вернул неожиданный результат init")
  }
  return {
    schemaCompileMs: results.reduce((sum, result) => sum + result.schemaCompileMs, 0),
    formSchemaMs: results.reduce((sum, result) => sum + result.formSchemaMs, 0),
    propertiesSchemaMs: results.reduce((sum, result) => sum + result.propertiesSchemaMs, 0),
    workerInitMs: performance.now() - startedAt,
  }
}
```

- [ ] **Step 6: Update validateProject orchestration**

In `validateProject.ts`:

```ts
let workerInitMs = 0
let schemaCompileMs = 0
let formSchemaMs = 0
let propertiesSchemaMs = 0
```

Replace:

```ts
await pool.start()
startMs = performance.now() - startStartedAt
```

with:

```ts
const init = await pool.start(context)
startMs = performance.now() - startStartedAt
workerInitMs = init.workerInitMs
schemaCompileMs = init.schemaCompileMs
formSchemaMs = init.formSchemaMs
propertiesSchemaMs = init.propertiesSchemaMs
```

Extend `logWorkerValidationProfile` params and output:

```ts
`workerInit=${params.workerInitMs.toFixed(2)}ms`,
`schemaCompile=${params.schemaCompileMs.toFixed(2)}ms`,
`formSchema=${params.formSchemaMs.toFixed(2)}ms`,
`propertiesSchema=${params.propertiesSchemaMs.toFixed(2)}ms`,
```

- [ ] **Step 7: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate \
  metadata/validation/projectValidationWorkerPool.test.ts \
  metadata/validation/validateProject.test.ts
```

Expected: pass or only known timeout if runtime exceeds existing limit. If timeout appears, record exact test and duration before changing timeout.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/validation/projectValidationWorker.ts \
  packages/core/metadata/validation/projectValidationWorkerPool.ts \
  packages/core/metadata/validation/validateProject.ts \
  packages/core/metadata/validation/projectValidationWorkerPool.test.ts
git commit -m "feat: :sparkles: инициализировать worker-ы validation схемами"
```

## Task 5: Measure Ref Graph and Memory

**Files:**
- Create: `packages/core/scripts/measure-validation-schemas.mjs`
- Modify: `packages/core/package.json`
- Test: no unit test; this is a diagnostic script used by verification.

- [ ] **Step 1: Add measurement script**

Create `packages/core/scripts/measure-validation-schemas.mjs`:

```js
import { performance } from "node:perf_hooks"

const { createValidationSchemaCache } = await import("../metadata/validation/projectValidationPasses.ts")

const context = {
  version: "2.20",
  defaultLanguage: "ru",
  exportToYAML: { toTyped: false },
}

const started = performance.now()
const cache = createValidationSchemaCache(context)
const profile = cache.compileAll()

console.log(
  JSON.stringify(
    {
      elapsedMs: Math.round(performance.now() - started),
      profile: {
        formMs: Math.round(profile.formMs),
        propertiesMs: Math.round(profile.propertiesMs),
        totalMs: Math.round(profile.totalMs),
      },
      memory: process.memoryUsage(),
    },
    null,
    2
  )
)
```

- [ ] **Step 2: Add package script**

In `packages/core/package.json` scripts:

```json
"measure:validation-schemas": "tsx scripts/measure-validation-schemas.mjs"
```

- [ ] **Step 3: Run schema measurement**

Run:

```bash
pnpm --filter @nakidka/core measure:validation-schemas
```

Expected: JSON with `elapsedMs`, `profile`, and `memory`.

- [ ] **Step 4: Run project validation profile on real YAML**

Run:

```bash
NKDK_VALIDATION_PROFILE=1 pnpm --filter @nakidka/core exec tsx -e "void (async () => { const { validateProject } = await import('./metadata/validation/validateProject.ts'); const started = performance.now(); const result = await validateProject({ projectDir: '/Users/nikita/git/nkdk-yaml', concurrency: 4 }); console.log(JSON.stringify({ elapsedMs: Math.round(performance.now() - started), diagnostics: result.diagnostics.length, memory: process.memoryUsage() }, null, 2)); })();"
```

Expected: command completes; profile output includes worker init/schema compile timings; diagnostics count is recorded for parity.

- [ ] **Step 5: Commit**

```bash
git add packages/core/scripts/measure-validation-schemas.mjs packages/core/package.json
git commit -m "test: :white_check_mark: добавить замер validation-схем"
```

## Task 6: Full Verification and Stabilization

**Files:**
- Modify only files needed to fix regressions found by verification.
- Do not change XML fixtures.

- [ ] **Step 1: Run type-check**

Run:

```bash
pnpm --filter @nakidka/core type-check
```

Expected: exit 0.

- [ ] **Step 2: Run focused validation tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate \
  metadata/orchestration/jsonSchemaRefs.test.ts \
  metadata/validation/compileValidationSchema.test.ts \
  metadata/validation/schemaRegistry.test.ts \
  metadata/validation/projectFileSchema.test.ts \
  metadata/validation/projectValidationPasses.test.ts \
  metadata/validation/projectValidationWorkerPool.test.ts \
  metadata/validation/validateProject.test.ts
```

Expected: exit 0. If DCS timeout from baseline remains, fix timeout only with evidence from runtime after implementation, not as a blind increase.

- [ ] **Step 3: Run full project tests**

Run from repository root:

```bash
pnpm test
```

Expected: exit 0.

- [ ] **Step 4: Compare real-project validation**

Run:

```bash
NKDK_VALIDATION_PROFILE=1 pnpm --filter @nakidka/core exec tsx -e "void (async () => { const { validateProject } = await import('./metadata/validation/validateProject.ts'); const started = performance.now(); const result = await validateProject({ projectDir: '/Users/nikita/git/nkdk-yaml', concurrency: 4 }); const diagnostics = result.diagnostics; console.log(JSON.stringify({ elapsedMs: Math.round(performance.now() - started), diagnostics: { total: diagnostics.length, bySeverity: diagnostics.reduce((acc, diagnostic) => { acc[diagnostic.severity] = (acc[diagnostic.severity] ?? 0) + 1; return acc }, {}) }, memory: process.memoryUsage() }, null, 2)); })();"
```

Expected: completes; diagnostics count is explainable compared with the pre-change run; memory and schema compile timings are recorded in final notes.

- [ ] **Step 5: Commit final fixes if needed**

If verification required changes, inspect the exact file list first:

```bash
git status --short
```

Then stage only files changed by the verification fix and commit:

```bash
git add packages/core/metadata/validation/compileValidationSchema.ts \
  packages/core/metadata/validation/projectValidationPasses.ts \
  packages/core/metadata/validation/projectValidationWorker.ts \
  packages/core/metadata/validation/projectValidationWorkerPool.ts \
  packages/core/metadata/validation/validateProject.ts \
  packages/core/metadata/validation/*.test.ts \
  packages/core/metadata/orchestration/jsonSchemaRefs.ts \
  packages/core/metadata/orchestration/jsonSchemaRefs.test.ts
git commit -m "fix: :bug: стабилизировать ref-граф validation-схем"
```

If no changes were required, do not create an empty commit.

## Self-Review

- Spec coverage: plan covers named rule-backed refs, worker startup compilation, AJV `inlineRefs`, allowlist rollout, DCS caution, error handling, tests, and performance verification.
- Placeholder scan: unresolved placeholders are absent.
- Type consistency: `ValidationSchemaCache.compileAll`, `exportJSONSchemaGraph`, `SchemaContext`, `CompileValidationSchemaOptions`, and `ProjectValidationWorkerPool.start(context)` are introduced before later tasks use them.
