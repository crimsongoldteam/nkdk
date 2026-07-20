# Fast XML Import Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace XML import discovery's full route scan with a fast route-structure matcher that preserves existing `ImportAssignment` behavior.

**Architecture:** Keep `rules.ts` and `describeRegisteredXmlImportRoutes()` as the source of truth. Add a focused XML route structure module that compiles route patterns once, classifies each XML path by walking path segments, and is used by `discoverXmlImport`.

**Tech Stack:** TypeScript, Vitest, Node `fs.promises.readdir`, existing `XmlImportRoute` / `ImportAssignment` contracts.

## Global Constraints

- Do not change `rules.ts` format.
- Do not read XML file contents during discovery.
- Preserve `discoverXmlImport` external behavior: assignment order, XML inputs, external files, owners and logical addresses.
- Keep common metadata/orchestration layers free of concrete item-type path conditions.
- Use TDD: write failing tests before production changes.
- Do not modify XML fixtures.

---

## File Structure

- Create `packages/core/metadata/importFromXml/routeStructure.ts`
  - Owns pattern parsing, route-structure compilation, recursion expansion per depth, and path matching.
  - Does not know about assignment grouping or worker distribution.
- Modify `packages/core/metadata/importFromXml/discovery.ts`
  - Uses route structure for path classification.
  - Uses parallel file listing.
  - Keeps assignment grouping, conflict checks and owner derivation here.
- Modify `packages/core/metadata/importFromXml/discovery.test.ts`
  - Adds behavior tests for the switched discovery path.
- Create `packages/core/metadata/importFromXml/routeStructure.test.ts`
  - Unit tests route matching independent from filesystem and assignment grouping.

---

### Task 1: Add route structure matcher

**Files:**
- Create: `packages/core/metadata/importFromXml/routeStructure.ts`
- Create: `packages/core/metadata/importFromXml/routeStructure.test.ts`

**Interfaces:**
- Consumes: `XmlImportRoute`, `expandImportPattern` from `packages/core/metadata/importFromXml/routes.ts`.
- Produces:
  ```ts
  export type XmlImportRouteMatch =
    | { kind: "assignment"; route: Extract<XmlImportRoute, { kind: "assignment" }>; targetProjectPath: string; values: Record<string, string> }
    | { kind: "externalFile"; route: Extract<XmlImportRoute, { kind: "externalFile" }>; targetProjectPath: string; assignmentTargetProjectPath: string; values: Record<string, string> }
    | { kind: "ignore"; route: Extract<XmlImportRoute, { kind: "ignore" }>; values: Record<string, string> }

  export interface XmlImportRouteStructure {
    readonly routes: readonly CompiledXmlImportRoute[]
  }

  export function compileXmlImportRouteStructure(routes: readonly XmlImportRoute[]): XmlImportRouteStructure
  export function matchXmlImportRouteStructure(structure: XmlImportRouteStructure, path: string): XmlImportRouteMatch[]
  ```

- [ ] **Step 1: Write failing tests for static, parameter and rest matching**

