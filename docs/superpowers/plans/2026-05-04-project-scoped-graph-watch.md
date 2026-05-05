# Project-Scoped Graph Watch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сделать `update-graph` и `watch` проектно-изолированными и перевести полный прогрев, `--file`, начальную догонку `watch` и текущие события на общий batch-путь с одинаковым чтением `Форма.yaml`/`Форма.nkdk`.

**Architecture:** `packages/cli/src/graph/` получает два маленьких узла ответственности: имя graph-БД от абсолютного пути проекта и нормализация tracked files в graph sources плюс tombstone-файлы. `packages/cli/src/commands/updateGraph.ts` становится единственным местом batch-записи payload в `@nakidka/graph`, а `watch.ts` только вычисляет diff, рано запускает watcher и отдаёт пачки в этот путь. `@nakidka/core.buildGraph` остаётся общим batch-строителем `FileGraphData[]`.

**Tech Stack:** TypeScript, Vitest, Commander, `chokidar`, Node `crypto`, `@nakidka/core.buildGraph`, `@nakidka/graph.updateGraph/getGraphFiles`.

---

## File Structure

- Create `packages/cli/src/graph/projectGraphName.ts`: чистая функция `projectGraphName(projectPath)` для `nkdk_<hash(resolve(projectPath))>`.
- Create `packages/cli/src/graph/projectGraphName.test.ts`: стабильность, безопасность имени и различие двух путей.
- Modify `packages/cli/src/graph/projectSources.ts`: заменить одиночный `readChangedProjectSource` на batch-нормализацию `readChangedProjectSources`; оставить тонкую совместимую обёртку.
- Modify `packages/cli/src/graph/projectSources.test.ts`: покрыть матрицу формы и отсутствие одинокого `Форма.nkdk` в sources.
- Modify `packages/cli/src/commands/updateGraph.ts`: удалить прямое использование `buildGraphForChangedFile`, добавить `updateGraphFiles`, полный `updateGraph` и `--file` через общий batch-путь, всегда передавать `graphName`.
- Create `packages/cli/src/commands/updateGraph.test.ts`: замокать `@nakidka/core` и `@nakidka/graph`, проверить payload и `graphName`.
- Modify `packages/cli/src/commands/watch.ts`: рано запускать watcher, считать diff пачкой, использовать `updateGraphFiles`, передавать `graphName` в `getGraphFiles`.
- Create `packages/cli/src/commands/watch.test.ts`: замокать `chokidar`, `getGraphFiles`, `updateGraphFiles`, проверить отсутствие массовой догонки после полного прогрева с paired `Форма.nkdk`.
- Modify `packages/cli/src/graph/watchQueue.ts`: принимать пачку файлов в `runTask`.
- Modify `packages/cli/src/graph/watchQueue.test.ts`: обновить ожидания под batch-вызовы.
- Run final verification with `pnpm --filter @nakidka/cli test`, `pnpm type-check`, and `pnpm test`.

## Task 1: Project-Scoped Graph Name

**Files:**
- Create: `packages/cli/src/graph/projectGraphName.ts`
- Create: `packages/cli/src/graph/projectGraphName.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/cli/src/graph/projectGraphName.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { projectGraphName } from "./projectGraphName"

describe("projectGraphName", () => {
  it("строит стабильное безопасное имя graph-БД от абсолютного пути", () => {
    const name = projectGraphName("/repo/yaml")

    expect(name).toMatch(/^nkdk_[a-f0-9]{12}$/)
    expect(projectGraphName("/repo/yaml")).toBe(name)
  })

  it("нормализует относительный путь через resolve", () => {
    expect(projectGraphName(".")).toBe(projectGraphName(process.cwd()))
  })

  it("разводит разные YAML-каталоги по разным graph-БД", () => {
    expect(projectGraphName("/repo/yaml-a")).not.toBe(projectGraphName("/repo/yaml-b"))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/cli test -- projectGraphName.test.ts
```

Expected: FAIL with `Cannot find module './projectGraphName'`.

