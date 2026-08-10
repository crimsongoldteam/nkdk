# TypeBox Validation Without AJV Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перевести структурную валидацию YAML с AJV standalone на runtime-компиляцию TypeBox 1.3.11 без патча библиотеки, сохранив быстрый discriminator и одну точную ошибку на файл.

**Architecture:** Локальный компилятор преобразует только `oneOf + discriminator` в TypeBox `~refine`, лениво компилирует выбранные ветви и передаёт их первую ошибку через служебный payload. Публичный `compileValidationSchema` сохраняет договор `Check/Errors`, worker компилирует schema cache при инициализации, а AJV standalone удаляется из core и MCP.

**Tech Stack:** TypeScript, TypeBox 1.3.11 (`typebox/compile`, `typebox/system`), Vitest, esbuild, pnpm workspaces.

## Global Constraints

- Использовать TypeBox строго версии `1.3.11` без `pnpm patch` и без форка.
- Возвращать не более одной структурной ошибки на YAML-файл.
- Сохранять полный `instancePath`, YAML-координаты, `severity: "error"` и `source: "structure"`.
- Обычные объединения без `discriminator` не преобразовывать.
- Некорректный контракт discriminator завершает компиляцию ошибкой; fallback на исходный `oneOf` запрещён.
- Временная замена TypeBox `Locale` выполняется синхронно и всегда восстанавливается в `finally`.
- Не изменять XML-фикстуры и dependency-cruiser baseline.
- Базовый commit для проверки дубликатов: `df2bf639c`.
- Проект решения: `docs/superpowers/specs/2026-08-10-typebox-validation-without-ajv-design.md`.

## File Structure

- Create `packages/core/metadata/validation/typeboxValidationCompiler.ts` — discriminator, runtime-компиляция и адаптер первой ошибки.
- Create `packages/core/metadata/validation/typeboxValidationCompiler.test.ts` — refs, рекурсия, payload и восстановление `Locale`.
- Modify `packages/core/metadata/validation/compileValidationSchema.ts` и тесты — публичный facade без AJV.
- Modify `packages/core/metadata/validation/projectValidationWorkerSchemaCache.ts` и тест — runtime cache с `compileAll()`.
- Delete standalone generator, loader, schemas, types и связанные tests/entrypoints из core.
- Modify core/MCP build scripts и package manifests — удалить AJV и standalone-файл.

---

### Task 1: Изолированный TypeBox validation compiler

**Files:**
- Create: `packages/core/metadata/validation/typeboxValidationCompiler.ts`
- Create: `packages/core/metadata/validation/typeboxValidationCompiler.test.ts`

**Interfaces:**
- Consumes: `SchemaContext`, `ValidationSchemaValidator`, `ValidationSchemaError` как type-only imports из `compileValidationSchema.ts`.
- Produces:

```ts
export function compileTypeboxValidationSchema(
  context: Readonly<Record<string, TSchema>>,
  schema: TSchema
): ValidationSchemaValidator
```

- [ ] **Step 1: Зафиксировать AJV baseline до переключения**

```bash
profile_dir=$(mktemp -d /private/tmp/nkdk-ajv-baseline.XXXXXX)
mkdir -p "$profile_dir/cf"
rsync -a --exclude .nkdk /Users/nikita/git/sed_nkdk/cf/ "$profile_dir/cf/"
pnpm --filter @nkdk/core build
perl -e 'alarm 115; exec @ARGV' node .agents/skills/validation-profile/validation-profile.mjs "$profile_dir/cf" --runs 3 --json > /private/tmp/nkdk-ajv-validation-baseline.json
```

Expected: exit `0`; JSON содержит diagnostics digest, времена и peak RSS. Файл не добавлять в git.

- [ ] **Step 2: Написать падающие тесты компилятора**

Зафиксировать прямой и вложенный discriminator:

