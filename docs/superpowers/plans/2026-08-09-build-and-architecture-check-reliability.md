# Build and Architecture Check Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Восстановить самостоятельную сборку standalone validation и заставить architecture quality gate всегда анализировать текущий исходный код.

**Architecture:** Точка входа генератора регистрирует metadata до динамической загрузки реализации, поэтому модуль `project/specs.ts` видит заполненные реестры. Dependency-cruiser запускается без межветочного кэша; baseline и архитектурные правила не меняются.

**Tech Stack:** TypeScript 6, Node.js 26, esbuild, Vitest, Node Test Runner, dependency-cruiser, pnpm.

## Global Constraints

- Не возвращать `.dependency-cruiser-known-violations.json` и не ослаблять архитектурные правила.
- Не изменять содержимое генерируемых JSON Schema.
- Не дублировать регистрацию metadata в build-скриптах core и MCP.
- Не затрагивать пользовательские изменения в других спеках и файлах.
- После каждого слоя выполнять `pnpm duplicates -- --base b7e5d4532`.

---

### Task 1: Самостоятельная регистрация metadata генератором standalone validation

**Files:**
- Create: `packages/core/metadata/validation/generateProjectValidationAjvStandaloneImplementation.ts`
- Modify: `packages/core/metadata/validation/generateProjectValidationAjvStandalone.ts`
- Create: `packages/core/metadata/validation/generateProjectValidationAjvStandalone.test.ts`

**Interfaces:**
- Consumes: `registerCoreMetadata(): void` из `packages/core/metadata/register.ts`.
- Produces: неизменённый публичный интерфейс `generateProjectValidationAjvStandalone(params: { outfile: string }): Promise<void>`.
- Internal: `runRegisteredProjectValidationGenerator(params, dependencies): Promise<void>` вызывает `dependencies.register()` до `dependencies.loadImplementation()`.

- [ ] **Step 1: Написать падающий тест порядка регистрации**

Создать быстрый unit-тест без построения настоящих схем:

```ts
import { describe, expect, it } from "vitest"
import { runRegisteredProjectValidationGenerator } from "./generateProjectValidationAjvStandalone"

describe("standalone validation generator entry", () => {
  it("регистрирует metadata до загрузки реализации", async () => {
    const trace: string[] = []

    await runRegisteredProjectValidationGenerator(
      { outfile: "/tmp/project-validation.js" },
      {
        register: () => trace.push("register"),
        loadImplementation: async () => {
          trace.push("load")
          return {
            generate: async () => {
              trace.push("generate")
            },
          }
        },
      },
    )

    expect(trace).toEqual(["register", "load", "generate"])
  })
})
```

