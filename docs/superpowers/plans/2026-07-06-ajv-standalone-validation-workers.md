# AJV Standalone Validation Workers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** собрать `@nakidka/core` так, чтобы validation worker-ы в `dist` использовали готовые AJV standalone-валидаторы и не компилировали проектные JSON Schema в runtime.

**Architecture:** Standalone остаётся внутренним ресурсом worker-а: build генерирует `dist/projectValidationAjvStandalone.js`, worker импортирует его и строит `ValidationSchemaCache` из готовых AJV-функций. In-process validation и source/test worker-ы продолжают использовать текущий runtime cache через `compileValidationSchema`, чтобы разработка из `.ts` не зависела от `dist`.

**Tech Stack:** TypeScript, Node.js, Piscina, AJV 8 standalone, TypeBox 1.3.3, esbuild, Vitest, pnpm.

---

## File Structure

- Modify: `packages/core/metadata/validation/compileValidationSchema.ts`  
  Экспортирует `SchemaContext`, `prepareSchemaForAjv` и wrapper готовой AJV-функции в `ValidationSchemaValidator`.

- Modify: `packages/core/metadata/validation/compileValidationSchema.test.ts`  
  Проверяет wrapper готовой AJV-функции, `Check`, `Errors`, `Schema`, `Context` и нормализацию `required/additionalProperties`.

- Create: `packages/core/metadata/validation/projectValidationStandaloneTypes.ts`  
  Описывает внутренний формат generated-модуля.

- Create: `packages/core/metadata/validation/projectValidationStandaloneSchemas.ts`  
  Собирает form/properties schemas для продукционного context `2.20/ru/toTyped=false`.

- Create: `packages/core/metadata/validation/projectValidationStandaloneLoader.ts`  
  Загружает generated-модуль и создаёт `ValidationSchemaCache`.

- Create: `packages/core/metadata/validation/projectValidationStandaloneLoader.test.ts`  
  Проверяет loader на generated-like модуле и ошибку несовместимого context.

- Create: `packages/core/metadata/validation/generateProjectValidationAjvStandalone.ts`  
  Генерирует ESM-модуль AJV standalone.

- Create: `packages/core/scripts/build.mjs`  
  Собирает core entrypoints, worker, generator и запускает генерацию standalone-модуля.

- Modify: `packages/core/package.json` and `pnpm-lock.yaml`  
  Добавляет `build`, `measure:validation-workers` и `esbuild`.

- Create: `packages/core/metadata/validation/projectValidationStandaloneBuild.test.ts`  
  Проверяет, что build-output можно импортировать и использовать.

- Create: `packages/core/metadata/validation/projectValidationWorkerSchemaCache.ts`  
  Выбирает runtime cache для `.ts` worker-а и standalone cache для built worker-а.

- Modify: `packages/core/metadata/validation/projectValidationWorker.ts`  
  Делает `runValidationWorkerTask` async и инициализирует worker cache через selector.

- Modify: `packages/core/metadata/validation/projectValidationWorkerPool.ts`  
  Поддерживает async default worker function result, если Piscina не разворачивает его автоматически в текущем пути.

- Modify: `packages/core/metadata/validation/projectValidationWorker.test.ts`  
  Обновляет прямые вызовы worker-а под async API.

- Modify: `packages/core/metadata/validation/projectValidationWorkerPool.test.ts`  
  Фиксирует source fallback и повторный старт worker pool.

- Create: `packages/core/scripts/measure-validation-workers.mjs`  
  Запускает built validation и печатает diagnostics summary и `process.memoryUsage()`.

---

### Task 1: Подготовить wrapper готовой AJV-функции

**Files:**
- Modify: `packages/core/metadata/validation/compileValidationSchema.ts`
- Modify: `packages/core/metadata/validation/compileValidationSchema.test.ts`

- [ ] **Step 1: Write the failing test**

Add this import to `packages/core/metadata/validation/compileValidationSchema.test.ts`:

```ts
import type { ValidateFunction } from "ajv"
```

Change the existing local import to:

```ts
import {
  compileValidationSchema,
  createValidationSchemaFromAjvFunction,
} from "./compileValidationSchema"
```

Add this test inside `describe("compileValidationSchema", () => { ... })`:

```ts
  it("оборачивает готовую AJV-функцию в совместимый интерфейс валидатора", () => {
    const schema = Type.Object({ Имя: Type.String() }, { additionalProperties: false })
    const validate = Object.assign(
      (value: unknown) => {
        const record = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {}
        if (typeof record.Имя === "string" && Object.keys(record).every((key) => key === "Имя")) {
          validate.errors = null
          return true
        }

        validate.errors = [
          {
            keyword: "required",
            instancePath: "",
            schemaPath: "#/required",
            params: { missingProperty: "Имя" },
            message: "must have required property 'Имя'",
          },
          {
            keyword: "additionalProperties",
            instancePath: "",
            schemaPath: "#/additionalProperties",
            params: { additionalProperty: "Лишнее" },
            message: "must NOT have additional properties",
          },
        ]
        return false
      },
      { errors: null as ValidateFunction["errors"] }
    ) as ValidateFunction

    const compiled = createValidationSchemaFromAjvFunction({ schema, context: {}, validate })

    expect(compiled.Check({ Имя: "Документ" })).toBe(true)
    expect(compiled.Check({ Лишнее: true })).toBe(false)
    expect(compiled.Schema()).toBe(schema)
    expect(compiled.Context()).toEqual({})

    const [, errors] = compiled.Errors({ Лишнее: true })
    expect(errors).toEqual([
      expect.objectContaining({
        keyword: "required",
        instancePath: "",
        params: { missingProperty: "Имя" },
      }),
      expect.objectContaining({
        keyword: "additionalProperties",
        instancePath: "",
        params: { additionalProperty: "Лишнее" },
      }),
    ])
  })
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/compileValidationSchema.test.ts --testNamePattern "готовую AJV"
```

Expected: FAIL with an export error for `createValidationSchemaFromAjvFunction`.

- [ ] **Step 3: Implement the wrapper**

Modify the imports in `packages/core/metadata/validation/compileValidationSchema.ts`:

```ts
import type { ErrorObject, ValidateFunction } from "ajv"
import Ajv2020, { type Options } from "ajv/dist/2020"
```

Export `SchemaContext`:

```ts
export type SchemaContext = Record<string, TSchema>
```

Replace `normalizeAjvErrors` with a version that reuses a single-error helper:

```ts
function normalizeAjvErrors(errors: typeof Ajv2020.prototype.errors): ValidationSchemaError[] {
  return (errors ?? []).map(normalizeAjvError)
}

function normalizeAjvError(error: ErrorObject): ValidationSchemaError {
  return {
    keyword: error.keyword,
    schemaPath: error.schemaPath,
    instancePath: error.instancePath,
    params: error.params as Record<string, unknown>,
    message: error.message ?? error.keyword,
    schema: error.schema as TSchema | undefined,
    value: error.data,
  }
}
```

Add the wrapper after `createTypeboxFallback`:

```ts
class AjvFunctionValidationSchema<Type extends TSchema = TSchema> implements ValidationSchemaValidator<Type> {
  constructor(
    private readonly params: {
      schema: Type
      context: SchemaContext
      validate: ValidateFunction
    }
  ) {}

  Check(value: unknown): boolean {
    return this.params.validate(value)
  }

  Errors(value: unknown): [boolean, ValidationSchemaError[]] {
    const valid = this.params.validate(value)
    if (valid) return [true, []]
    return [false, normalizeAjvErrors(this.params.validate.errors)]
  }

  Schema(): Type {
    return this.params.schema
  }

  Context(): SchemaContext {
    return this.params.context
  }
}

export function createValidationSchemaFromAjvFunction<const Type extends TSchema>(params: {
  schema: Type
  context?: SchemaContext
  validate: ValidateFunction
}): ValidationSchemaValidator<Type> {
  return new AjvFunctionValidationSchema({
    schema: params.schema,
    context: params.context ?? {},
    validate: params.validate,
  })
}
```

Export `prepareSchemaForAjv` by changing its declaration:

```ts
export function prepareSchemaForAjv(schema: TSchema, options: PrepareSchemaOptions = {}): TSchema {
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/compileValidationSchema.test.ts --testNamePattern "готовую AJV"
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/validation/compileValidationSchema.ts packages/core/metadata/validation/compileValidationSchema.test.ts
git commit -m "feat: :sparkles: обернуть готовые AJV-валидаторы"
```

---

### Task 2: Добавить standalone schema set и loader

**Files:**
- Create: `packages/core/metadata/validation/projectValidationStandaloneTypes.ts`
- Create: `packages/core/metadata/validation/projectValidationStandaloneSchemas.ts`
- Create: `packages/core/metadata/validation/projectValidationStandaloneLoader.ts`
- Create: `packages/core/metadata/validation/projectValidationStandaloneLoader.test.ts`

- [ ] **Step 1: Write failing loader tests**

Create `packages/core/metadata/validation/projectValidationStandaloneLoader.test.ts`:

```ts
import type { ValidateFunction } from "ajv"
import { describe, expect, it } from "vitest"
import { Type } from "typebox"
import { createValidationSchemaCacheFromStandaloneModule } from "./projectValidationStandaloneLoader"
import type { ProjectValidationStandaloneModule } from "./projectValidationStandaloneTypes"

const standardContext = {
  version: "2.20",
  defaultLanguage: "ru",
  exportToYAML: { toTyped: false },
} as const

describe("project validation standalone loader", () => {
  it("creates form and properties validators from a standalone-like module", () => {
    const formSchema = Type.Object({ Вид: Type.String() })
    const propertiesSchema = Type.Object({ Имя: Type.String() })
    const cache = createValidationSchemaCacheFromStandaloneModule({
      format: "project-validation-ajv-standalone-v1",
      context: standardContext,
      refs: {},
      form: { schema: formSchema, validate: validWhenHasString("Вид") },
      byProjectDir: {
        Справочник: { schema: propertiesSchema, validate: validWhenHasString("Имя") },
      },
    })

    expect(cache.form().Check({ Вид: "Форма" })).toBe(true)
    expect(cache.form().Check({})).toBe(false)
    expect(cache.properties({ dir: "Справочник" } as never).Check({ Имя: "Номенклатура" })).toBe(true)
    expect(cache.properties({ dir: "Справочник" } as never).Check({})).toBe(false)
    expect(cache.compileAll()).toEqual({ formMs: 0, propertiesMs: 0, totalMs: 0 })
  })

  it("rejects unsupported context instead of silently using wrong schemas", () => {
    const module = {
      format: "project-validation-ajv-standalone-v1",
      context: standardContext,
      refs: {},
      form: { schema: Type.Any(), validate: validWhenHasString("Вид") },
      byProjectDir: {},
    } satisfies ProjectValidationStandaloneModule

    expect(() =>
      createValidationSchemaCacheFromStandaloneModule(module, {
        version: "2.21",
        defaultLanguage: "ru",
        exportToYAML: { toTyped: false },
      })
    ).toThrow("Standalone validation schemas were built for context")
  })
})

function validWhenHasString(key: string): ValidateFunction {
  const validate = Object.assign(
    (value: unknown) => {
      const valid =
        typeof value === "object" && value !== null && typeof (value as Record<string, unknown>)[key] === "string"
      validate.errors = valid
        ? null
        : [
            {
              keyword: "required",
              instancePath: "",
              schemaPath: "#/required",
              params: { missingProperty: key },
              message: `must have required property '${key}'`,
            },
          ]
      return valid
    },
    { errors: null as ValidateFunction["errors"] }
  )

  return validate as ValidateFunction
}
```

- [ ] **Step 2: Run the focused tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectValidationStandaloneLoader.test.ts
```

Expected: FAIL because the standalone loader files do not exist.

- [ ] **Step 3: Add standalone module types**

Create `packages/core/metadata/validation/projectValidationStandaloneTypes.ts`:

```ts
import type { ValidateFunction } from "ajv"
import type { TSchema } from "typebox"
import type { ConfigurationContext } from "../context/types"

export interface ProjectValidationStandaloneValidator {
  schema: TSchema
  validate: ValidateFunction
}

export interface ProjectValidationStandaloneModule {
  format: "project-validation-ajv-standalone-v1"
  context: ConfigurationContext
  refs?: Record<string, TSchema>
  form: ProjectValidationStandaloneValidator
  byProjectDir: Record<string, ProjectValidationStandaloneValidator>
}
```

- [ ] **Step 4: Add schema set builder**

Create `packages/core/metadata/validation/projectValidationStandaloneSchemas.ts`:

```ts
import { Type, type TSchema } from "typebox"
import type { ConfigurationContext } from "../context/types"
import { JSON_SCHEMA_REF_PREFIX } from "../orchestration/jsonSchemaRefs"
import { exportJSONSchemaForSchemaName } from "./projectFileSchema"
import { configurationValidationProjectSpec, validationProjectSpecs } from "./projectSpecs"

export interface ProjectValidationStandaloneSchemaSet {
  context: ConfigurationContext
  form: TSchema
  refs: Record<string, TSchema>
  byProjectDir: Record<string, TSchema>
}

export const defaultStandaloneValidationContext: ConfigurationContext = {
  version: "2.20",
  defaultLanguage: "ru",
  exportToYAML: { toTyped: false },
}

export function createProjectValidationStandaloneSchemaSet(
  context: ConfigurationContext = defaultStandaloneValidationContext
): ProjectValidationStandaloneSchemaSet {
  const specs = [configurationValidationProjectSpec, ...validationProjectSpecs]
  const byProjectDir = Object.fromEntries(
    specs.map((spec) => [spec.dir, spec.exportSchema({ context, mode: "externalRefs" })])
  )

  return {
    context,
    form: stripExternalRefsForValidation(
      exportJSONSchemaForSchemaName({
        context,
        name: "ClientApplicationForm",
        mode: "externalRefs",
        includeNestedChildItems: true,
      })
    ),
    refs: collectExternalRefSchemas(context, Object.values(byProjectDir)),
    byProjectDir,
  }
}