```ts
function discriminated(propertyName: string, branches: [TSchema, TSchema, ...TSchema[]]): TSchema {
  return { oneOf: branches, discriminator: { propertyName } } as TSchema
}

const direct = discriminated("Kind", [
  Type.Object({ Kind: Type.Literal("A"), text: Type.String() }),
  Type.Object({ Kind: Type.Literal("B"), count: Type.Number() }),
])
const validator = compileTypeboxValidationSchema({}, Type.Object({ Child: direct }))

expect(validator.Check({ Child: { Kind: "B", count: 1 } })).toBe(true)
expect(validator.Errors({ Child: { Kind: "B", count: "bad" } })).toEqual([
  false,
  [expect.objectContaining({
    keyword: "type",
    instancePath: "/Child/count",
    params: { type: "number" },
  })],
])
expect(validator.Errors({ Child: { Kind: "X" } })[1]).toEqual([
  expect.objectContaining({ keyword: "enum", instancePath: "/Child/Kind" }),
])
```

Добавить отдельные tests для discriminator через внешний `$ref` и `allOf`, рекурсивного `Type.Cyclic`, missing/non-string discriminator, повторяющихся или отсутствующих `const`, обычного union без discriminator и восстановления `Locale` после всех исходов.

- [ ] **Step 3: Подтвердить красное состояние**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/typeboxValidationCompiler.test.ts --no-isolate
```

Expected: FAIL, модуль ещё не существует.

- [ ] **Step 4: Реализовать маркеры и единственное приведение payload**

```ts
const firstErrorMarker = Symbol("nkdk-first-validation-error")
const selectedBranchMarker = Symbol("nkdk-selected-branch-error")

interface SelectedBranchErrorPayload {
  readonly marker: typeof selectedBranchMarker
  readonly error: ValidationSchemaError
}

function asRefinementMessage(payload: SelectedBranchErrorPayload): string {
  return payload as unknown as string
}
```

Других двойных приведений для payload не добавлять.

- [ ] **Step 5: Реализовать разрешение discriminator**

Добавить закрытые функции:

```ts
function discriminatorPropertyName(schema: Record<string, unknown>): string | undefined
function discriminatorValue(
  schema: unknown,
  document: unknown,
  context: Readonly<Record<string, TSchema>>,
  propertyName: string,
  seenRefs: Set<string>
): unknown
function resolveSchemaRef(
  ref: string,
  document: unknown,
  context: Readonly<Record<string, TSchema>>
): { document: unknown; value: unknown } | undefined
function resolveSchemaPointer(document: unknown, fragment: string): unknown
```

`discriminatorValue` проверяет `const`, одноэлементный `enum`, `$ref` и каждый `allOf`. Pointer resolver декодирует URI и сегменты `~1`/`~0`.

- [ ] **Step 6: Реализовать подготовку и refinement dispatcher**

Обход root/context клонирует только изменённые узлы и использует `WeakMap`. Для каждого discriminator refinement имеет договор:

```ts
{
  "~refine": [{
    check(value: unknown): boolean {
      const branch = selectedBranch(value)
      return branch !== undefined && validatorFor(branch).Check(value)
    },
    error(value: unknown): string {
      const branch = selectedBranch(value)
      const error = branch === undefined
        ? discriminatorFieldError(value, propertyName, allowedValues)
        : validatorFor(branch).Errors(value)[1][0]!
      return asRefinementMessage({ marker: selectedBranchMarker, error })
    },
  }],
}
```

`validatorFor` лениво компилирует уже подготовленную ветвь и кэширует её по значению discriminator.

`discriminatorFieldError` возвращает `type` с `instancePath: /<propertyName>` и `params: { type: "string" }` для missing/non-string значения. Для неизвестной строки он возвращает `enum` на том же пути с `params: { allowedValues }`. JSON Pointer сегмент обязательно экранируется.

- [ ] **Step 7: Реализовать ранний выход через `Locale`**

Для invalid value временный locale callback распознаёт payload и добавляет родительские пути:

```ts
const error = payload === undefined
  ? sourceError
  : {
      ...payload.error,
      instancePath: `${sourceError.instancePath}${payload.error.instancePath}`,
      schemaPath: joinSchemaPaths(sourceError.schemaPath, payload.error.schemaPath),
    }
