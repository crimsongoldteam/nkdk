# Compact Standalone Validation Memory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Выпустить строгий functions-only standalone validation v3, удалить неиспользуемые schema/context/error-данные и сохранить поведение YAML-диагностик.

**Architecture:** Production validation использует единый минимальный договор `Check()`/`Errors()`. Standalone v3 хранит только готовые функции form/item validators; исходные схемы, refs и context остаются только на этапе сборки. Позиции диагностик продолжают вычисляться из `instancePath` через существующий `YamlLocationIndex`.

**Tech Stack:** TypeScript, Ajv 2020 standalone, TypeBox, Vitest, esbuild, Node.js worker_threads.

## Global Constraints

- Не изменять существующие XML-фикстуры.
- Не добавлять новые `fromXML`/`toXML`/`fromYAML`/`toYAML`.
- Сохранить посторонние изменения в `localIndexes.ts`, `yamlFactExtractor.ts` и `yamlFactExtractor.test.ts`.
- В постоянном результате не должно быть временного memory-скрипта и вложенного профиля `Загрузка standalone`.
- Не вводить численный CI-порог памяти.
- Перед завершением выполнить `pnpm test` из корня.
- Спецификация: `docs/superpowers/specs/2026-07-30-compact-standalone-validation-memory-design.md`.

---

### Task 1: Удалить legacy-договор Schema/Context

**Files:**
- Modify: `packages/core/metadata/validation/compileValidationSchema.ts`
- Modify: `packages/core/metadata/validation/compileValidationSchema.test.ts`
- Modify: `packages/core/metadata/validation/schemaRegistry.test.ts`
- Modify: `packages/core/metadata/validation/projectValidationPasses.ts`
- Modify: `packages/core/metadata/validation/projectValidationPasses.test.ts`
- Modify: `packages/core/metadata/validation/schemaCache.ts`
- Modify: `packages/core/metadata/validation/validateFile.ts`
- Modify: `packages/core/metadata/validation/validateFile.test.ts`
- Modify: `packages/core/metadata/validation/validateItem.ts`
- Modify: `packages/core/metadata/validation/typeboxErrorsToDiagnostics.ts`
- Modify: `packages/core/metadata/validation/projectValidationStandaloneLoader.ts`
- Modify: `packages/core/metadata/validation/projectValidationStandaloneLoader.test.ts`

**Interfaces:**
- Consumes: `ValidateFunction`, существующие Ajv/TypeBox validators.
- Produces: `ValidationSchemaValidator` без типового параметра, `Schema()` и `Context()`; `createValidationSchemaFromAjvFunction(validate)`.

- [ ] **Step 1: Написать падающий тест нового adapter API**

В `compileValidationSchema.test.ts` заменить старый тест adapter на вызов функции без schema/context:

```ts
it("wraps a standalone Ajv function without schema metadata", () => {
  const validate = Object.assign(
    (value: unknown) => typeof value === "string",
    { errors: null as ValidateFunction["errors"] }
  ) as ValidateFunction

  const compiled = createValidationSchemaFromAjvFunction(validate)

  expect(compiled.Check("ok")).toBe(true)
  expect(compiled.Check(42)).toBe(false)
})
```

Удалить утверждения `compiled.Schema()` и `compiled.Context()` из этого теста: новый договор не должен их предоставлять.

- [ ] **Step 2: Убедиться, что тест падает на старом adapter API**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/compileValidationSchema.test.ts
```

Expected: FAIL в тесте `wraps a standalone Ajv function without schema metadata`, потому что текущий `createValidationSchemaFromAjvFunction` ожидает объект `{ schema, context, validate }`.

- [ ] **Step 3: Сузить production-интерфейс**

В `compileValidationSchema.ts` заменить интерфейс:

```ts
export interface ValidationSchemaValidator {
  Check(value: unknown): boolean
  Errors(value: unknown): [boolean, ValidationSchemaError[]]
}
```

Оба overload `compileValidationSchema` должны возвращать `ValidationSchemaValidator` без типового параметра. Удалить `Schema()`/`Context()` из Ajv- и TypeBox-объектов.

Заменить standalone adapter на:

```ts
class AjvFunctionValidationSchema implements ValidationSchemaValidator {
  constructor(private readonly validate: ValidateFunction) {}

