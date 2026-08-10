# Metadata E2E Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить отдельный обязательный E2E-контур, который на репозиторных `cf` и `cfe` проверяет импорт, validation с изменением и без `.nkdk`, а также побайтовый XML → YAML → XML.

**Architecture:** Один `beforeAll` импортирует четыре XML-компонента реальными worker во временный эталонный NKDK-проект. Независимые тесты копируют эталон для validation и round-trip; сравнение XML вынесено в чистый файловый помощник, который сохраняет обычный и нормализованный diff.

**Tech Stack:** TypeScript 7, Vitest 4, Node.js 26, `@nkdk/core`, GitHub Actions, встроенные `node:fs`, `node:path`, `node:child_process` и `node:util`.

## Global Constraints

- Исходные данные копируются из `/Users/nikita/git/round-trip-compact/cf/all` и `/Users/nikita/git/round-trip-compact/cfe` в `e2e/fixtures/xml`; `.DS_Store` не копируется.
- Версионируемые XML-фикстуры после копирования не изменяются тестами или реализацией.
- `pnpm test` не запускает E2E; единственная команда нового контура — `pnpm test:e2e`.
- Импорт, validation и экспорт используют публичный API `@nkdk/core` и реальные worker с `concurrency: 2`.
- Строгий договор round-trip сравнивает относительные пути и байты; нормализованный XML diff только объясняет ошибку и не разрешает её.
- Отрицательная validation добавляет `НеизвестноеПолеE2E: true` в корень `cf/Конфигурация.yaml` только во временной копии.
- В этой реализации не удаляются существующие тесты и не изменяются production rules.
- Если строгий round-trip обнаружит production-расхождение, не добавлять исключение и не менять фикстуру: сохранить diff и остановить реализацию для отдельного исправления.
- Задание CI имеет общий предел 10 минут и сохраняет `reports/e2e/` только при падении.

---

## File Map

- `e2e/vitest.config.ts` — изолированная конфигурация E2E без лимита модульных test file.
- `e2e/tsconfig.json` — строгая проверка типов E2E отдельным TypeScript-проектом.
- `e2e/fixture-layout.test.ts` — договор наличия четырёх версионируемых XML-каталогов и отсутствия `.DS_Store`.
- `e2e/support/file-tree.ts` — перечисление файлов, побайтовое сравнение и запись обычного/нормализованного diff.
- `e2e/support/file-tree.test.ts` — быстрые проверки помощника сравнения без metadata worker.
- `e2e/support/metadata-project.ts` — описания компонентов, общий импорт, копирование эталона, validation и экспорт.
- `e2e/metadata-project.test.ts` — три пользовательских договора: импорт, validation, round-trip.
- `e2e/fixtures/xml/**` — неизменяемый XML-источник истины.
- `package.json` — команды `test:e2e`, общий `type-check` и workspace-зависимость на публичный `@nkdk/core`.
- `pnpm-lock.yaml` — корневая workspace-зависимость `@nkdk/core`.
- `.gitignore` — исключение локальных отчётов `reports/e2e/`.
- `.github/workflows/pr-quality.yml` — отдельное обязательное задание `e2e`.

---

### Task 1: Изолированный E2E-запуск и репозиторные XML-фикстуры

**Files:**
- Create: `e2e/vitest.config.ts`
- Create: `e2e/tsconfig.json`
- Create: `e2e/fixture-layout.test.ts`
- Create: `e2e/fixtures/xml/cf/**`
- Create: `e2e/fixtures/xml/cfe/all-extension/**`
- Create: `e2e/fixtures/xml/cfe/control/**`
- Create: `e2e/fixtures/xml/cfe/default/**`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: четыре внешних каталога, перечисленные в Global Constraints.
- Produces: команда `pnpm test:e2e`; константная структура `e2e/fixtures/xml/{cf,cfe/*}` для всех последующих задач.

- [ ] **Step 1: Создать падающую проверку структуры фикстур**

Создать `e2e/fixture-layout.test.ts`:

