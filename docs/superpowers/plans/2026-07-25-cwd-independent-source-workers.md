# Независимый от каталога запуска runtime source-workers — план реализации

> **Для agentic workers:** ОБЯЗАТЕЛЬНЫЙ SUB-SKILL: использовать `superpowers:subagent-driven-development` (рекомендуется) или `superpowers:executing-plans` для выполнения плана по задачам. Шаги отслеживаются флажками (`- [ ]`).

**Цель:** Сделать локальные TypeScript workers независимыми от текущего каталога процесса, сохранить JavaScript runtime production-сборки и показывать исходный stderr при аварии MCP-сервера.

**Архитектура:** Общий helper core разрешает `tsx` относительно собственного ESM-модуля и возвращает абсолютные `file:` URL для `execArgv`. Три source-worker pool используют helper, а собранные JavaScript workers продолжают запускаться без `tsx`. MCP-клиент на любой ветке завершения сохраняет stderr и выводит его один раз при ошибке.

**Стек:** Node.js 26, TypeScript 6, ESM, Piscina, MCP SDK, Vitest, pnpm.

## Общие ограничения

- Source-режим выполняет актуальные TypeScript-исходники без предварительной сборки.
- Production выполняет заранее собранный JavaScript без `tsx`.
- Worker не зависит от `cwd` вызывающего процесса.
- `tsx` не добавляется в зависимости корневого пакета.
- `cwd` MCP-клиента не меняется для разрешения зависимостей.
- Metadata-модели, rules.ts и договоры XML/YAML не изменяются.
- Существующие XML-фикстуры не изменяются.
- Реализация выполняется через RED → GREEN → REFACTOR.

---

### Задача 1: Независимый source-runtime для всех metadata workers

**Файлы:**

- Создать: `packages/core/metadata/sourceWorkerRuntime.ts`
- Изменить: `packages/core/metadata/importFromXml/workerPool.ts:324-335`
- Изменить: `packages/core/metadata/project/preparedYamlProjectWorkerPool.ts:374-387`
- Изменить: `packages/core/metadata/fullSyncToXml/workerPool.ts:228-239`
- Изменить: `packages/core/metadata/importFromXml/workerPool.test.ts:95-125`
- Изменить: `packages/core/metadata/importBoundaries.test.ts`

**Интерфейсы:**

- Создаёт: `sourceWorkerExecArgv(additionalImports?: readonly string[]): string[]`
- Потребляет: `import.meta.resolve("tsx")`
- Гарантирует: каждая запись имеет вид `["--import", "<absolute file URL>"]`
- Сохраняет: для собранного `.js` runtime используется пустой `execArgv`

- [ ] **Шаг 1: Усилить реальный тест импорта воспроизведением из корня**

В тесте `passes a real fragment buffer through Piscina when concurrency is one` временно менять рабочий каталог на корень репозитория перед созданием реального пула и обязательно восстанавливать его в `finally`:

```ts
import { fileURLToPath } from "node:url"

const repoRoot = fileURLToPath(new URL("../../../../", import.meta.url))

it("passes a real fragment buffer through Piscina when started outside the core package", async () => {
  const source = assignment("real", {
    itemName: "Контрагенты",
    logicalAddress: "Справочник.Контрагенты",
    targetProjectPath: "Справочник/Контрагенты/Свойства.yaml",
    xmlFiles: [{ role: "metadata", sourcePath: join(syncXmlDir, "Catalogs/Контрагенты.xml") }],
  })
  const context = mockContextFromXML()
  const collector = createConfigurationIndexCollector()
  await prepareImportYaml({ assignment: source, context, collector })
  const expected = collector.fragment(source.targetProjectPath)
  const pool = createXmlImportWorkerPool({ concurrency: 1 })
  const originalCwd = process.cwd()
  process.chdir(repoRoot)

  try {
    await pool.initialize({ operationId: "real", context, outputDir: createTempDir("piscina") })
    const result = await pool.runFirstPass([source])

    expect(result.diagnostics).toEqual([])
    expect(result.fragmentData).toEqual({
      identities: expected.identities,
      xmlNodes: expected.xmlNodes,
      xmlValues: expected.xmlValues,
    })
  } finally {
    try {
      await pool.close()
    } finally {
      process.chdir(originalCwd)
    }
  }
}, 30_000)
```