  Check(value: unknown): boolean {
    return this.validate(value)
  }

  Errors(value: unknown): [boolean, ValidationSchemaError[]] {
    const valid = this.validate(value)
    if (valid) return [true, []]
    return [false, normalizeAjvErrors(this.validate.errors)]
  }
}

export function createValidationSchemaFromAjvFunction(validate: ValidateFunction): ValidationSchemaValidator {
  return new AjvFunctionValidationSchema(validate)
}
```

В `projectValidationStandaloneLoader.ts` вызывать:

```ts
return createValidationSchemaFromAjvFunction(validator.validate)
```

Не создавать `Type.Any()` и не передавать refs/schema context.

- [ ] **Step 4: Обновить потребителей узкого интерфейса**

Во всех перечисленных файлах заменить `ValidationSchemaValidator<TSchema>` на `ValidationSchemaValidator`. Удалить ставшие неиспользуемыми импорты `TSchema`.

В `validateFile.test.ts` оставить test-double только с `Check()` и `Errors()`:

```ts
const countedSchema: ValidationSchemaValidator = {
  Check(value) {
    checkCalls += 1
    return simpleSchema.Check(value)
  },
  Errors(value) {
    errorsCalls += 1
    return simpleSchema.Errors(value)
  },
}
```

Удалить проверки `Schema()`/`Context()` из:

- `compileValidationSchema.test.ts`;
- `projectValidationPasses.test.ts`;
- `projectValidationStandaloneLoader.test.ts`.

В `typeboxErrorsToDiagnostics.ts` временно оставить параметр `_schema?: ValidationSchemaValidator` без generic; Task 2 удалит его полностью.

- [ ] **Step 5: Проверить узкий договор**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/compileValidationSchema.test.ts metadata/validation/projectValidationStandaloneLoader.test.ts metadata/validation/projectValidationPasses.test.ts metadata/validation/validateFile.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: все выбранные тесты PASS, `tsc --noEmit` завершается с кодом 0.

- [ ] **Step 6: Зафиксировать удаление legacy API**

```bash
git add packages/core/metadata/validation/compileValidationSchema.ts packages/core/metadata/validation/compileValidationSchema.test.ts packages/core/metadata/validation/schemaRegistry.test.ts packages/core/metadata/validation/projectValidationPasses.ts packages/core/metadata/validation/projectValidationPasses.test.ts packages/core/metadata/validation/schemaCache.ts packages/core/metadata/validation/validateFile.ts packages/core/metadata/validation/validateFile.test.ts packages/core/metadata/validation/validateItem.ts packages/core/metadata/validation/typeboxErrorsToDiagnostics.ts packages/core/metadata/validation/projectValidationStandaloneLoader.ts packages/core/metadata/validation/projectValidationStandaloneLoader.test.ts
git commit -m "refactor!: :recycle: удалить legacy-договор validation schema" -m "BREAKING CHANGE: ValidationSchemaValidator больше не предоставляет Schema() и Context(); createValidationSchemaFromAjvFunction принимает готовую ValidateFunction."
```

---

### Task 2: Удалить неиспользуемые schema/value из ошибок

**Files:**
- Modify: `packages/core/metadata/validation/compileValidationSchema.ts`
- Modify: `packages/core/metadata/validation/compileValidationSchema.test.ts`
- Modify: `packages/core/metadata/validation/typeboxErrorsToDiagnostics.ts`
- Modify: `packages/core/metadata/validation/validateFile.ts`
- Test: `packages/core/metadata/validation/validateFile.test.ts`

**Interfaces:**
- Consumes: Ajv `ErrorObject` с compact fields.
- Produces: `ValidationSchemaError`/`ValidationError` без `schema` и `value`; неизменные `Diagnostic.line`, `col`, `path`, `message`.

- [ ] **Step 1: Добавить падающую проверку compact normalized errors**

В `compileValidationSchema.test.ts` после получения ошибки добавить:

```ts
expect(Object.keys(errors[0] ?? {}).sort()).toEqual([
  "instancePath",
  "keyword",
  "message",
  "params",
  "schemaPath",
])
```

Тест защищает нормализованный договор, а не внутренний текст сгенерированного кода.

- [ ] **Step 2: Убедиться, что проверка ловит старые поля**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/compileValidationSchema.test.ts
```

