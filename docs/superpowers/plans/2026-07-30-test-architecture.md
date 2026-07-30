# Test Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ввести обязательную для ИИ архитектуру тестов и безопасные команды mutation testing, позволяющие доказательно удалять избыточные тесты.

**Architecture:** `AGENTS.md` хранит короткие обязательные принципы и ссылается на `.agents/testing.md` с полным процессом. Два небольших CLI-модуля запускают Stryker только для явно переданных production-файлов и сравнивают JSON-отчёты до и после изменения тестов.

**Tech Stack:** Node.js 26, TypeScript, Vitest 4, StrykerJS 9, pnpm.

## Global Constraints

- Не изменять существующие XML-фикстуры.
- Новый тест сохраняется только при доказанной уникальной ценности.
- Автоматически не удалять round-trip, XML/YAML fixture-, snapshot-, архитектурные и связанные с issue регрессионные тесты.
- Mutation testing всегда получает явный непустой список production TypeScript-файлов внутри `packages/`.
- Имя отчёта соответствует `[a-z0-9][a-z0-9-]*`.
- Сравнение допускается только для отчётов с одинаковыми production-исходниками.
- Отчёты с `Timeout`, `RuntimeError` или `CompileError` отклоняются как недостоверные.
- После изменения запускать `pnpm type-check` и `pnpm test`.
- Спецификация: `docs/superpowers/specs/2026-07-30-test-architecture-design.md`.

---

### Task 1: Безопасный запуск mutation testing

**Files:**
- Create: `packages/core/scripts/run-mutation-tests.mjs`
- Create: `packages/core/scripts/run-mutation-tests.test.ts`
- Modify: `package.json`
- Modify: `stryker.config.mjs`

**Interfaces:**
- Consumes: аргументы `--report <имя> <production-файл...>` из корня проекта.
- Produces: `parseMutationArguments(argv)`, `validateMutationFiles(projectRoot, files)` и команда `pnpm test:mutation -- --report <имя> <файлы...>`.

- [x] **Step 1: Написать падающие тесты разбора и проверки входов**

Создать `run-mutation-tests.test.ts`:

```ts
import { describe, expect, it } from "vitest"
// @ts-expect-error CLI-модуль остаётся исполняемым JavaScript без отдельной декларации типов.
import { parseMutationArguments, validateMutationFiles } from "./run-mutation-tests.mjs"

describe("run mutation tests", () => {
  it("requires an explicit report name and production files", () => {
    expect(() => parseMutationArguments([])).toThrow("Использование:")
    expect(() => parseMutationArguments(["--report", "before"])).toThrow("Не указаны production-файлы")
  })

  it("accepts a safe report name and file list", () => {
    expect(parseMutationArguments(["--report", "before-change", "packages/core/a.ts"])).toEqual({
      reportName: "before-change",
      files: ["packages/core/a.ts"],
    })
  })

  it.each(["../outside.ts", "packages/core/a.test.ts", "packages/core/__fixtures__/a.ts", "packages/core/a.js"])(
    "rejects unsafe mutation target %s",
    (file) => {
      expect(() => validateMutationFiles("/project", [file], () => true)).toThrow()
    }
  )

  it("normalizes valid production files", () => {
    expect(validateMutationFiles("/project", ["packages/core/a.ts"], () => true)).toEqual([
      "packages/core/a.ts",
    ])
  })
})
```

