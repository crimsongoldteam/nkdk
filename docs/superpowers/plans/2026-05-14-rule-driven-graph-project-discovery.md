# Rule-driven Graph Project Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `update-graph` discover project files from `registerTopLevelGraphImports.ts` and each object's `rules`, instead of hard-coded CLI owner directories.

**Architecture:** Move project-file discovery into `@nakidka/core` next to graph import registration. `registerTopLevelGraphImports.ts` exports the same top-level specs used for registration; reading each registered object's `Свойства.yaml` lets graph import process nested `rule.properties` such as requisites, tabular sections, commands, and references through the existing model graph builder. Separate source-file discovery walks `rule.properties` only for properties that are stored outside `Свойства.yaml`, starting with forms and paired NKDK form files because they already have a graph import registration.

**Tech Stack:** TypeScript, pnpm workspaces, Vitest, existing `@nakidka/core` graph import registry, Node `fs`/`path`.

---

## File Structure

- Modify `packages/core/metadata/graphImport/registerTopLevelGraphImports.ts`: introduce and export `topLevelGraphImportSpecs`; register graph imports from this array.
- Create `packages/core/metadata/graphImport/projectFiles.ts`: rule-driven discovery helpers for top-level project files and separately registered child source files.
- Modify `packages/core/metadata/graphImport/registerFormGraphImport.ts`: match form owners through `topLevelGraphImportSpecs` and `ChildFormNames` rules.
- Modify `packages/core/metadata/graphImport/buildGraph.ts`: no behavioral change expected, but keep imports stable if helper exports need central access.
- Modify `packages/core/index.ts`: export new core project discovery helpers for CLI.
- Modify `packages/cli/src/graph/projectFiles.ts`: delegate to core and keep CLI path normalization wrappers.
- Modify tests in `packages/core/metadata/graphImport/*.test.ts` and `packages/cli/src/graph/*.test.ts`: lock rule-driven behavior.

## Task 1: Export Top-level Graph Import Specs

**Files:**
- Modify: `packages/core/metadata/graphImport/registerTopLevelGraphImports.ts`
- Test: `packages/core/metadata/graphImport/registerTopLevelGraphImports.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/core/metadata/graphImport/registerTopLevelGraphImports.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { topLevelGraphImportSpecs } from "./registerTopLevelGraphImports"

describe("topLevelGraphImportSpecs", () => {
  it("экспортирует каталоги всех верхнеуровневых регистраций графа", () => {
    expect(topLevelGraphImportSpecs.map((spec) => spec.dir)).toEqual([
      "Справочник",
      "Документ",
      "Перечисление",
      "Обработка",
      "ЖурналДокументов",
      "HTTPСервис",
      "РегистрСведений",
      "РегистрНакопления",
      "ПланОбмена",
    ])
  })

  it("содержит rule для каждого зарегистрированного kind", () => {
    expect(
      topLevelGraphImportSpecs.map((spec) => ({
        kind: spec.kind,
        itemType: spec.rule.itemType,
        prefix: spec.rule.itemTypePrefix,
      })),
    ).toContainEqual({
      kind: "dataProcessor",
      itemType: "MetadataDataProcessor",
      prefix: "Обработка",
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/graphImport/registerTopLevelGraphImports.test.ts
```

Expected: FAIL because `topLevelGraphImportSpecs` is not exported.

- [ ] **Step 3: Implement the shared specs**

In `packages/core/metadata/graphImport/registerTopLevelGraphImports.ts`, add this type and array near the imports:

