# Fixture Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive command that copies XML fixtures from a 1C configuration dump into `full.xml`, `minimal.xml`, and `__fixtures__/sync/xml`.

**Architecture:** Implement the command as small script modules under `packages/core/scripts/fixture-wizard`. The command resolves the target metadata item, scans XML candidates, asks the user to choose full/minimal fixtures, copies files without changing contents, verifies the result, and prints focused test commands.

**Tech Stack:** TypeScript ESM, Node.js `fs/promises`, Node.js `readline/promises`, TypeScript compiler API for reading `xmlDir` from `rules.ts`, Vitest.

---

## File Structure

- Create `packages/core/scripts/fixture-wizard/types.ts`: shared types for candidates, choices, copy plans, and reports.
- Create `packages/core/scripts/fixture-wizard/targetResolver.ts`: resolve `metadataItem` to its directory and `xmlDir`; parse `rules.ts` with TypeScript AST.
- Create `packages/core/scripts/fixture-wizard/candidateScanner.ts`: scan top-level XML files and find `ВсеСвойства` / `ПоУмолчанию` candidates.
- Create `packages/core/scripts/fixture-wizard/interactivePicker.ts`: terminal choice helpers built around an injectable prompt function.
- Create `packages/core/scripts/fixture-wizard/fixtureCopier.ts`: build copy plan, copy files, verify copied content, and format test commands.
- Create `packages/core/scripts/fixture-wizard/index.ts`: CLI entrypoint that wires the modules together.
- Create tests next to implementation:
  - `packages/core/scripts/fixture-wizard/targetResolver.test.ts`
  - `packages/core/scripts/fixture-wizard/candidateScanner.test.ts`
  - `packages/core/scripts/fixture-wizard/interactivePicker.test.ts`
  - `packages/core/scripts/fixture-wizard/fixtureCopier.test.ts`

The script must not update XML contents, generate YAML, generate tests, or run tests automatically.

## Task 1: Shared Types And Target Resolver

**Files:**
- Create: `packages/core/scripts/fixture-wizard/types.ts`
- Create: `packages/core/scripts/fixture-wizard/targetResolver.ts`
- Test: `packages/core/scripts/fixture-wizard/targetResolver.test.ts`

- [ ] **Step 1: Write the failing target resolver tests**

```ts
import { mkdir, writeFile } from "fs/promises"
import { join } from "path"
import { tmpdir } from "os"
import { mkdtempSync } from "fs"
import { describe, expect, it } from "vitest"
import { readXmlDirFromRules, resolveMetadataTarget } from "./targetResolver"

const makeProject = () => mkdtempSync(join(tmpdir(), "fixture-wizard-target-"))

describe("fixture-wizard targetResolver", () => {
  it("reads xmlDir from rules.ts without importing the module", async () => {
    const root = makeProject()
    const itemDir = join(root, "packages/core/metadata/appliedObjects/metadataCatalog")
    await mkdir(itemDir, { recursive: true })
    await writeFile(
      join(itemDir, "rules.ts"),
      `export const MetadataCatalogRules = {
        itemType: "MetadataCatalog",
        xmlDir: "Catalogs",
        properties: {},
      } as const
      `,
      "utf-8"
    )

    await expect(readXmlDirFromRules(itemDir)).resolves.toBe("Catalogs")
  })

  it("returns undefined when rules.ts has no string xmlDir", async () => {
    const root = makeProject()
    const itemDir = join(root, "packages/core/metadata/appliedObjects/metadataCommand")
    await mkdir(itemDir, { recursive: true })
    await writeFile(join(itemDir, "rules.ts"), `export const Rules = { properties: {} }`, "utf-8")

    await expect(readXmlDirFromRules(itemDir)).resolves.toBeUndefined()
  })

  it("resolves an existing metadata item directory", async () => {
    const root = makeProject()
    const itemDir = join(root, "packages/core/metadata/appliedObjects/metadataEnumeration")
    await mkdir(itemDir, { recursive: true })
    await writeFile(join(itemDir, "rules.ts"), `export const Rules = { xmlDir: "Enums" }`, "utf-8")

    await expect(resolveMetadataTarget(root, "metadataEnumeration")).resolves.toEqual({
      metadataItem: "metadataEnumeration",
      itemDir,
      fixturesDir: join(itemDir, "__fixtures__"),
      syncXmlDir: join(itemDir, "__fixtures__/sync/xml"),
      xmlDir: "Enums",
    })
  })

  it("lists available metadata items when the requested item is missing", async () => {
    const root = makeProject()
    const appliedObjectsDir = join(root, "packages/core/metadata/appliedObjects")
    await mkdir(join(appliedObjectsDir, "metadataCatalog"), { recursive: true })
    await mkdir(join(appliedObjectsDir, "metadataDocument"), { recursive: true })

    await expect(resolveMetadataTarget(root, "metadataUnknown")).rejects.toThrow(
      "metadataItem metadataUnknown не найден. Доступные: metadataCatalog, metadataDocument"
    )
  })
})
```