```ts
import { readdir } from "node:fs/promises"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const fixturesRoot = resolve(import.meta.dirname, "fixtures/xml")
const componentRoots = [
  "cf",
  "cfe/all-extension",
  "cfe/control",
  "cfe/default",
] as const

describe("metadata E2E fixture layout", () => {
  it.each(componentRoots)("contains %s without Finder metadata", async (component) => {
    const files = await collectRelativeFiles(resolve(fixturesRoot, component))
    expect(files.length).toBeGreaterThan(0)
    expect(files.some((path) => path === ".DS_Store" || path.endsWith("/.DS_Store"))).toBe(false)
    expect(files).toContain("Configuration.xml")
  })
})

async function collectRelativeFiles(root: string, prefix = ""): Promise<string[]> {
  const entries = await readdir(resolve(root, prefix), { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const relative = prefix === "" ? entry.name : `${prefix}/${entry.name}`
    if (entry.isDirectory()) files.push(...await collectRelativeFiles(root, relative))
    else if (entry.isFile()) files.push(relative)
  }
  return files.sort()
}
```

- [ ] **Step 2: Добавить отдельную конфигурацию и команду запуска**

Создать `e2e/vitest.config.ts`:

```ts
import { resolve } from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  root: resolve(import.meta.dirname, ".."),
  test: {
    environment: "node",
    include: ["e2e/**/*.test.ts"],
    exclude: ["e2e/fixtures/**"],
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 600_000,
    hookTimeout: 600_000,
  },
})
```

Добавить в корневой `package.json`:

```json
"type-check": "pnpm --filter \"./packages/*\" -r exec tsc --noEmit && tsc --noEmit -p e2e/tsconfig.json",
"test:e2e": "vitest run --config e2e/vitest.config.ts"
```

Добавить в корневые `devDependencies`:

```json
"@nkdk/core": "workspace:*"
```

Создать `e2e/tsconfig.json`:

```json
{
  "extends": "../packages/core/tsconfig.json",
  "compilerOptions": {
    "types": ["node", "vitest/globals"]
  },
  "include": ["./**/*.ts"],
  "exclude": ["fixtures", "node_modules"]
}
```

Run: `pnpm install --lockfile-only`

Expected: корневой importer получает ссылку `@nkdk/core: workspace:*` в
`pnpm-lock.yaml`, сетевые зависимости не меняются.

- [ ] **Step 3: Запустить проверку и подтвердить красное состояние**

Run: `pnpm test:e2e -- e2e/fixture-layout.test.ts`

Expected: FAIL с `ENOENT` для `e2e/fixtures/xml/cf`, потому что фикстуры ещё не скопированы.

- [ ] **Step 4: Скопировать обычные файлы без `.DS_Store`**

Run:

```bash
mkdir -p e2e/fixtures/xml/cf e2e/fixtures/xml/cfe
rsync -a --exclude='.DS_Store' /Users/nikita/git/round-trip-compact/cf/all/ e2e/fixtures/xml/cf/
rsync -a --exclude='.DS_Store' /Users/nikita/git/round-trip-compact/cfe/all-extension e2e/fixtures/xml/cfe/
rsync -a --exclude='.DS_Store' /Users/nikita/git/round-trip-compact/cfe/control e2e/fixtures/xml/cfe/
rsync -a --exclude='.DS_Store' /Users/nikita/git/round-trip-compact/cfe/default e2e/fixtures/xml/cfe/
```

Проверить точный состав копии:

```bash
find e2e/fixtures/xml -name .DS_Store -print
find e2e/fixtures/xml -type f | wc -l
```

Expected: первая команда не печатает путей; вторая печатает `1367`.

- [ ] **Step 5: Запустить проверку структуры**

Run: `pnpm test:e2e -- e2e/fixture-layout.test.ts`

Expected: PASS, 4 проверки.

- [ ] **Step 6: Проверить типы E2E**

Run: `pnpm type-check`

Expected: exit 0, включая `tsc --noEmit -p e2e/tsconfig.json`.

- [ ] **Step 7: Убедиться, что обычный Vitest не подхватывает E2E**

Run: `pnpm --filter @nkdk/core exec vitest list | rg 'e2e/'`

Expected: `rg` завершается с кодом 1 и не печатает тесты.

- [ ] **Step 8: Зафиксировать слой**

```bash
git add package.json pnpm-lock.yaml e2e/vitest.config.ts e2e/tsconfig.json e2e/fixture-layout.test.ts e2e/fixtures/xml
git commit -m "test: :white_check_mark: добавить XML-фикстуры для e2e"
```

---

### Task 2: Побайтовое сравнение дерева и диагностический отчёт