Add to `packages/core/metadata/importFromXml/routeStructure.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import type { XmlImportRoute } from "./types"
import { compileXmlImportRouteStructure, matchXmlImportRouteStructure } from "./routeStructure"

const source = { kind: "itemRule", itemType: "test" } as const

describe("XML import route structure", () => {
  it("matches only routes reachable through the XML path structure", () => {
    const routes = [
      {
        kind: "assignment",
        xmlPattern: "Catalogs/{ownerName}.xml",
        targetPattern: "Справочник/{ownerName}/Свойства.yaml",
        role: "properties",
        itemType: "MetadataCatalog",
        source,
      },
      {
        kind: "assignment",
        xmlPattern: "Documents/{ownerName}.xml",
        targetPattern: "Документ/{ownerName}/Свойства.yaml",
        role: "properties",
        itemType: "MetadataDocument",
        source,
      },
      {
        kind: "externalFile",
        xmlPattern: "Catalogs/{ownerName}/Forms/{itemName}/Ext/{relativePath...}",
        targetPattern: "Справочник/{ownerName}/Формы/{itemName}/{relativePath...}",
        assignmentTargetPattern: "Справочник/{ownerName}/Формы/{itemName}/Форма.yaml",
        source,
      },
    ] satisfies readonly XmlImportRoute[]

    const structure = compileXmlImportRouteStructure(routes)

    expect(matchXmlImportRouteStructure(structure, "Catalogs/Контрагенты.xml")).toEqual([
      expect.objectContaining({
        kind: "assignment",
        targetProjectPath: "Справочник/Контрагенты/Свойства.yaml",
        values: { ownerName: "Контрагенты" },
      }),
    ])
    expect(matchXmlImportRouteStructure(structure, "Catalogs/Контрагенты/Forms/Форма/Ext/Form/Module.bsl")).toEqual([
      expect.objectContaining({
        kind: "externalFile",
        targetProjectPath: "Справочник/Контрагенты/Формы/Форма/Form/Module.bsl",
        assignmentTargetProjectPath: "Справочник/Контрагенты/Формы/Форма/Форма.yaml",
        values: { ownerName: "Контрагенты", itemName: "Форма", relativePath: "Form/Module.bsl" },
      }),
    ])
    expect(matchXmlImportRouteStructure(structure, "Reports/Продажи.xml")).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/routeStructure.test.ts --reporter dot
```

Expected: FAIL because `./routeStructure` does not exist.

- [ ] **Step 3: Implement minimal route structure matcher**

Create `packages/core/metadata/importFromXml/routeStructure.ts`:

```ts
import { expandImportPattern } from "./routes"
import type { XmlImportRoute } from "./types"

export type XmlImportRouteMatch =
  | {
      kind: "assignment"
      route: Extract<XmlImportRoute, { kind: "assignment" }>
      targetProjectPath: string
      values: Record<string, string>
    }
  | {
      kind: "externalFile"
      route: Extract<XmlImportRoute, { kind: "externalFile" }>
      targetProjectPath: string
      assignmentTargetProjectPath: string
      values: Record<string, string>
    }
  | { kind: "ignore"; route: Extract<XmlImportRoute, { kind: "ignore" }>; values: Record<string, string> }

export interface CompiledXmlImportRoute {
  route: XmlImportRoute
  pattern: CompiledXmlPattern
}

export interface XmlImportRouteStructure {
  readonly routes: readonly CompiledXmlImportRoute[]
}

interface CompiledXmlPattern {
  segments: readonly CompiledXmlPatternSegment[]
}

type CompiledXmlPatternSegment =
  | { kind: "static"; value: string }
  | { kind: "template"; parts: readonly CompiledTemplatePart[] }
  | { kind: "rest"; key: string }

type CompiledTemplatePart = { kind: "literal"; value: string } | { kind: "parameter"; key: string }

export function compileXmlImportRouteStructure(routes: readonly XmlImportRoute[]): XmlImportRouteStructure {
  return { routes: routes.map((route) => ({ route, pattern: compilePattern(route.xmlPattern) })) }
}

export function matchXmlImportRouteStructure(structure: XmlImportRouteStructure, path: string): XmlImportRouteMatch[] {
  const pathSegments = path.split("/")
  const matches: XmlImportRouteMatch[] = []
  for (const compiled of structure.routes) {
    const values = matchCompiledPattern(compiled.pattern, pathSegments)
    if (values === undefined) continue
    matches.push(createMatch(compiled.route, values))
  }
  return matches
}

function compilePattern(pattern: string): CompiledXmlPattern {
  return { segments: pattern.split("/").map(compileSegment) }
}

function compileSegment(segment: string): CompiledXmlPatternSegment {
  const rest = segment.match(/^\{([^}]+)\.\.\.\}$/)
  if (rest !== null) return { kind: "rest", key: rest[1]! }
  const parameterMatches = [...segment.matchAll(/\{([^}]+)\}/g)]
  if (parameterMatches.length === 0) return { kind: "static", value: segment }
  const parts: CompiledTemplatePart[] = []
  let offset = 0
  for (const match of parameterMatches) {
    if (match.index === undefined) continue
    if (match.index > offset) parts.push({ kind: "literal", value: segment.slice(offset, match.index) })
    parts.push({ kind: "parameter", key: match[1]! })
    offset = match.index + match[0].length
  }
  if (offset < segment.length) parts.push({ kind: "literal", value: segment.slice(offset) })
  return { kind: "template", parts }
}

function matchCompiledPattern(
  pattern: CompiledXmlPattern,
  pathSegments: readonly string[]
): Record<string, string> | undefined {
  const values: Record<string, string> = {}
  for (let index = 0; index < pattern.segments.length; index += 1) {
    const segment = pattern.segments[index]!
    if (segment.kind === "rest") {
      if (index !== pattern.segments.length - 1 || index >= pathSegments.length) return undefined
      values[segment.key] = pathSegments.slice(index).join("/")
      return values
    }
    const pathSegment = pathSegments[index]
    if (pathSegment === undefined) return undefined
    if (!matchSegment(segment, pathSegment, values)) return undefined
  }
  return pattern.segments.length === pathSegments.length ? values : undefined
}

function matchSegment(
  segment: Exclude<CompiledXmlPatternSegment, { kind: "rest" }>,
  value: string,
  values: Record<string, string>
): boolean {
  if (segment.kind === "static") return segment.value === value
  const expression = new RegExp(`^${segment.parts.map(templatePartRegex).join("(.+)")}$`)
  const match = value.match(expression)
  if (match === null) return false
  let valueIndex = 1
  for (const part of segment.parts) {
    if (part.kind !== "parameter") continue
    const next = match[valueIndex++]!
    const previous = values[part.key]
    if (previous !== undefined && previous !== next) return false
    values[part.key] = next
  }
  return true
}

function templatePartRegex(part: CompiledTemplatePart): string {
  return part.kind === "literal" ? escapeRegExp(part.value) : ""
}

function createMatch(route: XmlImportRoute, values: Record<string, string>): XmlImportRouteMatch {
  if (route.kind === "ignore") return { kind: "ignore", route, values }
  const targetProjectPath = expandTarget(route.targetPattern, values)
  if (route.kind === "assignment") return { kind: "assignment", route, targetProjectPath, values }
  return {
    kind: "externalFile",
    route,
    targetProjectPath,
    assignmentTargetProjectPath: expandTarget(route.assignmentTargetPattern, values),
    values,
  }
}

function expandTarget(pattern: string, values: Record<string, string>): string {
  return expandImportPattern(pattern, values).replace(/\\/g, "/").replace(/^\.\//, "")
}

function escapeRegExp(value: string): string {
  return value.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&")
}
```

- [ ] **Step 4: Run test to verify GREEN**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/routeStructure.test.ts --reporter dot
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/importFromXml/routeStructure.ts packages/core/metadata/importFromXml/routeStructure.test.ts
git commit -m "feat: :sparkles: добавить структуру XML-маршрутов"
```

---

### Task 2: Support recursive XML routes in the structure

**Files:**
- Modify: `packages/core/metadata/importFromXml/routeStructure.ts`
- Modify: `packages/core/metadata/importFromXml/routeStructure.test.ts`

**Interfaces:**
- Consumes: Task 1 `compileXmlImportRouteStructure`, `matchXmlImportRouteStructure`.
- Produces: recursion-aware matching that preserves current `recursiveRoutePatterns` behavior without generating variants per route per file.

- [ ] **Step 1: Write failing recursive subsystem test**

Append to `routeStructure.test.ts`:

```ts
  it("matches recursive routes by XML path depth", () => {
    const routes = [
      {
        kind: "assignment",
        xmlPattern: "Subsystems/{ownerName}.xml",
        targetPattern: "Подсистема/{ownerName}/Свойства.yaml",
        role: "properties",
        itemType: "MetadataSubsystem",
        source,
        recursion: {
          xmlRootPattern: "Subsystems/{ownerName}",
          targetRootPattern: "Подсистема/{ownerName}",
          xmlChildDir: "Subsystems",
          targetChildDir: "Подсистемы",
          assignmentRole: "fileItem",
        },
      },
    ] satisfies readonly XmlImportRoute[]

    const structure = compileXmlImportRouteStructure(routes)

    expect(matchXmlImportRouteStructure(structure, "Subsystems/Продажи/Subsystems/Опт.xml")).toEqual([
      expect.objectContaining({
        kind: "assignment",
        targetProjectPath: "Подсистема/Продажи/Подсистемы/Опт/Свойства.yaml",
        values: { ownerName: "Продажи", recursiveItemName1: "Опт" },
      }),
    ])
  })
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/routeStructure.test.ts --reporter dot
```

Expected: FAIL on the recursive route assertion.

- [ ] **Step 3: Add bounded recursion expansion at structure build time**

Update `compileXmlImportRouteStructure` to include the original route plus a fixed small set of recursive variants. Use `MAX_XML_ROUTE_RECURSION_DEPTH = 16`, which is above known 1C metadata nesting needs and avoids path-dependent expansion in the hot loop.

```ts
const MAX_XML_ROUTE_RECURSION_DEPTH = 16