- [ ] **Step 2: Run the target resolver tests to verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/scripts/fixture-wizard/targetResolver.test.ts
```

Expected: FAIL because `targetResolver.ts` does not exist.

- [ ] **Step 3: Add shared types**

Create `packages/core/scripts/fixture-wizard/types.ts`:

```ts
export type MetadataTarget = {
  metadataItem: string
  itemDir: string
  fixturesDir: string
  syncXmlDir: string
  xmlDir?: string
}

export type XmlCandidate = {
  name: string
  fileName: string
  path: string
}

export type CandidateScan = {
  xmlDir: string
  sourceDir: string
  candidates: XmlCandidate[]
  fullCandidates: XmlCandidate[]
  minimalCandidates: XmlCandidate[]
}

export type FixtureSelection = {
  full: XmlCandidate
  minimal?: XmlCandidate
}

export type CopyOperation = {
  source: string
  target: string
  kind: "full" | "minimal" | "sync-root" | "related"
}

export type CopyPlan = {
  metadataItem: string
  sourceXmlDir: string
  fixturesDir: string
  syncXmlDir: string
  fullName: string
  operations: CopyOperation[]
  overwrites: CopyOperation[]
}

export type CopyReport = {
  created: string[]
  updated: string[]
  verified: string[]
}

export type Prompt = (question: string) => Promise<string>
```

- [ ] **Step 4: Implement `targetResolver.ts`**

Create `packages/core/scripts/fixture-wizard/targetResolver.ts`:

```ts
import { readdir, readFile, stat } from "fs/promises"
import { join } from "path"
import ts from "typescript"
import type { MetadataTarget } from "./types"

const appliedObjectsPath = (projectRoot: string) => join(projectRoot, "packages/core/metadata/appliedObjects")

const isDirectory = async (path: string): Promise<boolean> => {
  try {
    return (await stat(path)).isDirectory()
  } catch {
    return false
  }
}

export const listMetadataItems = async (projectRoot: string): Promise<string[]> => {
  const dir = appliedObjectsPath(projectRoot)
  const entries = await readdir(dir, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right))
}