**Files:**
- Create: `e2e/support/file-tree.ts`
- Create: `e2e/support/file-tree.test.ts`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: два абсолютных пути к каталогам и абсолютный путь отчёта.
- Produces:

```ts
export interface FileTreeComparison {
  readonly equal: boolean
  readonly added: readonly string[]
  readonly removed: readonly string[]
  readonly changed: readonly string[]
  readonly reportDir?: string
}

export async function compareFileTrees(params: {
  readonly expectedDir: string
  readonly actualDir: string
  readonly reportDir: string
}): Promise<FileTreeComparison>
```

- [ ] **Step 1: Написать падающие проверки результата и отчёта**

Создать `e2e/support/file-tree.test.ts` с тремя случаями:

```ts
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { compareFileTrees } from "./file-tree"

const roots: string[] = []

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

describe("compareFileTrees", () => {
  it("accepts identical paths and bytes", async () => {
    const fixture = await treeFixture()
    await write(fixture.expectedDir, "a.xml", "<Root><Value>1</Value></Root>\n")
    await write(fixture.actualDir, "a.xml", "<Root><Value>1</Value></Root>\n")

    await expect(compareFileTrees(fixture)).resolves.toEqual({
      equal: true, added: [], removed: [], changed: [],
    })
  })

  it("reports added, removed and byte-changed files", async () => {
    const fixture = await treeFixture()
    await write(fixture.expectedDir, "removed.txt", "old")
    await write(fixture.expectedDir, "changed.xml", "<Root><Value>1</Value></Root>\n")
    await write(fixture.actualDir, "added.txt", "new")
    await write(fixture.actualDir, "changed.xml", "<Root>\n\t<Value>1</Value>\n</Root>\n")

    const result = await compareFileTrees(fixture)

    expect(result).toMatchObject({
      equal: false,
      added: ["added.txt"],
      removed: ["removed.txt"],
      changed: ["changed.xml"],
      reportDir: fixture.reportDir,
    })
    expect(await readFile(join(fixture.reportDir, "summary.txt"), "utf8"))
      .toContain("changed.xml")
    expect(await readFile(join(fixture.reportDir, "changed.xml.diff"), "utf8"))
      .toContain("Value")
    expect(await readFile(join(fixture.reportDir, "changed.xml.normalized.diff"), "utf8"))
      .toContain("Смысловое XML-содержимое совпадает")
  })

  it("shows a normalized semantic XML difference", async () => {
    const fixture = await treeFixture()
    await write(fixture.expectedDir, "changed.xml", "<Root><Value>1</Value></Root>")
    await write(fixture.actualDir, "changed.xml", "<Root><Value>2</Value></Root>")

    await compareFileTrees(fixture)

    expect(await readFile(join(fixture.reportDir, "changed.xml.normalized.diff"), "utf8"))
      .toMatch(/[+-].*Value/u)
  })
})
```

Дополнить файл локальными `treeFixture()` и `write()`: первая функция возвращает
`{ expectedDir, actualDir, reportDir }`, создаёт эти каталоги под одним
`mkdtemp` и добавляет корень в `roots`; вторая создаёт родительский каталог и
записывает строку по относительному пути.

- [ ] **Step 2: Запустить проверки и подтвердить красное состояние**

Run: `pnpm test:e2e -- e2e/support/file-tree.test.ts`

Expected: FAIL, модуль `./file-tree` отсутствует.

- [ ] **Step 3: Реализовать перечисление и сравнение байтов**

В `e2e/support/file-tree.ts`:

```ts
import { spawnSync } from "node:child_process"
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises"
import { dirname, extname, join, relative, resolve } from "node:path"
import { importContentFromXML } from "@nkdk/core"

export interface FileTreeComparison {
  readonly equal: boolean
  readonly added: readonly string[]
  readonly removed: readonly string[]
  readonly changed: readonly string[]
  readonly reportDir?: string
}

export async function compareFileTrees(params: {
  readonly expectedDir: string
  readonly actualDir: string
  readonly reportDir: string
}): Promise<FileTreeComparison> {
  const expected = await fileMap(params.expectedDir)
  const actual = await fileMap(params.actualDir)
  const added = [...actual.keys()].filter((path) => !expected.has(path)).sort()
  const removed = [...expected.keys()].filter((path) => !actual.has(path)).sort()
  const shared = [...expected.keys()].filter((path) => actual.has(path)).sort()
  const changed: string[] = []
  for (const path of shared) {
    if (!expected.get(path)!.equals(actual.get(path)!)) changed.push(path)
  }
  if (added.length === 0 && removed.length === 0 && changed.length === 0) {
    return { equal: true, added, removed, changed }
  }
  await writeReport({ ...params, added, removed, changed })
  return { equal: false, added, removed, changed, reportDir: params.reportDir }
}
```