Expected: FAIL; фактические ключи дополнительно содержат `schema` и `value`.

- [ ] **Step 3: Удалить лишние ссылки из ошибок**

В `ValidationSchemaError` и `ValidationError` удалить:

```ts
schema?: TSchema
value?: unknown
```

В `normalizeAjvError` оставить:

```ts
return {
  keyword: error.keyword,
  schemaPath: error.schemaPath,
  instancePath: error.instancePath,
  params: error.params as Record<string, unknown>,
  message: error.message ?? error.keyword,
}
```

Удалить импорты `TSchema` и неиспользуемый параметр `_schema` из `typeboxErrorsToDiagnostics`.

В `validateFile.ts` заменить создание копий ошибок на прямой вызов:

```ts
if (!valid) return typeboxErrorsToDiagnostics(errors, parsed, filePath)
```

- [ ] **Step 4: Проверить compact errors и позиции YAML**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/compileValidationSchema.test.ts metadata/validation/validateFile.test.ts
```

Expected: PASS, включая существующие проверки:

- `line: 3, col: 9, path: "/Лишнее"`;
- `line: 7, col: 20, path: "/Элементы/Группа1/Элементы/Надпись1/Заголовок"`;
- required property на родительском узле.

- [ ] **Step 5: Зафиксировать компактный договор ошибок**

```bash
git add packages/core/metadata/validation/compileValidationSchema.ts packages/core/metadata/validation/compileValidationSchema.test.ts packages/core/metadata/validation/typeboxErrorsToDiagnostics.ts packages/core/metadata/validation/validateFile.ts packages/core/metadata/validation/validateFile.test.ts
git commit -m "perf: :zap: убрать лишние данные ошибок validation"
```

---

### Task 3: Выпустить строгий functions-only standalone v3

**Files:**
- Modify: `packages/core/metadata/validation/generateProjectValidationAjvStandalone.ts`
- Modify: `packages/core/metadata/validation/projectValidationStandaloneTypes.ts`
- Modify: `packages/core/metadata/validation/projectValidationStandaloneLoader.ts`
- Modify: `packages/core/metadata/validation/projectValidationStandaloneLoader.test.ts`
- Modify: `packages/core/metadata/validation/projectValidationStandaloneBuild.test.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorker.ts`
- Modify: `packages/core/metadata/validation/projectValidationWorkerSchemaCache.ts`
- Modify temporarily: `packages/core/scripts/measure-standalone-import-memory.mjs`

**Interfaces:**
- Consumes: Ajv-generated `ValidateFunction` exports.
- Produces: `ProjectValidationStandaloneModule` формата `project-validation-ajv-standalone-v3` только с `format`, `form`, `byItemType`.

- [ ] **Step 1: Написать падающие тесты формата v3**

В `projectValidationStandaloneLoader.test.ts` использовать модуль:

```ts
const module = {
  format: "project-validation-ajv-standalone-v3",
  form: { validate: validAny() },
  byItemType: {
    MetadataCatalog: { validate: validAny() },
  },
} satisfies ProjectValidationStandaloneModule
```

Заменить тест context mismatch на:

```ts
it("rejects obsolete standalone formats", () => {
  expect(() =>
    createValidationSchemaCacheFromStandaloneModule({
      format: "project-validation-ajv-standalone-v2",
    } as never)
  ).toThrow("Unsupported standalone validation module format")
})
```

В `projectValidationStandaloneBuild.test.ts` ожидать:

```ts
format: "project-validation-ajv-standalone-v3",
moduleKeys: ["byItemType", "form", "format"],
formKeys: ["validate"],
configurationKeys: ["validate"],
formErrorKeys: ["instancePath", "keyword", "message", "params", "schemaPath"],
```

Перед RED-проверкой выполнить текущую сборку, чтобы test действительно загрузил dist:

```bash
pnpm --filter @nkdk/core build
pnpm --filter @nkdk/core exec vitest run metadata/validation/projectValidationStandaloneLoader.test.ts metadata/validation/projectValidationStandaloneBuild.test.ts
```

Expected: FAIL на `v3`/module keys, потому что текущий модуль ещё имеет формат `v2` и `context`.

- [ ] **Step 2: Описать строгие типы v3**

Заменить `projectValidationStandaloneTypes.ts` на договор:

```ts
import type { ValidateFunction } from "ajv"