export const readXmlDirFromRules = async (itemDir: string): Promise<string | undefined> => {
  const rulesPath = join(itemDir, "rules.ts")
  let sourceText: string
  try {
    sourceText = await readFile(rulesPath, "utf-8")
  } catch {
    return undefined
  }

  const sourceFile = ts.createSourceFile(rulesPath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  let result: string | undefined

  const visit = (node: ts.Node) => {
    if (
      ts.isPropertyAssignment(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === "xmlDir" &&
      ts.isStringLiteralLike(node.initializer)
    ) {
      result = node.initializer.text
      return
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return result
}

export const resolveMetadataTarget = async (
  projectRoot: string,
  metadataItem: string
): Promise<MetadataTarget> => {
  const itemDir = join(appliedObjectsPath(projectRoot), metadataItem)
  if (!(await isDirectory(itemDir))) {
    const available = await listMetadataItems(projectRoot)
    throw new Error(`metadataItem ${metadataItem} не найден. Доступные: ${available.join(", ")}`)
  }

  return {
    metadataItem,
    itemDir,
    fixturesDir: join(itemDir, "__fixtures__"),
    syncXmlDir: join(itemDir, "__fixtures__/sync/xml"),
    xmlDir: await readXmlDirFromRules(itemDir),
  }
}
```

- [ ] **Step 5: Run the target resolver tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/scripts/fixture-wizard/targetResolver.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/scripts/fixture-wizard/types.ts \
  packages/core/scripts/fixture-wizard/targetResolver.ts \
  packages/core/scripts/fixture-wizard/targetResolver.test.ts
git commit -m "feat: :sparkles: добавить поиск цели мастера фикстур"
```

## Task 2: Candidate Scanner

**Files:**
- Modify: `packages/core/scripts/fixture-wizard/types.ts`
- Create: `packages/core/scripts/fixture-wizard/candidateScanner.ts`
- Test: `packages/core/scripts/fixture-wizard/candidateScanner.test.ts`

- [ ] **Step 1: Write the failing candidate scanner tests**

```ts
import { mkdir, writeFile } from "fs/promises"
import { mkdtempSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { listXmlDirs, scanCandidates } from "./candidateScanner"

const makeDump = () => mkdtempSync(join(tmpdir(), "fixture-wizard-scan-"))

describe("fixture-wizard candidateScanner", () => {
  it("lists only directories from dump root", async () => {
    const dumpRoot = makeDump()
    await mkdir(join(dumpRoot, "Catalogs"))
    await mkdir(join(dumpRoot, "Enums"))
    await writeFile(join(dumpRoot, "Configuration.xml"), "<root />", "utf-8")

    await expect(listXmlDirs(dumpRoot)).resolves.toEqual(["Catalogs", "Enums"])
  })

  it("scans top-level xml candidates and classifies full/minimal names", async () => {
    const dumpRoot = makeDump()
    const catalogDir = join(dumpRoot, "Catalogs")
    await mkdir(join(catalogDir, "СправочникПолный"), { recursive: true })
    await writeFile(join(catalogDir, "СправочникВсеСвойства.xml"), "<full />", "utf-8")
    await writeFile(join(catalogDir, "СправочникПоУмолчанию.xml"), "<minimal />", "utf-8")
    await writeFile(join(catalogDir, ".DS_Store"), "", "utf-8")
    await writeFile(join(catalogDir, "СправочникПолный", "Nested.xml"), "<nested />", "utf-8")

    const scan = await scanCandidates(dumpRoot, "Catalogs")

    expect(scan.xmlDir).toBe("Catalogs")
    expect(scan.sourceDir).toBe(catalogDir)
    expect(scan.candidates.map((candidate) => candidate.fileName)).toEqual([
      "СправочникВсеСвойства.xml",
      "СправочникПоУмолчанию.xml",
    ])
    expect(scan.fullCandidates.map((candidate) => candidate.name)).toEqual(["СправочникВсеСвойства"])
    expect(scan.minimalCandidates.map((candidate) => candidate.name)).toEqual(["СправочникПоУмолчанию"])
  })

  it("throws a clear error when xmlDir does not exist", async () => {
    const dumpRoot = makeDump()

    await expect(scanCandidates(dumpRoot, "Missing")).rejects.toThrow(
      "XML-каталог Missing не найден в выгрузке"
    )
  })
})
```

- [ ] **Step 2: Run the candidate scanner tests to verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/scripts/fixture-wizard/candidateScanner.test.ts
```

Expected: FAIL because `candidateScanner.ts` does not exist.

- [ ] **Step 3: Implement `candidateScanner.ts`**

Create `packages/core/scripts/fixture-wizard/candidateScanner.ts`:

```ts
import { readdir, stat } from "fs/promises"
import { basename, join } from "path"
import type { CandidateScan, XmlCandidate } from "./types"

const isDirectory = async (path: string): Promise<boolean> => {
  try {
    return (await stat(path)).isDirectory()
  } catch {
    return false
  }
}

export const listXmlDirs = async (dumpRoot: string): Promise<string[]> => {
  const entries = await readdir(dumpRoot, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right))
}

export const scanCandidates = async (dumpRoot: string, xmlDir: string): Promise<CandidateScan> => {
  const sourceDir = join(dumpRoot, xmlDir)
  if (!(await isDirectory(sourceDir))) {
    throw new Error(`XML-каталог ${xmlDir} не найден в выгрузке`)
  }

  const entries = await readdir(sourceDir, { withFileTypes: true })
  const candidates: XmlCandidate[] = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".xml"))
    .map((entry) => ({
      fileName: entry.name,
      name: basename(entry.name, ".xml"),
      path: join(sourceDir, entry.name),
    }))
    .sort((left, right) => left.fileName.localeCompare(right.fileName))

  return {
    xmlDir,
    sourceDir,
    candidates,
    fullCandidates: candidates.filter((candidate) => candidate.name.includes("ВсеСвойства")),
    minimalCandidates: candidates.filter((candidate) => candidate.name.includes("ПоУмолчанию")),
  }
}
```

- [ ] **Step 4: Run the candidate scanner tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/scripts/fixture-wizard/candidateScanner.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/scripts/fixture-wizard/candidateScanner.ts \
  packages/core/scripts/fixture-wizard/candidateScanner.test.ts
git commit -m "feat: :sparkles: добавить сканирование XML-кандидатов"
```

## Task 3: Interactive Picker

**Files:**
- Create: `packages/core/scripts/fixture-wizard/interactivePicker.ts`
- Test: `packages/core/scripts/fixture-wizard/interactivePicker.test.ts`

- [ ] **Step 1: Write the failing interactive picker tests**

```ts
import { describe, expect, it } from "vitest"
import type { CandidateScan, Prompt, XmlCandidate } from "./types"
import { chooseFromList, chooseFixtureSelection, chooseXmlDir } from "./interactivePicker"

const candidate = (name: string): XmlCandidate => ({
  name,
  fileName: `${name}.xml`,
  path: `/dump/Catalogs/${name}.xml`,
})

const promptFrom = (answers: string[]): { prompt: Prompt; questions: string[] } => {
  const questions: string[] = []
  return {
    questions,
    prompt: async (question) => {
      questions.push(question)
      return answers.shift() ?? ""
    },
  }
}

describe("fixture-wizard interactivePicker", () => {
  it("accepts default choice on empty answer", async () => {
    const { prompt } = promptFrom([""])
    const result = await chooseFromList({
      prompt,
      title: "Выбери XML",
      items: ["Catalogs", "Enums"],
      defaultIndex: 1,
    })

    expect(result).toBe("Enums")
  })

  it("uses one-based numeric answers", async () => {
    const { prompt } = promptFrom(["1"])
    const result = await chooseFromList({
      prompt,
      title: "Выбери XML",
      items: ["Catalogs", "Enums"],
      defaultIndex: 1,
    })

    expect(result).toBe("Catalogs")
  })

  it("asks again after invalid input", async () => {
    const { prompt, questions } = promptFrom(["abc", "3", "2"])
    const result = await chooseFromList({
      prompt,
      title: "Выбери XML",
      items: ["Catalogs", "Enums"],
      defaultIndex: 0,
    })

    expect(result).toBe("Enums")
    expect(questions).toHaveLength(3)
  })

  it("chooses full and minimal from defaults", async () => {
    const scan: CandidateScan = {
      xmlDir: "Catalogs",
      sourceDir: "/dump/Catalogs",
      candidates: [candidate("СправочникВсеСвойства"), candidate("СправочникПоУмолчанию")],
      fullCandidates: [candidate("СправочникВсеСвойства")],
      minimalCandidates: [candidate("СправочникПоУмолчанию")],
    }
    const { prompt } = promptFrom(["", ""])

    await expect(chooseFixtureSelection(prompt, scan)).resolves.toEqual({
      full: scan.fullCandidates[0],
      minimal: scan.minimalCandidates[0],
    })
  })

  it("can skip minimal fixture", async () => {
    const scan: CandidateScan = {
      xmlDir: "Enums",
      sourceDir: "/dump/Enums",
      candidates: [candidate("ПеречислениеВсеСвойства")],
      fullCandidates: [candidate("ПеречислениеВсеСвойства")],
      minimalCandidates: [],
    }
    const { prompt } = promptFrom(["", "2"])

    await expect(chooseFixtureSelection(prompt, scan)).resolves.toEqual({
      full: scan.fullCandidates[0],
    })
  })

  it("chooses xmlDir from available directories", async () => {
    const { prompt } = promptFrom(["2"])

    await expect(chooseXmlDir(prompt, ["Catalogs", "Enums"], undefined)).resolves.toBe("Enums")
  })
})
```

- [ ] **Step 2: Run the interactive picker tests to verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/scripts/fixture-wizard/interactivePicker.test.ts
```

Expected: FAIL because `interactivePicker.ts` does not exist.

- [ ] **Step 3: Implement `interactivePicker.ts`**

Create `packages/core/scripts/fixture-wizard/interactivePicker.ts`:

```ts
import type { CandidateScan, FixtureSelection, Prompt } from "./types"

type ChooseParams<T> = {
  prompt: Prompt
  title: string
  items: T[]
  label?: (item: T) => string
  defaultIndex?: number
}

export const chooseFromList = async <T>(params: ChooseParams<T>): Promise<T> => {
  const { prompt, title, items, label = String, defaultIndex = 0 } = params
  if (items.length === 0) {
    throw new Error(`${title}: нет вариантов для выбора`)
  }

  const lines = items.map((item, index) => {
    const marker = index === defaultIndex ? " [Enter]" : ""
    return `${index + 1}. ${label(item)}${marker}`
  })
  const question = `${title}\n${lines.join("\n")}\n> `

  while (true) {
    const answer = (await prompt(question)).trim()
    if (answer === "" && items[defaultIndex]) {
      return items[defaultIndex]
    }

    const index = Number(answer) - 1
    if (Number.isInteger(index) && items[index]) {
      return items[index]
    }
  }
}

export const chooseXmlDir = async (
  prompt: Prompt,
  availableXmlDirs: string[],
  defaultXmlDir: string | undefined
): Promise<string> => {
  const defaultIndex = defaultXmlDir ? Math.max(availableXmlDirs.indexOf(defaultXmlDir), 0) : 0
  return chooseFromList({
    prompt,
    title: "Выбери XML-каталог выгрузки",
    items: availableXmlDirs,
    defaultIndex,
  })
}

const defaultCandidateIndex = (preferredCount: number): number => (preferredCount > 0 ? 0 : 0)

export const chooseFixtureSelection = async (
  prompt: Prompt,
  scan: CandidateScan
): Promise<FixtureSelection> => {
  const fullItems = scan.fullCandidates.length > 0 ? scan.fullCandidates : scan.candidates
  const full = await chooseFromList({
    prompt,
    title: "Выбери XML для full.xml",
    items: fullItems,
    label: (candidate) => candidate.fileName,
    defaultIndex: defaultCandidateIndex(scan.fullCandidates.length),
  })

  const minimalItems = [
    ...(scan.minimalCandidates.length > 0 ? scan.minimalCandidates : scan.candidates),
    undefined,
  ]
  const minimal = await chooseFromList({
    prompt,
    title: "Выбери XML для minimal.xml или пропусти",
    items: minimalItems,
    label: (candidate) => candidate?.fileName ?? "Пропустить minimal.xml",
    defaultIndex: scan.minimalCandidates.length > 0 ? 0 : minimalItems.length - 1,
  })

  return minimal ? { full, minimal } : { full }
}
```

- [ ] **Step 4: Run the interactive picker tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/scripts/fixture-wizard/interactivePicker.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/scripts/fixture-wizard/interactivePicker.ts \
  packages/core/scripts/fixture-wizard/interactivePicker.test.ts
git commit -m "feat: :sparkles: добавить выбор фикстур в мастере"
```

## Task 4: Fixture Copier And Verification

**Files:**
- Create: `packages/core/scripts/fixture-wizard/fixtureCopier.ts`
- Test: `packages/core/scripts/fixture-wizard/fixtureCopier.test.ts`

- [ ] **Step 1: Write the failing fixture copier tests**

```ts
import { mkdir, readFile, writeFile } from "fs/promises"
import { existsSync, mkdtempSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { describe, expect, it } from "vitest"
import type { FixtureSelection, MetadataTarget, XmlCandidate } from "./types"
import { buildCopyPlan, copyFixtures, formatTestCommands, verifyCopyPlan } from "./fixtureCopier"

const makeRoot = () => mkdtempSync(join(tmpdir(), "fixture-wizard-copy-"))

const makeTarget = (root: string): MetadataTarget => ({
  metadataItem: "metadataCatalog",
  itemDir: join(root, "packages/core/metadata/appliedObjects/metadataCatalog"),
  fixturesDir: join(root, "packages/core/metadata/appliedObjects/metadataCatalog/__fixtures__"),
  syncXmlDir: join(root, "packages/core/metadata/appliedObjects/metadataCatalog/__fixtures__/sync/xml"),
  xmlDir: "Catalogs",
})

const makeCandidate = (sourceDir: string, name: string): XmlCandidate => ({
  name,
  fileName: `${name}.xml`,
  path: join(sourceDir, `${name}.xml`),
})

describe("fixture-wizard fixtureCopier", () => {
  it("builds operations for full, minimal, sync root, and related files", async () => {
    const root = makeRoot()
    const dumpRoot = join(root, "dump")
    const sourceDir = join(dumpRoot, "Catalogs")
    const objectDir = join(sourceDir, "СправочникВсеСвойства")
    await mkdir(join(objectDir, "Ext"), { recursive: true })
    await mkdir(join(objectDir, "Forms"), { recursive: true })
    await writeFile(join(sourceDir, "СправочникВсеСвойства.xml"), "<full />", "utf-8")
    await writeFile(join(sourceDir, "СправочникПоУмолчанию.xml"), "<minimal />", "utf-8")
    await writeFile(join(objectDir, "Ext", "ManagerModule.bsl"), "procedure", "utf-8")
    await writeFile(join(objectDir, "Forms", "Форма.xml"), "<form />", "utf-8")

    const target = makeTarget(root)
    const selection: FixtureSelection = {
      full: makeCandidate(sourceDir, "СправочникВсеСвойства"),
      minimal: makeCandidate(sourceDir, "СправочникПоУмолчанию"),
    }

    const plan = await buildCopyPlan({
      target,
      sourceXmlDir: sourceDir,
      selection,
    })

    expect(plan.operations.map((operation) => operation.target.replace(root, "<root>"))).toEqual([
      "<root>/packages/core/metadata/appliedObjects/metadataCatalog/__fixtures__/full.xml",
      "<root>/packages/core/metadata/appliedObjects/metadataCatalog/__fixtures__/minimal.xml",
      "<root>/packages/core/metadata/appliedObjects/metadataCatalog/__fixtures__/sync/xml/СправочникВсеСвойства.xml",
      "<root>/packages/core/metadata/appliedObjects/metadataCatalog/__fixtures__/sync/xml/Ext/ManagerModule.bsl",
      "<root>/packages/core/metadata/appliedObjects/metadataCatalog/__fixtures__/sync/xml/Forms/Форма.xml",
    ])
  })

  it("copies files without changing content and verifies them", async () => {
    const root = makeRoot()
    const sourceDir = join(root, "dump/Enums")
    await mkdir(sourceDir, { recursive: true })
    await writeFile(join(sourceDir, "ПеречислениеВсеСвойства.xml"), "<full />", "utf-8")

    const target: MetadataTarget = {
      metadataItem: "metadataEnumeration",
      itemDir: join(root, "packages/core/metadata/appliedObjects/metadataEnumeration"),
      fixturesDir: join(root, "packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__"),
      syncXmlDir: join(root, "packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/sync/xml"),
      xmlDir: "Enums",
    }
    const selection: FixtureSelection = {
      full: makeCandidate(sourceDir, "ПеречислениеВсеСвойства"),
    }
    const plan = await buildCopyPlan({ target, sourceXmlDir: sourceDir, selection })

    const report = await copyFixtures(plan)

    await expect(readFile(join(target.fixturesDir, "full.xml"), "utf-8")).resolves.toBe("<full />")
    await expect(readFile(join(target.syncXmlDir, "ПеречислениеВсеСвойства.xml"), "utf-8")).resolves.toBe(
      "<full />"
    )
    await expect(verifyCopyPlan(plan)).resolves.toEqual([
      join(target.fixturesDir, "full.xml"),
      join(target.syncXmlDir, "ПеречислениеВсеСвойства.xml"),
    ])
    expect(report.created).toEqual([
      join(target.fixturesDir, "full.xml"),
      join(target.syncXmlDir, "ПеречислениеВсеСвойства.xml"),
    ])
    expect(report.updated).toEqual([])
  })

  it("records overwrites before copying", async () => {
    const root = makeRoot()
    const sourceDir = join(root, "dump/Enums")
    const target = makeTarget(root)
    await mkdir(sourceDir, { recursive: true })
    await mkdir(target.fixturesDir, { recursive: true })
    await writeFile(join(sourceDir, "ПеречислениеВсеСвойства.xml"), "<full />", "utf-8")
    await writeFile(join(target.fixturesDir, "full.xml"), "<old />", "utf-8")

    const plan = await buildCopyPlan({
      target,
      sourceXmlDir: sourceDir,
      selection: { full: makeCandidate(sourceDir, "ПеречислениеВсеСвойства") },
    })

    expect(plan.overwrites.map((operation) => operation.target)).toContain(join(target.fixturesDir, "full.xml"))
  })

  it("formats focused test commands", () => {
    expect(formatTestCommands("metadataCatalog")).toEqual([
      "pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/metadataCatalog/fromXML.test.ts",
      "pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/metadataCatalog/toXML.test.ts",
      "pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/metadataCatalog/convertFromXML.test.ts",
      "pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/metadataCatalog/syncToXML.test.ts",
    ])
  })

  it("does not create empty related directories", async () => {
    const root = makeRoot()
    const sourceDir = join(root, "dump/Enums")
    await mkdir(join(sourceDir, "ПеречислениеВсеСвойства"), { recursive: true })
    await writeFile(join(sourceDir, "ПеречислениеВсеСвойства.xml"), "<full />", "utf-8")

    const target = makeTarget(root)
    const plan = await buildCopyPlan({
      target,
      sourceXmlDir: sourceDir,
      selection: { full: makeCandidate(sourceDir, "ПеречислениеВсеСвойства") },
    })
    await copyFixtures(plan)

    expect(existsSync(join(target.syncXmlDir, "Ext"))).toBe(false)
  })
})
```

- [ ] **Step 2: Run the fixture copier tests to verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/scripts/fixture-wizard/fixtureCopier.test.ts
```

Expected: FAIL because `fixtureCopier.ts` does not exist.

- [ ] **Step 3: Implement `fixtureCopier.ts`**

Create `packages/core/scripts/fixture-wizard/fixtureCopier.ts`:

```ts
import { copyFile, mkdir, readdir, readFile, stat } from "fs/promises"
import { existsSync } from "fs"
import { join, relative } from "path"
import type { CopyOperation, CopyPlan, CopyReport, FixtureSelection, MetadataTarget } from "./types"

const relatedDirs = ["Ext", "Forms", "Templates", "Commands"] as const

type BuildCopyPlanParams = {
  target: MetadataTarget
  sourceXmlDir: string
  selection: FixtureSelection
}

const isDirectory = async (path: string): Promise<boolean> => {
  try {
    return (await stat(path)).isDirectory()
  } catch {
    return false
  }
}

const walkFiles = async (dir: string): Promise<string[]> => {
  const entries = await readdir(dir, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) {
        return walkFiles(path)
      }
      return [path]
    })
  )
  return nested.flat().sort((left, right) => left.localeCompare(right))
}