export function compileXmlImportRouteStructure(routes: readonly XmlImportRoute[]): XmlImportRouteStructure {
  return {
    routes: routes.flatMap(expandRouteRecursion).map((route) => ({ route, pattern: compilePattern(route.xmlPattern) })),
  }
}

function expandRouteRecursion(route: XmlImportRoute): XmlImportRoute[] {
  const recursion = route.recursion
  if (recursion === undefined || !startsWithPatternRoot(route.xmlPattern, recursion.xmlRootPattern)) return [route]
  const result: XmlImportRoute[] = [route]
  for (let depth = 1; depth <= MAX_XML_ROUTE_RECURSION_DEPTH; depth += 1) {
    const xmlRootPattern = nestedRootPattern(recursion.xmlRootPattern, recursion.xmlChildDir, depth)
    const targetRootPattern = nestedRootPattern(recursion.targetRootPattern, recursion.targetChildDir, depth)
    const xmlPattern = replacePatternRoot(route.xmlPattern, recursion.xmlRootPattern, xmlRootPattern)
    if (route.kind === "ignore") {
      result.push({ ...route, xmlPattern })
      continue
    }
    const targetPattern = replacePatternRoot(route.targetPattern, recursion.targetRootPattern, targetRootPattern)
    if (route.kind === "assignment") {
      result.push({
        ...route,
        xmlPattern,
        targetPattern,
        role: recursion.assignmentRole,
        inputRole: route.inputRole ?? (route.role === "fileItem" || route.source.kind === "itemRule" ? "metadata" : "property"),
      })
      continue
    }
    result.push({
      ...route,
      xmlPattern,
      targetPattern,
      assignmentTargetPattern: replacePatternRoot(route.assignmentTargetPattern, recursion.targetRootPattern, targetRootPattern),
    })
  }
  return result
}
```

Also add helper functions copied from current discovery:

```ts
function nestedRootPattern(rootPattern: string, childDir: string, depth: number): string {
  const steps = Array.from({ length: depth }, (_, index) => `${childDir}/{recursiveItemName${index + 1}}`)
  return [rootPattern, ...steps].join("/")
}

function startsWithPatternRoot(pattern: string, rootPattern: string): boolean {
  if (!pattern.startsWith(rootPattern)) return false
  const boundary = pattern[rootPattern.length]
  return boundary === undefined || boundary === "/" || boundary === "."
}

function replacePatternRoot(pattern: string, rootPattern: string, replacement: string): string {
  return startsWithPatternRoot(pattern, rootPattern) ? `${replacement}${pattern.slice(rootPattern.length)}` : pattern
}
```

- [ ] **Step 4: Run recursive tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/routeStructure.test.ts --reporter dot
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/importFromXml/routeStructure.ts packages/core/metadata/importFromXml/routeStructure.test.ts
git commit -m "feat: :sparkles: поддержать рекурсивные XML-маршруты"
```

---