- [ ] **Step 3: Add implementation**

Create `packages/cli/src/graph/projectGraphName.ts`:

```ts
import { createHash } from "crypto"
import { resolve } from "path"

export function projectGraphName(projectPath: string): string {
  const absoluteProjectPath = resolve(projectPath)
  const hash = createHash("sha1").update(absoluteProjectPath).digest("hex").slice(0, 12)
  return `nkdk_${hash}`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @nakidka/cli test -- projectGraphName.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/cli/src/graph/projectGraphName.ts packages/cli/src/graph/projectGraphName.test.ts
git commit -m "feat: :sparkles: добавить проектное имя graph-базы"
```

## Task 2: Batch Normalization Of Changed Files

**Files:**
- Modify: `packages/cli/src/graph/projectSources.ts`
- Modify: `packages/cli/src/graph/projectSources.test.ts`

- [ ] **Step 1: Add failing tests for form matrix**

Append these tests inside `describe("projectSources", ...)` in `packages/cli/src/graph/projectSources.test.ts`:

```ts
it("batch-нормализация пересобирает форму при изменении paired Форма.nkdk", () => {
  const projectPath = createProject()
  const yamlPath = "Справочник/Товары/Формы/ФормаСписка/Форма.yaml"
  const nkdkPath = "Справочник/Товары/Формы/ФормаСписка/Форма.nkdk"
  writeProjectFile(projectPath, yamlPath, "Элементы: {}\n")
  writeProjectFile(projectPath, nkdkPath, "ПолеВвода1(Реквизит):\n")

  const changed = readChangedProjectSources(projectPath, [nkdkPath])

  expect(changed.deletedFilePaths).toEqual([])
  expect(changed.sources).toHaveLength(1)
  expect(changed.sources[0]).toMatchObject({
    filePath: yamlPath,
    pairedText: {
      filePath: nkdkPath,
      text: "ПолеВвода1(Реквизит):\n",
    },
  })
})

it("batch-нормализация удаляет вклад Форма.nkdk при сохранённом Форма.yaml", () => {
  const projectPath = createProject()
  const yamlPath = "Справочник/Товары/Формы/ФормаСписка/Форма.yaml"
  const nkdkPath = "Справочник/Товары/Формы/ФормаСписка/Форма.nkdk"
  writeProjectFile(projectPath, yamlPath, "Элементы: {}\n")

  const changed = readChangedProjectSources(projectPath, [nkdkPath])

  expect(changed.sources.map((source) => source.filePath)).toEqual([yamlPath])
  expect(changed.sources[0]?.pairedText).toBeUndefined()
  expect(changed.deletedFilePaths).toEqual([nkdkPath])
})

it("batch-нормализация не делает одинокий Форма.nkdk graph source", () => {
  const projectPath = createProject()
  const nkdkPath = "Справочник/Товары/Формы/ФормаСписка/Форма.nkdk"
  writeProjectFile(projectPath, nkdkPath, "ПолеВвода1(Реквизит):\n")

  const changed = readChangedProjectSources(projectPath, [nkdkPath])

  expect(changed.sources).toEqual([])
  expect(changed.deletedFilePaths).toEqual([nkdkPath])
})

it("batch-нормализация удаляет YAML и paired NKDK при удалённой Форма.yaml", () => {
  const projectPath = createProject()
  const yamlPath = "Справочник/Товары/Формы/ФормаСписка/Форма.yaml"
  const nkdkPath = "Справочник/Товары/Формы/ФормаСписка/Форма.nkdk"
  writeProjectFile(projectPath, nkdkPath, "ПолеВвода1(Реквизит):\n")

  const changed = readChangedProjectSources(projectPath, [yamlPath])

  expect(changed.sources).toEqual([])
  expect(changed.deletedFilePaths).toEqual([yamlPath, nkdkPath])
})
```

Also change the import line:

```ts
import {
  readChangedProjectSource,
  readChangedProjectSources,
  readProjectGraphSources,
} from "./projectSources"
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/cli test -- projectSources.test.ts
```