throw { marker: firstErrorMarker, error: localize(error, previousLocale) }
```

Перехватывать только точный marker; `Locale.Set(previousLocale)` выполнять в `finally`; отсутствие locale callback для invalid value считать invariant error.

- [ ] **Step 8: Запустить tests и type-check**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/typeboxValidationCompiler.test.ts --no-isolate
pnpm --filter @nkdk/core type-check
```

Expected: PASS; пути `/Child/count` и `/Child/Kind` сохранены.

- [ ] **Step 9: Создать коммит**

```bash
git add packages/core/metadata/validation/typeboxValidationCompiler.ts packages/core/metadata/validation/typeboxValidationCompiler.test.ts
git commit -m "feat: :sparkles: добавить компилятор validation для TypeBox"
```

---

### Task 2: Переключение публичного validation facade

**Files:**
- Modify: `packages/core/metadata/validation/compileValidationSchema.ts`
- Modify: `packages/core/metadata/validation/compileValidationSchema.test.ts`
- Modify: `packages/core/metadata/validation/validateFile.test.ts`
- Modify: `packages/core/metadata/validation/projectValidationPasses.ts`
- Modify: `packages/core/metadata/validation/schemaRegistry.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/toJSONSchema.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/toJSONSchema.test.ts`

**Interfaces:**
- Consumes: `compileTypeboxValidationSchema(context, schema)` из Task 1.
- Produces: overloads `compileValidationSchema(schema)` и `compileValidationSchema(context, schema)` без AJV options.

- [ ] **Step 1: Переписать facade tests под TypeBox**

Удалить `ValidateFunction`, standalone wrapper test и AJV params. Ожидать одну TypeBox error:

```ts
expect(compiled.Errors({ Лишнее: true })).toEqual([
  false,
  [expect.objectContaining({
    keyword: "required",
    instancePath: "",
    params: { requiredProperties: ["Имя"] },
  })],
])
```

В `validateFile.test.ts` убрать AJV из названий. Сохранить selected/nested/recursive paths; unknown, missing и non-string `Вид` должны давать одну диагностику на `/Вид` с нейтральным сообщением TypeBox.

- [ ] **Step 2: Подтвердить падение старого facade**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/compileValidationSchema.test.ts metadata/validation/validateFile.test.ts --no-isolate
```

Expected: FAIL на AJV semantics.

- [ ] **Step 3: Заменить реализацию facade**

```ts
export function compileValidationSchema(
  schemaOrContext: TSchema | SchemaContext,
  maybeSchema?: TSchema
): ValidationSchemaValidator {
  const context = maybeSchema === undefined ? {} : schemaOrContext as SchemaContext
  const schema = maybeSchema === undefined ? schemaOrContext as TSchema : maybeSchema
  return compileTypeboxValidationSchema(context, schema)
}
```

Удалить `CompileValidationSchemaOptions`, `prepareSchemaForAjv`, custom keyword, AJV factory и `createValidationSchemaFromAjvFunction`.

- [ ] **Step 4: Удалить AJV options из call sites**

Убрать `{ inlineRefs: false }` и `{ eagerFallback: true }` только из перечисленных files; schema-export logic не менять.

- [ ] **Step 5: Запустить validation tests и type-check**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/typeboxValidationCompiler.test.ts metadata/validation/compileValidationSchema.test.ts metadata/validation/validateFile.test.ts metadata/validation/schemaRegistry.test.ts --no-isolate
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

- [ ] **Step 6: Создать коммит**

```bash
git add packages/core/metadata/validation packages/core/metadata/forms/commonObjects/formAttribute/toJSONSchema.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/toJSONSchema.test.ts
git commit -m "refactor: :recycle: перевести validation facade на TypeBox"
```

---

### Task 3: Runtime schema cache и удаление standalone path из core

**Files:**
- Modify: `packages/core/metadata/validation/projectValidationWorkerSchemaCache.ts`
- Modify: `packages/core/metadata/validation/projectValidationWorkerSchemaCache.test.ts`
- Modify: `packages/core/scripts/build.mjs`
- Delete: `packages/core/metadata/validation/generateProjectValidationAjvStandaloneImplementation.ts`
- Delete: `packages/core/metadata/validation/projectValidationStandaloneBuild.test.ts`
- Delete: `packages/core/metadata/validation/projectValidationStandaloneLoader.ts`
- Delete: `packages/core/metadata/validation/projectValidationStandaloneLoader.test.ts`
- Delete: `packages/core/metadata/validation/projectValidationStandaloneSchemas.ts`
- Delete: `packages/core/metadata/validation/projectValidationStandaloneTypes.ts`
- Delete: `packages/core/metadata/workerPool/generateProjectValidationAjvStandaloneEntry.ts`
- Delete: `packages/core/metadata/workerPool/generateProjectValidationAjvStandaloneEntry.test.ts`

**Interfaces:**
- Consumes: `createValidationSchemaCache(context)` и `ValidationSchemaCache.compileAll()`.
- Produces: `createProjectValidationWorkerSchemaCache({ context }): Promise<ValidationSchemaCache>` без `workerUrl` и filesystem loader.

- [ ] **Step 1: Написать падающий runtime-cache test**

Убрать `workerUrl` из test input. Проверить рабочие form/properties validators и исходник factory:

```ts
const source = await readFile(new URL("./projectValidationWorkerSchemaCache.ts", import.meta.url), "utf8")
expect(source).not.toContain("projectValidationAjvStandalone")
expect(source).toContain("cache.compileAll()")
```

- [ ] **Step 2: Подтвердить падение**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/projectValidationWorkerSchemaCache.test.ts --no-isolate
```