Реализовать `fileMap(root)` рекурсивно через `readdir(..., {withFileTypes:true})`,
сохраняя POSIX-подобный относительный путь с `/` и `Buffer` каждого файла.
Перед отчётом удалять старый `reportDir`, затем создавать его.

- [ ] **Step 4: Реализовать обычный и нормализованный diff**

Для каждого `changed` создать пути `reportDir/<relative>.diff` и
`reportDir/<relative>.normalized.diff`. Обычный diff получить без оболочки:

```ts
function gitDiff(expectedPath: string, actualPath: string): string {
  const result = spawnSync("git", [
    "diff", "--no-index", "--no-ext-diff", "--text", "--",
    expectedPath, actualPath,
  ], { encoding: "utf8" })
  if (result.status !== 0 && result.status !== 1) {
    throw new Error(result.stderr || `git diff завершился с кодом ${result.status}`)
  }
  return result.stdout
}
```

Для `.xml` прочитать обе строки, вызвать `importContentFromXML<unknown>()`,
преобразовать результат функцией `stableJson(value)` с рекурсивной сортировкой
обычных ключей и отступом 2 пробела, записать два временных `.json` рядом с
отчётом и получить второй `gitDiff`. Если JSON одинаков, записать строку
`Смысловое XML-содержимое совпадает; различаются только исходные байты.\n`.
Для не-XML записать `Нормализация доступна только для XML.\n`.

`summary.txt` должен иметь точный формат:

```text
Добавлены: <число>
Удалены: <число>
Изменены: <число>

[added]
<пути>
[removed]
<пути>
[changed]
<пути>
```

После построения diff удалить только временные normalized JSON, сохранив
`summary.txt` и оба вида diff.

- [ ] **Step 5: Игнорировать локальные отчёты и получить зелёные проверки**

Добавить в `.gitignore`:

```gitignore
# Локальные отчёты metadata E2E
reports/e2e/
```

Run: `pnpm test:e2e -- e2e/support/file-tree.test.ts`

Expected: PASS, 3 проверки.

- [ ] **Step 6: Проверить типы и зафиксировать слой**

Run: `pnpm type-check`

Expected: exit 0.

```bash
git add .gitignore e2e/support/file-tree.ts e2e/support/file-tree.test.ts
git commit -m "test: :white_check_mark: добавить отчёт побайтового e2e diff"
```

---

### Task 3: Однократный импорт реальными worker

**Files:**
- Create: `e2e/support/metadata-project.ts`
- Create: `e2e/metadata-project.test.ts`

**Interfaces:**
- Consumes: `e2e/fixtures/xml/**`, публичные `createProjectStateService` и `importConfigurationFromXml`.
- Produces:

```ts
export interface E2EComponent {
  readonly fixturePath: string
  readonly componentPath: "cf" | `cfe/${string}`
  readonly reportName: string
}

export interface ImportedMetadataProject {
  readonly root: string
  readonly projectDir: string
  readonly results: readonly ConfigurationImportResult[]
  readonly durationsMs: Readonly<Record<string, number>>
}

export const E2E_COMPONENTS: readonly E2EComponent[]
export async function importMetadataProject(): Promise<ImportedMetadataProject>
export async function cloneImportedProject(source: ImportedMetadataProject, name: string): Promise<string>
export async function removeImportedProject(source: ImportedMetadataProject): Promise<void>
```

- [ ] **Step 1: Написать падающий сценарий импорта**

Создать `e2e/metadata-project.test.ts`:

```ts
import { access } from "node:fs/promises"
import { join } from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import {
  E2E_COMPONENTS,
  importMetadataProject,
  removeImportedProject,
  type ImportedMetadataProject,
} from "./support/metadata-project"

let baseline: ImportedMetadataProject

describe.sequential("metadata project E2E", () => {
  beforeAll(async () => {
    baseline = await importMetadataProject()
  })

  afterAll(async () => {
    if (baseline !== undefined) await removeImportedProject(baseline)
  })

  it("imports cf and every cfe with real workers", async () => {
    expect(baseline.results.map((result) => result.componentPath))
      .toEqual(E2E_COMPONENTS.map(({ componentPath }) => componentPath))
    for (const result of baseline.results) {
      expect(result.failed).toEqual([])
      expect(result.succeeded).toBeGreaterThan(0)
      expect(result.configurationIndexPath).toBeDefined()
    }
    for (const { componentPath } of E2E_COMPONENTS) {
      await expect(access(join(baseline.projectDir, componentPath, "Конфигурация.yaml")))
        .resolves.toBeUndefined()
    }
    await expect(access(join(baseline.projectDir, ".nkdk"))).resolves.toBeUndefined()
    console.info("E2E import durations, ms", baseline.durationsMs)
  })
})
```

- [ ] **Step 2: Запустить сценарий и подтвердить красное состояние**

Run: `pnpm test:e2e -- e2e/metadata-project.test.ts`

Expected: FAIL, модуль `./support/metadata-project` отсутствует.

- [ ] **Step 3: Реализовать описания компонентов и контексты**

В `e2e/support/metadata-project.ts` определить:

```ts
import {
  createProjectStateService,
  importConfigurationFromXml,
  type ConfigurationImportResult,
} from "@nkdk/core"

const fixturesRoot = resolve(import.meta.dirname, "../fixtures/xml")

export const E2E_COMPONENTS = [
  { fixturePath: "cf", componentPath: "cf", reportName: "cf" },
  { fixturePath: "cfe/all-extension", componentPath: "cfe/Расширение_All", reportName: "cfe-all-extension" },
  { fixturePath: "cfe/control", componentPath: "cfe/РасширениеКонтроль", reportName: "cfe-control" },
  { fixturePath: "cfe/default", componentPath: "cfe/РасширениеПоУмолчанию", reportName: "cfe-default" },
] as const satisfies readonly E2EComponent[]

export const IMPORT_CONTEXT = {
  defaultLanguage: "ru",
  version: "2.20",
  exportToYAML: { toTyped: false },
  fromXML: { forReference: false },
} as const

export const SYNC_CONTEXT = {
  defaultLanguage: "ru",
  version: "2.20",
  exportToYAML: { toTyped: false },
} as const
```

Импортировать также `cp`, `mkdtemp`, `rm` из `node:fs/promises`, `tmpdir`,
`join`, `resolve` и `performance`.

- [ ] **Step 4: Реализовать общий импорт и безопасное закрытие состояния**

`importMetadataProject()` создаёт `mkdtemp(join(tmpdir(), "nkdk-e2e-"))`, каталог
`project`, один `projectState = createProjectStateService()`, затем для каждого
`E2E_COMPONENTS` последовательно вызывает:

```ts
const startedAt = performance.now()
const result = await importConfigurationFromXml({
  context: IMPORT_CONTEXT,
  inputDir: resolve(fixturesRoot, component.fixturePath),
  projectDir,
  requestedComponentPath: component.componentPath,
  concurrency: 2,
  operationId: `e2e-import-${component.reportName}`,
  projectState,
})
durationsMs[`import:${component.reportName}`] = performance.now() - startedAt
results.push(result)
```

Закрыть `projectState` в `finally`. Если вызов бросил исключение, удалить весь
временный корень перед повторным выбросом. Ошибочный `ConfigurationImportResult`
не выбрасывать: вернуть его, чтобы тест показал точные `failed`.

`cloneImportedProject(source, name)` создаёт соседний каталог под `source.root`,
копирует только `source.projectDir` через `cp(..., {recursive:true})` и возвращает
путь копии. `removeImportedProject` удаляет `source.root` рекурсивно.

- [ ] **Step 5: Запустить импорт и проверить договор**

Run: `pnpm test:e2e -- e2e/metadata-project.test.ts -t 'imports cf'`

Expected: PASS; вывод содержит длительности четырёх импортов. Если `failed` не
пуст, сохранить вывод без ослабления проверки и остановиться для отдельного
исправления production-кода.

- [ ] **Step 6: Проверить отсутствие утечки worker**

Run: `pnpm test:e2e -- e2e/metadata-project.test.ts -t 'imports cf'`

Expected: процесс завершается самостоятельно с exit 0, без зависания после
итоговой строки Vitest.

