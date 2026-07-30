# Compact XML Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить репозиторный skill и проверенный Node.js-скрипт для создания точной компактной копии XML-каталога.

**Architecture:** Один модуль `.mjs` экспортирует файловую операцию для тестов и запускается как CLI. Сначала он проверяет пути и полностью сканирует входное дерево, затем удаляет выход, воспроизводит каталоги, копирует XML байт-в-байт и создаёт остальные файлы пустыми.

**Tech Stack:** Node.js ESM, `node:fs/promises`, `node:path`, `node:test`, встроенные средства проверки skill.

## Global Constraints

- Skill находится в `.agents/skills/compact-xml-catalog`.
- Оба пути CLI обязательны; относительные пути вычисляются от текущего рабочего каталога.
- Расширение `.xml` сравнивается без учёта регистра.
- Выходной каталог перед записью полностью удаляется.
- Одинаковые пути и вложенность входа и выхода в любом направлении запрещены.
- Символические ссылки и специальные элементы завершают операцию ошибкой до удаления выхода.
- Новые зависимости не добавляются.
- После узких тестов запускается `pnpm test` из корня репозитория.

---

### Task 1: Файловая операция и CLI

**Files:**

- Create: `.agents/skills/compact-xml-catalog/compact-xml-catalog.test.mjs`
- Create: `.agents/skills/compact-xml-catalog/compact-xml-catalog.mjs`

**Interfaces:**

- Produces: `compactXmlCatalog(inputPath, outputPath)` → `Promise<CompactResult>`
- Produces: `CompactResult` shape `{ inputPath, outputPath, xmlFiles, emptiedFiles, directories, inputBytes, outputBytes }`
- Produces: CLI `node compact-xml-catalog.mjs <input> <output>`

- [x] **Step 1: Write the failing behavior tests**

Создать тестовый модуль с временным каталогом, очисткой через `afterEach` и
проверками основной операции:

```js
import assert from "node:assert/strict"
import { mkdtemp, mkdir, readFile, stat, writeFile, rm, symlink } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import test, { afterEach } from "node:test"
import { compactXmlCatalog } from "./compact-xml-catalog.mjs"

const tempRoots = []

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

async function createFixture() {
  const root = await mkdtemp(path.join(tmpdir(), "compact-xml-catalog-"))
  tempRoots.push(root)
  const input = path.join(root, "input")
  const output = path.join(root, "output")
  await mkdir(path.join(input, "nested", "empty"), { recursive: true })
  await writeFile(path.join(input, "root.xml"), "<root>данные</root>")
  await writeFile(path.join(input, "nested", "upper.XML"), Buffer.from([0, 1, 2, 255]))
  await writeFile(path.join(input, "nested", "module.bsl"), 'Сообщить("test");')
  return { root, input, output }
}

test("copies XML bytes and empties other files", async () => {
  const { input, output } = await createFixture()
  await mkdir(output)
  await writeFile(path.join(output, "stale.txt"), "stale")

  const result = await compactXmlCatalog(input, output)

  assert.equal(await readFile(path.join(output, "root.xml"), "utf8"), "<root>данные</root>")
  assert.deepEqual(await readFile(path.join(output, "nested", "upper.XML")), Buffer.from([0, 1, 2, 255]))
  assert.equal((await stat(path.join(output, "nested", "module.bsl"))).size, 0)
  await assert.rejects(stat(path.join(output, "stale.txt")), { code: "ENOENT" })
  assert.equal((await stat(path.join(output, "nested", "empty"))).isDirectory(), true)
  assert.deepEqual(
    {
      xmlFiles: result.xmlFiles,
      emptiedFiles: result.emptiedFiles,
      directories: result.directories,
      inputBytes: result.inputBytes,
      outputBytes: result.outputBytes,
    },
    {
      xmlFiles: 2,
      emptiedFiles: 1,
      directories: 3,
      inputBytes: Buffer.byteLength("<root>данные</root>") + 4 + Buffer.byteLength('Сообщить("test");'),
      outputBytes: Buffer.byteLength("<root>данные</root>") + 4,
    }
  )
})

test("rejects unsafe paths", async () => {
  const { input } = await createFixture()
  await assert.rejects(compactXmlCatalog(input, input), /must differ/)
  await assert.rejects(compactXmlCatalog(input, path.join(input, "compact")), /inside input/)
  await assert.rejects(compactXmlCatalog(input, path.dirname(input)), /input directory must not be inside output/)
  await assert.rejects(compactXmlCatalog(path.join(input, "missing"), path.join(input, "..", "out")), /input directory/)
})

test("rejects symbolic links before clearing output", async (t) => {
  const { input, output } = await createFixture()
  await mkdir(output)
  await writeFile(path.join(output, "sentinel.txt"), "keep")
  try {
    await symlink(path.join(input, "root.xml"), path.join(input, "link.xml"))
  } catch (error) {
    if (error.code === "EPERM") return t.skip("symbolic links are unavailable")
    throw error
  }

  await assert.rejects(compactXmlCatalog(input, output), /symbolic link/)
  assert.equal(await readFile(path.join(output, "sentinel.txt"), "utf8"), "keep")
})
```

