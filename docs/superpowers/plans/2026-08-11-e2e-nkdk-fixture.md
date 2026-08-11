# Эталонный NKDK-проект для e2e — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Разделить e2e-проверку `XML → NKDK → XML` на независимые побайтовые проверки `XML → эталонный NKDK` и `эталонный NKDK → XML`, а также добавить безопасную команду обновления эталона.

**Architecture:** Полный NKDK-проект хранится в `e2e/fixtures/nkdk` рядом с XML-источником истины. Общий e2e-модуль импортирует XML реальным runtime, генератор устанавливает результат через подготовленный соседний каталог с откатом, а тесты независимо сравнивают импортированный проект с NKDK-эталоном и временную копию NKDK-эталона с XML после sync.

**Tech Stack:** TypeScript 7, Node.js 26, Vitest 4, pnpm 10, `@nkdk/runtime`, metadata rules и workers из `@nkdk/rules`, `node:fs/promises`.

## Global Constraints

- XML в `e2e/fixtures/xml` остаётся источником истины; реализация и тесты не переписывают существующие XML-файлы.
- Сохраняется текущая пользовательская XML-дельта: регистрация и файлы `КомпоновщикНастроек`, а также уже выгруженные поля `KeyField`, `ObjectField`, `TypeField`.
- Эталон хранится как обычное дерево `e2e/fixtures/nkdk/{cf,cfe/...}` без `.nkdk` и `.DS_Store`.
- Сравнение путей и содержимого строго побайтовое; отчёт не ослабляет результат проверки.
- Команда `pnpm fixtures:e2e:nkdk` всегда обновляет весь проект и не поддерживает частичное обновление компонента.
- Если импорт содержит ошибку, существующий эталон не меняется.
- Тесты и генератор используют те же `E2E_COMPONENTS`, контексты, runtime и реальные workers.
- Новые правила fromXML/toXML/fromYAML/toYAML и новые применения `!xml` в этой задаче не создаются.
- Реализация следует `.agents/testing.md`: каждый самостоятельный договор сначала получает красную проверку.
- Базовый коммит для проверки дублей: `7dd4afed3`.

---

## File Map

- `e2e/support/nkdk-fixture.ts` — проверка результата импорта, безопасная установка полного эталона и публичная функция его обновления.
- `e2e/support/nkdk-fixture.test.ts` — быстрые проверки отказа от замены, успешной замены и отката после ошибки переименования.
- `e2e/update-nkdk-fixture.ts` — минимальная командная точка входа без собственной логики.
- `e2e/support/metadata-project.ts` — общий путь NKDK-фикстуры, существующий импорт и копирование эталона во временный проект для обратного sync.
- `e2e/support/metadata-project.test.ts` — узкая проверка, что копия NKDK-эталона изолирована от исходного дерева.
- `e2e/fixture-layout.test.ts` — договор структуры XML- и NKDK-фикстур и запрет служебных файлов.
- `e2e/metadata-project.test.ts` — независимые e2e-договоры `XML → NKDK` и `NKDK → XML`.
- `e2e/fixtures/nkdk/**` — версионируемый полный NKDK-проект для `cf` и трёх `cfe`.
- `package.json` — команда `fixtures:e2e:nkdk`.

---

### Task 1: Безопасное обновление полного NKDK-эталона

**Files:**
- Create: `e2e/support/nkdk-fixture.ts`
- Create: `e2e/support/nkdk-fixture.test.ts`
- Create: `e2e/update-nkdk-fixture.ts`
- Modify: `e2e/support/metadata-project.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `importMetadataProject()` и `removeImportedProject()` из `e2e/support/metadata-project.ts`; абсолютный путь целевого каталога.
- Produces в `e2e/support/metadata-project.ts`:

```ts
export const NKDK_FIXTURES_ROOT: string
```

- Produces в `e2e/support/nkdk-fixture.ts`:

```ts

export interface NkdkFixtureUpdateDependencies {
  readonly importProject?: typeof importMetadataProject
  readonly removeProject?: typeof removeImportedProject
  readonly renamePath?: typeof rename
}

export async function updateNkdkFixture(params?: {
  readonly targetDir?: string
  readonly dependencies?: NkdkFixtureUpdateDependencies
}): Promise<void>

export async function replaceDirectoryWithRollback(params: {
  readonly sourceDir: string
  readonly targetDir: string
  readonly renamePath?: typeof rename
}): Promise<void>
```

- [ ] **Step 1: Написать красные проверки безопасной замены**

Создать `e2e/support/nkdk-fixture.test.ts`:

```ts
import { mkdir, mkdtemp, readFile, rm, writeFile, rename } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { replaceDirectoryWithRollback, updateNkdkFixture } from "./nkdk-fixture"