```ts
export interface TopLevelGraphImportSpec {
  kind: string
  dir: string
  rule: MetadataItemRule
  importModel?: (
    params: Parameters<NonNullable<Parameters<typeof registerGraphImport>[0]["importModel"]>>[0],
  ) => ReturnType<NonNullable<Parameters<typeof registerGraphImport>[0]["importModel"]>>
}

export const topLevelGraphImportSpecs: readonly TopLevelGraphImportSpec[] = [
  {
    kind: "catalog",
    dir: "Справочник",
    rule: MetadataCatalogRules,
    importModel: ({ context, parsed, name }) => {
      const model = importMetadataCatalogFromYAML(context, parsed.data, name)
      if (!model) return undefined
      return { model, graphModel: toGraphModel(model), rule: MetadataCatalogRules }
    },
  },
  {
    kind: "document",
    dir: "Документ",
    rule: MetadataDocumentRules,
  },
  {
    kind: "enumeration",
    dir: "Перечисление",
    rule: MetadataEnumerationRules,
    importModel: ({ context, parsed, name }) => {
      const model = importMetadataEnumerationFromYAML(context, parsed.data, name)
      if (!model) return undefined
      return { model, graphModel: toGraphModel(model), rule: MetadataEnumerationRules }
    },
  },
  { kind: "dataProcessor", dir: "Обработка", rule: MetadataDataProcessorRules },
  { kind: "documentJournal", dir: "ЖурналДокументов", rule: MetadataDocumentJournalRules },
  { kind: "httpService", dir: "HTTPСервис", rule: MetadataHTTPServiceRules },
  { kind: "informationRegister", dir: "РегистрСведений", rule: MetadataInformationRegisterRules },
  { kind: "accumulationRegister", dir: "РегистрНакопления", rule: MetadataAccumulationRegisterRules },
  { kind: "exchangePlan", dir: "ПланОбмена", rule: MetadataExchangePlanRules },
]
```

Then replace the body of `registerTopLevelGraphImports()` with:

```ts
export function registerTopLevelGraphImports(): void {
  for (const spec of topLevelGraphImportSpecs) {
    registerTopLevelMetadataItem(spec)
  }
}
```

Replace `registerTopLevelMetadataItem` with:

```ts
function registerTopLevelMetadataItem(spec: TopLevelGraphImportSpec) {
  registerGraphImport({
    kind: spec.kind,
    phase: 0,
    matchPath: matchTopLevelPath(spec.dir, spec.kind),
    importModel: (params) => {
      if (spec.importModel) return spec.importModel(params)

      const model = importMetadataItemFromYAML({
        context: params.context,
        yaml: params.parsed.data,
        rule: spec.rule,
        name: params.name,
      })
      if (!model) return undefined
      const graphModel = model as GraphImportedMetadataModel
      return { model: graphModel, graphModel: toGraphModel(graphModel), rule: spec.rule }
    },
    declareRoot: ({ graph, rule, name, filePath }) =>
      declareMetadataItemGraphRoot({ graph, rule, name, filePath }),
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/graphImport/registerTopLevelGraphImports.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/graphImport/registerTopLevelGraphImports.ts packages/core/metadata/graphImport/registerTopLevelGraphImports.test.ts
git commit -m "refactor: :recycle: выделить регистрации графа"
```

## Task 2: Add Rule-driven Project File Discovery in Core

**Files:**
- Create: `packages/core/metadata/graphImport/projectFiles.ts`
- Test: `packages/core/metadata/graphImport/projectFiles.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/core/metadata/graphImport/projectFiles.test.ts`:

```ts
import { mkdtempSync, mkdirSync, writeFileSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { describe, expect, it } from "vitest"
import {
  discoverProjectGraphFiles,
  isSupportedProjectGraphFile,
  pairedProjectGraphFile,
} from "./projectFiles"

const createProject = () => mkdtempSync(join(tmpdir(), "nkdk-graph-files-"))

const write = (root: string, filePath: string) => {
  const fullPath = join(root, ...filePath.split("/"))
  mkdirSync(join(fullPath, ".."), { recursive: true })
  writeFileSync(fullPath, "")
}

describe("graphImport projectFiles", () => {
  it("читает свойства для всех top-level регистраций, а не только старые три каталога", () => {
    const root = createProject()
    write(root, "Обработка/ЗагрузкаДанных/Свойства.yaml")
    write(root, "РегистрСведений/Цены/Свойства.yaml")
    write(root, "Справочник/Товары/Свойства.yaml")

    expect(discoverProjectGraphFiles(root)).toEqual([
      "РегистрСведений/Цены/Свойства.yaml",
      "Справочник/Товары/Свойства.yaml",
      "Обработка/ЗагрузкаДанных/Свойства.yaml",
    ].sort())
  })

  it("читает формы только если rule содержит ChildFormNames", () => {
    const root = createProject()
    write(root, "Обработка/ЗагрузкаДанных/Свойства.yaml")
    write(root, "Обработка/ЗагрузкаДанных/Формы/Форма/Форма.yaml")
    write(root, "Обработка/ЗагрузкаДанных/Формы/Форма/Форма.nkdk")
    write(root, "HTTPСервис/API/Свойства.yaml")
    write(root, "HTTPСервис/API/Формы/Форма/Форма.yaml")

    expect(discoverProjectGraphFiles(root)).toEqual([
      "HTTPСервис/API/Свойства.yaml",
      "Обработка/ЗагрузкаДанных/Свойства.yaml",
      "Обработка/ЗагрузкаДанных/Формы/Форма/Форма.nkdk",
      "Обработка/ЗагрузкаДанных/Формы/Форма/Форма.yaml",
    ].sort())
  })

  it("проверяет поддержанные пути тем же rule-driven механизмом", () => {
    expect(isSupportedProjectGraphFile("Обработка/ЗагрузкаДанных/Свойства.yaml")).toBe(true)
    expect(isSupportedProjectGraphFile("Обработка/ЗагрузкаДанных/Формы/Форма/Форма.yaml")).toBe(true)
    expect(isSupportedProjectGraphFile("HTTPСервис/API/Формы/Форма/Форма.yaml")).toBe(false)
    expect(isSupportedProjectGraphFile("README.md")).toBe(false)
  })

  it("находит пару формы без знания владельца", () => {
    expect(pairedProjectGraphFile("Обработка/ЗагрузкаДанных/Формы/Форма/Форма.nkdk")).toBe(
      "Обработка/ЗагрузкаДанных/Формы/Форма/Форма.yaml",
    )
    expect(pairedProjectGraphFile("Обработка/ЗагрузкаДанных/Формы/Форма/Форма.yaml")).toBe(
      "Обработка/ЗагрузкаДанных/Формы/Форма/Форма.nkdk",
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/graphImport/projectFiles.test.ts
```

Expected: FAIL because `projectFiles.ts` does not exist.

- [ ] **Step 3: Implement discovery helpers**

Create `packages/core/metadata/graphImport/projectFiles.ts`:

```ts
import { existsSync, readdirSync } from "fs"
import { join } from "path"
import type { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import { topLevelGraphImportSpecs } from "./registerTopLevelGraphImports"

export interface ProjectGraphFileOwner {
  dir: string
  name: string
  rule: MetadataItemRule
}

export function pairedProjectGraphFile(filePath: string): string | undefined {
  if (filePath.endsWith("/Форма.nkdk")) {
    return filePath.slice(0, -"Форма.nkdk".length) + "Форма.yaml"
  }
  if (filePath.endsWith("/Форма.yaml")) {
    return filePath.slice(0, -"Форма.yaml".length) + "Форма.nkdk"
  }
  return undefined
}

export function discoverProjectGraphFiles(projectPath: string): string[] {
  const result: string[] = []

  for (const spec of topLevelGraphImportSpecs) {
    const ownerRoot = join(projectPath, spec.dir)
    if (!existsSync(ownerRoot)) continue

    for (const entry of readdirSync(ownerRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue

      const owner = { dir: spec.dir, name: entry.name, rule: spec.rule }
      const objectRoot = join(ownerRoot, entry.name)
      const props = join(objectRoot, "Свойства.yaml")
      if (existsSync(props)) result.push(ownerFile(owner, "Свойства.yaml"))

      // Nested properties such as requisites, tabular sections, commands, and references
      // are read from the top-level Свойства.yaml above. Only separately registered
      // graph source files are discovered as additional project files here.
      for (const filePath of discoverChildProjectGraphFiles(projectPath, owner)) {
        result.push(filePath)
      }
    }
  }

  return result.sort()
}

export function isSupportedProjectGraphFile(filePath: string): boolean {
  const owner = parseProjectGraphFileOwner(filePath)
  if (!owner) return false

  const rest = filePath.split("/").slice(2).join("/")
  if (rest === "Свойства.yaml") return true

  return getRuleChildFileMatchers(owner.rule).some((matcher) => matcher(rest))
}

export function parseProjectGraphFileOwner(filePath: string): ProjectGraphFileOwner | undefined {
  const parts = filePath.split("/")
  if (parts.length < 3) return undefined

  const dir = parts[0]!
  const name = parts[1]!
  const spec = topLevelGraphImportSpecs.find((candidate) => candidate.dir === dir)
  if (!spec) return undefined

  return { dir, name, rule: spec.rule }
}

function discoverChildProjectGraphFiles(projectPath: string, owner: ProjectGraphFileOwner): string[] {
  const result: string[] = []

  for (const rule of Object.values(owner.rule.properties)) {
    if (isChildFormRule(rule)) {
      const formsRoot = join(projectPath, owner.dir, owner.name, rule.folderName)
      if (!existsSync(formsRoot)) continue

      for (const formEntry of readdirSync(formsRoot, { withFileTypes: true })) {
        if (!formEntry.isDirectory()) continue

        for (const fileName of ["Форма.yaml", "Форма.nkdk"] as const) {
          const fullPath = join(formsRoot, formEntry.name, fileName)
          if (existsSync(fullPath)) {
            result.push(ownerFile(owner, `${rule.folderName}/${formEntry.name}/${fileName}`))
          }
        }
      }
    }
  }

  return result
}

function getRuleChildFileMatchers(rule: MetadataItemRule): Array<(rest: string) => boolean> {
  return Object.values(rule.properties).flatMap((propertyRule) => {
    if (isChildFormRule(propertyRule)) {
      return [
        (rest: string) =>
          rest.startsWith(`${propertyRule.folderName}/`) &&
          (rest.endsWith("/Форма.yaml") || rest.endsWith("/Форма.nkdk")),
      ]
    }

    return []
  })
}

function isChildFormRule(rule: PropertyRule): rule is PropertyRule & { type: "ChildFormNames"; folderName: string } {
  return rule.type === "ChildFormNames" && typeof (rule as { folderName?: unknown }).folderName === "string"
}

function ownerFile(owner: ProjectGraphFileOwner, rest: string): string {
  return `${owner.dir}/${owner.name}/${rest}`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/graphImport/projectFiles.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/graphImport/projectFiles.ts packages/core/metadata/graphImport/projectFiles.test.ts
git commit -m "feat: :sparkles: добавить rule-driven обход графа"
```