export function assertStandaloneValidationContext(
  actual: ConfigurationContext,
  expected: ConfigurationContext = defaultStandaloneValidationContext
): void {
  if (JSON.stringify(actual) === JSON.stringify(expected)) return

  throw new Error(
    `Standalone validation schemas were built for context ${JSON.stringify(actual)}, but validation requested ${JSON.stringify(expected)}`
  )
}

function stripExternalRefsForValidation(schema: TSchema): TSchema {
  return stripExternalRefs(schema) as TSchema
}

function stripExternalRefs(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripExternalRefs)
  if (value === null || typeof value !== "object") return value

  const record = value as Record<string, unknown>
  if (typeof record.$ref === "string" && record.$ref.startsWith(JSON_SCHEMA_REF_PREFIX)) {
    return Type.Any()
  }

  return Object.fromEntries(
    Object.entries(record).map(([key, entry]) => [
      key,
      key === "additionalProperties" && containsExternalRef(entry) ? true : stripExternalRefs(entry),
    ])
  )
}

function containsExternalRef(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsExternalRef)
  if (value === null || typeof value !== "object") return false

  const record = value as Record<string, unknown>
  if (typeof record.$ref === "string" && record.$ref.startsWith(JSON_SCHEMA_REF_PREFIX)) return true

  return Object.values(record).some(containsExternalRef)
}

function collectExternalRefSchemas(context: ConfigurationContext, roots: TSchema[]): Record<string, TSchema> {
  const schemas = new Map<string, TSchema>()
  const queue = roots.flatMap(schemaRefs)

  for (let index = 0; index < queue.length; index += 1) {
    const ref = queue[index]!
    if (schemas.has(ref)) continue

    const schema = exportJSONSchemaForSchemaName({
      context,
      name: schemaNameFromRef(ref),
      mode: "externalRefs",
    })
    schemas.set(ref, schema)
    queue.push(...schemaRefs(schema))
  }

  return Object.fromEntries(schemas)
}

function schemaRefs(schema: unknown): string[] {
  const refs = new Set<string>()

  function visit(value: unknown): void {
    if (Array.isArray(value)) {
      value.forEach(visit)
      return
    }
    if (value === null || typeof value !== "object") return

    const record = value as Record<string, unknown>
    const ownRef = record.$ref
    if (typeof ownRef === "string" && ownRef.startsWith(JSON_SCHEMA_REF_PREFIX)) refs.add(ownRef)

    const attachedRefs = record["x-nkdk-schemaRefs"]
    if (Array.isArray(attachedRefs)) {
      for (const ref of attachedRefs) {
        if (typeof ref === "string" && ref.startsWith(JSON_SCHEMA_REF_PREFIX)) refs.add(ref)
      }
    }

    Object.values(record).forEach(visit)
  }

  visit(schema)
  return [...refs]
}

function schemaNameFromRef(ref: string): string {
  return ref.startsWith(JSON_SCHEMA_REF_PREFIX) ? ref.slice(JSON_SCHEMA_REF_PREFIX.length) : ref
}
```

- [ ] **Step 5: Add standalone loader**

Create `packages/core/metadata/validation/projectValidationStandaloneLoader.ts`:

```ts
import { pathToFileURL } from "node:url"
import { performance } from "node:perf_hooks"
import type { ConfigurationContext } from "../context/types"
import { createValidationSchemaFromAjvFunction } from "./compileValidationSchema"
import { validationProjectSpecs } from "./projectSpecs"
import type { ValidationSchemaCache } from "./projectValidationPasses"
import { assertStandaloneValidationContext } from "./projectValidationStandaloneSchemas"
import type {
  ProjectValidationStandaloneModule,
  ProjectValidationStandaloneValidator,
} from "./projectValidationStandaloneTypes"

export function createValidationSchemaCacheFromStandaloneModule(
  module: ProjectValidationStandaloneModule,
  context: ConfigurationContext = module.context
): ValidationSchemaCache {
  assertProjectValidationStandaloneModule(module)
  assertStandaloneValidationContext(module.context, context)

  const schemaContext = module.refs ?? {}
  const form = createCompiledStandaloneValidator(module.form, schemaContext)
  const properties = new Map<string, ReturnType<typeof createCompiledStandaloneValidator>>()

  return {
    form() {
      return form
    },
    properties(spec) {
      const existing = properties.get(spec.dir)
      if (existing !== undefined) return existing

      const validator = module.byProjectDir[spec.dir]
      if (validator === undefined) {
        throw new Error(`Standalone validation schema was not generated for project dir "${spec.dir}"`)
      }

      const compiled = createCompiledStandaloneValidator(validator, schemaContext)
      properties.set(spec.dir, compiled)
      return compiled
    },
    compileAll() {
      const startedAt = performance.now()
      const formStartedAt = performance.now()
      this.form()
      const formMs = performance.now() - formStartedAt

      const propertiesStartedAt = performance.now()
      for (const spec of validationProjectSpecs) this.properties(spec)
      const propertiesMs = performance.now() - propertiesStartedAt

      return {
        formMs,
        propertiesMs,
        totalMs: performance.now() - startedAt,
      }
    },
  }
}