- [x] **Step 2: Run tests to verify they fail**

Run:

```powershell
node --test .agents/skills/compact-xml-catalog/compact-xml-catalog.test.mjs
```

Expected: FAIL because `compact-xml-catalog.mjs` does not exist.

- [x] **Step 3: Implement validation, pre-scan and copy**

Создать `.agents/skills/compact-xml-catalog/compact-xml-catalog.mjs` с такой
структурой:

```js
import { copyFile, lstat, mkdir, readdir, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

function isInside(parent, candidate) {
  const relative = path.relative(parent, candidate)
  return relative !== "" && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)
}

async function scanDirectory(inputRoot) {
  const entries = []
  async function visit(relativeDirectory) {
    const absoluteDirectory = path.join(inputRoot, relativeDirectory)
    for (const entry of await readdir(absoluteDirectory, { withFileTypes: true })) {
      const relativePath = path.join(relativeDirectory, entry.name)
      const absolutePath = path.join(inputRoot, relativePath)
      const info = await lstat(absolutePath)
      if (info.isSymbolicLink()) throw new Error(`Unsupported symbolic link: ${absolutePath}`)
      if (info.isDirectory()) {
        entries.push({ kind: "directory", relativePath })
        await visit(relativePath)
      } else if (info.isFile()) {
        entries.push({ kind: "file", relativePath, size: info.size })
      } else {
        throw new Error(`Unsupported special entry: ${absolutePath}`)
      }
    }
  }
  await visit("")
  return entries
}

export async function compactXmlCatalog(inputPath, outputPath) {
  const input = path.resolve(inputPath)
  const output = path.resolve(outputPath)
  if (input === output) throw new Error("Input and output paths must differ")
  if (isInside(input, output)) throw new Error("Output directory must not be inside input directory")
  if (isInside(output, input)) throw new Error("Input directory must not be inside output directory")
  const inputInfo = await lstat(input).catch(() => null)
  if (!inputInfo?.isDirectory()) throw new Error(`Invalid input directory: ${input}`)

  const entries = await scanDirectory(input)
  await rm(output, { recursive: true, force: true })
  await mkdir(output, { recursive: true })

  const result = {
    inputPath: input,
    outputPath: output,
    xmlFiles: 0,
    emptiedFiles: 0,
    directories: 1,
    inputBytes: 0,
    outputBytes: 0,
  }

  for (const entry of entries) {
    const target = path.join(output, entry.relativePath)
    if (entry.kind === "directory") {
      await mkdir(target, { recursive: true })
      result.directories += 1
      continue
    }
    result.inputBytes += entry.size
    await mkdir(path.dirname(target), { recursive: true })
    if (path.extname(entry.relativePath).toLowerCase() === ".xml") {
      await copyFile(path.join(input, entry.relativePath), target)
      result.xmlFiles += 1
      result.outputBytes += entry.size
    } else {
      await writeFile(target, Buffer.alloc(0))
      result.emptiedFiles += 1
    }
  }
  return result
}
```

Добавить CLI-границу, которая требует ровно два аргумента, печатает
`JSON.stringify(result, null, 2)` при успехе и ошибку в `stderr` с
`process.exitCode = 1` при сбое. Определять прямой запуск сравнением
`fileURLToPath(import.meta.url)` и `path.resolve(process.argv[1])`.

- [x] **Step 4: Run tests to verify they pass**

Run:

```powershell
node --test .agents/skills/compact-xml-catalog/compact-xml-catalog.test.mjs
```

Expected: PASS; тест символической ссылки может быть SKIP в ограниченной Windows-среде.

- [x] **Step 5: Add and verify CLI tests**

Дополнить тесты запуском `execFile(process.execPath, [script, input, output])`
через `promisify`, разобрать stdout как JSON и проверить абсолютные пути и
счётчики. Отдельно запустить без аргументов и проверить ненулевой код и строку
использования в `stderr`.

Run:

```powershell
node --test .agents/skills/compact-xml-catalog/compact-xml-catalog.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add .agents/skills/compact-xml-catalog/compact-xml-catalog.mjs `
  .agents/skills/compact-xml-catalog/compact-xml-catalog.test.mjs