## Task 3: Delegate CLI Project File Discovery to Core

**Files:**
- Modify: `packages/core/index.ts`
- Modify: `packages/cli/src/graph/projectFiles.ts`
- Modify: `packages/cli/src/graph/projectFiles.test.ts`

- [ ] **Step 1: Write the failing CLI expectations**

Replace the supported-file test in `packages/cli/src/graph/projectFiles.test.ts` with:

```ts
  it("распознаёт поддержанные файлы проекта через core-регистрации", () => {
    expect(isSupportedProjectFile("Справочник/Товары/Свойства.yaml")).toBe(true)
    expect(isSupportedProjectFile("Обработка/ЗагрузкаДанных/Свойства.yaml")).toBe(true)
    expect(isSupportedProjectFile("Обработка/ЗагрузкаДанных/Формы/Форма/Форма.nkdk")).toBe(true)
    expect(isSupportedProjectFile("HTTPСервис/API/Формы/Форма/Форма.yaml")).toBe(false)
    expect(isSupportedProjectFile("README.md")).toBe(false)
  })
```

Add a read-list test to the same file:

```ts
  it("читает файлы всех top-level регистраций из core", () => {
    const projectPath = mkdtempSync(join(tmpdir(), "nkdk-cli-project-files-"))
    writeFile(projectPath, "Обработка/ЗагрузкаДанных/Свойства.yaml")
    writeFile(projectPath, "РегистрСведений/Цены/Свойства.yaml")
    writeFile(projectPath, "Обработка/ЗагрузкаДанных/Формы/Форма/Форма.yaml")

    expect(readProjectFileList(projectPath)).toEqual([
      "РегистрСведений/Цены/Свойства.yaml",
      "Обработка/ЗагрузкаДанных/Свойства.yaml",
      "Обработка/ЗагрузкаДанных/Формы/Форма/Форма.yaml",
    ].sort())
  })
```

Add imports and helper at the top of the test file:

```ts
import { mkdtempSync, mkdirSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
```

```ts
function writeFile(projectPath: string, filePath: string): void {
  const fullPath = join(projectPath, ...filePath.split("/"))
  mkdirSync(join(fullPath, ".."), { recursive: true })
  writeFileSync(fullPath, "")
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/cli exec vitest run packages/cli/src/graph/projectFiles.test.ts
```