const roots: string[] = []

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

describe("updateNkdkFixture", () => {
  it("не заменяет эталон после ошибки импорта", async () => {
    const root = await temporaryRoot()
    const targetDir = join(root, "fixtures", "nkdk")
    const importedRoot = join(root, "imported")
    const projectDir = join(importedRoot, "project")
    await write(join(targetDir, "old.txt"), "old")
    await write(join(projectDir, "new.txt"), "new")
    const removeProject = vi.fn(async () => rm(importedRoot, { recursive: true, force: true }))

    await expect(updateNkdkFixture({
      targetDir,
      dependencies: {
        importProject: async () => ({
          root: importedRoot,
          projectDir,
          durationsMs: {},
          results: [{
            componentPath: "cf",
            succeeded: 0,
            failed: [{
              severity: "error",
              code: "fixture",
              message: "Ошибка импорта",
              targetProjectPath: "cf/Конфигурация.yaml",
            }],
            warnings: [],
          }],
        }) as never,
        removeProject,
      },
    })).rejects.toThrow("Ошибка импорта")

    await expect(readFile(join(targetDir, "old.txt"), "utf8")).resolves.toBe("old")
    await expect(readFile(join(targetDir, "new.txt"), "utf8")).rejects.toMatchObject({ code: "ENOENT" })
    expect(removeProject).toHaveBeenCalledOnce()
  })

  it("заменяет полный эталон после успешного импорта", async () => {
    const root = await temporaryRoot()
    const targetDir = join(root, "fixtures", "nkdk")
    const importedRoot = join(root, "imported")
    const projectDir = join(importedRoot, "project")
    await write(join(targetDir, "old.txt"), "old")
    await write(join(projectDir, "cf", "Конфигурация.yaml"), "Имя: Новая\n")

    await updateNkdkFixture({
      targetDir,
      dependencies: {
        importProject: async () => ({
          root: importedRoot,
          projectDir,
          durationsMs: {},
          results: [{ componentPath: "cf", succeeded: 1, failed: [], warnings: [] }],
        }) as never,
        removeProject: async () => rm(importedRoot, { recursive: true, force: true }),
      },
    })

    await expect(readFile(join(targetDir, "cf", "Конфигурация.yaml"), "utf8"))
      .resolves.toBe("Имя: Новая\n")
    await expect(readFile(join(targetDir, "old.txt"), "utf8"))
      .rejects.toMatchObject({ code: "ENOENT" })
  })
})

describe("replaceDirectoryWithRollback", () => {
  it("восстанавливает прежний эталон при ошибке установки нового", async () => {
    const root = await temporaryRoot()
    const sourceDir = join(root, "source")
    const targetDir = join(root, "fixtures", "nkdk")
    await write(join(sourceDir, "new.txt"), "new")
    await write(join(targetDir, "old.txt"), "old")
    let renameCalls = 0
    const renamePath: typeof rename = async (from, to) => {
      renameCalls += 1
      if (renameCalls === 2) throw new Error("Ошибка установки")
      await rename(from, to)
    }

    await expect(replaceDirectoryWithRollback({ sourceDir, targetDir, renamePath }))
      .rejects.toThrow("Ошибка установки")

    await expect(readFile(join(targetDir, "old.txt"), "utf8")).resolves.toBe("old")
  })
})

async function temporaryRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "nkdk-fixture-test-"))
  roots.push(root)
  return root
}

async function write(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, content)
}
```

Если точная форма `ConfigurationImportResult` не допускает компактный объект, создать локальный построитель `importResult()` в тесте и ограничить единственное приведение `as never` границей подмены `importProject`; production-типы не ослаблять.

- [ ] **Step 2: Запустить проверки и подтвердить красное состояние**

Run:

```bash
pnpm test:e2e -- e2e/support/nkdk-fixture.test.ts
```

Expected: FAIL, модуль `./nkdk-fixture` отсутствует.

- [ ] **Step 3: Реализовать проверку импорта и замену с откатом**

Сначала в `e2e/support/metadata-project.ts` экспортировать путь без изменения существующего `fixturesRoot`:

```ts
export const NKDK_FIXTURES_ROOT = resolve(import.meta.dirname, "../fixtures/nkdk")
```

Затем создать `e2e/support/nkdk-fixture.ts`:

```ts
import { access, cp, mkdir, mkdtemp, rename, rm } from "node:fs/promises"
import { dirname, join } from "node:path"
import {
  NKDK_FIXTURES_ROOT,
  importMetadataProject,
  removeImportedProject,
  type ImportedMetadataProject,
} from "./metadata-project"