- [ ] **Step 2: Запустить тест и подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/generateProjectValidationAjvStandalone.test.ts --no-isolate
```

Expected: FAIL, потому что `runRegisteredProjectValidationGenerator` ещё не экспортируется.

- [ ] **Step 3: Отделить реализацию генерации схем**

Перенести всё текущее содержимое генератора в
`generateProjectValidationAjvStandaloneImplementation.ts`. Единственное
смысловое изменение в перенесённом коде — имя экспортируемой функции:

```ts
-export async function generateProjectValidationAjvStandalone(params: { outfile: string }): Promise<void> {
+export async function generateProjectValidationAjvStandaloneImplementation(params: { outfile: string }): Promise<void> {
```

В новом файле сохраняются существующие `withSchemaId`,
`createStandaloneValidatorsCode` и `normalizeStandaloneCodeForEsm`.

- [ ] **Step 4: Реализовать регистрирующую точку входа**

Содержимое `generateProjectValidationAjvStandalone.ts` должно иметь следующую
границу:

```ts
import { registerCoreMetadata } from "../register"

interface GeneratorDependencies {
  register(): void
  loadImplementation(): Promise<{
    generate(params: { outfile: string }): Promise<void>
  }>
}

const defaultDependencies: GeneratorDependencies = {
  register: registerCoreMetadata,
  async loadImplementation() {
    const implementation = await import("./generateProjectValidationAjvStandaloneImplementation")
    return { generate: implementation.generateProjectValidationAjvStandaloneImplementation }
  },
}

export async function runRegisteredProjectValidationGenerator(
  params: { outfile: string },
  dependencies: GeneratorDependencies,
): Promise<void> {
  dependencies.register()
  const implementation = await dependencies.loadImplementation()
  await implementation.generate(params)
}

export function generateProjectValidationAjvStandalone(
  params: { outfile: string },
): Promise<void> {
  return runRegisteredProjectValidationGenerator(params, defaultDependencies)
}
```

Статический импорт реализации запрещён: он снова выполнит `project/specs.ts` до
регистрации.

- [ ] **Step 5: Запустить тест слоя и type-check**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/generateProjectValidationAjvStandalone.test.ts --no-isolate
pnpm --filter @nkdk/core type-check
pnpm duplicates -- --base b7e5d4532
```

Expected: тест PASS, TypeScript без ошибок, новых дублей нет.

- [ ] **Step 6: Проверить настоящую сборку core**

Run:

```bash
pnpm --filter @nkdk/core build
```

Expected: exit 0; созданы `packages/core/dist/projectValidationAjvStandalone.js`
и `packages/core/dist/generateProjectValidationAjvStandalone.js`.

- [ ] **Step 7: Зафиксировать слой**

```bash
git add packages/core/metadata/validation/generateProjectValidationAjvStandalone.ts \
  packages/core/metadata/validation/generateProjectValidationAjvStandaloneImplementation.ts \
  packages/core/metadata/validation/generateProjectValidationAjvStandalone.test.ts
git commit -m "fix: :bug: регистрировать metadata перед standalone validation"
```

---

### Task 2: Всегда свежий dependency-граф

**Files:**
- Modify: `tools/dependency-cruiser/src/cruise-result.mjs`
- Modify: `tools/dependency-cruiser/test/cruise-result.test.mjs`

**Interfaces:**
- Consumes: `runDepcruise(command, args, options)`.
- Produces: `dependencyCruiseArgs(outputPath): string[]`, всегда содержащий `--no-cache`.
- Existing: `createCruiseResult(options = {})` сохраняет сигнатуру и использует новый построитель аргументов.

- [ ] **Step 1: Написать падающий тест аргументов quality gate**

Дополнить `cruise-result.test.mjs`:

```js
import {
  assertCompleteCruiseResult,
  dependencyCruiseArgs,
} from "../src/cruise-result.mjs"

test("всегда отключает межветочный кэш dependency-cruiser", () => {
  assert.deepEqual(dependencyCruiseArgs("/tmp/current.json"), [
    "--config",
    ".dependency-cruiser.mjs",
    "--output-type",
    "json",
    "--output-to",
    "/tmp/current.json",
    "--no-cache",
    "packages",
  ])
})
```

- [ ] **Step 2: Запустить тест и подтвердить падение**

Run:

```bash
node --test tools/dependency-cruiser/test/cruise-result.test.mjs
```

Expected: FAIL, потому что `dependencyCruiseArgs` ещё не экспортируется.

- [ ] **Step 3: Удалить условную проверку git status и добавить чистый построитель**

Удалить `hasRelevantWorkingTreeChanges`. Добавить:

```js
export function dependencyCruiseArgs(outputPath) {
  return [
    "--config",
    ".dependency-cruiser.mjs",
    "--output-type",
    "json",
    "--output-to",
    outputPath,
    "--no-cache",
    "packages",
  ]
}
```

В `createCruiseResult` заменить локальный массив на:

```js
const args = dependencyCruiseArgs(outputPath)
```

- [ ] **Step 4: Запустить тесты инструмента и настоящий quality gate**

Run:

```bash
node --test 'tools/dependency-cruiser/test/*.test.mjs'
pnpm test:architecture
pnpm duplicates -- --base b7e5d4532
```

Expected: все тесты PASS; architecture сообщает ноль новых нарушений и ноль
циклических компонент; новых дублей нет.

- [ ] **Step 5: Зафиксировать слой**

```bash
git add tools/dependency-cruiser/src/cruise-result.mjs \
  tools/dependency-cruiser/test/cruise-result.test.mjs
git commit -m "fix: :bug: пересчитывать architecture-граф без кэша"
```

---

### Task 3: Сквозная проверка сборки и проекта

**Files:**
- Verify only; производственные файлы не изменяются.

**Interfaces:**
- Consumes: самостоятельный генератор из Task 1 и свежий architecture quality gate из Task 2.
- Produces: подтверждённую сборку core/MCP и полный результат проверок ветки.

- [ ] **Step 1: Собрать оба пакета**

Run:

```bash
pnpm --filter @nkdk/core build
pnpm --filter @nkdk/mcp build
```

Expected: обе команды завершаются с exit 0; ошибка
`Metadata не зарегистрирована перед операцией project/specs` отсутствует.

- [ ] **Step 2: Выполнить статические проверки последовательно**

Run:

```bash
pnpm type-check
pnpm test:architecture
pnpm duplicates -- --base b7e5d4532
```

Expected: TypeScript без ошибок, ноль новых архитектурных нарушений, ноль новых
дублей.

- [ ] **Step 3: Выполнить полный набор тестов без параллельной нагрузки**

Run:

```bash
pnpm test
```

Expected: все тесты проходят, включая контроль длительности. Если случайный
тест превышает локальный бюджет, сохранить точное имя и длительность; не менять
не относящийся к плану тест без воспроизводимого превышения.

- [ ] **Step 4: Проверить границы итогового diff**

Run:

```bash
git status --short
git diff b7e5d4532 --stat
git log --oneline b7e5d4532..HEAD
```

Expected: изменены только файлы из Tasks 1–2 и документы этого цикла; сторонние
пользовательские изменения сохранены отдельно.