export async function loadProjectValidationStandaloneCache(params: {
  modulePath: string
  context: ConfigurationContext
}): Promise<ValidationSchemaCache> {
  const loaded = (await import(pathToFileURL(params.modulePath).href)) as {
    default?: ProjectValidationStandaloneModule
  } & Partial<ProjectValidationStandaloneModule>
  const module = loaded.default ?? loaded

  return createValidationSchemaCacheFromStandaloneModule(module as ProjectValidationStandaloneModule, params.context)
}

function createCompiledStandaloneValidator(
  validator: ProjectValidationStandaloneValidator,
  context: NonNullable<ProjectValidationStandaloneModule["refs"]>
) {
  return createValidationSchemaFromAjvFunction({
    schema: validator.schema,
    context,
    validate: validator.validate,
  })
}

function assertProjectValidationStandaloneModule(module: ProjectValidationStandaloneModule): void {
  if (module.format !== "project-validation-ajv-standalone-v1") {
    throw new Error(`Unsupported standalone validation module format: ${String(module.format)}`)
  }
}
```

- [ ] **Step 6: Run the focused tests and verify they pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectValidationStandaloneLoader.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/validation/projectValidationStandaloneTypes.ts packages/core/metadata/validation/projectValidationStandaloneSchemas.ts packages/core/metadata/validation/projectValidationStandaloneLoader.ts packages/core/metadata/validation/projectValidationStandaloneLoader.test.ts
git commit -m "feat: :sparkles: добавить standalone-кэш validation"
```

---

### Task 3: Генерировать AJV standalone при build

**Files:**
- Create: `packages/core/metadata/validation/generateProjectValidationAjvStandalone.ts`
- Create: `packages/core/scripts/build.mjs`
- Modify: `packages/core/package.json`
- Modify: `pnpm-lock.yaml`
- Create: `packages/core/metadata/validation/projectValidationStandaloneBuild.test.ts`

- [ ] **Step 1: Write the build-output test**

Create `packages/core/metadata/validation/projectValidationStandaloneBuild.test.ts`:

```ts
import { existsSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { defaultStandaloneValidationContext } from "./projectValidationStandaloneSchemas"
import { loadProjectValidationStandaloneCache } from "./projectValidationStandaloneLoader"

describe("project validation standalone build output", () => {
  it("loads generated validators from dist when build has produced them", async () => {
    const modulePath = new URL("../../../dist/projectValidationAjvStandalone.js", import.meta.url).pathname
    if (!existsSync(modulePath)) return

    const cache = await loadProjectValidationStandaloneCache({
      modulePath,
      context: defaultStandaloneValidationContext,
    })

    expect(cache.form().Check({})).toBe(false)
  })
})
```

- [ ] **Step 2: Add package scripts and esbuild dependency**

Modify `packages/core/package.json` scripts and devDependencies:

```json
"scripts": {
  "build": "node scripts/build.mjs",
  "measure:validation-workers": "node scripts/measure-validation-workers.mjs",
  "measure:validation-schemas": "tsx --expose-gc scripts/measure-validation-schemas.mjs",
  "test": "vitest run --no-isolate --sequence.shuffle",
  "test:isolated": "vitest run",
  "test:ui": "vitest --ui",
  "type-check": "tsc --noEmit",
  "prepare": "ts-patch install"
}
```

```json
"devDependencies": {
  "@types/js-yaml": "^4.0.9",
  "@types/node": "^25.9.3",
  "esbuild": "^0.28.0",
  "ts-patch": "^3.3.0",
  "tsx": "^4.22.4",
  "typescript": "~5.9.3",
  "vitest": "^4.1.9"
}
```

Run:

```bash
pnpm install
```

Expected: PASS and `pnpm-lock.yaml` updates.

- [ ] **Step 3: Add the standalone generator**

Create `packages/core/metadata/validation/generateProjectValidationAjvStandalone.ts` by porting the implementation from `/Users/nikita/git/nkdk/.worktrees/ajv-standalone-validation-workers/packages/core/metadata/validation/generateProjectValidationAjvStandalone.ts`, with these required properties:

```ts
import Ajv2020 from "ajv/dist/2020.js"
import standaloneCode from "ajv/dist/standalone/index.js"
import addFormats from "ajv-formats"
import { writeFile } from "node:fs/promises"
import { prepareSchemaForAjv } from "./compileValidationSchema"
import {
  createProjectValidationStandaloneSchemaSet,
  defaultStandaloneValidationContext,
} from "./projectValidationStandaloneSchemas"
```

The exported function must be:

```ts
export async function generateProjectValidationAjvStandalone(params: { outfile: string }): Promise<void>
```

The generated module must end with:

```ts
const module = {
  format: "project-validation-ajv-standalone-v1",
  context: schemaSet.context,
  refs,
  form: { schema: formSchema, validate: validateForm },
  byProjectDir,
}

export default module
```

Keep the ESM normalization helpers for AJV runtime imports:

```ts
function normalizeStandaloneCodeForEsm(code: string): string {
  const imports: string[] = []
  let normalized = code.replace(
    /const (func\d+) = require\("ajv\/dist\/runtime\/equal"\)\.default;/g,
    (_match, name: string) => {
      if (!imports.includes('import equalModule from "ajv/dist/runtime/equal.js"')) {
        imports.push('import equalModule from "ajv/dist/runtime/equal.js"')
      }
      return `const ${name} = equalModule.default;`
    }
  )
  normalized = normalized.replace(
    /const (func\d+) = require\("ajv\/dist\/runtime\/ucs2length"\)\.default;/g,
    (_match, name: string) => {
      if (!imports.includes('import ucs2lengthModule from "ajv/dist/runtime/ucs2length.js"')) {
        imports.push('import ucs2lengthModule from "ajv/dist/runtime/ucs2length.js"')
      }
      return `const ${name} = ucs2lengthModule.default;`
    }
  )

  return imports.length === 0 ? normalized : `${imports.join("\n")}\n${normalized}`
}
```

- [ ] **Step 4: Add the build script**

Create `packages/core/scripts/build.mjs`:

```js
import esbuild from "esbuild"
import { rm } from "node:fs/promises"

const outdir = new URL("../dist/", import.meta.url)
const rootDir = new URL("../", import.meta.url)

await rm(outdir, { force: true, recursive: true })

const commonOptions = {
  absWorkingDir: rootDir.pathname,
  bundle: true,
  external: [
    "@node-rs/xxhash",
    "ajv",
    "ajv-formats",
    "date-fns",
    "fast-xml-parser",
    "js-yaml",
    "p-limit",
    "piscina",
    "typebox",
    "uuid",
  ],
  format: "esm",
  logLevel: "info",
  platform: "node",
  sourcemap: false,
  target: "node20",
}

await esbuild.build({
  ...commonOptions,
  entryPoints: ["index.ts"],
  outfile: new URL("index.js", outdir).pathname,
})

await esbuild.build({
  ...commonOptions,
  entryPoints: ["metadata/validation/projectValidationWorker.ts"],
  outfile: new URL("projectValidationWorker.js", outdir).pathname,
})

await esbuild.build({
  ...commonOptions,
  entryPoints: ["metadata/validation/generateProjectValidationAjvStandalone.ts"],
  outfile: new URL("generateProjectValidationAjvStandalone.js", outdir).pathname,
})

const { generateProjectValidationAjvStandalone } = await import(
  new URL("generateProjectValidationAjvStandalone.js", outdir).href
)

await generateProjectValidationAjvStandalone({
  outfile: new URL("projectValidationAjvStandalone.js", outdir).pathname,
})
```

- [ ] **Step 5: Build core**

Run:

```bash
pnpm --filter @nakidka/core build
```

Expected: PASS and `packages/core/dist/projectValidationAjvStandalone.js` exists.

- [ ] **Step 6: Run the build-output test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectValidationStandaloneBuild.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/package.json pnpm-lock.yaml packages/core/scripts/build.mjs packages/core/metadata/validation/generateProjectValidationAjvStandalone.ts packages/core/metadata/validation/projectValidationStandaloneBuild.test.ts
git commit -m "build: :construction_worker: генерировать AJV-схемы worker-ов"
```

---

### Task 4: Подключить standalone cache в worker

**Files:**
- Create: `packages/core/metadata/validation/projectValidationWorkerSchemaCache.ts`
- Modify: `packages/core/metadata/validation/projectValidationWorker.ts`
- Modify: `packages/core/metadata/validation/projectValidationWorker.test.ts`
- Modify: `packages/core/metadata/validation/projectValidationWorkerPool.test.ts`

- [ ] **Step 1: Write source fallback test**

Add this test to `packages/core/metadata/validation/projectValidationWorkerPool.test.ts`:

```ts
  it("uses source runtime cache when worker is started through tsx", async () => {
    const script = [
      'const { createProjectValidationWorkerPool } = await import("./metadata/validation/projectValidationWorkerPool.ts")',
      "const pool = createProjectValidationWorkerPool({ concurrency: 1 })",
      "await pool.start({ version: '2.20', defaultLanguage: 'ru', exportToYAML: { toTyped: false } })",
      "await pool.runFirstPass({ projectDir: '/project', context: { version: '2.20', defaultLanguage: 'ru', exportToYAML: { toTyped: false } }, files: [] })",
      "console.log('first-pass-ok')",
      "await pool.close()",
    ].join(";")

    const { stdout } = await execFileAsync(process.execPath, ["--import", "tsx", "-e", script], {
      cwd: process.cwd(),
      env: { ...process.env, NODE_OPTIONS: "" },
    })

    expect(stdout.trim()).toBe("first-pass-ok")
  }, 120_000)