type ImportProject = () => Promise<ImportedMetadataProject>
type RemoveProject = (project: ImportedMetadataProject) => Promise<void>

export interface NkdkFixtureUpdateDependencies {
  readonly importProject?: ImportProject
  readonly removeProject?: RemoveProject
  readonly renamePath?: typeof rename
}

export async function updateNkdkFixture(params: {
  readonly targetDir?: string
  readonly dependencies?: NkdkFixtureUpdateDependencies
} = {}): Promise<void> {
  const targetDir = params.targetDir ?? NKDK_FIXTURES_ROOT
  const importProject = params.dependencies?.importProject ?? importMetadataProject
  const removeProject = params.dependencies?.removeProject ?? removeImportedProject
  const renamePath = params.dependencies?.renamePath ?? rename
  const imported = await importProject()
  try {
    assertSuccessfulImport(imported)
    await replaceDirectoryWithRollback({ sourceDir: imported.projectDir, targetDir, renamePath })
  } finally {
    await removeProject(imported)
  }
}

export async function replaceDirectoryWithRollback(params: {
  readonly sourceDir: string
  readonly targetDir: string
  readonly renamePath?: typeof rename
}): Promise<void> {
  const renamePath = params.renamePath ?? rename
  const parentDir = dirname(params.targetDir)
  await mkdir(parentDir, { recursive: true })
  const stagingRoot = await mkdtemp(join(parentDir, ".nkdk-fixture-"))
  const nextDir = join(stagingRoot, "next")
  const previousDir = join(stagingRoot, "previous")
  let previousMoved = false
  try {
    await cp(params.sourceDir, nextDir, { recursive: true })
    if (await pathExists(params.targetDir)) {
      await renamePath(params.targetDir, previousDir)
      previousMoved = true
    }
    try {
      await renamePath(nextDir, params.targetDir)
    } catch (error) {
      if (previousMoved) await renamePath(previousDir, params.targetDir)
      throw error
    }
  } finally {
    await rm(stagingRoot, { recursive: true, force: true })
  }
}

function assertSuccessfulImport(imported: ImportedMetadataProject): void {
  const failures = imported.results.flatMap((result) =>
    result.failed.map(({ message }) => `${result.componentPath}: ${message}`)
  )
  if (failures.length === 0) return
  throw new Error(`Ошибка импорта:\n${failures.join("\n")}`)
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch (error) {
    if (isFileSystemError(error) && error.code === "ENOENT") return false
    throw error
  }
}

function isFileSystemError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error
}
```

Если проверка типов покажет, что `result.failed` хранит не путь-строку, форматировать элемент через существующий диагностический тип результата, не добавляя `as any` в production-код.

- [ ] **Step 4: Запустить проверки и получить зелёное состояние**

Run:

```bash
pnpm test:e2e -- e2e/support/nkdk-fixture.test.ts
```

Expected: PASS, 3 проверки.

- [ ] **Step 5: Добавить командную точку входа и корневую команду**

Создать `e2e/update-nkdk-fixture.ts`:

```ts
import { updateNkdkFixture } from "./support/nkdk-fixture"