- [x] **Step 2: Убедиться, что тест падает без CLI-модуля**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run scripts/run-mutation-tests.test.ts
```

Expected: FAIL, модуль `run-mutation-tests.mjs` не найден.

- [x] **Step 3: Реализовать проверяемую обёртку**

Создать `run-mutation-tests.mjs` со следующими экспортами и main-блоком:

```js
import { existsSync, statSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { isAbsolute, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const reportNamePattern = /^[a-z0-9][a-z0-9-]*$/u

export function parseMutationArguments(argv) {
  const args = argv[0] === "--" ? argv.slice(1) : argv
  if (args[0] !== "--report" || args[1] === undefined) {
    throw new Error("Использование: pnpm test:mutation -- --report <имя> <production-файл...>")
  }
  const reportName = args[1]
  if (!reportNamePattern.test(reportName)) {
    throw new Error(`Некорректное имя отчёта: ${reportName}`)
  }
  const files = args.slice(2)
  if (files.length === 0) throw new Error("Не указаны production-файлы")
  return { reportName, files }
}

export function validateMutationFiles(projectRoot, files, fileExists = existsSync) {
  return files.map((file) => {
    const absolute = resolve(projectRoot, file)
    const projectPath = relative(projectRoot, absolute).replace(/\\/gu, "/")
    const segments = projectPath.split("/")
    const invalid =
      projectPath.startsWith("../") ||
      isAbsolute(projectPath) ||
      !projectPath.startsWith("packages/") ||
      !projectPath.endsWith(".ts") ||
      projectPath.endsWith(".d.ts") ||
      /\.(?:test|spec)\.ts$/u.test(projectPath) ||
      segments.includes("__fixtures__") ||
      segments.includes("generated") ||
      !fileExists(absolute)
    if (invalid) throw new Error(`Недопустимая цель mutation testing: ${file}`)
    return projectPath
  })
}

export function runMutationTests(projectRoot, options) {
  const files = validateMutationFiles(projectRoot, options.files, (file) =>
    existsSync(file) && statSync(file).isFile()
  )
  return spawnSync("pnpm", ["exec", "stryker", "run", "--mutate", files.join(",")], {
    cwd: projectRoot,
    stdio: "inherit",
    env: { ...process.env, NKDK_STRYKER_REPORT_NAME: options.reportName },
  }).status ?? 1
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    process.exitCode = runMutationTests(process.cwd(), parseMutationArguments(process.argv.slice(2)))
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
```

Перед запуском обёртка удаляет прежние JSON/HTML-отчёты с тем же именем, а после запуска читает новый JSON и отклоняет нестабильные статусы.

- [x] **Step 4: Сделать конфигурацию Stryker общей**

В `stryker.config.mjs` удалить фиксированный `targetResolver.ts`, установить безопасный пустой список и динамические отчёты:

```js
const reportName = process.env.NKDK_STRYKER_REPORT_NAME ?? "mutation"

export default {
  mutate: [],
  // остальные существующие параметры сохраняются
  concurrency: 4,
  timeoutMS: 30_000,
  reporters: ["clear-text", "progress", "json", "html"],
  jsonReporter: {
    fileName: `reports/stryker/${reportName}.json`,
  },
  htmlReporter: {
    fileName: `reports/stryker/${reportName}.html`,
  },
}
```

В корневом `package.json` заменить `test:mutation:pilot`:

```json
"test:mutation": "node packages/core/scripts/run-mutation-tests.mjs"
```

- [x] **Step 5: Проверить модуль и защиту от пустого запуска**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run scripts/run-mutation-tests.test.ts
pnpm test:mutation
```

Expected: Vitest PASS; вторая команда завершается с кодом 1 и печатает строку `Использование:`.

- [x] **Step 6: Проверить реальный целевой запуск**

Run:

```bash
pnpm test:mutation -- --report target-resolver packages/core/scripts/fixture-wizard/targetResolver.ts
```

Expected: 29 мутантов, mutation score 89,66%; созданы игнорируемые `reports/stryker/target-resolver.json` и `.html`.

- [x] **Step 7: Зафиксировать безопасный запуск**

```bash
git add package.json stryker.config.mjs packages/core/scripts/run-mutation-tests.mjs packages/core/scripts/run-mutation-tests.test.ts
git commit -m "chore: :wrench: обобщить запуск mutation testing"
```

---

### Task 2: Сравнение mutation-отчётов

**Files:**
- Create: `packages/core/scripts/compare-mutation-reports.mjs`
- Create: `packages/core/scripts/compare-mutation-reports.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: два Stryker Mutation Testing Elements JSON report с одинаковыми `files[*].source`.
- Produces: `compareMutationReports(before, after)` с `{ preserved, improvements, regressions }` и команда `pnpm test:mutation:compare -- <до> <после>`.

- [x] **Step 1: Написать падающие тесты сравнения**

Создать `compare-mutation-reports.test.ts` с минимальными отчётами:

```ts
import { describe, expect, it } from "vitest"
// @ts-expect-error CLI-модуль остаётся исполняемым JavaScript без отдельной декларации типов.
import { compareMutationReports } from "./compare-mutation-reports.mjs"

const mutant = {
  id: "1",
  mutatorName: "BooleanLiteral",
  replacement: "false",
  location: { start: { line: 1, column: 1 }, end: { line: 1, column: 5 } },
}

function report(status: string, source = "export const value = true") {
  return {
    files: {
      "packages/core/value.ts": {
        language: "typescript",
        source,
        mutants: [{ ...mutant, status }],
      },
    },
  }
}

describe("compare mutation reports", () => {
  it("preserves a killed mutant", () => {
    expect(compareMutationReports(report("Killed"), report("Killed"))).toMatchObject({
      preserved: 1,
      regressions: [],
    })
  })

  it("reports a killed mutant regression", () => {
    expect(compareMutationReports(report("Killed"), report("Survived")).regressions).toHaveLength(1)
  })

  it("reports an improvement", () => {
    expect(compareMutationReports(report("Survived"), report("Killed")).improvements).toHaveLength(1)
  })

  it("rejects changed production sources", () => {
    expect(() => compareMutationReports(report("Killed"), report("Killed", "changed"))).toThrow(
      "Production-исходники отчётов различаются"
    )
  })
})
```

- [x] **Step 2: Убедиться, что тест падает без comparator**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run scripts/compare-mutation-reports.test.ts
```

Expected: FAIL, модуль `compare-mutation-reports.mjs` не найден.

- [x] **Step 3: Реализовать стабильное сопоставление мутантов**

В `compare-mutation-reports.mjs`:

```js
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

const reportNamePattern = /^[a-z0-9][a-z0-9-]*$/u

function mutantKey(file, mutant) {
  return JSON.stringify([
    file,
    mutant.mutatorName,
    mutant.replacement,
    mutant.location?.start,
    mutant.location?.end,
  ])
}

export function compareMutationReports(before, after) {
  assertStableMutationReport(before)
  assertStableMutationReport(after)
  const beforeFiles = Object.keys(before.files ?? {}).sort()
  const afterFiles = Object.keys(after.files ?? {}).sort()
  if (JSON.stringify(beforeFiles) !== JSON.stringify(afterFiles)) {
    throw new Error("Production-файлы отчётов различаются")
  }
  for (const file of beforeFiles) {
    if (before.files[file].source !== after.files[file].source) {
      throw new Error(`Production-исходники отчётов различаются: ${file}`)
    }
  }
  const afterMutants = new Map(
    afterFiles.flatMap((file) => after.files[file].mutants.map((mutant) => [mutantKey(file, mutant), mutant]))
  )
  const regressions = []
  const improvements = []
  let preserved = 0
  for (const file of beforeFiles) {
    for (const mutant of before.files[file].mutants) {
      const current = afterMutants.get(mutantKey(file, mutant))
      if (mutant.status === "Killed") {
        if (current?.status === "Killed") preserved += 1
        else regressions.push({ file, mutant, currentStatus: current?.status ?? "Missing" })
      } else if (current?.status === "Killed") {
        improvements.push({ file, mutant })
      }
    }
  }
  return { preserved, improvements, regressions }
}
```

Добавить разбор имён и main-блок:

```js
export function parseReportNames(argv) {
  const args = argv[0] === "--" ? argv.slice(1) : argv
  if (args.length !== 2 || args.some((name) => !reportNamePattern.test(name))) {
    throw new Error("Использование: pnpm test:mutation:compare -- <до> <после>")
  }
  return args
}

function readReport(name) {
  return JSON.parse(readFileSync(resolve("reports/stryker", `${name}.json`), "utf8"))
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    const [beforeName, afterName] = parseReportNames(process.argv.slice(2))
    const result = compareMutationReports(readReport(beforeName), readReport(afterName))
    process.stdout.write(
      `Сохранено обнаруживаемых мутантов: ${result.preserved}; новых обнаруживаемых: ${result.improvements.length}\n`
    )
    for (const regression of result.regressions) {
      process.stderr.write(
        `Потерян обнаруживаемый мутант: ${regression.file} #${regression.mutant.id} → ${regression.currentStatus}\n`
      )
    }
    if (result.regressions.length > 0) process.exitCode = 1
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
```

- [x] **Step 4: Подключить команду сравнения**

В `package.json` добавить:

```json
"test:mutation:compare": "node packages/core/scripts/compare-mutation-reports.mjs"
```

- [x] **Step 5: Проверить comparator**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run scripts/compare-mutation-reports.test.ts
pnpm test:mutation:compare -- target-resolver target-resolver
```

Expected: тесты PASS; comparator сообщает 26 сохранённых и 0 новых обнаруживаемых мутантов.

- [x] **Step 6: Зафиксировать сравнение**

```bash
git add package.json packages/core/scripts/compare-mutation-reports.mjs packages/core/scripts/compare-mutation-reports.test.ts
git commit -m "chore: :wrench: сравнивать mutation-отчёты"
```

---

### Task 3: Обязательные инструкции для ИИ

**Files:**
- Modify: `AGENTS.md`
- Create: `.agents/testing.md`

**Interfaces:**
- Consumes: команды Tasks 1–2 и архитектуру metadata-слоёв.
- Produces: обязательные правила выбора, добавления, объединения и удаления тестов.

- [x] **Step 1: Добавить краткую политику в `AGENTS.md`**

Расширить раздел `## Написание тестов` принципами из спецификации и ссылкой:

```md
- при добавлении или изменении функциональности следуй [архитектуре тестов](.agents/testing.md)
- тестируй наблюдаемый договор, а не внутреннее устройство реализации
- перед созданием нового теста найди проверки того же договора; предпочитай расширить `it.each` или усилить существующий тест
- сохраняй новый тест только для уникального класса входов, границы, ошибки, межслойного взаимодействия или содержательного мутанта, не обнаруживаемого другими тестами
- если изменение делает существующие тесты избыточными, объединяй или удаляй их в том же изменении при сохранении договоров и обнаруживаемых мутантов
- не удаляй автоматически round-trip, XML/YAML fixture-, snapshot-, архитектурные и связанные с issue регрессионные тесты
```

- [x] **Step 2: Создать исполняемый процесс `.agents/testing.md`**

Создать `.agents/testing.md` со следующим содержанием:

````md
# Архитектура тестов

## Цель

Сохранять минимальный набор тестов, достаточный для защиты наблюдаемых договоров.
Количество тестов само по себе не является целью; каждый тест должен иметь
уникальную причину существования.

## Выбор проверки

1. Опиши новый или изменяемый наблюдаемый договор.
2. Найди существующие проверки импортируемого символа, соседнего модуля и
   операции соответствующего уровня.
3. Сначала добавь случай в существующий `it.each`, затем рассмотри усиление
   существующего теста. Новый тест создавай только для самостоятельного договора.
4. Не размножай перестановки одного класса эквивалентности. Проверяй
   представителя класса и содержательные границы.
5. Размещай тест на самом узком стабильном уровне. Интеграционный тест нужен
   только для поведения между слоями.

## Процесс изменения

1. Получи падающую проверку нового договора.
2. Реализуй минимальное production-изменение и получи зелёный целевой тест.
3. После завершения production-кода зафиксируй mutation baseline:

   ```bash
   pnpm test:mutation -- --report before <production-файлы>
   ```

4. Найди тесты без уникально обнаруживаемых мутантов. ИИ читает их утверждения,
   production-код и историю изменений и объединяет или удаляет только проверки
   без самостоятельного договора.
5. Не удаляй автоматически round-trip, XML/YAML fixture-, snapshot-,
   архитектурные и связанные с issue регрессионные тесты.
6. Повтори mutation testing и сравни отчёты:

   ```bash
   pnpm test:mutation -- --report after <production-файлы>
   pnpm test:mutation:compare -- before after
   ```

7. Если сравнение потеряло обнаруживаемый мутант, восстанови или усили проверку.
8. Для выживших мутантов добавляй тест только тогда, когда мутант представляет
   содержательное поведение. Эквивалентные и несущественные мутанты не требуют
   искусственных тестов.
9. Выполни полную проверку:

   ```bash
   pnpm type-check
   pnpm test
   ```

## Итог задачи

Перечисли расширенные, добавленные, объединённые и удалённые тесты. Для каждого
нового теста назови уникальный договор, для удаления — оставшуюся защиту.
Сообщи изменение количества тестов и mutation-результата.
````

- [x] **Step 3: Проверить согласованность документации**

Run:

```bash
rg -n "test:mutation|test:mutation:compare|архитектур" AGENTS.md .agents/testing.md package.json
git diff --check
```

Expected: имена команд совпадают во всех трёх файлах; ошибок пробелов нет.

- [x] **Step 4: Выполнить полную проверку**

Run:

```bash
pnpm type-check
pnpm test
```

Expected: TypeScript и все пакеты Vitest завершаются со статусом PASS.

- [x] **Step 5: Зафиксировать инструкции**

```bash
git add AGENTS.md .agents/testing.md docs/superpowers/plans/2026-07-30-test-architecture.md
git commit -m "docs: :memo: закрепить архитектуру тестов"
```