Expected: FAIL because CLI still uses hard-coded `OWNER_DIRS`.

- [ ] **Step 3: Export core helpers**

Add to `packages/core/index.ts`:

```ts
export {
  discoverProjectGraphFiles,
  isSupportedProjectGraphFile,
  pairedProjectGraphFile,
} from "./metadata/graphImport/projectFiles"
```

- [ ] **Step 4: Replace CLI hard-coded discovery**

Replace `packages/cli/src/graph/projectFiles.ts` with:

```ts
import {
  discoverProjectGraphFiles,
  isSupportedProjectGraphFile,
  pairedProjectGraphFile,
} from "@nakidka/core"
import { join, relative, sep } from "path"

export function normalizeProjectFile(projectPath: string, path: string): string {
  return relative(projectPath, path).split(sep).join("/")
}

export function absoluteProjectFile(projectPath: string, filePath: string): string {
  return join(projectPath, ...filePath.split("/"))
}

export function pairedFormPath(filePath: string): string | undefined {
  return pairedProjectGraphFile(filePath)
}

export function isSupportedProjectFile(filePath: string): boolean {
  return isSupportedProjectGraphFile(filePath)
}

export function readProjectFileList(projectPath: string): string[] {
  return discoverProjectGraphFiles(projectPath)
}
```

- [ ] **Step 5: Run CLI graph tests**

Run:

```bash
pnpm --filter @nakidka/cli exec vitest run packages/cli/src/graph/projectFiles.test.ts packages/cli/src/graph/projectSources.test.ts packages/cli/src/commands/updateGraph.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/index.ts packages/cli/src/graph/projectFiles.ts packages/cli/src/graph/projectFiles.test.ts
git commit -m "refactor: :recycle: читать файлы графа из core"
```

## Task 4: Match Form Graph Imports Through Rules

**Files:**
- Modify: `packages/core/metadata/graphImport/registerFormGraphImport.ts`
- Test: `packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts`

- [ ] **Step 1: Write failing form graph test for a non-legacy owner**

Append this test to `packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts`:

```ts
  it("строит граф формы для объекта, владелец которого найден через top-level rules", async () => {
    ensureDefaultGraphImportsRegistered()

    const files = await buildGraph(
      [
        {
          filePath: "Обработка/ЗагрузкаДанных/Свойства.yaml",
          text: "Синоним: Загрузка данных\nФормы:\n  - Форма\n",
        },
        {
          filePath: "Обработка/ЗагрузкаДанных/Формы/Форма/Форма.yaml",
          text: "Заголовок: Форма\n",
        },
      ],
      { version: "2.20", defaultLanguage: "ru" },
    )

    const nodeIds = files.flatMap((file) => file.nodes.map((node) => node.id))
    expect(nodeIds).toContain("Обработка.ЗагрузкаДанных")
    expect(nodeIds).toContain("Обработка.ЗагрузкаДанных.Форма.Форма")
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts -t "строит граф формы для объекта"
```

Expected: FAIL because `registerFormGraphImport.ts` accepts only `Справочник`, `Документ`, `Перечисление`.

- [ ] **Step 3: Implement rule-driven form matching**

In `packages/core/metadata/graphImport/registerFormGraphImport.ts`, import helpers:

```ts
import { parseProjectGraphFileOwner } from "./projectFiles"
```

Replace `matchFormPath` with:

```ts
function matchFormPath(filePath: string): GraphImportSourceMatch | undefined {
  const owner = parseProjectGraphFileOwner(filePath)
  if (!owner) return undefined

  const parts = filePath.split("/")
  if (parts.length !== 5 || parts[4] !== "Форма.yaml") return undefined

  const formName = parts[3]!
  const hasFormsRule = Object.values(owner.rule.properties).some(
    (rule) =>
      rule.type === "ChildFormNames" &&
      typeof (rule as { folderName?: unknown }).folderName === "string" &&
      parts[2] === (rule as { folderName: string }).folderName,
  )
  if (!hasFormsRule) return undefined

  return {
    kind: "form",
    name: formName,
    pathParams: {
      ownerNodeId: `${owner.dir}.${owner.name}`,
      ownerDir: owner.dir,
      ownerName: owner.name,
    },
  }
}
```