```

- [ ] **Step 2: Run the source fallback test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectValidationWorkerPool.test.ts --testNamePattern "source runtime cache"
```

Expected: PASS before implementation. This protects the `.ts` worker path.

- [ ] **Step 3: Add worker schema cache selector**

Create `packages/core/metadata/validation/projectValidationWorkerSchemaCache.ts`:

```ts
import { existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import type { ConfigurationContext } from "../context/types"
import { createValidationSchemaCache, type ValidationSchemaCache } from "./projectValidationPasses"
import { defaultStandaloneValidationContext } from "./projectValidationStandaloneSchemas"
import { loadProjectValidationStandaloneCache } from "./projectValidationStandaloneLoader"

let standaloneCache: ValidationSchemaCache | undefined

export async function createWorkerValidationSchemaCache(context: ConfigurationContext): Promise<ValidationSchemaCache> {
  const currentFile = fileURLToPath(import.meta.url)
  if (currentFile.endsWith(".ts")) return createValidationSchemaCache(context)

  if (JSON.stringify(context) !== JSON.stringify(defaultStandaloneValidationContext)) {
    throw new Error(
      `Standalone validation worker supports only context ${JSON.stringify(defaultStandaloneValidationContext)}, got ${JSON.stringify(context)}`
    )
  }

  const modulePath = join(dirname(currentFile), "projectValidationAjvStandalone.js")
  if (!existsSync(modulePath)) {
    throw new Error(`Standalone validation module is missing: ${modulePath}`)
  }

  standaloneCache ??= await loadProjectValidationStandaloneCache({ modulePath, context })
  return standaloneCache
}
```

- [ ] **Step 4: Make worker init async and use selector**

Modify `packages/core/metadata/validation/projectValidationWorker.ts`.

Add import:

```ts
import { createWorkerValidationSchemaCache } from "./projectValidationWorkerSchemaCache"
```

Remove `createValidationSchemaCache` from the `projectValidationPasses` import list.

Change the exported handler signature:

```ts
export default async function runValidationWorkerTask(message: ValidationWorkerTask): Promise<ValidationWorkerTaskResult> {
  if (message.kind === "init") return { kind: "initResult", ...(await runInit(message)) }
  if (message.kind === "firstPass") return { kind: "firstPassResult", ...runFirstPass(message) }
  return { kind: "secondPassResult", ...runSecondPass(message) }
}
```

Change `runInit`:

```ts
async function runInit(message: Extract<ValidationWorkerTask, { kind: "init" }>): Promise<ValidationSchemaCacheCompileProfile> {
  workerSchemaCache = await createWorkerValidationSchemaCache(message.context)
  workerRulesSnapshot = message.rulesSnapshot
  return workerSchemaCache.compileAll()
}
```

Update direct tests in `packages/core/metadata/validation/projectValidationWorker.test.ts` by awaiting every `runValidationWorkerTask(...)` call:

```ts
await runValidationWorkerTask({ kind: "init", context, rulesSnapshot: createValidationRulesSnapshot(context) })
const firstPass = await runValidationWorkerTask({ kind: "firstPass", projectDir: "/project", context, filePaths: [] })
const secondPass = await runValidationWorkerTask({
  kind: "secondPass",
  projectDir: "/project",
  context,
  mode: "full",
  sharedValidationSnapshot: emptySharedSnapshot(),
  pendingReferences: [],
  filePaths: [],
})
```

- [ ] **Step 5: Run worker tests from source**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectValidationWorker.test.ts metadata/validation/projectValidationWorkerPool.test.ts
```

Expected: PASS.

- [ ] **Step 6: Build and smoke-test built worker**

Run:

```bash
pnpm --filter @nakidka/core build
pnpm --filter @nakidka/core exec node -e 'const { validateProject } = await import("./dist/index.js"); const result = await validateProject({ projectDir: "/Users/nikita/git/nkdk-yaml", concurrency: 2 }); console.log(JSON.stringify({ diagnostics: result.diagnostics.length }));'
```

Expected: command completes and prints JSON. If `/Users/nikita/git/nkdk-yaml` is unavailable, use a temporary project fixture and record that real-project smoke test was skipped.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/validation/projectValidationWorkerSchemaCache.ts packages/core/metadata/validation/projectValidationWorker.ts packages/core/metadata/validation/projectValidationWorker.test.ts packages/core/metadata/validation/projectValidationWorkerPool.test.ts
git commit -m "feat: :sparkles: подключить standalone-схемы в worker"
```