export interface ProjectValidationStandaloneValidator {
  validate: ValidateFunction
}

export interface ProjectValidationStandaloneModule {
  format: "project-validation-ajv-standalone-v3"
  form: ProjectValidationStandaloneValidator
  byItemType: Record<string, ProjectValidationStandaloneValidator>
}
```

Не оставлять optional legacy-поля `schema`, `refs` или `context`.

- [ ] **Step 3: Удалить исходные данные из generator output**

В `generateProjectValidationAjvStandalone.ts`:

- сохранить `schemaSet.context`, `refs`, form schema и item schemas только как вход генерации Ajv;
- оставить `verbose: false`;
- не хранить `schema` в `entries`;
- сформировать:

```ts
const moduleCode = [
  validatorsCode,
  "",
  "const module = {",
  '  format: "project-validation-ajv-standalone-v3",',
  "  form: { validate: validateForm },",
  "  byItemType: {",
  ...entries.map(
    (entry) => `    ${JSON.stringify(entry.itemType)}: { validate: ${entry.exportName} },`
  ),
  "  },",
  "}",
  "",
  "export default module",
  "",
].join("\n")
```

В output не должно быть `JSON.stringify(schemaSet.context)`, `JSON.stringify(refs)`, `JSON.stringify(formSchema)` или `JSON.stringify(entry.schema)`.

- [ ] **Step 4: Упростить loader v3**

В `projectValidationStandaloneLoader.ts`:

- удалить `ConfigurationContext`, `assertStandaloneValidationContext`, `Type` и schema placeholder;
- `createValidationSchemaCacheFromStandaloneModule(module)` принимает только module;
- `loadProjectValidationStandaloneCache({ modulePath })` принимает только путь;
- `createCompiledStandaloneValidator(validator)` вызывает `createValidationSchemaFromAjvFunction(validator.validate)`;
- assert принимает только `project-validation-ajv-standalone-v3`.

В `projectValidationWorkerSchemaCache.ts` compiled-ветка вызывает:

```ts
return loadProjectValidationStandaloneCache({ modulePath })
```

Параметр `context` функции сохраняется для source `.ts`-ветки, где выполняется runtime-компиляция.

Одновременно удалить временное вложенное профилирование:

- в `preparedYamlProjectWorker.ts` не передавать `profiler` в schema cache;
- из `projectValidationWorkerSchemaCache.ts` удалить import `ValidationProfiler`, optional-параметр `profiler` и wrapper `measureAsync("Инициализация", "Загрузка standalone", ...)`.

- [ ] **Step 5: Обновить незакоммиченный измеритель для финального замера v3**

В `measure-standalone-import-memory.mjs` временно заменить ожидаемый format:

```js
if (result.format !== "project-validation-ajv-standalone-v3") {
  // existing error
}
```

Этот файл не добавлять в индекс: он не входит в постоянный результат и будет удалён в Task 4.

- [ ] **Step 6: Собрать и проверить v3**

Run:

```bash
pnpm --filter @nkdk/core build
pnpm --filter @nkdk/core exec vitest run metadata/validation/projectValidationStandaloneLoader.test.ts metadata/validation/projectValidationStandaloneBuild.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: build exit 0, все выбранные loader/build tests PASS, type-check exit 0.