### Task 3: Index route structure by first static segment

**Files:**
- Modify: `packages/core/metadata/importFromXml/routeStructure.ts`
- Modify: `packages/core/metadata/importFromXml/routeStructure.test.ts`

**Interfaces:**
- Consumes: Task 2 route structure.
- Produces: `XmlImportRouteStructure` whose hot-path matching checks only top-level candidate buckets.

- [ ] **Step 1: Write failing test that counts visited route patterns**

Add an optional diagnostics callback to desired API in test:

```ts
  it("does not visit unrelated top-level route buckets", () => {
    const routes = [
      {
        kind: "assignment",
        xmlPattern: "Catalogs/{ownerName}.xml",
        targetPattern: "Справочник/{ownerName}/Свойства.yaml",
        role: "properties",
        itemType: "MetadataCatalog",
        source,
      },
      {
        kind: "assignment",
        xmlPattern: "Documents/{ownerName}.xml",
        targetPattern: "Документ/{ownerName}/Свойства.yaml",
        role: "properties",
        itemType: "MetadataDocument",
        source,
      },
    ] satisfies readonly XmlImportRoute[]
    const structure = compileXmlImportRouteStructure(routes)
    let visited = 0

    const matches = matchXmlImportRouteStructure(structure, "Catalogs/Контрагенты.xml", {
      onPatternVisited: () => {
        visited += 1
      },
    })

    expect(matches).toHaveLength(1)
    expect(visited).toBe(1)
  })
```

Update function type expected by test:

```ts
export interface XmlImportRouteMatchOptions {
  onPatternVisited?: () => void
}
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/routeStructure.test.ts --reporter dot
```

Expected: FAIL because `matchXmlImportRouteStructure` does not accept options and visits all routes.

- [ ] **Step 3: Implement first-segment buckets**

Change structure:

```ts
export interface XmlImportRouteStructure {
  readonly routesByFirstSegment: ReadonlyMap<string, readonly CompiledXmlImportRoute[]>
  readonly fallbackRoutes: readonly CompiledXmlImportRoute[]
}

export interface XmlImportRouteMatchOptions {
  onPatternVisited?: () => void
}
```

In compile:

```ts
export function compileXmlImportRouteStructure(routes: readonly XmlImportRoute[]): XmlImportRouteStructure {
  const routesByFirstSegment = new Map<string, CompiledXmlImportRoute[]>()
  const fallbackRoutes: CompiledXmlImportRoute[] = []
  for (const route of routes.flatMap(expandRouteRecursion)) {
    const compiled = { route, pattern: compilePattern(route.xmlPattern) }
    const first = compiled.pattern.segments[0]
    if (first?.kind === "static") {
      routesByFirstSegment.set(first.value, [...(routesByFirstSegment.get(first.value) ?? []), compiled])
    } else {
      fallbackRoutes.push(compiled)
    }
  }
  return { routesByFirstSegment, fallbackRoutes }
}
```

In match:

```ts
export function matchXmlImportRouteStructure(
  structure: XmlImportRouteStructure,
  path: string,
  options: XmlImportRouteMatchOptions = {}
): XmlImportRouteMatch[] {
  const pathSegments = path.split("/")
  const candidates = [...(structure.routesByFirstSegment.get(pathSegments[0] ?? "") ?? []), ...structure.fallbackRoutes]
  const matches: XmlImportRouteMatch[] = []
  for (const compiled of candidates) {
    options.onPatternVisited?.()
    const values = matchCompiledPattern(compiled.pattern, pathSegments)
    if (values !== undefined) matches.push(createMatch(compiled.route, values))
  }
  return matches
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/routeStructure.test.ts --reporter dot
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/importFromXml/routeStructure.ts packages/core/metadata/importFromXml/routeStructure.test.ts
git commit -m "perf: :zap: индексировать XML-маршруты по корню"
```

---

### Task 4: Switch discovery to route structure and parallel file listing

**Files:**
- Modify: `packages/core/metadata/importFromXml/discovery.ts`
- Modify: `packages/core/metadata/importFromXml/discovery.test.ts`