- [ ] **Шаг 2: Добавить архитектурную проверку трёх call sites**

В `importBoundaries.test.ts` прочитать исходники трёх worker pool и потребовать общий helper:

```ts
const sourceWorkerPools = [
  "importFromXml/workerPool.ts",
  "project/preparedYamlProjectWorkerPool.ts",
  "fullSyncToXml/workerPool.ts",
]

it("source worker pools resolve their TypeScript loader through one runtime helper", async () => {
  for (const relativePath of sourceWorkerPools) {
    const source = await fs.promises.readFile(join(import.meta.dirname, relativePath), "utf8")
    expect(source).toContain("sourceWorkerExecArgv")
    expect(source).not.toContain('["--import", "tsx"]')
  }
})
```

- [ ] **Шаг 3: Запустить RED-проверки**

Команда:

```bash
pnpm --filter @nkdk/core exec vitest run --no-isolate metadata/importFromXml/workerPool.test.ts metadata/importBoundaries.test.ts
```

Ожидаемый результат:

- реальный Piscina worker падает с `ERR_MODULE_NOT_FOUND: Cannot find package 'tsx' imported from <repo root>`;
- архитектурная проверка не находит `sourceWorkerExecArgv`;
- падения вызваны текущим голым specifier, а не ошибкой теста.

- [ ] **Шаг 4: Реализовать единый helper**

Создать `packages/core/metadata/sourceWorkerRuntime.ts`:

```ts
export function sourceWorkerExecArgv(additionalImports: readonly string[] = []): string[] {
  const imports = [import.meta.resolve("tsx"), ...additionalImports]
  return imports.flatMap((specifier) => ["--import", specifier])
}
```

`import.meta.resolve()` выполняется из пакета `@nkdk/core`, которому принадлежит зависимость `tsx`, и возвращает абсолютный `file:` URL.

- [ ] **Шаг 5: Перевести три worker pool на helper**

В `importFromXml/workerPool.ts`:

```ts
import { sourceWorkerExecArgv } from "../sourceWorkerRuntime"

const execArgv = currentFile.endsWith(".ts") ? sourceWorkerExecArgv() : []
```

В `fullSyncToXml/workerPool.ts`:

```ts
import { sourceWorkerExecArgv } from "../sourceWorkerRuntime"

const execArgv = currentFile.endsWith(".ts") ? sourceWorkerExecArgv() : []
```

В `project/preparedYamlProjectWorkerPool.ts` сохранить дополнительную регистрацию validation:

```ts
import { sourceWorkerExecArgv } from "../sourceWorkerRuntime"

const validationRegisterUrl = pathToFileURL(
  join(dirname(currentFile), "../validation/projectValidationWorkerRegister.mjs"),
).href
const execArgv = currentFile.endsWith(".ts") ? sourceWorkerExecArgv([validationRegisterUrl]) : []
```

Не менять вычисление `workerFile`, степень параллелизма и договоры команд.

- [ ] **Шаг 6: Запустить GREEN-проверки core**

Команда:

```bash
pnpm --filter @nkdk/core exec vitest run --no-isolate metadata/importFromXml/workerPool.test.ts metadata/importBoundaries.test.ts
```

Ожидаемый результат: оба файла тестов проходят, реальный worker успешно работает при `cwd` в корне.

- [ ] **Шаг 7: Проверить типы core**

Команда:

```bash
pnpm --filter @nkdk/core run type-check
```

Ожидаемый результат: exit code 0.

- [ ] **Шаг 8: Закоммитить source-runtime**