- [ ] **Step 7: Зафиксировать слой**

```bash
git add e2e/support/metadata-project.ts e2e/metadata-project.test.ts
git commit -m "test: :white_check_mark: проверить полный импорт cf и cfe"
```

---

### Task 4: Validation по изменению и без `.nkdk`

**Files:**
- Modify: `e2e/support/metadata-project.ts`
- Modify: `e2e/metadata-project.test.ts`

**Interfaces:**
- Consumes: `cloneImportedProject`, `IMPORT_CONTEXT`, `createProjectStateService`, `validateProject`.
- Produces:

```ts
export interface ValidationParityResult {
  readonly warm: readonly ComparableDiagnostic[]
  readonly cold: readonly ComparableDiagnostic[]
  readonly durationsMs: { readonly warm: number; readonly cold: number }
}

export interface ComparableDiagnostic {
  readonly filePath: string
  readonly severity: "error" | "warning"
  readonly source: string
  readonly message: string
  readonly path?: string
}

export async function validateChangedProject(projectDir: string): Promise<ValidationParityResult>
```

- [ ] **Step 1: Добавить падающий validation-сценарий**

В `e2e/metadata-project.test.ts` добавить:

```ts
it("validates a clean project and reports the same changed YAML without .nkdk", async () => {
  const projectDir = await cloneImportedProject(baseline, "validation")
  const clean = await validateCleanProject(projectDir)
  expect(clean).toEqual([])

  const result = await validateChangedProject(projectDir)

  expect(result.warm).toHaveLength(1)
  expect(result.warm[0]).toMatchObject({
    filePath: "cf/Конфигурация.yaml",
    severity: "error",
    source: "structure",
  })
  expect(result.warm[0]?.message).toContain("НеизвестноеПолеE2E")
  expect(result.cold).toEqual(result.warm)
  console.info("E2E validation durations, ms", result.durationsMs)
})
```

Импортировать `cloneImportedProject`, `validateChangedProject` и
`validateCleanProject`.

- [ ] **Step 2: Запустить сценарий и подтвердить красное состояние**

Run: `pnpm test:e2e -- e2e/metadata-project.test.ts -t 'validates a clean project'`

Expected: FAIL, новые функции не экспортированы.

- [ ] **Step 3: Реализовать чистую validation с отдельным состоянием**

В `metadata-project.ts`:

```ts
export async function validateCleanProject(projectDir: string): Promise<readonly ComparableDiagnostic[]> {
  const projectState = createProjectStateService()
  try {
    const result = await validateProject({ projectDir, context: SYNC_CONTEXT, concurrency: 2, projectState })
    return comparableDiagnostics(result.diagnostics)
  } finally {
    await projectState.close()
  }
}
```

`comparableDiagnostics` разворачивает collection через `[...diagnostics]`,
оставляет `filePath`, `severity`, `source`, `message` и существующий `path`, затем
сортирует по `filePath`, `path ?? ""`, `message`.

- [ ] **Step 4: Реализовать тёплую и холодную validation**

`validateChangedProject(projectDir)`:

1. прочитать `cf/Конфигурация.yaml` как UTF-8;
2. дописать `\nНеизвестноеПолеE2E: true\n`;
3. вызвать общий внутренний `runValidation(projectDir)` и измерить `warm`;
4. удалить `join(projectDir, ".nkdk")` через `rm(..., {recursive:true, force:true})`;
5. вызвать `runValidation(projectDir)` с новым `ProjectStateService` и измерить `cold`;
6. вернуть нормализованные диагностики и длительности.

Каждый `runValidation` создаёт и закрывает собственное состояние. Не
переиспользовать состояние после удаления `.nkdk`.

- [ ] **Step 5: Получить зелёный validation-сценарий**

Run: `pnpm test:e2e -- e2e/metadata-project.test.ts -t 'validates a clean project'`

Expected: PASS; warm и cold возвращают одну одинаковую schema-диагностику.

- [ ] **Step 6: Проверить типы и зафиксировать слой**

Run: `pnpm type-check`

Expected: exit 0.

```bash
git add e2e/support/metadata-project.ts e2e/metadata-project.test.ts
git commit -m "test: :white_check_mark: проверить validation с diff и без состояния"
```

---

### Task 5: Побайтовый YAML round-trip всех компонентов