Expected: FAIL, старый код выбирает standalone по `workerUrl`.

- [ ] **Step 3: Реализовать единый runtime cache**

```ts
export async function createProjectValidationWorkerSchemaCache(params: {
  context: ConfigurationContext
}): Promise<ValidationSchemaCache> {
  const cache = createValidationSchemaCache(params.context)
  cache.compileAll()
  return cache
}
```

Не добавлять новый global cache: form/property caches уже учитывают context.

- [ ] **Step 4: Удалить standalone core modules и generation**

Удалить перечисленные modules/tests. В `packages/core/scripts/build.mjs` удалить generator entrypoint, dynamic import и запись `projectValidationAjvStandalone.js`.

- [ ] **Step 5: Запустить core tests и build**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/projectValidationWorkerSchemaCache.test.ts metadata/workerPool/workerState.test.ts --no-isolate
pnpm --filter @nkdk/core build
test ! -e packages/core/dist/projectValidationAjvStandalone.js
pnpm --filter @nkdk/core type-check
```

Expected: PASS; standalone file отсутствует.

- [ ] **Step 6: Создать коммит**

```bash
git add packages/core/metadata/validation packages/core/metadata/workerPool packages/core/scripts/build.mjs
git commit -m "refactor: :recycle: компилировать схемы в validation worker"
```

---

### Task 4: Удаление AJV из зависимостей и MCP build

**Files:**
- Modify: `packages/core/package.json`
- Modify: `packages/mcp/package.json`
- Modify: `packages/core/scripts/build.mjs`
- Modify: `packages/mcp/scripts/build.mjs`
- Modify: `packages/mcp/src/server.test.ts`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: core worker без соседнего standalone module.
- Produces: core и MCP без direct dependencies `ajv`/`ajv-formats`.

- [ ] **Step 1: Обновить MCP publish test**

```ts
expect(source).toContain('outfile: join(binDir, "worker.js")')
expect(source).not.toContain("projectValidationAjvStandalone")
```

- [ ] **Step 2: Подтвердить падение до очистки build**

```bash
pnpm --filter @nkdk/mcp exec vitest run src/server.test.ts --no-isolate
```

Expected: FAIL, MCP build script ещё содержит standalone path.

- [ ] **Step 3: Очистить build scripts**

Из MCP build удалить generator build, dynamic import, generation и `cp`. Из `external` core/MCP удалить `ajv` и `ajv-formats`.

- [ ] **Step 4: Удалить dependencies и обновить lockfile**

Удалить `ajv`/`ajv-formats` из core и MCP `dependencies`, оставить `typebox: "1.3.11"`, затем:

```bash
pnpm install --offline
```

- [ ] **Step 5: Доказать отсутствие production AJV**

```bash
if rg -n 'ajv|AJV' packages/core packages/mcp --glob '*.{ts,mjs}'; then exit 1; fi
```

Expected: exit `0` без совпадений.

- [ ] **Step 6: Собрать packages и запустить MCP test**

```bash
pnpm --filter @nkdk/core build
pnpm --filter @nkdk/mcp build
pnpm --filter @nkdk/mcp exec vitest run src/server.test.ts --no-isolate
test ! -e packages/mcp/dist/bin/projectValidationAjvStandalone.js
```

Expected: PASS; standalone file отсутствует.

- [ ] **Step 7: Создать коммит**

```bash
git add packages/core/package.json packages/mcp/package.json packages/core/scripts/build.mjs packages/mcp/scripts/build.mjs packages/mcp/src/server.test.ts pnpm-lock.yaml
git commit -m "chore: :wrench: удалить AJV из validation build"
```

---

### Task 5: Паритет, производительность и полная проверка

**Files:**
- Verify: `packages/core/metadata/validation/typeboxValidationCompiler.ts`
- Verify: `packages/core/metadata/validation/validateFile.test.ts`
- Verify: `packages/core/scripts/measure-validation-schemas.mjs`
- Verify: `/private/tmp/nkdk-ajv-validation-baseline.json`

**Interfaces:**
- Consumes: законченный TypeBox path Tasks 1–4.
- Produces: parity report, compile/memory profile и зелёные проверки.

- [ ] **Step 1: Повторить узкие validation tests**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/typeboxValidationCompiler.test.ts metadata/validation/compileValidationSchema.test.ts metadata/validation/validateFile.test.ts metadata/validation/projectValidationWorkerSchemaCache.test.ts --no-isolate
```