```bash
git add packages/core/metadata/sourceWorkerRuntime.ts \
  packages/core/metadata/importFromXml/workerPool.ts \
  packages/core/metadata/project/preparedYamlProjectWorkerPool.ts \
  packages/core/metadata/fullSyncToXml/workerPool.ts \
  packages/core/metadata/importFromXml/workerPool.test.ts \
  packages/core/metadata/importBoundaries.test.ts
git commit -m "fix: :bug: устранить зависимость workers от каталога запуска"
```

---

### Задача 2: Сохранение исходного stderr MCP-сервера

**Файлы:**

- Изменить: `.agents/tools/mcp/call.mjs`
- Создать: `packages/mcp/src/callScript.test.ts`

**Интерфейсы:**

- Создаёт: экспортируемый `reportServerStderr({ stderr, failed, debug, logPath, writeStderr }): Promise<void>`
- Сохраняет: stderr в `logPath`, если путь передан
- Выводит: stderr только при `failed === true`, `debug === false` и непустом тексте
- Не дублирует: поток, уже показанный при `--debug`

- [ ] **Шаг 1: Добавить характеристический тест CLI перед рефакторингом**

В `packages/mcp/src/callScript.test.ts` запустить `call.mjs` без аргументов через `execFile` и зафиксировать существующий договор:

```ts
import { execFile } from "node:child_process"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"
import { describe, expect, it } from "vitest"

const execFileAsync = promisify(execFile)
const callScript = new URL("../../../.agents/tools/mcp/call.mjs", import.meta.url)

it("keeps the CLI usage contract", async () => {
  await expect(execFileAsync(process.execPath, [fileURLToPath(callScript)])).rejects.toMatchObject({
    code: 2,
    stderr: expect.stringContaining("tool name is required"),
  })
})
```

- [ ] **Шаг 2: Запустить характеристический тест**

Команда:

```bash
pnpm --filter @nkdk/mcp exec vitest run src/callScript.test.ts
```

Ожидаемый результат: PASS до рефакторинга.

- [ ] **Шаг 3: Создать тестовый шов без изменения CLI-поведения**

В `call.mjs`:

- экспортировать `reportServerStderr`;
- запускать `main()` только когда модуль является CLI entrypoint;
- начальная версия `reportServerStderr` только выполняет существующую запись `serverStderrLog`:

```js
export async function reportServerStderr({ stderr, logPath }) {
  await writeText(logPath, stderr)
}
```

- повторно запустить характеристический тест и получить PASS.

Проверка entrypoint:

```js
const isCliEntrypoint =
  process.argv[1] !== undefined && pathToFileURL(resolve(process.argv[1])).href === import.meta.url

if (isCliEntrypoint) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}
```

- [ ] **Шаг 4: Добавить RED-тест аварийного stderr**

Импортировать `reportServerStderr` и проверить реальную запись файла и переданный writer:

```ts
import { mkdtempSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

const { reportServerStderr } = await import(callScript.href)

it("persists and prints server stderr once when an MCP call fails", async () => {
  const logPath = join(mkdtempSync(join(tmpdir(), "nkdk-mcp-stderr-")), "server.log")
  const written: string[] = []

  await reportServerStderr({
    stderr: "worker root cause\n",
    failed: true,
    debug: false,
    logPath,
    writeStderr: (text) => written.push(text),
  })

  expect(await readFile(logPath, "utf8")).toBe("worker root cause\n")
  expect(written).toEqual(["worker root cause\n"])
})

it("does not print stderr twice in debug mode", async () => {
  const written: string[] = []
  await reportServerStderr({
    stderr: "already streamed\n",
    failed: true,
    debug: true,
    writeStderr: (text) => written.push(text),
  })
  expect(written).toEqual([])
})
```

RED должен быть обычным несовпадением `written`, а не ошибкой импорта.

- [ ] **Шаг 5: Реализовать вывод и надёжный finally**

Реализовать helper:

```js
export async function reportServerStderr({
  stderr,
  failed,
  debug,
  logPath,
  writeStderr = (text) => process.stderr.write(text),
}) {
  await writeText(logPath, stderr)
  if (failed && !debug && stderr.length > 0) {
    writeStderr(stderr.endsWith("\n") ? stderr : `${stderr}\n`)
  }
}
```

В `main()`:

- установить `let failed = true` перед `client.callTool`;
- присвоить `failed = false` только после успешной проверки результата;
- в `finally` сначала закрыть client, затем вызвать `reportServerStderr`;
- использовать вложенный `try/finally`, чтобы запись stderr выполнялась даже при ошибке `client.close()`;
- удалить прежнюю запись stderr только с успешного пути.

Итоговая структура блока:

```js
let failed = true
try {
  const result = await client.callTool(request)
  const payload = structuredPayload(result)
  await writeJson(options.responseLog, result)
  await writeJson(options.output, payload ?? result)
  if (result.isError || operationFailed(payload)) {
    throw new Error(failureMessage(options.toolName, result, payload))
  }
  failed = false
  if (options.debug) process.stderr.write(`[mcp] ok ${options.toolName}\n`)
} finally {
  try {
    await client.close()
  } finally {
    await reportServerStderr({
      stderr,
      failed,
      debug: options.debug,
      logPath: options.serverStderrLog,
    })
  }
}
```

- [ ] **Шаг 6: Запустить GREEN-проверки MCP-клиента**

Команда:

```bash
pnpm --filter @nkdk/mcp exec vitest run src/callScript.test.ts src/server.test.ts
```

Ожидаемый результат: оба файла тестов проходят.

- [ ] **Шаг 7: Проверить типы и сборку MCP**

Команды:

```bash
pnpm --filter @nkdk/mcp run type-check
pnpm --filter @nkdk/mcp run build
```

Ожидаемый результат:

- type-check проходит;
- `dist/bin/nkdk-mcp` и три JavaScript worker создаются.

- [ ] **Шаг 8: Закоммитить диагностику**

```bash
git add .agents/tools/mcp/call.mjs packages/mcp/src/callScript.test.ts
git commit -m "fix: :bug: показывать исходную ошибку MCP-сервера"
```

---

### Задача 3: Исключить core из runtime-зависимостей production-пакета

**Файлы:**

- Изменить: `packages/mcp/package.json`
- Изменить: `packages/mcp/src/server.test.ts`
- Изменить: `pnpm-lock.yaml`

**Интерфейсы:**

- Source/build потребляет: `@nkdk/core: workspace:*` из `devDependencies`
- Production manifest гарантирует: `dependencies` не содержит `@nkdk/core` и других workspace-протоколов
- Production bundle гарантирует: core включён esbuild внутрь JavaScript MCP и не указан в `external`

- [ ] **Шаг 1: Добавить RED-тест границы package manifest**

В `packages/mcp/src/server.test.ts` добавить:

```ts
it("keeps private core as a build-only dependency", async () => {
  const packageJson = (
    await import("../package.json", {
      with: { type: "json" },
    })
  ).default

  expect(packageJson.dependencies).not.toHaveProperty("@nkdk/core")
  expect(packageJson.devDependencies).toHaveProperty("@nkdk/core", "workspace:*")
})
```

- [ ] **Шаг 2: Запустить RED-проверку**

Команда:

```bash
pnpm --filter @nkdk/mcp exec vitest run src/server.test.ts -t "keeps private core"
```

Ожидаемый результат: FAIL, потому что `@nkdk/core` находится в `dependencies` и отсутствует в `devDependencies`.

- [ ] **Шаг 3: Перенести core в build-only зависимости**

В `packages/mcp/package.json` удалить:

```json
"@nkdk/core": "workspace:*"
```

из `dependencies` и добавить то же значение в `devDependencies`:

```json
"devDependencies": {
  "@nkdk/core": "workspace:*",
  "@types/node": "^26.0.0",
  "esbuild": "^0.28.1",
  "typescript": "~6.0.0",
  "vitest": "^4.1.9"
}
```