export const buildCopyPlan = async (params: BuildCopyPlanParams): Promise<CopyPlan> => {
  const { target, sourceXmlDir, selection } = params
  const operations: CopyOperation[] = [
    {
      source: selection.full.path,
      target: join(target.fixturesDir, "full.xml"),
      kind: "full",
    },
    {
      source: selection.full.path,
      target: join(target.syncXmlDir, selection.full.fileName),
      kind: "sync-root",
    },
  ]

  if (selection.minimal) {
    operations.splice(1, 0, {
      source: selection.minimal.path,
      target: join(target.fixturesDir, "minimal.xml"),
      kind: "minimal",
    })
  }

  const objectDir = join(sourceXmlDir, selection.full.name)
  for (const relatedDir of relatedDirs) {
    const sourceRelatedDir = join(objectDir, relatedDir)
    if (!(await isDirectory(sourceRelatedDir))) continue

    const files = await walkFiles(sourceRelatedDir)
    operations.push(
      ...files.map((source): CopyOperation => ({
        source,
        target: join(target.syncXmlDir, relatedDir, relative(sourceRelatedDir, source)),
        kind: "related",
      }))
    )
  }

  return {
    metadataItem: target.metadataItem,
    sourceXmlDir,
    fixturesDir: target.fixturesDir,
    syncXmlDir: target.syncXmlDir,
    fullName: selection.full.name,
    operations,
    overwrites: operations.filter((operation) => existsSync(operation.target)),
  }
}