Expected: FAIL with `readChangedProjectSources` missing.

- [ ] **Step 3: Implement batch normalization**

In `packages/cli/src/graph/projectSources.ts`, add the interface after `ChangedProjectSource`:

```ts
export interface ChangedProjectSources {
  sources: ProjectGraphSource[]
  deletedFilePaths: string[]
}
```

Replace `readChangedProjectSource` with this implementation and keep the wrapper below it:

```ts
export const readChangedProjectSources = (
  projectPath: string,
  filePaths: readonly string[],
): ChangedProjectSources => {
  const primaryPaths = new Set<string>()
  const explicitlyChanged = new Set<string>()

  for (const filePath of filePaths) {
    const normalizedFilePath = normalizeChangedFile(projectPath, filePath)
    explicitlyChanged.add(normalizedFilePath)

    const primaryFilePath = normalizedFilePath.endsWith("/Форма.nkdk")
      ? pairedFormPath(normalizedFilePath)
      : normalizedFilePath

    if (primaryFilePath) primaryPaths.add(primaryFilePath)
    else explicitlyChanged.add(normalizedFilePath)
  }

  const sources: ProjectGraphSource[] = []
  const deletedFilePaths = new Set<string>()

  for (const primaryFilePath of [...primaryPaths].sort()) {
    const fullPath = absoluteProjectFile(projectPath, primaryFilePath)
    const pairedPath = pairedFormPath(primaryFilePath)

    if (!existsSync(fullPath)) {
      for (const deletedFilePath of deletedPathsFor(primaryFilePath)) {
        deletedFilePaths.add(deletedFilePath)
      }
      continue
    }

    const source = readSource(projectPath, primaryFilePath)
    sources.push(source)

    if (
      pairedPath &&
      explicitlyChanged.has(pairedPath) &&
      !existsSync(absoluteProjectFile(projectPath, pairedPath))
    ) {
      deletedFilePaths.add(pairedPath)
    }
  }

  return {
    sources,
    deletedFilePaths: [...deletedFilePaths].sort(),
  }
}

export const readChangedProjectSource = (
  projectPath: string,
  filePath: string,
): ChangedProjectSource => {
  const changed = readChangedProjectSources(projectPath, [filePath])
  const source = changed.sources[0]
  return {
    deleted: changed.sources.length === 0,
    source,
    deletedFilePaths: changed.deletedFilePaths,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @nakidka/cli test -- projectSources.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/cli/src/graph/projectSources.ts packages/cli/src/graph/projectSources.test.ts
git commit -m "feat: :sparkles: нормализовать изменения graph sources пачкой"
```

## Task 3: Common Batch Path For `update-graph`

**Files:**
- Modify: `packages/cli/src/commands/updateGraph.ts`
- Create: `packages/cli/src/commands/updateGraph.test.ts`

- [ ] **Step 1: Write failing command tests**

Create `packages/cli/src/commands/updateGraph.test.ts`:

```ts
import { buildGraph } from "@nakidka/core"
import { updateGraph as writeGraph } from "@nakidka/graph"
import { mkdirSync, mkdtempSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { projectGraphName } from "../graph/projectGraphName"
import { updateGraph, updateGraphFiles } from "./updateGraph"

vi.mock("@nakidka/core", async () => {
  return {
    buildGraph: vi.fn(async (sources: Array<{ filePath: string; pairedText?: { filePath: string } }>) =>
      sources.flatMap((source) => [
        {
          filePath: source.filePath,
          fileStats: { mtimeMs: 1, size: 2, updatedAt: 3 },
          nodes: [],
          edges: [],
        },
        ...(source.pairedText
          ? [{
              filePath: source.pairedText.filePath,
              fileStats: { mtimeMs: 4, size: 5, updatedAt: 6 },
              nodes: [],
              edges: [],
            }]
          : []),
      ]),
    ),
  }
})

vi.mock("@nakidka/graph", async () => {
  return {
    updateGraph: vi.fn(async () => undefined),
  }
})

const createProject = (): string => mkdtempSync(join(tmpdir(), "nakidka-update-graph-"))

const writeProjectFile = (projectPath: string, filePath: string, text: string): void => {
  const fullPath = join(projectPath, ...filePath.split("/"))
  mkdirSync(join(fullPath, ".."), { recursive: true })
  writeFileSync(fullPath, text)
}

describe("updateGraph command", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("полный update-graph строит payload с paired Форма.nkdk и пишет в project-scoped graph", async () => {
    const projectPath = createProject()
    writeProjectFile(projectPath, "Справочник/Товары/Свойства.yaml", "ДлинаКода: 9\n")
    writeProjectFile(projectPath, "Справочник/Товары/Формы/ФормаСписка/Форма.yaml", "Элементы: {}\n")
    writeProjectFile(projectPath, "Справочник/Товары/Формы/ФормаСписка/Форма.nkdk", "ПолеВвода1(Реквизит):\n")

    await updateGraph(projectPath)

    expect(buildGraph).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          filePath: "Справочник/Товары/Формы/ФормаСписка/Форма.yaml",
          pairedText: expect.objectContaining({
            filePath: "Справочник/Товары/Формы/ФормаСписка/Форма.nkdk",
          }),
        }),
      ]),
      { version: "2.20", defaultLanguage: "ru" },
    )
    expect(writeGraph).toHaveBeenNthCalledWith(1, [], { graphName: projectGraphName(projectPath) })
    expect(writeGraph).toHaveBeenNthCalledWith(
      2,
      expect.arrayContaining([
        expect.objectContaining({
          filePath: "Справочник/Товары/Формы/ФормаСписка/Форма.nkdk",
        }),
      ]),
      expect.objectContaining({ graphName: projectGraphName(projectPath) }),
    )
  })

  it("updateGraphFiles пересобирает пачку через buildGraph и добавляет tombstone для удалённого paired NKDK", async () => {
    const projectPath = createProject()
    const yamlPath = "Справочник/Товары/Формы/ФормаСписка/Форма.yaml"
    const nkdkPath = "Справочник/Товары/Формы/ФормаСписка/Форма.nkdk"
    writeProjectFile(projectPath, yamlPath, "Элементы: {}\n")

    await updateGraphFiles(projectPath, [nkdkPath])

    expect(buildGraph).toHaveBeenCalledWith(
      [expect.objectContaining({ filePath: yamlPath, pairedText: undefined })],
      { version: "2.20", defaultLanguage: "ru" },
    )
    expect(writeGraph).toHaveBeenCalledWith(
      [
        expect.objectContaining({ filePath: yamlPath }),
        { filePath: nkdkPath, nodes: [], edges: [] },
      ],
      expect.objectContaining({ graphName: projectGraphName(projectPath) }),
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/cli test -- updateGraph.test.ts
```

Expected: FAIL because `updateGraphFiles` is not exported and `updateGraph` still excludes paired text.

- [ ] **Step 3: Replace command implementation with common batch path**

In `packages/cli/src/commands/updateGraph.ts`, change imports to:

```ts
import { buildGraph } from "@nakidka/core"
import type { FileGraphData } from "@nakidka/core"
import { updateGraph as writeGraph } from "@nakidka/graph"
import chalk from "chalk"
import { existsSync } from "fs"
import { resolve } from "path"
import { performance } from "perf_hooks"
import { projectGraphName } from "../graph/projectGraphName"
import { readProjectFileList } from "../graph/projectFiles"
import { readChangedProjectSources, readProjectGraphSources } from "../graph/projectSources"
```

Delete `applyChangedSourceStats`, `updateGraphFile`, and `buildProjectGraph`. Add these helpers above `export const updateGraph`:

```ts
const createGraphOptions = (projectPath: string) => ({
  graphName: projectGraphName(projectPath),
})

const createDeletionTombstones = (filePaths: readonly string[]): FileGraphData[] =>
  filePaths.map((filePath) => ({
    filePath,
    nodes: [],
    edges: [],
  }))

const buildPayload = async (
  sources: Parameters<typeof buildGraph>[0],
  deletedFilePaths: readonly string[],
): Promise<FileGraphData[]> => {
  const graphFiles = await buildGraph(sources, CONTEXT)
  return [...graphFiles, ...createDeletionTombstones(deletedFilePaths)]
}

export const updateGraphFiles = async (
  projectPath: string,
  filePaths: readonly string[],
): Promise<void> => {
  const absoluteProjectPath = resolve(projectPath)
  const changed = readChangedProjectSources(absoluteProjectPath, filePaths)
  const payload = await buildPayload(changed.sources, changed.deletedFilePaths)
  await writeGraph(payload, {
    ...createGraphOptions(absoluteProjectPath),
    onProgress: createProgressReporter(),
  })
}

export const updateGraphFile = async (projectPath: string, filePath: string): Promise<void> => {
  await updateGraphFiles(projectPath, [filePath])
}
```

In `updateGraph`, replace the build/write part with:

```ts
  const absoluteProjectPath = resolve(projectPath)
  const graphOptions = createGraphOptions(absoluteProjectPath)

  const tStart = performance.now()
  const tReadStart = performance.now()
  const projectFiles = readProjectFileList(absoluteProjectPath)
  const sources = readProjectGraphSources(absoluteProjectPath)
  const tRead = performance.now() - tReadStart

  const tBuildStart = performance.now()
  const graphFiles = await buildPayload(sources, [])
  const tBuild = performance.now() - tBuildStart

  const tWriteStart = performance.now()
  await writeGraph([], graphOptions)
  await writeGraph(graphFiles, { ...graphOptions, onProgress: createProgressReporter() })
  const tWrite = performance.now() - tWriteStart
```

Keep the existing counters and `console.log` lines.

- [ ] **Step 4: Run updateGraph command tests**

Run:

```bash
pnpm --filter @nakidka/cli test -- updateGraph.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run existing project source tests**

Run:

```bash
pnpm --filter @nakidka/cli test -- projectSources.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/cli/src/commands/updateGraph.ts packages/cli/src/commands/updateGraph.test.ts
git commit -m "feat: :sparkles: перевести update-graph на общий batch-путь"
```

## Task 4: Batch Watch Queue

**Files:**
- Modify: `packages/cli/src/graph/watchQueue.ts`
- Modify: `packages/cli/src/graph/watchQueue.test.ts`

- [ ] **Step 1: Update failing tests for batch calls**

In `packages/cli/src/graph/watchQueue.test.ts`, change `calls` from `string[]` to `string[][]` in the first test and replace `runTask` plus assertion:

```ts
const calls: string[][] = []
const queue = createWatchQueue({
  debounceMs: 50,
  runTask: async (filePaths) => {
    calls.push(filePaths)
  },
})

queue.enqueue("a.yaml")
queue.enqueue("a.yaml")
queue.enqueue("b.yaml")

await vi.advanceTimersByTimeAsync(60)
await vi.runAllTimersAsync()

expect(calls).toEqual([["a.yaml", "b.yaml"]])
```

In the second test, replace the `runTask` body:

```ts
runTask: async (filePaths) => {
  started.push(filePaths.join(","))
  if (filePaths.includes("a.yaml")) {
    await new Promise<void>((resolve) => {
      finishA = resolve
    })
  }
  finished.push(filePaths.join(","))
},
```

Then change the expectations:

```ts
expect(started).toEqual(["a.yaml,b.yaml"])
expect(finished).toEqual([])

finishA?.()
await queue.drain()