await updateNkdkFixture()
console.info("Эталонный NKDK-проект обновлён")
```

Добавить в scripts корневого `package.json`:

```json
"fixtures:e2e:nkdk": "pnpm --filter @nkdk/rules exec tsx ../../e2e/update-nkdk-fixture.ts"
```

Не запускать команду на этом шаге: первый реальный запуск и проверка созданного дерева входят в красно-зелёный цикл Task 2.

- [ ] **Step 6: Проверить слой и новые дубли**

Run:

```bash
pnpm type-check
pnpm duplicates -- --base 7dd4afed3
```

Expected: обе команды завершаются с кодом 0.

- [ ] **Step 7: Зафиксировать слой**

```bash
git add package.json e2e/support/metadata-project.ts e2e/support/nkdk-fixture.ts e2e/support/nkdk-fixture.test.ts e2e/update-nkdk-fixture.ts
git commit -m "test: :white_check_mark: добавить обновление NKDK-эталона"
```

---

### Task 2: Побайтовый договор XML → эталонный NKDK

**Files:**
- Modify: `e2e/fixture-layout.test.ts`
- Modify: `e2e/metadata-project.test.ts`
- Create: `e2e/fixtures/nkdk/**`
- Preserve: `e2e/fixtures/xml/cf/Configuration.xml`
- Preserve: `e2e/fixtures/xml/cf/CommonForms/КомпоновщикНастроек.xml`
- Preserve: `e2e/fixtures/xml/cf/CommonForms/КомпоновщикНастроек/Ext/Form.xml`
- Preserve: `e2e/fixtures/xml/cf/ChartsOfCharacteristicTypes/ПланВидовХарактеристикВсеСвойства.xml`

**Interfaces:**
- Consumes: `baseline.projectDir`, `NKDK_FIXTURES_ROOT`, `compareFileTrees()`.
- Produces: самостоятельный e2e-договор, что результат полного импорта всех XML-компонентов побайтно равен сохранённому NKDK-проекту.

- [ ] **Step 1: Расширить проверку структуры до отсутствующего NKDK-эталона**

В `e2e/fixture-layout.test.ts` изменить `fixturesRoot` на `resolve(import.meta.dirname, "fixtures")` и заменить список строк на описания двух форматов:

```ts
const componentRoots = [
  { path: "xml/cf", rootFile: "Configuration.xml" },
  { path: "xml/cfe/all-extension", rootFile: "Configuration.xml" },
  { path: "xml/cfe/control", rootFile: "Configuration.xml" },
  { path: "xml/cfe/default", rootFile: "Configuration.xml" },
  { path: "nkdk/cf", rootFile: "Конфигурация.yaml" },
  { path: "nkdk/cfe/Расширение_All", rootFile: "Конфигурация.yaml" },
  { path: "nkdk/cfe/РасширениеКонтроль", rootFile: "Конфигурация.yaml" },
  { path: "nkdk/cfe/РасширениеПоУмолчанию", rootFile: "Конфигурация.yaml" },
] as const
```

Для каждого описания собирать все относительные пути от `resolve(fixturesRoot, component.path)`, требовать `component.rootFile` и запрещать сегменты `.DS_Store` и `.nkdk`. Заменить `collectRelativeFiles()` на вариант, который включает каталоги, поэтому обнаруживает даже пустой `.nkdk`:

```ts
async function collectRelativePaths(root: string, prefix = ""): Promise<string[]> {
  const entries = await readdir(resolve(root, prefix), { withFileTypes: true })
  const paths: string[] = []
  for (const entry of entries) {
    const relative = prefix === "" ? entry.name : `${prefix}/${entry.name}`
    paths.push(relative)
    if (entry.isDirectory()) paths.push(...await collectRelativePaths(root, relative))
  }
  return paths.sort()
}
```

Проверка служебных сегментов:

```ts
expect(paths.some((path) => path.split("/").some((segment) =>
  segment === ".DS_Store" || segment === ".nkdk"
))).toBe(false)
```

- [ ] **Step 2: Добавить прямое сравнение результата импорта с эталоном**

В `e2e/metadata-project.test.ts` импортировать `rm` из `node:fs/promises`, `compareFileTrees` из `./support/file-tree` и `NKDK_FIXTURES_ROOT` из `./support/metadata-project`, затем добавить отдельный тест после проверки импорта:

```ts
it("matches the committed NKDK project byte for byte", async () => {
  if (baseline === undefined) throw new Error("E2E import prerequisite did not complete")
  const reportDir = resolve(import.meta.dirname, "../reports/e2e/nkdk-import")
  await rm(reportDir, { recursive: true, force: true })
  const comparison = await compareFileTrees({
    expectedDir: NKDK_FIXTURES_ROOT,
    actualDir: baseline.projectDir,
    reportDir,
  })

  expect(comparison, comparison.reportDir).toMatchObject({
    equal: true,
    added: [],
    removed: [],
    changed: [],
  })
})
```

Не объединять этот договор с тестом успешного импорта: причина падения и отчёт должны быть самостоятельными.

- [ ] **Step 3: Запустить две проверки и подтвердить красное состояние**

Run:

```bash
pnpm test:e2e -- e2e/fixture-layout.test.ts e2e/metadata-project.test.ts
```

Expected: FAIL с `ENOENT` для `e2e/fixtures/nkdk`; XML-импорт при этом завершается успешно.

- [ ] **Step 4: Сгенерировать полный NKDK-эталон штатной командой**

Run:

```bash
pnpm fixtures:e2e:nkdk
```

Expected: exit 0 и сообщение `Эталонный NKDK-проект обновлён`.

Проверить состав:

```bash
find e2e/fixtures/nkdk -name .nkdk -o -name .DS_Store
test -f e2e/fixtures/nkdk/cf/Конфигурация.yaml
test -f e2e/fixtures/nkdk/cfe/Расширение_All/Конфигурация.yaml
test -f e2e/fixtures/nkdk/cfe/РасширениеКонтроль/Конфигурация.yaml
test -f e2e/fixtures/nkdk/cfe/РасширениеПоУмолчанию/Конфигурация.yaml
```

Expected: `find` не печатает путей; четыре `test -f` завершаются с кодом 0.

- [ ] **Step 5: Повторить прямые проверки**

Run:

```bash
pnpm test:e2e -- e2e/fixture-layout.test.ts e2e/metadata-project.test.ts
```

Expected: новая проверка `XML → NKDK` проходит побайтно; существующая обратная проверка пока продолжает использовать импортированный проект.

- [ ] **Step 6: Проверить YAML новой общей формы**

Run:

```bash
test -f 'e2e/fixtures/nkdk/cf/ОбщаяФорма/КомпоновщикНастроек/Свойства.yaml'
rg -n 'КомпоновщикНастроекКомпоновкиДанных|ПутьКДанным: КомпоновщикНастроек.Settings' 'e2e/fixtures/nkdk/cf/ОбщаяФорма/КомпоновщикНастроек/Свойства.yaml'
```

Expected: файл существует; `rg` находит тип реквизита и путь к настройкам.

- [ ] **Step 7: Проверить слой и новые дубли**

Run:

```bash
pnpm type-check
pnpm duplicates -- --base 7dd4afed3
```

Expected: обе команды завершаются с кодом 0.

- [ ] **Step 8: Зафиксировать XML-дельту и полный NKDK-эталон**

Перед добавлением вывести `git status --short` и убедиться, что кроме перечисленных XML, NKDK-эталона и двух изменённых тестов нет неожиданных файлов.

```bash
git add e2e/fixture-layout.test.ts e2e/metadata-project.test.ts e2e/fixtures/xml e2e/fixtures/nkdk
git commit -m "test: :white_check_mark: зафиксировать NKDK-эталон e2e"
```

---

### Task 3: Независимый договор эталонный NKDK → XML

**Files:**
- Modify: `e2e/support/metadata-project.ts`
- Modify: `e2e/support/metadata-project.test.ts`
- Modify: `e2e/metadata-project.test.ts`

**Interfaces:**
- Consumes: `ImportedMetadataProject.root` как владеющий временный корень и `NKDK_FIXTURES_ROOT` как неизменяемый источник.
- Produces:

```ts
export async function cloneNkdkFixtureProject(
  owner: Pick<ImportedMetadataProject, "root">,
  name: string,
  fixtureRoot?: string,
): Promise<string>
```

Функция копирует эталон в `${owner.root}/${name}` и возвращает путь копии. Sync получает только этот путь.

- [ ] **Step 1: Написать красную проверку изоляции копии эталона**

Дополнить `e2e/support/metadata-project.test.ts`:

```ts
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { afterEach } from "vitest"
import { cloneNkdkFixtureProject } from "./metadata-project"

const roots: string[] = []

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

it("copies the NKDK fixture without exposing the committed tree to writes", async () => {
  const root = await mkdtemp(join(tmpdir(), "nkdk-clone-test-"))
  roots.push(root)
  const fixtureRoot = join(root, "fixture")
  const fixturePath = join(fixtureRoot, "cf", "Конфигурация.yaml")
  await mkdir(dirname(fixturePath), { recursive: true })
  await writeFile(fixturePath, "Имя: Эталон\n")
  const owner = { root: join(root, "owner") }
  await mkdir(owner.root, { recursive: true })

  const projectDir = await cloneNkdkFixtureProject(owner, "round-trip", fixtureRoot)
  await writeFile(join(projectDir, "cf", "Конфигурация.yaml"), "Имя: Копия\n")

  await expect(readFile(fixturePath, "utf8")).resolves.toBe("Имя: Эталон\n")
})
```

Импортировать `ImportedMetadataProject` как type только для объявления production-интерфейса; тесту приведение не требуется. Существующие тесты `compareSuccessfulSync` оставить без изменений.

- [ ] **Step 2: Запустить проверку и подтвердить красное состояние**

Run:

```bash
pnpm test:e2e -- e2e/support/metadata-project.test.ts
```

Expected: FAIL, экспорт `cloneNkdkFixtureProject` отсутствует.

- [ ] **Step 3: Реализовать копирование эталона**

В `e2e/support/metadata-project.ts` использовать объявленный в Task 1 `NKDK_FIXTURES_ROOT` и добавить:

```ts
export async function cloneNkdkFixtureProject(
  owner: Pick<ImportedMetadataProject, "root">,
  name: string,
  fixtureRoot = NKDK_FIXTURES_ROOT,
): Promise<string> {
  const target = join(owner.root, name)
  await cp(fixtureRoot, target, { recursive: true })
  return target
}
```

Не удалять `cloneImportedProject()`: validation по-прежнему использует копию результата прямого импорта.

- [ ] **Step 4: Получить зелёную узкую проверку**

Run:

```bash
pnpm test:e2e -- e2e/support/metadata-project.test.ts
```

Expected: PASS, включая новый договор изоляции.

- [ ] **Step 5: Переключить обратный e2e на эталонный NKDK-проект**

В `e2e/metadata-project.test.ts` импортировать `cloneNkdkFixtureProject` и заменить подготовку обратного теста:

```ts
const projectDir = await cloneNkdkFixtureProject(baseline, "round-trip")
```

Вместо прежнего:

```ts
const projectDir = await cloneImportedProject(baseline, "round-trip")
```

Название теста изменить на `restores every XML component byte for byte from the committed NKDK project`. Validation продолжает вызывать `cloneImportedProject()`.

- [ ] **Step 6: Запустить полный e2e**

Run:

```bash
pnpm test:e2e
```

Expected: PASS; отдельные тесты подтверждают `XML → NKDK` и `NKDK → XML`, а validation остаётся зелёной.

- [ ] **Step 7: Проверить слой и новые дубли**

Run:

```bash
pnpm type-check
pnpm duplicates -- --base 7dd4afed3
```

Expected: обе команды завершаются с кодом 0.

- [ ] **Step 8: Зафиксировать разделение направлений**

```bash
git add e2e/support/metadata-project.ts e2e/support/metadata-project.test.ts e2e/metadata-project.test.ts
git commit -m "test: :white_check_mark: разделить направления metadata e2e"
```

---

### Task 4: Полная проверка результата

**Files:**
- Verify only; production- и fixture-файлы на этом слое не меняются.

**Interfaces:**
- Consumes: все коммиты Task 1–3.
- Produces: проверенный результат, готовый к отдельному циклу PR после решения пользователя.

- [ ] **Step 1: Проверить рабочее дерево и итоговую дельту**

Run:

```bash
git status --short
git diff 7dd4afed3 --stat
git diff 7dd4afed3 --check
```

Expected: нет незапланированных файлов и ошибок пробелов; дельта соответствует File Map.

- [ ] **Step 2: Проверить типы и быстрые тесты**

Run:

```bash
pnpm type-check
pnpm test
```

Expected: обе команды завершаются с кодом 0. Если проявится ранее наблюдавшееся превышение временного бюджета `@nkdk/platform`, сохранить полный вывод и повторить один раз отдельно от остальных команд; не менять лимиты ради прохождения.

- [ ] **Step 3: Проверить оба e2e-направления свежим запуском**

Run:

```bash
pnpm test:e2e
```

Expected: exit 0; все e2e-файлы и тесты проходят, отчёты расхождений не создаются.

- [ ] **Step 4: Проверить архитектуру**

Run:

```bash
pnpm test:architecture:rules
pnpm test:architecture
```

Expected: обе команды завершаются с кодом 0; baseline dependency-cruiser не изменяется.

- [ ] **Step 5: Выполнить итоговую проверку дублей**

Run:

```bash
pnpm duplicates -- --base 7dd4afed3
```

Expected: exit 0, новых запрещённых дублей нет.

- [ ] **Step 6: Сверить наблюдаемые договоры тестов**

В итоговом сообщении перечислить:

- расширенный `fixture-layout.test.ts`: один общий договор структуры XML- и NKDK-фикстур;
- новый тест `updateNkdkFixture`: неуспешный импорт не меняет эталон;
- новый тест успешной замены: полный каталог заменяется целиком;
- новый тест отката: прежний каталог восстанавливается после ошибки установки;
- новый прямой e2e: импортированный NKDK побайтно равен эталону;
- изменённый обратный e2e: XML строится из сохранённого NKDK, а не из результата того же импорта;
- сохранённый validation e2e: чистый и изменённый проект проверяются как раньше.

Удалённых тестов нет.