- [ ] **Step 7: Зафиксировать v3**

```bash
git add packages/core/metadata/validation/generateProjectValidationAjvStandalone.ts packages/core/metadata/validation/projectValidationStandaloneTypes.ts packages/core/metadata/validation/projectValidationStandaloneLoader.ts packages/core/metadata/validation/projectValidationStandaloneLoader.test.ts packages/core/metadata/validation/projectValidationStandaloneBuild.test.ts packages/core/metadata/project/preparedYamlProjectWorker.ts packages/core/metadata/validation/projectValidationWorkerSchemaCache.ts
git commit -m "perf!: :zap: выпустить functions-only standalone validation v3" -m "BREAKING CHANGE: project-validation-ajv-standalone-v3 больше не экспортирует context, refs и schema; loader принимает только v3."
```

---

### Task 4: Выполнить финальный замер и удалить временную диагностику

**Files:**
- Delete: `packages/core/scripts/measure-standalone-import-memory.mjs`
- Verify: all files changed by Tasks 1–3.

**Interfaces:**
- Consumes: собранный standalone v3 и штатный validation profile.
- Produces: постоянный production-код без временных измерителей; подтверждённый test/build result.

- [ ] **Step 1: Выполнить последний изолированный замер**

Свежая сборка обязательна:

```bash
pnpm --filter @nkdk/core build
node --expose-gc packages/core/scripts/measure-standalone-import-memory.mjs --runs 5
```

Записать в итоговый отчёт размер standalone, RSS первого импорта, медианы `heapUsed`, `external` и времени импорта. Не добавлять численные значения в тесты.

- [ ] **Step 2: Проверить готовность реального YAML-каталога**

Run:

```bash
rg --files /Users/nikita/git/nkdk-yaml/cf -g '*.yaml'
```

Expected: список непустой перед заявлением о полноценной validation.

Если список пуст, не запускать и не интерпретировать full-project benchmark; явно указать, что финальный изолированный замер выполнен, а проверка реального каталога ожидает завершения импорта.

Если список непуст, после свежей сборки выполнить:

```bash
pnpm --filter @nkdk/core build
node .agents/skills/validation-profile/validation-profile.mjs /Users/nikita/git/nkdk-yaml --runs 1 --timing
```

Expected: compiled standalone mode, ненулевое число обработанных YAML в profile и отсутствие новых диагностик относительно baseline каталога.

- [ ] **Step 3: Удалить временный memory-скрипт**

Удалить файл:

```text
packages/core/scripts/measure-standalone-import-memory.mjs
```

- [ ] **Step 4: Выполнить сфокусированную проверку**

Run:

```bash
pnpm --filter @nkdk/core build
pnpm --filter @nkdk/core exec vitest run metadata/validation/compileValidationSchema.test.ts metadata/validation/projectValidationStandaloneLoader.test.ts metadata/validation/projectValidationStandaloneBuild.test.ts metadata/validation/projectValidationPasses.test.ts metadata/validation/validateFile.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: build, выбранные тесты и type-check завершаются с кодом 0.

- [ ] **Step 5: Выполнить полную проверку проекта**

Run:

```bash
pnpm test
```

Expected: все пакеты `packages/*` проходят без ошибок.

- [ ] **Step 6: Проверить границы diff**

Run:

```bash
git diff --check
git status --short
```

Expected:

- временный memory-скрипт отсутствует;
- в `preparedYamlProjectWorker.ts` и `projectValidationWorkerSchemaCache.ts` нет временного profiler plumbing;
- посторонние изменения `localIndexes.ts`, `yamlFactExtractor.ts`, `yamlFactExtractor.test.ts` сохранены и не включены в staged diff задачи.