Не добавлять `@nkdk/core` в `external` файла `packages/mcp/scripts/build.mjs`.

- [ ] **Шаг 4: Обновить lockfile**

Команда:

```bash
pnpm install --lockfile-only
```

Ожидаемый результат: importer `packages/mcp` переносит `@nkdk/core` из `dependencies` в `devDependencies`.

- [ ] **Шаг 5: Запустить GREEN-тест и проверки сборки**

Команды:

```bash
pnpm --filter @nkdk/mcp exec vitest run src/server.test.ts
pnpm --filter @nkdk/mcp run type-check
pnpm --filter @nkdk/mcp run build
```

Ожидаемый результат: тесты, type-check и build проходят; собранный MCP не содержит внешнего импорта `@nkdk/core`.

- [ ] **Шаг 6: Запустить production smoke вне workspace**

Команда:

```bash
env npm_config_cache=/private/tmp/nkdk-npm-cache pnpm --filter @nkdk/mcp run smoke:packed
```

Ожидаемый результат:

- tarball устанавливается обычным `npm install`;
- npm не видит `workspace:*` в runtime-зависимостях;
- установленный `nkdk-mcp` регистрирует и выполняет `nkdk.get_schema`;
- JavaScript workers запускаются без `tsx` в runtime.

- [ ] **Шаг 7: Закоммитить production-границу**

```bash
git add packages/mcp/package.json packages/mcp/src/server.test.ts pnpm-lock.yaml
git commit -m "fix: :bug: исключить core из runtime-зависимостей MCP"
```

---

### Задача 4: Общая проверка и повторный round-trip

**Файлы:**

- Не создавать и не изменять файлы кода.
- Диагностический результат остаётся в `/Users/nikita/git/round-trip/cf/all`.
- YAML-результат остаётся в `/Users/nikita/git/nkdk-yaml/cf`.

**Интерфейсы:**

- Проверяет: source MCP → import worker → YAML → prepared YAML worker → full XML sync worker
- Подтверждает: production build отдельно проходит через packed smoke test

- [ ] **Шаг 1: Запустить весь проект**

Команда:

```bash
pnpm test
```

Ожидаемый результат: все пакеты `packages/*` зелёные.

- [ ] **Шаг 2: Убедиться в чистоте рабочего дерева кода**

Команда:

```bash
git status --short
```

Ожидаемый результат: нет незакоммиченных изменений в `nkdk`.

- [ ] **Шаг 3: Повторить диагностический round-trip**

Команда:

```bash
env \
  NKDK_XML_REPO=/Users/nikita/git/round-trip \
  NKDK_XML_DIR=/Users/nikita/git/round-trip/cf/all \
  NKDK_ROUND_TRIP_YAML_DIR=/Users/nikita/git/nkdk-yaml/cf \
  ./.agents/skills/round-trip-yaml/round-trip.sh
```

Скрипту разрешено:

- выполнить `git restore .` в `/Users/nikita/git/round-trip`;
- очистить `/Users/nikita/git/nkdk-yaml/cf`;
- оставить итоговый XML diff и YAML-каталог после прогона.

- [ ] **Шаг 4: Классифицировать результат по `round-trip-yaml`**

Если diff отсутствует, сообщить о чистом round-trip.

Если diff найден, показать single-разбор:

- абсолютный XML-файл;
- активный XML-каталог;
- YAML-каталог;
- выбранный diff-файл;
- вероятный metadata-модуль и `rules.ts`;
- категорию и описание;
- релевантный diff;
- сомнения, если причина неоднозначна.

Не исправлять XML/YAML расхождение в рамках этого плана.

- [ ] **Шаг 5: Финальная проверка истории и состояния**

Команды:

```bash
git log -7 --oneline
git status --short
```

Ожидаемый результат:

- design-коммиты, plan-коммиты и три implementation-коммита присутствуют;
- дерево `nkdk` чистое;
- XML-репозиторий намеренно остаётся с диагностическим diff, если round-trip не чистый.