**Files:**
- Modify: `e2e/support/metadata-project.ts`
- Modify: `e2e/metadata-project.test.ts`

**Interfaces:**
- Consumes: `E2E_COMPONENTS`, `SYNC_CONTEXT`, `compareFileTrees`.
- Produces:

```ts
export interface ComponentRoundTripResult {
  readonly component: E2EComponent
  readonly sync: FullXmlSyncResult
  readonly comparison: FileTreeComparison
  readonly durationMs: number
}

export async function roundTripMetadataProject(params: {
  readonly projectDir: string
  readonly reportRoot: string
}): Promise<readonly ComponentRoundTripResult[]>
```

- [ ] **Step 1: Добавить падающий round-trip-сценарий**

В `metadata-project.test.ts` добавить:

```ts
it("restores every XML component byte for byte after YAML", async () => {
  const projectDir = await cloneImportedProject(baseline, "round-trip")
  const reportRoot = resolve(import.meta.dirname, "../reports/e2e/round-trip")
  const results = await roundTripMetadataProject({ projectDir, reportRoot })

  expect(results.map(({ component }) => component.componentPath))
    .toEqual(E2E_COMPONENTS.map(({ componentPath }) => componentPath))
  for (const result of results) {
    expect(result.sync.failed).toEqual([])
    expect(result.comparison, result.comparison.reportDir).toMatchObject({
      equal: true,
      added: [],
      removed: [],
      changed: [],
    })
  }
  console.table(results.map(({ component, durationMs }) => ({
    component: component.componentPath,
    durationMs,
  })))
})
```

Импортировать `resolve` и `roundTripMetadataProject`.

- [ ] **Step 2: Запустить сценарий и подтвердить красное состояние**

Run: `pnpm test:e2e -- e2e/metadata-project.test.ts -t 'restores every XML'`

Expected: FAIL, `roundTripMetadataProject` не экспортирован.

- [ ] **Step 3: Реализовать последовательный экспорт компонентов**

В `metadata-project.ts` импортировать `syncConfigurationToXML`, тип
`FullXmlSyncResult`, `compareFileTrees` и тип `FileTreeComparison`.

`roundTripMetadataProject` удаляет прежний `reportRoot`, создаёт один
`projectState`, затем для каждого компонента:

```ts
const xmlDir = join(dirname(params.projectDir), `xml-${component.reportName}`)
await rm(xmlDir, { recursive: true, force: true })
const startedAt = performance.now()
const sync = await syncConfigurationToXML({
  context: SYNC_CONTEXT,
  projectDir: params.projectDir,
  componentPath: component.componentPath,
  xmlDir,
  concurrency: 2,
  projectState,
})
const comparison = await compareFileTrees({
  expectedDir: resolve(fixturesRoot, component.fixturePath),
  actualDir: xmlDir,
  reportDir: resolve(params.reportRoot, component.reportName),
})
results.push({ component, sync, comparison, durationMs: performance.now() - startedAt })
```

Закрыть `projectState` в `finally`. Даже если `sync.failed` не пуст, выполнить
сравнение уже записанного каталога, чтобы отчёт содержал наблюдаемый состав.

- [ ] **Step 4: Запустить строгий round-trip**

Run: `pnpm test:e2e -- e2e/metadata-project.test.ts -t 'restores every XML'`

Expected: PASS для четырёх компонентов, `reports/e2e/round-trip` отсутствует или
не содержит отчётов. Если тест падает, открыть напечатанный `summary.txt` и
обычный/нормализованный diff; не менять фикстуру и не добавлять допустимые
расхождения.

- [ ] **Step 5: Проверить диагностический путь намеренной порчей результата**

Во временной локальной проверке после `syncConfigurationToXML` дописать один
пробел к экспортированному `Configuration.xml`, запустить целевой тест и
убедиться, что он падает, а оба diff созданы. Затем отменить только эту
намеренную строку через `git diff` + `apply_patch`, не через `git restore`.

Expected red: `comparison.equal === false`, `changed` содержит
`Configuration.xml`.

Повторно запустить без порчи:

Run: `pnpm test:e2e -- e2e/metadata-project.test.ts -t 'restores every XML'`

Expected: PASS.

- [ ] **Step 6: Зафиксировать слой**

```bash
git add e2e/support/metadata-project.ts e2e/metadata-project.test.ts
git commit -m "test: :white_check_mark: проверить побайтовый YAML round-trip"
```