export const copyFixtures = async (plan: CopyPlan): Promise<CopyReport> => {
  const created: string[] = []
  const updated: string[] = []

  for (const operation of plan.operations) {
    const existed = existsSync(operation.target)
    await mkdir(join(operation.target, ".."), { recursive: true })
    await copyFile(operation.source, operation.target)
    if (existed) {
      updated.push(operation.target)
    } else {
      created.push(operation.target)
    }
  }

  return {
    created,
    updated,
    verified: await verifyCopyPlan(plan),
  }
}

export const verifyCopyPlan = async (plan: CopyPlan): Promise<string[]> => {
  const verified: string[] = []
  for (const operation of plan.operations) {
    const source = await readFile(operation.source)
    const target = await readFile(operation.target)
    if (!source.equals(target)) {
      throw new Error(`Скопированный файл отличается от источника: ${operation.target}`)
    }
    verified.push(operation.target)
  }
  return verified
}

export const formatTestCommands = (metadataItem: string): string[] => [
  `pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/${metadataItem}/fromXML.test.ts`,
  `pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/${metadataItem}/toXML.test.ts`,
  `pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/${metadataItem}/convertFromXML.test.ts`,
  `pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/${metadataItem}/syncToXML.test.ts`,
]

export const formatCopyPlan = (plan: CopyPlan): string => {
  const lines = [
    `Будут скопированы файлы для ${plan.metadataItem}:`,
    ...plan.operations.map((operation) => `- ${operation.source} -> ${operation.target}`),
  ]

  if (plan.overwrites.length > 0) {
    lines.push("", "Будут перезаписаны:")
    lines.push(...plan.overwrites.map((operation) => `- ${operation.target}`))
  }

  return lines.join("\n")
}
```

- [ ] **Step 4: Fix parent directory creation if needed**

If the test fails because `join(operation.target, "..")` is not normalized as intended, update `fixtureCopier.ts` to import `dirname` and use it:

```ts
import { dirname, join, relative } from "path"
```

Then replace:

```ts
await mkdir(join(operation.target, ".."), { recursive: true })
```

with:

```ts
await mkdir(dirname(operation.target), { recursive: true })
```

- [ ] **Step 5: Run the fixture copier tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/scripts/fixture-wizard/fixtureCopier.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/scripts/fixture-wizard/fixtureCopier.ts \
  packages/core/scripts/fixture-wizard/fixtureCopier.test.ts
git commit -m "feat: :sparkles: добавить копирование sync-фикстур"
```