Expected: PASS; одна error, полный nested path, unknown discriminator на поле `Вид`.

- [ ] **Step 2: Измерить compile time и память cache**

```bash
pnpm --filter @nkdk/core exec tsx --expose-gc scripts/measure-validation-schemas.mjs /Users/nikita/git/sed_nkdk/cf
```

Expected: `compileAll` завершается. Зафиксировать `totalMs`, `rssBeforeMb`, `rssAfterMb`; ориентиры прототипа — около 259 мс компиляции и 687 MiB peak процесса, не жёсткие thresholds.

- [ ] **Step 3: Выполнить production validation profile**

```bash
profile_dir=$(mktemp -d /private/tmp/nkdk-typebox-profile.XXXXXX)
mkdir -p "$profile_dir/cf"
rsync -a --exclude .nkdk /Users/nikita/git/sed_nkdk/cf/ "$profile_dir/cf/"
pnpm --filter @nkdk/core build
perl -e 'alarm 115; exec @ARGV' node .agents/skills/validation-profile/validation-profile.mjs "$profile_dir/cf" --runs 3 --json > /private/tmp/nkdk-typebox-validation-profile.json
```

Expected: diagnostics digest/counts совпадают с `/private/tmp/nkdk-ajv-validation-baseline.json`. Зафиксировать cold/warm и peak RSS.

- [ ] **Step 4: Проверить одну ошибку на input с несколькими нарушениями**

В tests использовать nested discriminator input с неверным типом и лишним полем. Проверить `errors.length === 1` и полный path выбранной ветви.

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/typeboxValidationCompiler.test.ts metadata/validation/validateFile.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 5: Выполнить обязательные проверки**

```bash
pnpm test
pnpm duplicates -- --base df2bf639c
pnpm test:architecture:rules
pnpm test:architecture
```

Expected: все exits `0`; dependency-cruiser baseline не изменён.

- [ ] **Step 6: Проверить итоговый diff**

```bash
git status --short
git diff --check df2bf639c...HEAD
git log --oneline df2bf639c..HEAD
```

Expected: только запланированные code/test/docs changes; profiles и temporary benchmarks не добавлены в git.

- [ ] **Step 7: Коммитить только реальные исправления проверки**

Если Step 5 потребовал изменения, создать отдельный Conventional Commit с gitmoji, повторить затронутый test и весь Step 5. Пустой commit не создавать.