- [ ] **Step 4: Run focused test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts -t "строит граф формы для объекта"
```

Expected: PASS.

- [ ] **Step 5: Run graph import tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/graphImport packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/graphImport/registerFormGraphImport.ts packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts
git commit -m "fix: :bug: определять владельцев форм из rules"
```

## Task 5: Wire Changed-file Handling and Final Verification

**Files:**
- Modify only if tests reveal a gap: `packages/cli/src/graph/projectSources.ts`
- Test: `packages/cli/src/graph/projectSources.test.ts`
- Test: `packages/cli/src/commands/updateGraph.test.ts`

- [ ] **Step 1: Add changed-file coverage for a new top-level owner**

Append to `packages/cli/src/graph/projectSources.test.ts`:

```ts
  it("readChangedProjectSources читает форму Обработка через rule-driven paired path", () => {
    const projectPath = createProject({
      "Обработка/ЗагрузкаДанных/Формы/Форма/Форма.yaml": "Заголовок: Форма\n",
      "Обработка/ЗагрузкаДанных/Формы/Форма/Форма.nkdk": "Элементы:\n",
    })

    const changed = readChangedProjectSources(projectPath, [
      "Обработка/ЗагрузкаДанных/Формы/Форма/Форма.nkdk",
    ])

    expect(changed.deletedFilePaths).toEqual([])
    expect(changed.sources).toMatchObject([
      {
        filePath: "Обработка/ЗагрузкаДанных/Формы/Форма/Форма.yaml",
        pairedText: {
          filePath: "Обработка/ЗагрузкаДанных/Формы/Форма/Форма.nkdk",
          text: "Элементы:\n",
        },
      },
    ])
  })
```

If `createProject` in that test file does not accept arbitrary file maps, extend the existing helper with this exact behavior:

```ts
function createProject(files: Record<string, string>): string {
  const projectPath = mkdtempSync(join(tmpdir(), "nkdk-project-sources-"))
  for (const [filePath, text] of Object.entries(files)) {
    const fullPath = join(projectPath, ...filePath.split("/"))
    mkdirSync(dirname(fullPath), { recursive: true })
    writeFileSync(fullPath, text)
  }
  return projectPath
}
```

- [ ] **Step 2: Run changed-file tests**

Run:

```bash
pnpm --filter @nakidka/cli exec vitest run packages/cli/src/graph/projectSources.test.ts packages/cli/src/commands/updateGraph.test.ts
```

Expected: PASS. If it fails because `projectSources.ts` still assumes only form paths from old owners, fix by relying on `pairedFormPath` only; do not add owner-name lists.

- [ ] **Step 3: Run required metadata generation**

Run:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected: command finishes with `Langium generator finished successfully`.

- [ ] **Step 4: Run full tests**

Run:

```bash
pnpm test
```

Expected: all package tests pass. Baseline before implementation was green in this worktree.

- [ ] **Step 5: Check git status**

Run:

```bash
git status --short
```

Expected: only intentional source/test/plan files are modified. Do not stage `packages/core/tests/fixtures/sync/syncConfiguration/out-to-xml/` if it appears as untracked test output.

- [ ] **Step 6: Commit final verification changes**

If Task 5 changed tests or source files, commit them:

```bash
git add packages/cli/src/graph/projectSources.test.ts packages/cli/src/graph/projectSources.ts packages/cli/src/commands/updateGraph.test.ts
git commit -m "test: :white_check_mark: покрыть rule-driven обновление графа"
```

If Task 5 made no file changes, skip this commit and record the verification commands in the final handoff.

## Self-review

- Spec coverage: top-level source of truth is Task 1; rule-driven discovery is Task 2; CLI delegation is Task 3; form ownership from rules is Task 4; changed-file and full verification are Task 5.
- Scope: the plan does not add new `fromYAML`/`toYAML` rules and does not register new appliedObjects beyond `registerTopLevelGraphImports.ts`.
- Ambiguity resolved: requisites, tabular sections, commands, and other nested model properties are covered by reading each registered object's `Свойства.yaml`; forms are discovered separately from `ChildFormNames` because they are separate YAML/NKDK graph sources today. Additional separate file properties must be added through the same `rule.properties` helper when a graph import registration exists for them, without hard-coded CLI lists.