**Interfaces:**
- Consumes:
  ```ts
  compileXmlImportRouteStructure(routes)
  matchXmlImportRouteStructure(structure, path)
  ```
- Produces: `discoverXmlImport` behavior unchanged, but hot path no longer uses full route scan.

- [ ] **Step 1: Add parity test for current real routes**

Add to `discovery.test.ts`:

```ts
  it("discovers representative registered routes through the fast XML structure", async () => {
    const paths = [
      "Configuration.xml",
      "Catalogs/Контрагенты.xml",
      "Catalogs/Контрагенты/Forms/ФормаЭлемента.xml",
      "Catalogs/Контрагенты/Forms/ФормаЭлемента/Ext/Form.xml",
      "Catalogs/Контрагенты/Forms/ФормаЭлемента/Ext/Form/Module.bsl",
      "Subsystems/Продажи.xml",
      "Subsystems/Продажи/Subsystems/Опт.xml",
      "ConfigDumpInfo.xml",
    ]

    const result = await discoverXmlImport({
      xmlDir,
      routes: describeRegisteredXmlImportRoutes(),
      fs: fakeFs(paths),
    })

    expect(result.assignments.map((assignment) => assignment.targetProjectPath)).toEqual([
      "Конфигурация.yaml",
      "Подсистема/Продажи/Подсистемы/Опт/Свойства.yaml",
      "Подсистема/Продажи/Свойства.yaml",
      "Справочник/Контрагенты/Свойства.yaml",
      "Справочник/Контрагенты/Формы/ФормаЭлемента/Форма.yaml",
    ])
    expect(result.assignments.find((assignment) => assignment.targetProjectPath.endsWith("/Форма.yaml"))?.externalFiles).toContainEqual({
      sourcePath: join(xmlDir, "Catalogs/Контрагенты/Forms/ФормаЭлемента/Ext/Form/Module.bsl"),
      targetProjectPath: "Справочник/Контрагенты/Формы/ФормаЭлемента/Модуль.bsl",
    })
  })
```

- [ ] **Step 2: Run discovery tests before switching**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/discovery.test.ts --reporter dot
```

Expected: PASS. This locks current behavior before switching internals.

- [ ] **Step 3: Replace full route scan with route structure**

In `discovery.ts`, import:

```ts
import { compileXmlImportRouteStructure, matchXmlImportRouteStructure, type XmlImportRouteMatch } from "./routeStructure"
```

Replace local `ResolvedMatch` with:

```ts
type ResolvedMatch = XmlImportRouteMatch
```

In `discoverXmlImport`, compile once:

```ts
const routeStructure = compileXmlImportRouteStructure(params.routes)
```

Replace:

```ts
const allMatches = params.routes.flatMap((route) => resolveRoute(route, path))
```

with:

```ts
const allMatches = matchXmlImportRouteStructure(routeStructure, path)
```

Remove old private helpers that are no longer used:

```ts
resolveRoute
recursiveRoutePatterns
nestedRootPattern
startsWithPatternRoot
replacePatternRoot
expandedTarget
```

- [ ] **Step 4: Make XML file listing parallel**

Replace `listRegularFiles` body with validation-style bounded parallel traversal:

```ts
const DISCOVERY_READDIR_CONCURRENCY = 32

async function listRegularFiles(xmlDir: string): Promise<string[]> {
  const result: string[] = []
  const dirs = [""]
  let active = 0
  let resolveDone!: () => void
  let rejectDone!: (error: unknown) => void
  const done = new Promise<void>((resolve, reject) => {
    resolveDone = resolve
    rejectDone = reject
  })

  const pump = (): void => {
    while (active < DISCOVERY_READDIR_CONCURRENCY && dirs.length > 0) {
      const relativeDir = dirs.pop()!
      const directory = relativeDir === "" ? xmlDir : join(xmlDir, ...relativeDir.split("/"))
      active++
      nodeFs.readdir(directory, { withFileTypes: true }).then(
        (entries) => {
          for (const entry of entries) {
            const path = relativeDir === "" ? entry.name : `${relativeDir}/${entry.name}`
            if (entry.isDirectory()) dirs.push(path)
            else if (entry.isFile()) result.push(path)
          }
        },
        (error: unknown) => rejectDone(error)
      ).finally(() => {
        active--
        if (active === 0 && dirs.length === 0) resolveDone()
        else pump()
      })
    }
  }

  pump()
  await done
  return result
}
```

- [ ] **Step 5: Run discovery tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/discovery.test.ts metadata/importFromXml/routeStructure.test.ts --reporter dot
```