## Task 5: CLI Entrypoint

**Files:**
- Create: `packages/core/scripts/fixture-wizard/index.ts`

- [ ] **Step 1: Add the CLI entrypoint**

Create `packages/core/scripts/fixture-wizard/index.ts`:

```ts
import { createInterface } from "readline/promises"
import { stdin as input, stdout as output } from "process"
import { resolve } from "path"
import { listXmlDirs, scanCandidates } from "./candidateScanner"
import { buildCopyPlan, copyFixtures, formatCopyPlan, formatTestCommands } from "./fixtureCopier"
import { chooseFixtureSelection, chooseXmlDir } from "./interactivePicker"
import { resolveMetadataTarget } from "./targetResolver"
import type { Prompt } from "./types"

const usage = `Использование:
pnpm --filter @nakidka/core exec tsx packages/core/scripts/fixture-wizard/index.ts <metadataItem> <dumpRoot>

Пример:
pnpm --filter @nakidka/core exec tsx packages/core/scripts/fixture-wizard/index.ts metadataCatalog /Users/nikita/git/roundTripElements`

const confirm = async (prompt: Prompt, question: string): Promise<boolean> => {
  const answer = (await prompt(`${question} [y/N]\n> `)).trim().toLowerCase()
  return answer === "y" || answer === "yes" || answer === "д" || answer === "да"
}

export const runFixtureWizard = async (params: {
  projectRoot: string
  metadataItem: string
  dumpRoot: string
  prompt: Prompt
}): Promise<void> => {
  const { projectRoot, metadataItem, dumpRoot, prompt } = params
  const target = await resolveMetadataTarget(projectRoot, metadataItem)
  const availableXmlDirs = await listXmlDirs(dumpRoot)
  const xmlDir = await chooseXmlDir(prompt, availableXmlDirs, target.xmlDir)
  const scan = await scanCandidates(dumpRoot, xmlDir)

  if (scan.candidates.length === 0) {
    throw new Error(`В ${scan.sourceDir} нет XML-файлов верхнего уровня`)
  }

  const selection = await chooseFixtureSelection(prompt, scan)
  const plan = await buildCopyPlan({
    target: { ...target, xmlDir },
    sourceXmlDir: scan.sourceDir,
    selection,
  })

  output.write(`${formatCopyPlan(plan)}\n`)
  if (!(await confirm(prompt, "Выполнить копирование?"))) {
    output.write("Копирование отменено. Файлы не изменены.\n")
    return
  }

  const report = await copyFixtures(plan)
  output.write("Готово.\n")
  output.write(`Созданы:\n${report.created.map((path) => `- ${path}`).join("\n") || "- нет"}\n`)
  output.write(`Обновлены:\n${report.updated.map((path) => `- ${path}`).join("\n") || "- нет"}\n`)
  output.write(`Проверены:\n${report.verified.map((path) => `- ${path}`).join("\n") || "- нет"}\n`)
  output.write("Точечные проверки:\n")
  output.write(`${formatTestCommands(metadataItem).join("\n")}\n`)
}

const main = async () => {
  const [, , metadataItem, dumpRoot] = process.argv
  if (!metadataItem || !dumpRoot) {
    output.write(`${usage}\n`)
    process.exitCode = 1
    return
  }

  const rl = createInterface({ input, output })
  try {
    await runFixtureWizard({
      projectRoot: process.cwd(),
      metadataItem,
      dumpRoot: resolve(dumpRoot),
      prompt: (question) => rl.question(question),
    })
  } finally {
    rl.close()
  }
}

await main()
```