---

### Task 5: Добавить parity и RSS-измерение

**Files:**
- Create: `packages/core/scripts/measure-validation-workers.mjs`

- [ ] **Step 1: Create the measurement script**

Create `packages/core/scripts/measure-validation-workers.mjs`:

```js
import { performance } from "node:perf_hooks"
import { validateProject } from "../dist/index.js"

const projectDir = process.argv[2]
if (!projectDir) {
  console.error("Использование: node scripts/measure-validation-workers.mjs <projectDir>")
  process.exit(2)
}

const concurrency = Number(process.env.NKDK_VALIDATION_CONCURRENCY ?? "4")
const startedAt = performance.now()
const result = await validateProject({ projectDir, concurrency })
const elapsedMs = Math.round(performance.now() - startedAt)

const bySeverity = new Map()
const bySource = new Map()
for (const diagnostic of result.diagnostics) {
  bySeverity.set(diagnostic.severity, (bySeverity.get(diagnostic.severity) ?? 0) + 1)
  bySource.set(diagnostic.source, (bySource.get(diagnostic.source) ?? 0) + 1)
}

console.log(
  JSON.stringify(
    {
      projectDir,
      concurrency,
      elapsedMs,
      diagnostics: {
        total: result.diagnostics.length,
        bySeverity: Object.fromEntries([...bySeverity.entries()].sort()),
        bySource: Object.fromEntries([...bySource.entries()].sort()),
      },
      memory: process.memoryUsage(),
    },
    null,
    2
  )
)
```

- [ ] **Step 2: Build and run standalone measurement**

Run:

```bash
pnpm --filter @nakidka/core build
pnpm --filter @nakidka/core run measure:validation-workers /Users/nikita/git/nkdk-yaml
```

Expected: PASS and JSON with `diagnostics.total`, `elapsedMs`, and `memory.rss`.

- [ ] **Step 3: Run source runtime baseline for parity**

Run:

```bash
pnpm --filter @nakidka/core exec tsx -e 'import { validateProject } from "./metadata/validation/validateProject.ts"; const result = await validateProject({ projectDir: "/Users/nikita/git/nkdk-yaml", concurrency: 1 }); const bySeverity = new Map(); const bySource = new Map(); for (const diagnostic of result.diagnostics) { bySeverity.set(diagnostic.severity, (bySeverity.get(diagnostic.severity) ?? 0) + 1); bySource.set(diagnostic.source, (bySource.get(diagnostic.source) ?? 0) + 1); } console.log(JSON.stringify({ diagnostics: { total: result.diagnostics.length, bySeverity: Object.fromEntries([...bySeverity.entries()].sort()), bySource: Object.fromEntries([...bySource.entries()].sort()) } }, null, 2));'
```

Expected: PASS. The diagnostics summary must match the built standalone run. If it differs, inspect and fix standalone error/schema adaptation before continuing.

- [ ] **Step 4: Commit**

```bash
git add packages/core/scripts/measure-validation-workers.mjs
git commit -m "test: :white_check_mark: добавить замер validation worker-ов"
```

---

### Task 6: Финальная проверка

**Files:**
- No planned file changes.

- [ ] **Step 1: Run core type-check**

Run:

```bash
pnpm --filter @nakidka/core type-check
```

Expected: PASS.

- [ ] **Step 2: Run focused validation tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/compileValidationSchema.test.ts metadata/validation/projectValidationStandaloneLoader.test.ts metadata/validation/projectValidationStandaloneBuild.test.ts metadata/validation/projectValidationWorker.test.ts metadata/validation/projectValidationWorkerPool.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run core build**

Run:

```bash
pnpm --filter @nakidka/core build
```

Expected: PASS.

- [ ] **Step 4: Run full test suite from repository root**

Run:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 5: Commit final adjustments if verification changed files**

If Steps 1-4 required code changes, commit them:

```bash
git add packages/core/metadata/validation packages/core/scripts packages/core/package.json pnpm-lock.yaml
git commit -m "fix: :bug: стабилизировать standalone validation worker-ы"
```

If verification produced no file changes, do not create an empty commit.

---

## Self-Review

- Spec coverage: the plan covers worker-only generated schemas, build-time generation, standard-context enforcement, no hidden built-worker runtime compilation, diagnostics parity, RSS measurement, and final `pnpm test`.
- Placeholder scan: no placeholder markers or open-ended implementation steps remain. The only porting instruction points to an existing file and lists required imports, export shape, generated module shape, and ESM normalization code.
- Type consistency: `ProjectValidationStandaloneModule`, `createValidationSchemaCacheFromStandaloneModule`, `loadProjectValidationStandaloneCache`, `createWorkerValidationSchemaCache`, `prepareSchemaForAjv`, and `createValidationSchemaFromAjvFunction` are introduced before later tasks use them.