expect(started).toEqual(["a.yaml,b.yaml"])
expect(finished).toEqual(["a.yaml,b.yaml"])
```

In the third test, replace the `runTask` body and expectations:

```ts
runTask: async (filePaths) => {
  calls.push(filePaths.join(","))
  if (filePaths.includes("a.yaml")) throw new Error("boom")
},
onError: (filePaths) => {
  errors.push(filePaths.join(","))
},
```

```ts
expect(calls).toEqual(["a.yaml,b.yaml", "c.yaml"])
expect(errors).toEqual(["a.yaml,b.yaml"])
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/cli test -- watchQueue.test.ts
```

Expected: FAIL because `runTask` still receives one file at a time.

- [ ] **Step 3: Change queue API to batch**

Replace `packages/cli/src/graph/watchQueue.ts` with:

```ts
export interface WatchQueueOptions {
  debounceMs: number
  runTask: (filePaths: string[]) => Promise<void>
  onError?: (filePaths: string[], error: unknown) => void
}

export interface WatchQueue {
  enqueue: (filePath: string) => void
  enqueueMany: (filePaths: readonly string[]) => void
  drain: () => Promise<void>
}

export function createWatchQueue(options: WatchQueueOptions): WatchQueue {
  const pending = new Set<string>()
  let timer: NodeJS.Timeout | undefined
  let running = Promise.resolve()

  const runBatch = (batch: string[]): void => {
    if (batch.length === 0) return

    running = running.catch(() => undefined).then(async () => {
      try {
        await options.runTask(batch)
      } catch (error) {
        options.onError?.(batch, error)
      }
    })
  }

  const schedule = (): void => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = undefined
      const batch = [...pending]
      pending.clear()
      runBatch(batch)
    }, options.debounceMs)
  }

  return {
    enqueue(filePath: string): void {
      pending.add(filePath)
      schedule()
    },
    enqueueMany(filePaths: readonly string[]): void {
      for (const filePath of filePaths) pending.add(filePath)
      schedule()
    },
    async drain(): Promise<void> {
      if (timer) {
        clearTimeout(timer)
        timer = undefined
      }
      const batch = [...pending]
      pending.clear()
      runBatch(batch)
      await running
    },
  }
}
```

- [ ] **Step 4: Run queue tests**

Run:

```bash
pnpm --filter @nakidka/cli test -- watchQueue.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/cli/src/graph/watchQueue.ts packages/cli/src/graph/watchQueue.test.ts
git commit -m "feat: :sparkles: выполнять watch queue пачками"
```

## Task 5: Watch Startup Diff Through Batch Path

**Files:**
- Modify: `packages/cli/src/commands/watch.ts`
- Create: `packages/cli/src/commands/watch.test.ts`

- [ ] **Step 1: Write failing watch tests**

Create `packages/cli/src/commands/watch.test.ts`:

```ts
import { getGraphFiles } from "@nakidka/graph"
import chokidar from "chokidar"
import { mkdirSync, mkdtempSync, statSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { projectGraphName } from "../graph/projectGraphName"
import { updateGraphFiles } from "./updateGraph"
import { watch } from "./watch"

vi.mock("@nakidka/graph", async () => {
  return {
    getGraphFiles: vi.fn(async () => []),
  }
})

vi.mock("./updateGraph", async () => {
  return {
    updateGraphFiles: vi.fn(async () => undefined),
  }
})

const watcher = {
  on: vi.fn(() => watcher),
  close: vi.fn(async () => undefined),
}

vi.mock("chokidar", async () => {
  return {
    default: {
      watch: vi.fn(() => watcher),
    },
  }
})

const createProject = (): string => mkdtempSync(join(tmpdir(), "nakidka-watch-"))

const writeProjectFile = (projectPath: string, filePath: string, text: string): void => {
  const fullPath = join(projectPath, ...filePath.split("/"))
  mkdirSync(join(fullPath, ".."), { recursive: true })
  writeFileSync(fullPath, text)
}

const graphRecord = (projectPath: string, filePath: string) => {
  const fullPath = join(projectPath, ...filePath.split("/"))
  const stat = statSync(fullPath)
  return {
    path: filePath,
    mtimeMs: stat.mtimeMs,
    size: stat.size,
    updatedAt: 1,
  }
}

describe("watch", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("запускает watcher до чтения graph files и использует project-scoped graph", async () => {
    const projectPath = createProject()
    writeProjectFile(projectPath, "Справочник/Товары/Свойства.yaml", "ДлинаКода: 9\n")

    await watch(projectPath)

    expect(chokidar.watch).toHaveBeenCalledBefore(getGraphFiles as unknown as ReturnType<typeof vi.fn>)
    expect(getGraphFiles).toHaveBeenCalledWith({ graphName: projectGraphName(projectPath) })
  })

  it("после полного прогрева с Форма.yaml и paired Форма.nkdk не запускает догонку", async () => {
    const projectPath = createProject()
    const yamlPath = "Справочник/Товары/Формы/ФормаСписка/Форма.yaml"
    const nkdkPath = "Справочник/Товары/Формы/ФормаСписка/Форма.nkdk"
    writeProjectFile(projectPath, yamlPath, "Элементы: {}\n")
    writeProjectFile(projectPath, nkdkPath, "ПолеВвода1(Реквизит):\n")
    vi.mocked(getGraphFiles).mockResolvedValueOnce([
      graphRecord(projectPath, yamlPath),
      graphRecord(projectPath, nkdkPath),
    ])

    await watch(projectPath)

    expect(updateGraphFiles).not.toHaveBeenCalled()
  })

  it("начальную догонку передаёт одним batch-вызовом", async () => {
    const projectPath = createProject()
    const yamlPath = "Справочник/Товары/Формы/ФормаСписка/Форма.yaml"
    const nkdkPath = "Справочник/Товары/Формы/ФормаСписка/Форма.nkdk"
    writeProjectFile(projectPath, yamlPath, "Элементы: {}\n")
    writeProjectFile(projectPath, nkdkPath, "ПолеВвода1(Реквизит):\n")
    vi.mocked(getGraphFiles).mockResolvedValueOnce([])

    await watch(projectPath)

    expect(updateGraphFiles).toHaveBeenCalledTimes(1)
    expect(updateGraphFiles).toHaveBeenCalledWith(projectPath, [yamlPath, nkdkPath])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/cli test -- watch.test.ts
```

Expected: FAIL because `watch` currently starts watcher after diff and calls `updateGraphFile` one by one.

- [ ] **Step 3: Implement early watcher and batch diff**

Replace `packages/cli/src/commands/watch.ts` with:

```ts
import { getGraphFiles } from "@nakidka/graph"
import chokidar from "chokidar"
import chalk from "chalk"
import { existsSync } from "fs"
import { projectGraphName } from "../graph/projectGraphName"
import { hasFileChanged, readFileStats } from "../graph/fileStats"
import {
  absoluteProjectFile,
  isSupportedProjectFile,
  normalizeProjectFile,
  readProjectFileList,
} from "../graph/projectFiles"
import { createWatchQueue } from "../graph/watchQueue"
import { updateGraphFiles } from "./updateGraph"

const WATCH_PATTERNS = [
  "**/Свойства.yaml",
  "**/Форма.yaml",
  "**/Форма.nkdk",
] as const

const enqueueIfSupported = (
  projectPath: string,
  queue: ReturnType<typeof createWatchQueue>,
  path: string,
): void => {
  const filePath = normalizeProjectFile(projectPath, path)
  if (isSupportedProjectFile(filePath)) queue.enqueue(filePath)
}

const collectChangedFiles = async (projectPath: string): Promise<string[]> => {
  const graphFiles = await getGraphFiles({ graphName: projectGraphName(projectPath) })
  const graphFileByPath = new Map(graphFiles.map((file) => [file.path, file]))
  const diskFiles = readProjectFileList(projectPath)
  const diskFileSet = new Set(diskFiles)
  const changed = new Set<string>()

  for (const filePath of diskFiles) {
    const fullPath = absoluteProjectFile(projectPath, filePath)
    const stats = readFileStats(fullPath)
    if (hasFileChanged(graphFileByPath.get(filePath), stats)) changed.add(filePath)
  }

  for (const file of graphFiles) {
    if (!diskFileSet.has(file.path)) changed.add(file.path)
  }

  return [...changed].sort()
}

export async function watch(projectPath: string): Promise<void> {
  if (!existsSync(projectPath)) {
    throw new Error(`Директория не найдена: ${projectPath}`)
  }

  const queue = createWatchQueue({
    debounceMs: 150,
    runTask: async (filePaths) => {
      await updateGraphFiles(projectPath, filePaths)
    },
    onError: (filePaths, error) => {
      const message = error instanceof Error ? error.message : String(error)
      console.warn(chalk.yellow(`Предупреждение: не удалось обновить граф для ${filePaths.join(", ")}: ${message}`))
    },
  })

  const watcher = chokidar.watch(
    WATCH_PATTERNS.map((pattern) => `${projectPath}/${pattern}`),
    { ignoreInitial: true },
  )

  watcher.on("add", (path) => {
    enqueueIfSupported(projectPath, queue, path)
  })
  watcher.on("change", (path) => {
    enqueueIfSupported(projectPath, queue, path)
  })
  watcher.on("unlink", (path) => {
    enqueueIfSupported(projectPath, queue, path)
  })

  const changedFiles = await collectChangedFiles(projectPath)
  if (changedFiles.length > 0) {
    await updateGraphFiles(projectPath, changedFiles)
  }

  await queue.drain()

  process.once("SIGINT", () => {
    void queue.drain().finally(() => {
      void watcher.close().then(() => process.exit(0))
    })
  })
}
```

- [ ] **Step 4: Run watch tests**

Run:

```bash
pnpm --filter @nakidka/cli test -- watch.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run all CLI graph tests**

Run:

```bash
pnpm --filter @nakidka/cli test -- graph commands
```

Expected: PASS for CLI tests. If Vitest treats `commands` as a filename filter and finds no files, run:

```bash
pnpm --filter @nakidka/cli test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/cli/src/commands/watch.ts packages/cli/src/commands/watch.test.ts
git commit -m "feat: :sparkles: выполнять watch догонку через batch-путь"
```

## Task 6: Final Verification And Performance Smoke

**Files:**
- No code files unless verification exposes a defect.

- [ ] **Step 1: Run focused CLI package tests**

Run:

```bash
pnpm --filter @nakidka/cli test
```

Expected: PASS.

- [ ] **Step 2: Run type check**

Run:

```bash
pnpm type-check
```

Expected: PASS.

- [ ] **Step 3: Run full project tests before closing the issue**

Run from repository root:

```bash
pnpm test
```

Expected: PASS across all `packages/*`.

- [ ] **Step 4: Optional large-project smoke**

Run only if `/Users/nikita/git/erp_nkdk/` exists locally:

```bash
pnpm --filter @nakidka/cli dev -- update-graph /Users/nikita/git/erp_nkdk/
```

Expected: command completes, full payload includes `Форма.nkdk` `File` records, and runtime is acceptable enough to proceed. If it is visibly slower than the previous full прогрев, measure the slow phase from existing timing output and optimize reading/parsing instead of excluding `Форма.nkdk`.

- [ ] **Step 5: Commit verification note if code changed during fixes**

If verification required fixes, commit those exact files:

```bash
git add packages/cli/src
git commit -m "fix: :bug: стабилизировать project-scoped graph watch"
```

If no files changed, do not create an empty commit.

## Self-Review

- Spec coverage: full `update-graph`, `--file`, `watch` startup diff, current watch events, paired `Форма.nkdk`, lone `Форма.nkdk`, deletion semantics, project-scoped graph names, and final `pnpm test` are covered by Tasks 1-6.
- Placeholder scan: no forbidden stub markers, no vague edge-case instructions, no references to undefined helper names in code snippets.
- Type consistency: `projectGraphName`, `readChangedProjectSources`, `updateGraphFiles`, `createWatchQueue.runTask(filePaths: string[])`, and `FileGraphData` payload shapes are consistent across tasks.