- [ ] **Step 2: Run TypeScript check**

Run:

```bash
pnpm --filter @nakidka/core exec tsc --noEmit
```

Expected: PASS. If it fails with `process` types in `index.ts`, import `process` explicitly:

```ts
import process, { stdin as input, stdout as output } from "process"
```

- [ ] **Step 3: Smoke-test usage output**

Run:

```bash
pnpm --filter @nakidka/core exec tsx packages/core/scripts/fixture-wizard/index.ts
```

Expected: command exits non-zero and prints `Использование:`.

- [ ] **Step 4: Commit**

```bash
git add packages/core/scripts/fixture-wizard/index.ts
git commit -m "feat: :sparkles: добавить CLI мастера фикстур"
```

## Task 6: End-To-End Script Check With A Temporary Dump

**Files:**
- No new files expected unless a previous task requires a small fix.

- [ ] **Step 1: Create a temporary metadata fixture target and dump in `/tmp`**

Run:

```bash
tmp_root=$(mktemp -d)
mkdir -p "$tmp_root/dump/Enums/ПеречислениеВсеСвойства/Ext"
cat > "$tmp_root/dump/Enums/ПеречислениеВсеСвойства.xml" <<'XML'
<MetaDataObject/>
XML
cat > "$tmp_root/dump/Enums/ПеречислениеПоУмолчанию.xml" <<'XML'
<MetaDataObject minimal="true"/>
XML
cat > "$tmp_root/dump/Enums/ПеречислениеВсеСвойства/Ext/ManagerModule.bsl" <<'BSL'
Процедура Тест()
КонецПроцедуры
BSL
printf "%s\n" "$tmp_root"
```