Expected: PASS.

- [ ] **Step 6: Run type-check**

Run:

```bash
pnpm --filter @nkdk/core run type-check
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/importFromXml/discovery.ts packages/core/metadata/importFromXml/discovery.test.ts packages/core/metadata/importFromXml/routeStructure.ts packages/core/metadata/importFromXml/routeStructure.test.ts
git commit -m "perf: :zap: ускорить discovery XML-импорта"
```

---

### Task 5: Profile ERP discovery only

**Files:**
- No production file changes required.
- Use temporary script in `/private/tmp/nkdk-discovery-profile.ts`.

**Interfaces:**
- Consumes: switched `discoverXmlImport`.
- Produces: measured before/after discovery numbers for ERP.

- [ ] **Step 1: Create temporary discovery profile script**

Create `/private/tmp/nkdk-discovery-profile.ts` with:

```ts
import { performance } from "node:perf_hooks"
import "/Users/nikita/git/nkdk/.worktrees/remote-sync-state-design/packages/core/metadata/commonObjects/index.ts"
import "/Users/nikita/git/nkdk/.worktrees/remote-sync-state-design/packages/core/metadata/forms/index.ts"
import "/Users/nikita/git/nkdk/.worktrees/remote-sync-state-design/packages/core/metadata/appliedObjects/index.ts"
import { discoverXmlImport } from "/Users/nikita/git/nkdk/.worktrees/remote-sync-state-design/packages/core/metadata/importFromXml/discovery.ts"
import { describeRegisteredXmlImportRoutes } from "/Users/nikita/git/nkdk/.worktrees/remote-sync-state-design/packages/core/metadata/importFromXml/routes.ts"

const xmlDir = process.argv[2] ?? "/Users/nikita/git/round-trip/cf/erp"
const started = performance.now()
const result = await discoverXmlImport({ xmlDir, routes: describeRegisteredXmlImportRoutes() })
console.log(JSON.stringify({ assignments: result.assignments.length, elapsedMs: Math.round(performance.now() - started) }, null, 2))
```

- [ ] **Step 2: Run ERP discovery profile**

Run:

```bash
/usr/bin/time -l pnpm --filter @nkdk/core exec tsx /private/tmp/nkdk-discovery-profile.ts /Users/nikita/git/round-trip/cf/erp
```

Expected: command completes without worker/import transfer. Record elapsed time and max RSS. Target is materially below the previous ~100 seconds discovery time.

- [ ] **Step 3: Run importFromXml test group**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/discovery.test.ts metadata/importFromXml/routes.test.ts metadata/importFromXml/importConfiguration.test.ts --reporter dot
```

Expected: PASS.

- [ ] **Step 4: Run type-check**

Run:

```bash
pnpm --filter @nkdk/core run type-check
```

Expected: PASS.

- [ ] **Step 5: Commit profile notes only if a checked-in note is requested**

Do not commit `/private/tmp/nkdk-discovery-profile.ts`. If profile numbers need documentation, append a short note to the implementation thread or a follow-up spec; otherwise no commit is required for this task.

---

## Self-Review

- Spec coverage: tasks cover structure compilation, static/parameter/rest matching, recursion, fast top-level route buckets, discovery switch, parallel file listing, and ERP discovery profiling.
- Placeholder scan: no placeholder markers or undefined future function names; every introduced interface is defined before use.
- Type consistency: exported names are consistent across tasks: `compileXmlImportRouteStructure`, `matchXmlImportRouteStructure`, `XmlImportRouteStructure`, `XmlImportRouteMatch`.