---

### Task 6: Отдельное обязательное задание CI

**Files:**
- Modify: `.github/workflows/pr-quality.yml`

**Interfaces:**
- Consumes: `pnpm test:e2e`, `reports/e2e/`.
- Produces: обязательное задание GitHub Actions `e2e` с пределом 10 минут и загружаемым отчётом при падении.

- [ ] **Step 1: Добавить задание `e2e`**

В `.github/workflows/pr-quality.yml` рядом с `tests` добавить:

```yaml
  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v7
      - uses: pnpm/action-setup@v6
        with:
          version: 10.33.0
      - uses: actions/setup-node@v7
        with:
          node-version: 26
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:e2e
      - if: failure()
        uses: actions/upload-artifact@v6
        with:
          name: metadata-e2e-reports
          path: reports/e2e/
          if-no-files-found: ignore
```

- [ ] **Step 2: Проверить синтаксис workflow и полный E2E локально**

Проверить YAML существующим парсером из пакета MCP, не добавляя зависимость:

Run: `pnpm --filter @nkdk/mcp exec tsx -e 'import fs from "node:fs"; import yaml from "js-yaml"; yaml.load(fs.readFileSync("../../.github/workflows/pr-quality.yml", "utf8"))'`

Expected: exit 0.

Run: `pnpm test:e2e`

Expected: все проверки PASS, процесс укладывается в 10 минут.

- [ ] **Step 3: Зафиксировать слой**

```bash
git add .github/workflows/pr-quality.yml
git commit -m "chore: :wrench: добавить обязательный metadata e2e в CI"
```

---

### Task 7: Полная проверка и исходный профиль

**Files:**
- No source changes expected.
- Create locally, ignored: `reports/test-profile/e2e-baseline-notes.md` only if timings need manual capture.

**Interfaces:**
- Consumes: весь E2E-контур.
- Produces: подтверждённая зелёная проверка и данные для отдельного плана аудита медленных тестов.

- [ ] **Step 1: Запустить проверку типов**

Run: `pnpm type-check`

Expected: exit 0.

- [ ] **Step 2: Запустить обычный тестовый контур**

Run: `pnpm test`

Expected: все тесты проходят и в списке test files нет `e2e/`. Если падает
только существующий бюджет холодного setup при нулевых функциональных ошибках,
повторить один раз и зафиксировать оба результата, не повышая бюджет.

- [ ] **Step 3: Трижды запустить E2E для устойчивости**

Run три раза последовательно: `pnpm test:e2e`

Expected: три exit 0; каждый запуск укладывается в 10 минут; пути и диагностики
не зависят от временного каталога.

- [ ] **Step 4: Выполнить обязательные архитектурные проверки**

Run: `pnpm test:architecture:rules`

Expected: exit 0.

Run: `pnpm test:architecture`

Expected: exit 0.

- [ ] **Step 5: Проверить новые дубли**

Run: `pnpm duplicates -- --base origin/develop`

Expected: новых дублей нет. Не исключать `e2e` из `.jscpd.json` только ради
прохождения проверки.

- [ ] **Step 6: Проверить чистоту и историю ветки**

Run:

```bash
git status --short
git log --oneline origin/develop..HEAD
```

Expected: рабочее дерево чистое; история содержит отдельные коммиты фикстур,
diff-помощника, импорта, validation, round-trip и CI.

- [ ] **Step 7: Подготовить следующий отдельный план**

Не удалять тесты в этом плане. На основании `pnpm test:profile` и длительностей
фаз `pnpm test:e2e` начать отдельный brainstorming для таблицы
«существующий тест → уникальный договор → оставшаяся защита → решение».

---

## Completion Checklist

- `pnpm test:e2e` не является частью `pnpm test`.
- В репозитории ровно 1 367 скопированных файлов фикстур и нет `.DS_Store`.
- Импорт создаёт `cf` и три ожидаемых `cfe` без ошибок.
- Чистый проект валиден.
- Неизвестное свойство одинаково диагностируется с существующим `.nkdk` и после его удаления.
- Все четыре XML-дерева совпадают с экспортом по путям и байтам.
- При намеренном расхождении создаются обычный и нормализованный diff.
- CI запускает отдельное обязательное задание с пределом 10 минут.
- Существующие тесты и production rules не удалены и не изменены.