Expected: prints the temporary root path.

- [ ] **Step 2: Run the wizard against real `metadataEnumeration` and answer defaults**

Run the command below, replacing `<tmp_root>` with the printed path:

```bash
printf "\n\n\ny\n" | pnpm --filter @nakidka/core exec tsx packages/core/scripts/fixture-wizard/index.ts metadataEnumeration <tmp_root>/dump
```

Expected:

- the command prints a copy plan;
- the command prints `Готово.`;
- `packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/full.xml` is updated from the temporary dump;
- `packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/minimal.xml` is updated from the temporary dump;
- `packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/sync/xml/ПеречислениеВсеСвойства.xml` is updated from the temporary dump;
- `packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/sync/xml/Ext/ManagerModule.bsl` is created.

- [ ] **Step 3: Revert the smoke-test fixture changes**

Run:

```bash
git restore packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/full.xml \
  packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/minimal.xml \
  packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/sync/xml/ПеречислениеВсеСвойства.xml
rm -f packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/sync/xml/Ext/ManagerModule.bsl
rmdir packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/sync/xml/Ext 2>/dev/null || true
```

Expected: smoke-test changes are removed. Check with:

```bash
git status --short packages/core/metadata/appliedObjects/metadataEnumeration
```

Expected output is empty.

- [ ] **Step 4: Run focused script tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/scripts/fixture-wizard
```

Expected: PASS.

- [ ] **Step 5: Run core type-check**

Run:

```bash
pnpm --filter @nakidka/core exec tsc --noEmit
```

Expected: PASS.

- [ ] **Step 6: Commit any fixes from the smoke test**

If Step 4 or Step 5 required code changes, commit them:

```bash
git add packages/core/scripts/fixture-wizard
git commit -m "fix: :bug: исправить запуск мастера фикстур"
```

If there were no changes, skip this commit.

## Task 7: Final Verification

**Files:**
- No code changes.

- [ ] **Step 1: Generate Langium files**

Run:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected: generator finishes successfully.

- [ ] **Step 2: Run all tests**

Run:

```bash
pnpm test
```

Expected: PASS across all packages.

- [ ] **Step 3: Check git status**

Run:

```bash
git status --short
```

Expected: only intentional committed changes should be present. If generated Langium files changed, inspect them before deciding whether to include or restore them.

- [ ] **Step 4: Summarize the result**

Prepare a short summary for the user:

```text
Готово: добавлен мастер фикстур в packages/core/scripts/fixture-wizard.
Проверки: pnpm --filter @nakidka/core exec vitest run packages/core/scripts/fixture-wizard, pnpm --filter @nakidka/core exec tsc --noEmit, pnpm test.
```

## Self-Review

Spec coverage:

- Interactive full/minimal selection: covered by Task 3.
- Default `ВсеСвойства` / `ПоУмолчанию`: covered by Task 2 and Task 3.
- Exception selection from list: covered by Task 3 numeric choice tests.
- Copy to `full.xml`, `minimal.xml`, and `sync/xml/<Имя>.xml`: covered by Task 4.
- Related `Ext`, `Forms`, `Templates`, `Commands`: covered by Task 4.
- No XML mutation: covered by byte comparison in Task 4 verification.
- Confirm before overwrites/copying: covered by Task 5.
- Print changed files and test commands: covered by Task 4 and Task 5.
- No YAML generation and no automatic tests: preserved by file structure and CLI flow.

Placeholder scan: no forbidden placeholder markers or undefined follow-up sections are intentionally left in this plan.

Type consistency:

- `MetadataTarget`, `CandidateScan`, `FixtureSelection`, `CopyPlan`, and `Prompt` are defined in Task 1 and reused by later tasks.
- `chooseFixtureSelection`, `buildCopyPlan`, `copyFixtures`, `verifyCopyPlan`, and `formatTestCommands` are introduced before use by the CLI.