git commit -m "feat: :sparkles: добавить компактирование XML-каталога"
```

### Task 2: Описание и проверка skill

**Files:**

- Create: `.agents/skills/compact-xml-catalog/SKILL.md`

**Interfaces:**

- Consumes: CLI из Task 1.
- Produces: обнаруживаемый skill с точной командой запуска и форматом отчёта.

- [x] **Step 1: Record the baseline skill-use failure**

До создания `SKILL.md` проверить сценарий: «Сделай компактную копию каталога
конфигурации, оставив содержимое только XML». Зафиксировать, что без skill
агенту приходится самостоятельно выбирать команду и правила безопасности.

- [x] **Step 2: Write the minimal skill**

Создать `SKILL.md`:

```markdown
---
name: compact-xml-catalog
description: Use when the user asks to shrink, compact, or make a lightweight copy of an XML catalog while preserving XML contents and emptying all non-XML files.
---

# Компактирование XML-каталога

Запусти из корня репозитория:

\`\`\`powershell
node .agents/skills/compact-xml-catalog/compact-xml-catalog.mjs <input> <output>
\`\`\`

Скрипт полностью пересоздаёт `<output>`. Перед запуском явно покажи
пользователю оба абсолютных пути, если они не были заданы в запросе.

При успехе сообщи число скопированных XML-файлов, число обнулённых файлов и
изменение объёма. При ошибке не объявляй выходной каталог готовым.

Пример:

\`\`\`powershell
node .agents/skills/compact-xml-catalog/compact-xml-catalog.mjs `  C:\git\round-trip\cf\erp`
C:\git\round-trip-compact\cf\erp
\`\`\`
```

- [x] **Step 3: Validate the skill structure**

Найти `quick_validate.py` в каталоге `skill-creator` и запустить:

```powershell
python <skill-creator-path>\scripts\quick_validate.py .agents\skills\compact-xml-catalog
```

Expected: validation success.

- [x] **Step 4: Re-run the skill-use scenario**

Проверить, что с `SKILL.md` агент выбирает сохранённый скрипт, передаёт два
каталога в правильном порядке и не заменяет операцию произвольным `Copy-Item`.

- [ ] **Step 5: Run focused and full verification**

Run:

```powershell
node --test .agents/skills/compact-xml-catalog/compact-xml-catalog.test.mjs
pnpm test
git diff --check
```

Expected: все тесты PASS, `git diff --check` не выводит ошибок.

- [ ] **Step 6: Commit**

```powershell
git add .agents/skills/compact-xml-catalog/SKILL.md
git commit -m "docs: :memo: описать skill компактирования XML-каталога"
```

### Task 3: Именные исключения XML

**Files:**

- Modify: `.agents/skills/compact-xml-catalog/compact-xml-catalog.test.mjs`
- Modify: `.agents/skills/compact-xml-catalog/compact-xml-catalog.mjs`
- Modify: `.agents/skills/compact-xml-catalog/SKILL.md`

**Interfaces:**

- Consumes: `compactXmlCatalog(inputPath, outputPath)`.
- Produces: поле результата `excludedFiles`.

- [x] **Step 1: Write failing tests**

Добавить корневые и вложенные `ConfigDumpInfo.xml` и `Template.xml`. Проверить,
что первые отсутствуют в выходе, вторые имеют нулевую длину, а статистика
содержит `excludedFiles: 2` и учитывает два шаблона в `emptiedFiles`.

- [x] **Step 2: Run tests to verify they fail**

```powershell
node --test .agents/skills/compact-xml-catalog/compact-xml-catalog.test.mjs
```

Expected: FAIL — `ConfigDumpInfo.xml` скопирован, `Template.xml` не пустой,
`excludedFiles` отсутствует.

- [x] **Step 3: Implement filename precedence**

Перед общей проверкой расширения сравнить `path.basename(relativePath)` без
учёта регистра:

```js
if (fileName === "configdumpinfo.xml") {
  result.excludedFiles += 1
} else if (fileName === "template.xml") {
  await writeFile(target, Buffer.alloc(0))
  result.emptiedFiles += 1
} else if (path.extname(entry.relativePath).toLowerCase() === ".xml") {
  // существующее копирование XML
}
```

- [x] **Step 4: Update and validate skill**

Описать оба исключения и `excludedFiles` в `SKILL.md`, затем запустить
`quick_validate.py`.

- [x] **Step 5: Verify and rebuild the real output**

Запустить узкие тесты, форматирование и скрипт для:

```text
C:\git\round-trip\cf\erp
C:\git\round-trip-compact\cf\erp
```
