# Universal Orchestration Graph Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сделать графовый импорт `orchestration` универсальным: конкретные catalog/document/enumeration/form регистрируются снаружи, а ядро работает только с общим протоколом.

**Architecture:** Внутри `packages/core/metadata/orchestration` появляется маленькое ядро `graphImport`: реестр, универсальный импорт зарегистрированного источника и применение `buildGraphFromModel`. Конкретные регистрации живут в `packages/core/metadata/graphImport`, а старые публичные входы становятся совместимыми обёртками.

**Tech Stack:** TypeScript 5.9, Vitest, YAML AST из `yaml`, существующие `GraphBuilder`, `GraphOps`, `MetadataItemRule`, `parseMetadataYaml`.

---

## Структура Файлов

- Создать `packages/core/metadata/orchestration/graphImport/registry.ts` — универсальные типы регистрации, реестр kind'ов, поиск источника по зарегистрированным шаблонам пути.
- Создать `packages/core/metadata/orchestration/graphImport/root.ts` — универсальное объявление корня item-узла и терминалов `graphTerminals`.
- Создать `packages/core/metadata/orchestration/graphImport/importRegisteredMetadataSourceWithGraph.ts` — общий сценарий `YAML source -> model -> graph`.
- Создать `packages/core/metadata/orchestration/graphImport/importRegisteredMetadataSourceWithGraph.test.ts` — контрактные тесты на фиктивном типе без appliedObjects/forms.
- Создать `packages/core/metadata/graphImport/registerTopLevelGraphImports.ts` — регистрации catalog/document/enumeration вне `orchestration`.
- Создать `packages/core/metadata/graphImport/registerFormGraphImport.ts` — регистрация формы вне `orchestration`.
- Создать `packages/core/metadata/graphImport/registerDefaultGraphImports.ts` — идемпотентная регистрация всех стандартных графовых импортёров.
- Создать `packages/core/metadata/graphImport/importMetadataFileWithGraph.ts` — совместимая обёртка старого API.
- Создать `packages/core/metadata/graphImport/buildGraph.ts` — публичная обёртка `buildGraph`/`buildGraphForChangedFile`, которая сначала регистрирует стандартные типы.
- Изменить `packages/core/metadata/orchestration/importMetadataFileWithGraph.ts` — оставить только re-export совместимой обёртки.
- Изменить `packages/core/metadata/orchestration/buildGraph/buildGraph.ts` — убрать зашитые catalog/document/enumeration/form, использовать `resolveGraphImportSource`.
- Изменить `packages/core/metadata/orchestration/buildGraph/buildGraphForChangedFile.ts` — убрать ветку form, использовать свойства регистрации.
- Изменить `packages/core/metadata/orchestration/buildGraph/index.ts` — экспортировать универсальные типы пути.
- Изменить `packages/core/index.ts` — экспортировать публичные обёртки из `metadata/graphImport`.
- Создать `packages/core/metadata/orchestration/graphImport/noConcreteMetadataImports.test.ts` — защита универсального ядра от прямых импортов `appliedObjects`/`forms`.
- Изменить `.agents/architecture-orchestration.md` — уточнить, что автоматическая проверка сначала покрывает универсальное графовое ядро.

## Task 1: Универсальный Реестр И Импорт

**Files:**
- Create: `packages/core/metadata/orchestration/graphImport/registry.ts`
- Create: `packages/core/metadata/orchestration/graphImport/root.ts`
- Create: `packages/core/metadata/orchestration/graphImport/importRegisteredMetadataSourceWithGraph.ts`
- Create: `packages/core/metadata/orchestration/graphImport/importRegisteredMetadataSourceWithGraph.test.ts`

- [ ] **Step 1: Write the failing registry/import contract test**

Create `packages/core/metadata/orchestration/graphImport/importRegisteredMetadataSourceWithGraph.test.ts`:

```ts
import { describe, expect, it, beforeEach } from "vitest"
import { GraphBuilder } from "~/metadata/orchestration/buildGraph/internal/GraphBuilder"
import { walkGraphToFileData } from "~/metadata/orchestration/buildGraph/walkGraphToFileData"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import {
  clearGraphImportRegistry,
  registerGraphImport,
  resolveGraphImportSource,
  toGraphModel,
} from "./registry"
import { declareMetadataItemGraphRoot } from "./root"
import { importRegisteredMetadataSourceWithGraph } from "./importRegisteredMetadataSourceWithGraph"

const testRule = {
  itemType: "MetadataCatalog",
  itemTypePrefix: "ТестовыйОбъект",
  graphTerminals: ["ПустаяСсылка"],
  properties: {},
} satisfies MetadataItemRule

const context = {
  version: "2.20",
  defaultLanguage: "ru",
}

describe("graphImport registry", () => {
  beforeEach(() => {
    clearGraphImportRegistry()
  })

  it("резолвит источник через зарегистрированный шаблон пути", () => {
    registerGraphImport({
      kind: "test-item",
      phase: 3,
      matchPath: (filePath) => {
        const parts = filePath.split("/")
        if (parts.length !== 3 || parts[0] !== "ТестовыйОбъект" || parts[2] !== "Свойства.yaml") return undefined
        return { kind: "test-item", name: parts[1]!, pathParams: { prefix: parts[0]! } }
      },
      importModel: ({ name }) => {
        const model = { itemType: "MetadataCatalog", name }
        return { model, graphModel: toGraphModel(model), rule: testRule }
      },
      declareRoot: ({ graph, rule, name, filePath }) =>
        declareMetadataItemGraphRoot({ graph, rule, name, filePath }),
    })

    expect(resolveGraphImportSource("ТестовыйОбъект/Демо/Свойства.yaml")).toEqual({
      kind: "test-item",
      name: "Демо",
      phase: 3,
      pathParams: { prefix: "ТестовыйОбъект" },
    })
  })

  it("импортирует фиктивный тип, объявляет корень и терминалы", async () => {
    registerGraphImport({
      kind: "test-item",
      matchPath: (filePath) => {
        const parts = filePath.split("/")
        if (parts.length !== 3 || parts[0] !== "ТестовыйОбъект" || parts[2] !== "Свойства.yaml") return undefined
        return { kind: "test-item", name: parts[1]!, pathParams: {} }
      },
      importModel: ({ name }) => {
        const model = { itemType: "MetadataCatalog", name, comment: "из теста" }
        return { model, graphModel: toGraphModel(model), rule: testRule }
      },
      declareRoot: ({ graph, rule, name, filePath }) =>
        declareMetadataItemGraphRoot({ graph, rule, name, filePath }),
    })

    const graph = new GraphBuilder()
    const result = await importRegisteredMetadataSourceWithGraph({
      filePath: "ТестовыйОбъект/Демо/Свойства.yaml",
      sources: { yaml: "Комментарий: из теста\n" },
      kind: "test-item",
      name: "Демо",
      graph,
      context,
    })

    expect(result?.model.itemType).toBe("MetadataCatalog")
    expect(graph.hasNode("ТестовыйОбъект.Демо")).toBe(true)
    expect(graph.hasNode("ТестовыйОбъект.Демо.ПустаяСсылка")).toBe(true)

    const files = walkGraphToFileData(graph)
    expect(files).toContainEqual(
      expect.objectContaining({
        filePath: "ТестовыйОбъект/Демо/Свойства.yaml",
        declaredNodeIds: expect.arrayContaining([
          "ТестовыйОбъект.Демо",
          "ТестовыйОбъект.Демо.ПустаяСсылка",
        ]),
      }),
    )
  })

  it("передаёт парный источник в afterBuildGraph без знания его предметного смысла", async () => {
    registerGraphImport({
      kind: "test-paired",
      importModel: ({ name }) => {
        const model = { itemType: "MetadataCatalog", name }
        return { model, graphModel: toGraphModel(model), rule: testRule }
      },
      declareRoot: ({ graph, rule, name, filePath }) =>
        declareMetadataItemGraphRoot({ graph, rule, name, filePath }),
      afterBuildGraph: ({ graph, parentNodeId, sources }) => {
        if (!sources.paired?.filePath) return
        graph.addContributedFilePath(parentNodeId, sources.paired.filePath)
      },
    })

    const graph = new GraphBuilder()
    await importRegisteredMetadataSourceWithGraph({
      filePath: "ТестовыйОбъект/Демо/Свойства.yaml",
      sources: {
        yaml: "{}",
        paired: {
          filePath: "ТестовыйОбъект/Демо/Парный.txt",
          text: "pair",
        },
      },
      kind: "test-paired",
      name: "Демо",
      graph,
      context,
    })

    const files = walkGraphToFileData(graph)
    expect(files).toContainEqual(
      expect.objectContaining({
        filePath: "ТестовыйОбъект/Демо/Парный.txt",
        contributedNodeIds: expect.arrayContaining(["ТестовыйОбъект.Демо"]),
      }),
    )
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/orchestration/graphImport/importRegisteredMetadataSourceWithGraph.test.ts
```

Expected: FAIL because `./registry`, `./root`, and `./importRegisteredMetadataSourceWithGraph` do not exist.

- [ ] **Step 3: Implement registry.ts**

Create `packages/core/metadata/orchestration/graphImport/registry.ts`:

```ts
import type { ConfigurationContext } from "~/metadata/context/types"
import type { GraphBuilder } from "~/metadata/orchestration/buildGraph/internal/GraphBuilder"
import type { PairedGraphSourceText } from "~/metadata/orchestration/buildGraph/types"
import type { MetadataItem, MetadataItemRule } from "~/metadata/orchestration/property/types"
import type { ParsedYaml } from "~/yaml/parseMetadataYaml"

export interface GraphImportSources {
  yaml: string
  paired?: PairedGraphSourceText
}

export interface GraphImportSourceMatch {
  kind: string
  name: string
  pathParams: Record<string, string>
  phase?: number
}

export interface GraphModelImportParams {
  filePath: string
  sources: GraphImportSources
  parsed: ParsedYaml
  name: string
  pathParams: Record<string, string>
  context: ConfigurationContext
  graph: GraphBuilder
}

export interface GraphModelImportResult {
  model: MetadataItem
  graphModel: Record<string, unknown>
  rule: MetadataItemRule
  extra?: Record<string, unknown>
}

export interface DeclareGraphRootParams {
  graph: GraphBuilder
  rule: MetadataItemRule
  model: MetadataItem
  graphModel: Record<string, unknown>
  name: string
  filePath: string
  pathParams: Record<string, string>
  context: ConfigurationContext
  parsed: ParsedYaml
}

export interface AfterBuildGraphParams extends DeclareGraphRootParams {
  sources: GraphImportSources
  parentNodeId: string
  extra?: Record<string, unknown>
}

export interface GraphImportRegistration {
  kind: string
  phase?: number
  includeStubEdgesInChangedFile?: true
  matchPath?: (filePath: string) => GraphImportSourceMatch | undefined
  importModel: (params: GraphModelImportParams) =>
    | GraphModelImportResult
    | undefined
    | Promise<GraphModelImportResult | undefined>
  declareRoot: (params: DeclareGraphRootParams) => string
  afterBuildGraph?: (params: AfterBuildGraphParams) => void | Promise<void>
}

const graphImportRegistry = new Map<string, GraphImportRegistration>()

export function registerGraphImport(registration: GraphImportRegistration): void {
  graphImportRegistry.set(registration.kind, registration)
}

export function getGraphImportRegistration(kind: string): GraphImportRegistration | undefined {
  return graphImportRegistry.get(kind)
}

export function clearGraphImportRegistry(): void {
  graphImportRegistry.clear()
}

export function resolveGraphImportSource(filePath: string): GraphImportSourceMatch | undefined {
  for (const registration of graphImportRegistry.values()) {
    const match = registration.matchPath?.(filePath)
    if (!match) continue
    return {
      ...match,
      phase: match.phase ?? registration.phase ?? 0,
    }
  }
  return undefined
}

export function toGraphModel(model: MetadataItem): Record<string, unknown> {
  return Object.fromEntries(Object.entries(model))
}
```

- [ ] **Step 4: Implement root.ts**

Create `packages/core/metadata/orchestration/graphImport/root.ts`:

```ts
import { getKindByYaml } from "~/metadata/orchestration/buildGraph/internal/edgeKinds"
import type { GraphBuilder } from "~/metadata/orchestration/buildGraph/internal/GraphBuilder"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"

export function declareMetadataItemGraphRoot(params: {
  graph: GraphBuilder
  rule: MetadataItemRule
  name: string
  filePath: string
}): string {
  const { graph, rule, name, filePath } = params
  if (!rule.itemTypePrefix) {
    throw new Error(`declareMetadataItemGraphRoot: правило "${rule.itemType}" не задаёт itemTypePrefix`)
  }

  const itemNodeId = `${rule.itemTypePrefix}.${name}`
  graph.ensureNode(rule.itemTypePrefix, { name: rule.itemTypePrefix })
  graph.ensureNode(itemNodeId, { name })
  graph.addFilePath(itemNodeId, filePath)

  const edgeKind = getKindByYaml(rule.itemType) ?? rule.itemType
  graph.ensureEdge(rule.itemTypePrefix, itemNodeId, edgeKind, { yaml: rule.itemType })
  materializeGraphTerminals({ graph, rule, itemNodeId, ownerName: name, filePath })
  return itemNodeId
}

function materializeGraphTerminals(params: {
  graph: GraphBuilder
  rule: MetadataItemRule
  itemNodeId: string
  ownerName: string
  filePath: string
}): void {
  const { graph, rule, itemNodeId, ownerName, filePath } = params
  if (!rule.graphTerminals?.length) return

  const ownerType = rule.itemTypePrefix ?? ""
  for (const terminalName of rule.graphTerminals) {
    const terminalId = `${itemNodeId}.${terminalName}`
    graph.ensureNode(terminalId, { name: terminalName })
    graph.addFilePath(terminalId, filePath)
    graph.setItem(terminalId, { itemType: "EmptyRef", ownerType, ownerName })

    const edgeKind = getKindByYaml(terminalName) ?? terminalName
    graph.ensureEdge(itemNodeId, terminalId, edgeKind, { yaml: terminalName })
  }
}
```

- [ ] **Step 5: Implement importRegisteredMetadataSourceWithGraph.ts**

Create `packages/core/metadata/orchestration/graphImport/importRegisteredMetadataSourceWithGraph.ts`:

```ts
import { isMap } from "yaml"
import { buildGraphFromModel } from "~/metadata/orchestration/buildGraphFromModel"
import { parseMetadataYaml } from "~/yaml/parseMetadataYaml"
import type { ParsedYaml } from "~/yaml/parseMetadataYaml"
import {
  getGraphImportRegistration,
  type GraphImportSources,
  type GraphModelImportResult,
} from "./registry"
import type { ConfigurationContext } from "~/metadata/context/types"
import type { GraphBuilder } from "~/metadata/orchestration/buildGraph/internal/GraphBuilder"
import type { MetadataItem } from "~/metadata/orchestration/property/types"

export interface ImportRegisteredMetadataSourceResult {
  model: MetadataItem
  parsed: ParsedYaml
}

export async function importRegisteredMetadataSourceWithGraph(params: {
  filePath: string
  sources: GraphImportSources
  kind: string
  name: string
  graph: GraphBuilder
  context: ConfigurationContext
  pathParams?: Record<string, string>
}): Promise<ImportRegisteredMetadataSourceResult | undefined> {
  const { filePath, sources, kind, name, graph, context } = params
  const registration = getGraphImportRegistration(kind)
  if (!registration) {
    throw new Error(`importRegisteredMetadataSourceWithGraph: неизвестный kind "${kind}"`)
  }

  const parsed = parseMetadataYaml(sources.yaml)
  const yamlMap = isMap(parsed.doc.contents) ? parsed.doc.contents : undefined
  const pathParams = params.pathParams ?? {}
  const importContext: ConfigurationContext = { ...context, graph }

  const imported = await registration.importModel({
    filePath,
    sources,
    parsed,
    name,
    pathParams,
    context: importContext,
    graph,
  })
  if (!imported) return undefined

  const parentNodeId = declareRoot(registration, {
    graph,
    filePath,
    name,
    pathParams,
    context: importContext,
    parsed,
    imported,
  })

  graph.setItem(parentNodeId, imported.model)
  graph.addFilePath(parentNodeId, filePath)

  buildGraphFromModel({
    model: imported.graphModel,
    yamlMap,
    lineCounter: parsed.lineCounter,
    rule: imported.rule,
    graph,
    parentNodeId,
    filePath,
    extra: imported.extra,
  })

  await registration.afterBuildGraph?.({
    graph,
    rule: imported.rule,
    model: imported.model,
    graphModel: imported.graphModel,
    name,
    filePath,
    pathParams,
    context: importContext,
    parsed,
    sources,
    parentNodeId,
    extra: imported.extra,
  })

  return { model: imported.model, parsed }
}

function declareRoot(
  registration: NonNullable<ReturnType<typeof getGraphImportRegistration>>,
  params: {
    graph: GraphBuilder
    filePath: string
    name: string
    pathParams: Record<string, string>
    context: ConfigurationContext
    parsed: ParsedYaml
    imported: GraphModelImportResult
  },
): string {
  const { imported } = params
  return registration.declareRoot({
    graph: params.graph,
    rule: imported.rule,
    model: imported.model,
    graphModel: imported.graphModel,
    name: params.name,
    filePath: params.filePath,
    pathParams: params.pathParams,
    context: params.context,
    parsed: params.parsed,
  })
}
```

- [ ] **Step 6: Run the contract test**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/orchestration/graphImport/importRegisteredMetadataSourceWithGraph.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit universal graph import core**

```bash
git add packages/core/metadata/orchestration/graphImport/registry.ts \
  packages/core/metadata/orchestration/graphImport/root.ts \
  packages/core/metadata/orchestration/graphImport/importRegisteredMetadataSourceWithGraph.ts \
  packages/core/metadata/orchestration/graphImport/importRegisteredMetadataSourceWithGraph.test.ts
git commit -m "feat: :sparkles: добавить универсальный графовый импорт"
```

## Task 2: Внешние Регистрации Верхнеуровневых Объектов

**Files:**
- Create: `packages/core/metadata/graphImport/registerTopLevelGraphImports.ts`
- Create: `packages/core/metadata/graphImport/registerDefaultGraphImports.ts`
- Create: `packages/core/metadata/graphImport/importMetadataFileWithGraph.ts`
- Modify: `packages/core/metadata/orchestration/importMetadataFileWithGraph.ts`
- Modify: `packages/core/metadata/orchestration/importMetadataFileWithGraph.test.ts`

- [ ] **Step 1: Add failing compatibility test for catalog through old import path**

At the top of `packages/core/metadata/orchestration/importMetadataFileWithGraph.test.ts`, keep the current imports and add this test near the first catalog describe:

```ts
it("старый вход использует внешнюю регистрацию catalog", async () => {
  const graph = new GraphBuilder()
  const result = await importMetadataFileWithGraph({
    filePath: FILE_PATH,
    sources: { yaml: "{}" },
    kind: "catalog",
    name: "Товары",
    graph,
    context: baseContext,
  })

  expect(result?.model.itemType).toBe("MetadataCatalog")
  expect(graph.hasNode("Справочник.Товары")).toBe(true)
})
```

- [ ] **Step 2: Run the compatibility test to verify it still uses old in-file concrete imports**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/orchestration/importMetadataFileWithGraph.test.ts -t "старый вход использует внешнюю регистрацию catalog"
```

Expected before implementation: the test may pass behaviorally, but `packages/core/metadata/orchestration/importMetadataFileWithGraph.ts` still contains direct imports from applied objects. Continue with the refactor; the guard in Task 5 will fail until those imports are gone.

- [ ] **Step 3: Implement top-level registrations outside orchestration**

Create `packages/core/metadata/graphImport/registerTopLevelGraphImports.ts`:

```ts
import { importMetadataCatalogFromYAML } from "~/metadata/appliedObjects/metadataCatalog/fromYAML"
import { MetadataCatalogRules } from "~/metadata/appliedObjects/metadataCatalog/rules"
import { MetadataDocumentRules } from "~/metadata/appliedObjects/metadataDocument/rules"
import { importMetadataEnumerationFromYAML } from "~/metadata/appliedObjects/metadataEnumeration/fromYAML"
import { MetadataEnumerationRules } from "~/metadata/appliedObjects/metadataEnumeration/rules"
import { importMetadataItemFromYAML } from "~/metadata/orchestration/metadataItem/fromYAML"
import {
  registerGraphImport,
  toGraphModel,
  type GraphImportSourceMatch,
} from "~/metadata/orchestration/graphImport/registry"
import { declareMetadataItemGraphRoot } from "~/metadata/orchestration/graphImport/root"

export function registerTopLevelGraphImports(): void {
  registerGraphImport({
    kind: "catalog",
    phase: 0,
    matchPath: matchTopLevelPath("Справочник", "catalog"),
    importModel: ({ context, parsed, name }) => {
      const model = importMetadataCatalogFromYAML(context, parsed.data, name)
      if (!model) return undefined
      return { model, graphModel: toGraphModel(model), rule: MetadataCatalogRules }
    },
    declareRoot: ({ graph, rule, name, filePath }) =>
      declareMetadataItemGraphRoot({ graph, rule, name, filePath }),
  })

  registerGraphImport({
    kind: "document",
    phase: 0,
    matchPath: matchTopLevelPath("Документ", "document"),
    importModel: ({ context, parsed, name }) => {
      const model = importMetadataItemFromYAML({
        context,
        yaml: parsed.data,
        rule: MetadataDocumentRules,
        name,
      })
      if (!model) return undefined
      return { model, graphModel: toGraphModel(model), rule: MetadataDocumentRules }
    },
    declareRoot: ({ graph, rule, name, filePath }) =>
      declareMetadataItemGraphRoot({ graph, rule, name, filePath }),
  })

  registerGraphImport({
    kind: "enumeration",
    phase: 0,
    matchPath: matchTopLevelPath("Перечисление", "enumeration"),
    importModel: ({ context, parsed, name }) => {
      const model = importMetadataEnumerationFromYAML(context, parsed.data, name)
      if (!model) return undefined
      return { model, graphModel: toGraphModel(model), rule: MetadataEnumerationRules }
    },
    declareRoot: ({ graph, rule, name, filePath }) =>
      declareMetadataItemGraphRoot({ graph, rule, name, filePath }),
  })
}

function matchTopLevelPath(dir: string, kind: string) {
  return (filePath: string): GraphImportSourceMatch | undefined => {
    const parts = filePath.split("/")
    if (parts.length !== 3 || parts[0] !== dir || parts[2] !== "Свойства.yaml") return undefined
    return { kind, name: parts[1]!, pathParams: { dir } }
  }
}
```

The repeated registrations are intentional in this task because they keep each model importer explicit and easy to move independently later.

- [ ] **Step 4: Add default registration entry point**

Create `packages/core/metadata/graphImport/registerDefaultGraphImports.ts`:

```ts
import { registerTopLevelGraphImports } from "./registerTopLevelGraphImports"

let registered = false

export function ensureDefaultGraphImportsRegistered(): void {
  if (registered) return
  registerTopLevelGraphImports()
  registered = true
}
```

- [ ] **Step 5: Add compatible importMetadataFileWithGraph wrapper outside orchestration**

Create `packages/core/metadata/graphImport/importMetadataFileWithGraph.ts`:

```ts
import type { ConfigurationContext } from "~/metadata/context/types"
import type { GraphBuilder } from "~/metadata/orchestration/buildGraph/internal/GraphBuilder"
import {
  importRegisteredMetadataSourceWithGraph,
  type ImportRegisteredMetadataSourceResult,
} from "~/metadata/orchestration/graphImport/importRegisteredMetadataSourceWithGraph"
import { ensureDefaultGraphImportsRegistered } from "./registerDefaultGraphImports"

export type ImportMetadataFileResult = ImportRegisteredMetadataSourceResult

export async function importMetadataFileWithGraph(params: {
  filePath: string
  nkdkFilePath?: string
  sources: { yaml: string; nkdk?: string }
  kind: string
  name: string
  graph: GraphBuilder
  context: ConfigurationContext
  ownerNodeId?: string
}): Promise<ImportMetadataFileResult | undefined> {
  ensureDefaultGraphImportsRegistered()
  return importRegisteredMetadataSourceWithGraph({
    filePath: params.filePath,
    sources: {
      yaml: params.sources.yaml,
      paired: params.sources.nkdk
        ? {
            filePath: params.nkdkFilePath ?? "",
            text: params.sources.nkdk,
          }
        : undefined,
    },
    kind: params.kind,
    name: params.name,
    graph: params.graph,
    context: params.context,
    pathParams: params.ownerNodeId ? { ownerNodeId: params.ownerNodeId } : undefined,
  })
}
```

- [ ] **Step 6: Replace orchestration/importMetadataFileWithGraph.ts with re-export**

Replace `packages/core/metadata/orchestration/importMetadataFileWithGraph.ts` with:

```ts
export {
  importMetadataFileWithGraph,
  type ImportMetadataFileResult,
} from "~/metadata/graphImport/importMetadataFileWithGraph"
```

- [ ] **Step 7: Run top-level import tests**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/orchestration/importMetadataFileWithGraph.test.ts -t "catalog|document|enumeration|неизвестный kind"
```

Expected: catalog/document/enumeration tests PASS. The unknown kind test now fails with `importRegisteredMetadataSourceWithGraph: неизвестный kind "unknown"`; update only the expected message:

```ts
await expect(
  importMetadataFileWithGraph({
    filePath: FILE_PATH,
    sources: { yaml: "{}" },
    kind: "unknown",
    name: "X",
    graph,
    context: baseContext,
  }),
).rejects.toThrow('importRegisteredMetadataSourceWithGraph: неизвестный kind "unknown"')
```

- [ ] **Step 8: Commit top-level registrations**

```bash
git add packages/core/metadata/graphImport/registerTopLevelGraphImports.ts \
  packages/core/metadata/graphImport/registerDefaultGraphImports.ts \
  packages/core/metadata/graphImport/importMetadataFileWithGraph.ts \
  packages/core/metadata/orchestration/importMetadataFileWithGraph.ts \
  packages/core/metadata/orchestration/importMetadataFileWithGraph.test.ts
git commit -m "refactor: :recycle: вынести регистрации объектов из orchestration"
```

## Task 3: Внешняя Регистрация Формы И Парного Файла

**Files:**
- Create: `packages/core/metadata/graphImport/registerFormGraphImport.ts`
- Modify: `packages/core/metadata/graphImport/registerDefaultGraphImports.ts`
- Modify: `packages/core/metadata/orchestration/importMetadataFileWithGraph.test.ts`
- Modify: `packages/core/metadata/orchestration/buildGraph/buildGraphForChangedFile.test.ts`

- [ ] **Step 1: Run existing form tests to capture current behavior**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/orchestration/importMetadataFileWithGraph.test.ts -t "form"
```

Expected before implementation: FAIL because the form kind is not registered after Task 2.

- [ ] **Step 2: Implement form registration outside orchestration**

Create `packages/core/metadata/graphImport/registerFormGraphImport.ts`:

```ts
import { createEmptyClientApplicationForm } from "~/metadata/forms/clientApplicationForm/createEmpty"
import { importClientApplicationFormFromYAML } from "~/metadata/forms/clientApplicationForm/fromYAML"
import { parseClientApplicationFormFromNKDK } from "~/metadata/forms/clientApplicationForm/parseNKDK"
import { ClientApplicationFormRules } from "~/metadata/forms/clientApplicationForm/rules"
import {
  registerGraphImport,
  toGraphModel,
  type GraphImportSourceMatch,
} from "~/metadata/orchestration/graphImport/registry"

export function registerFormGraphImport(): void {
  registerGraphImport({
    kind: "form",
    phase: 1,
    includeStubEdgesInChangedFile: true,
    matchPath: matchFormPath,
    importModel: async ({ context, parsed, sources }) => {
      const nkdkModel = sources.paired?.text
        ? await parseClientApplicationFormFromNKDK(context, sources.paired.text)
        : createEmptyClientApplicationForm()

      const model = importClientApplicationFormFromYAML(context, parsed.data, nkdkModel)
      return {
        model,
        graphModel: toGraphModel(model),
        rule: ClientApplicationFormRules,
      }
    },
    declareRoot: ({ graph, name, pathParams }) => {
      const ownerNodeId = pathParams.ownerNodeId
      if (!ownerNodeId) {
        throw new Error("importMetadataFileWithGraph: form kind требует ownerNodeId")
      }

      const formNodeId = `${ownerNodeId}.Форма.${name}`
      graph.ensureNode(ownerNodeId, { name: ownerNodeId.split(".").pop() ?? ownerNodeId })
      graph.ensureNode(formNodeId, { name })
      graph.ensureEdge(ownerNodeId, formNodeId, "FORM", { yaml: "Форма" })
      return formNodeId
    },
    afterBuildGraph: ({ graph, parentNodeId, filePath, sources }) => {
      if (!sources.paired?.filePath) return

      graph.addContributedFilePath(parentNodeId, sources.paired.filePath)
      const visualPrefix = `${parentNodeId}.Элемент.`
      const visualNodeIds = [...graph.nodesWithPrefix(visualPrefix)]

      for (const nodeId of visualNodeIds) {
        graph.removeFilePath(nodeId, filePath)
        graph.addFilePath(nodeId, sources.paired.filePath)
      }

      for (const { source, target, attributes } of graph.edgeEntriesTouching(visualNodeIds)) {
        graph.ensureEdge(source, target, attributes.kind, { filePath: sources.paired.filePath })
      }
    },
  })
}

function matchFormPath(filePath: string): GraphImportSourceMatch | undefined {
  const parts = filePath.split("/")
  if (parts.length !== 5 || parts[2] !== "Формы" || parts[4] !== "Форма.yaml") return undefined

  const ownerDir = parts[0]!
  const ownerName = parts[1]!
  const formName = parts[3]!
  if (!["Справочник", "Документ", "Перечисление"].includes(ownerDir)) return undefined

  return {
    kind: "form",
    name: formName,
    pathParams: {
      ownerNodeId: `${ownerDir}.${ownerName}`,
      ownerDir,
      ownerName,
    },
  }
}
```

- [ ] **Step 3: Register forms in default graph imports**

Modify `packages/core/metadata/graphImport/registerDefaultGraphImports.ts`:

```ts
import { registerFormGraphImport } from "./registerFormGraphImport"
import { registerTopLevelGraphImports } from "./registerTopLevelGraphImports"

let registered = false

export function ensureDefaultGraphImportsRegistered(): void {
  if (registered) return
  registerTopLevelGraphImports()
  registerFormGraphImport()
  registered = true
}
```

- [ ] **Step 4: Run form import tests**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/orchestration/importMetadataFileWithGraph.test.ts -t "form"
```

Expected: PASS. If the test `form kind требует ownerNodeId` fails because `pathParams` no longer contains `ownerNodeId`, keep the exact old error message in `declareRoot`, as shown above.

- [ ] **Step 5: Run changed-file form test**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/orchestration/buildGraph/buildGraphForChangedFile.test.ts -t "Форма.nkdk"
```

Expected before Task 4: it can still PASS because changed-file logic is not yet universal. If it fails, do not restore form-specific code in `orchestration`; leave the fix to Task 4.

- [ ] **Step 6: Commit form registration**

```bash
git add packages/core/metadata/graphImport/registerFormGraphImport.ts \
  packages/core/metadata/graphImport/registerDefaultGraphImports.ts \
  packages/core/metadata/orchestration/importMetadataFileWithGraph.test.ts \
  packages/core/metadata/orchestration/buildGraph/buildGraphForChangedFile.test.ts
git commit -m "refactor: :recycle: вынести регистрацию форм из orchestration"
```

## Task 4: Универсальный buildGraph Через Реестр Путей

**Files:**
- Modify: `packages/core/metadata/orchestration/buildGraph/buildGraph.ts`
- Modify: `packages/core/metadata/orchestration/buildGraph/buildGraphForChangedFile.ts`
- Modify: `packages/core/metadata/orchestration/buildGraph/index.ts`
- Create: `packages/core/metadata/graphImport/buildGraph.ts`
- Modify: `packages/core/index.ts`
- Modify: `packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts`
- Modify: `packages/core/metadata/orchestration/buildGraph/buildGraphForChangedFile.test.ts`

- [ ] **Step 1: Add failing assertion that universal buildGraph has no concrete path names**

Add this test to `packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts`:

```ts
import { readFileSync } from "fs"
import { join } from "path"

it("универсальный buildGraph не содержит зашитые пути прикладных объектов", () => {
  const source = readFileSync(
    join(process.cwd(), "metadata/orchestration/buildGraph/buildGraph.ts"),
    "utf-8",
  )

  expect(source).not.toContain("Справочник")
  expect(source).not.toContain("Документ")
  expect(source).not.toContain("Перечисление")
  expect(source).not.toContain("Формы")
  expect(source).not.toContain("formEntries")
})
```

- [ ] **Step 2: Run the new assertion to verify it fails**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/orchestration/buildGraph/buildGraph.test.ts -t "универсальный buildGraph"
```

Expected: FAIL because `buildGraph.ts` still contains concrete path handling.

- [ ] **Step 3: Replace buildGraph.ts with registry-based implementation**

Replace `packages/core/metadata/orchestration/buildGraph/buildGraph.ts` with:

```ts
import type { ConfigurationContext } from "~/metadata/context/types"
import {
  importRegisteredMetadataSourceWithGraph,
} from "~/metadata/orchestration/graphImport/importRegisteredMetadataSourceWithGraph"
import {
  resolveGraphImportSource,
  type GraphImportSourceMatch,
} from "~/metadata/orchestration/graphImport/registry"
import { GraphBuilder } from "./internal/GraphBuilder"
import { walkGraphToFileData } from "./walkGraphToFileData"
import type {
  FileGraphData,
  ImportContext,
  ProjectGraphInput,
  ProjectGraphSource,
} from "./types"

const normalizeGraphSources = (input: ProjectGraphInput): ProjectGraphSource[] => {
  if (input instanceof Map) {
    return Array.from(input.entries()).map(([filePath, text]) => ({ filePath, text }))
  }
  return [...input]
}

const applySourceStats = (
  files: FileGraphData[],
  sources: readonly ProjectGraphSource[],
): FileGraphData[] => {
  const statsByPath = new Map<string, ProjectGraphSource["fileStats"]>()
  for (const source of sources) {
    statsByPath.set(source.filePath, source.fileStats)
    if (source.pairedText) {
      statsByPath.set(source.pairedText.filePath, source.pairedText.fileStats)
    }
  }
  return files.map((file) => {
    const fileStats = statsByPath.get(file.filePath)
    return fileStats ? { ...file, fileStats } : file
  })
}

export async function buildGraph(
  projectFiles: ProjectGraphInput,
  context: ImportContext,
): Promise<FileGraphData[]> {
  const sources = normalizeGraphSources(projectFiles)
  const graph = new GraphBuilder()
  const importContext: ConfigurationContext = context as ConfigurationContext

  const entries = sources
    .map((source) => ({ source, parsed: parseFilePath(source.filePath) }))
    .filter((entry): entry is { source: ProjectGraphSource; parsed: ParsedGraphSourcePath } => entry.parsed !== undefined)
    .sort((a, b) => a.parsed.phase - b.parsed.phase)

  for (const { source, parsed } of entries) {
    try {
      await importRegisteredMetadataSourceWithGraph({
        filePath: source.filePath,
        sources: {
          yaml: source.text,
          paired: source.pairedText,
        },
        kind: parsed.kind,
        name: parsed.name,
        pathParams: parsed.pathParams,
        graph,
        context: importContext,
      })
    } catch {
      // Контракт buildGraph прежний: собрать то, что точно понятно.
    }
  }

  return applySourceStats(walkGraphToFileData(graph), sources)
}

export interface ParsedGraphSourcePath extends GraphImportSourceMatch {
  phase: number
}

export function parseFilePath(filePath: string): ParsedGraphSourcePath | undefined {
  const match = resolveGraphImportSource(filePath)
  if (!match) return undefined
  return {
    ...match,
    phase: match.phase ?? 0,
  }
}
```

This keeps one existing `as ConfigurationContext`. Task 6 removes or isolates it if a narrower `ImportContext` change is practical without widening the refactor.

- [ ] **Step 4: Replace buildGraphForChangedFile.ts with registry-based implementation**

Replace `packages/core/metadata/orchestration/buildGraph/buildGraphForChangedFile.ts` with:

```ts
import type { ConfigurationContext } from "~/metadata/context/types"
import {
  importRegisteredMetadataSourceWithGraph,
} from "~/metadata/orchestration/graphImport/importRegisteredMetadataSourceWithGraph"
import { getGraphImportRegistration } from "~/metadata/orchestration/graphImport/registry"
import { GraphBuilder } from "./internal/GraphBuilder"
import { parseFilePath } from "./buildGraph"
import { walkGraphToFileData } from "./walkGraphToFileData"
import type { FileGraphData, ImportContext, ProjectGraphSource } from "./types"

export interface BuildGraphForChangedFileParams {
  projectPath: string
  filePath: string
  text: string
  context: ImportContext
  pairedText?: ProjectGraphSource["pairedText"]
}

export async function buildGraphForChangedFile(
  params: BuildGraphForChangedFileParams,
): Promise<FileGraphData[]> {
  const { filePath, text, context, pairedText } = params
  void params.projectPath

  const parsed = parseFilePath(filePath)
  if (!parsed) return []

  const graph = new GraphBuilder()
  const importContext: ConfigurationContext = context as ConfigurationContext

  await importRegisteredMetadataSourceWithGraph({
    filePath,
    sources: { yaml: text, paired: pairedText },
    kind: parsed.kind,
    name: parsed.name,
    pathParams: parsed.pathParams,
    graph,
    context: importContext,
  })

  const files = walkGraphToFileData(graph)
  const registration = getGraphImportRegistration(parsed.kind)
  if (registration?.includeStubEdgesInChangedFile) {
    const stub = files.find((file) => file.filePath === "")
    const changedFile = files.find((file) => file.filePath === filePath)
    if (stub && changedFile) {
      changedFile.edges.push(...stub.edges)
    }
  }
  return files.filter((file) => file.filePath !== "")
}
```

- [ ] **Step 5: Add public default buildGraph wrapper outside orchestration**

Create `packages/core/metadata/graphImport/buildGraph.ts`:

```ts
import {
  buildGraph as buildRegisteredGraph,
  buildGraphForChangedFile as buildRegisteredGraphForChangedFile,
} from "~/metadata/orchestration/buildGraph"
import type {
  BuildGraphForChangedFileParams,
  FileGraphData,
  ImportContext,
  ProjectGraphInput,
} from "~/metadata/orchestration/buildGraph"
import { ensureDefaultGraphImportsRegistered } from "./registerDefaultGraphImports"

export async function buildGraph(
  projectFiles: ProjectGraphInput,
  context: ImportContext,
): Promise<FileGraphData[]> {
  ensureDefaultGraphImportsRegistered()
  return buildRegisteredGraph(projectFiles, context)
}

export async function buildGraphForChangedFile(
  params: BuildGraphForChangedFileParams,
): Promise<FileGraphData[]> {
  ensureDefaultGraphImportsRegistered()
  return buildRegisteredGraphForChangedFile(params)
}
```

- [ ] **Step 6: Update exports**

In `packages/core/index.ts`, replace:

```ts
export { buildGraph, buildGraphForChangedFile } from "./metadata/orchestration/buildGraph"
```

with:

```ts
export { buildGraph, buildGraphForChangedFile } from "./metadata/graphImport/buildGraph"
```

In `packages/core/metadata/orchestration/buildGraph/index.ts`, replace the parsed path type export:

```ts
export type { ParsedFormPath, ParsedItemPath } from "./buildGraph"
```

with:

```ts
export type { ParsedGraphSourcePath } from "./buildGraph"
```

- [ ] **Step 7: Ensure tests register defaults when importing universal buildGraph directly**

At the top of `packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts`, add:

```ts
import { ensureDefaultGraphImportsRegistered } from "~/metadata/graphImport/registerDefaultGraphImports"

ensureDefaultGraphImportsRegistered()
```

At the top of `packages/core/metadata/orchestration/buildGraph/buildGraphForChangedFile.test.ts`, add the same two lines unless that file only tests the public wrapper.

- [ ] **Step 8: Run buildGraph tests**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/orchestration/buildGraph/buildGraph.test.ts metadata/orchestration/buildGraph/buildGraphForChangedFile.test.ts
```

Expected: PASS, including the new assertion that universal `buildGraph.ts` has no fixed object names.

- [ ] **Step 9: Commit universal buildGraph**

```bash
git add packages/core/metadata/orchestration/buildGraph/buildGraph.ts \
  packages/core/metadata/orchestration/buildGraph/buildGraphForChangedFile.ts \
  packages/core/metadata/orchestration/buildGraph/index.ts \
  packages/core/metadata/graphImport/buildGraph.ts \
  packages/core/index.ts \
  packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts \
  packages/core/metadata/orchestration/buildGraph/buildGraphForChangedFile.test.ts
git commit -m "refactor: :recycle: перевести buildGraph на реестр путей"
```

## Task 5: Guard Against Concrete Imports In Universal Core

**Files:**
- Create: `packages/core/metadata/orchestration/graphImport/noConcreteMetadataImports.test.ts`
- Modify: `.agents/architecture-orchestration.md`

- [ ] **Step 1: Write failing import-guard test**

Create `packages/core/metadata/orchestration/graphImport/noConcreteMetadataImports.test.ts`:

```ts
import { readdirSync, readFileSync, statSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"

const UNIVERSAL_GRAPH_IMPORT_DIR = join(process.cwd(), "metadata/orchestration/graphImport")

describe("orchestration graphImport universal core", () => {
  it("не импортирует конкретные appliedObjects/forms", () => {
    const offenders = listTypeScriptFiles(UNIVERSAL_GRAPH_IMPORT_DIR)
      .map((filePath) => ({
        filePath,
        content: readFileSync(filePath, "utf-8"),
      }))
      .filter(({ content }) =>
        content.includes("~/metadata/appliedObjects/") ||
        content.includes("~/metadata/forms/") ||
        content.includes("../../appliedObjects/") ||
        content.includes("../../forms/"),
      )
      .map(({ filePath }) => filePath.replace(`${process.cwd()}/`, ""))

    expect(offenders).toEqual([])
  })
})

function listTypeScriptFiles(dir: string): string[] {
  const result: string[] = []
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      result.push(...listTypeScriptFiles(fullPath))
      continue
    }
    if (entry.endsWith(".ts") && !entry.endsWith(".test.ts")) {
      result.push(fullPath)
    }
  }
  return result
}
```

- [ ] **Step 2: Run the guard**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/orchestration/graphImport/noConcreteMetadataImports.test.ts
```

Expected: PASS if Tasks 1-4 kept concrete imports outside `metadata/orchestration/graphImport`.

- [ ] **Step 3: Clarify architecture doc guard boundary**

In `.agents/architecture-orchestration.md`, extend the "Универсальность слоя" section with this paragraph:

```md
Автоматическая проверка первой очереди покрывает универсальное графовое ядро `orchestration/graphImport`: там не должно быть прямых импортов конкретных appliedObjects/forms. Исторические formElement/property-модули могут требовать отдельного будущего разреза; при изменении графового импорта не расширяй их связанность и не добавляй новую конкретику в универсальное ядро.
```

- [ ] **Step 4: Run documentation diff check**

Run:

```bash
git diff --check
```

Expected: no output and exit code 0.

- [ ] **Step 5: Commit guard and doc clarification**

```bash
git add packages/core/metadata/orchestration/graphImport/noConcreteMetadataImports.test.ts \
  .agents/architecture-orchestration.md
git commit -m "test: :white_check_mark: закрепить универсальность graphImport"
```

## Task 6: Type Cast Audit And Local Verification

**Files:**
- Modify if needed: `packages/core/metadata/orchestration/graphImport/*.ts`
- Modify if needed: `packages/core/metadata/graphImport/*.ts`
- Modify if needed: `packages/core/metadata/orchestration/buildGraph/*.ts`

- [ ] **Step 1: Search for new broad casts**

Run:

```bash
rg -n "as any|as unknown" packages/core/metadata/orchestration/graphImport packages/core/metadata/graphImport packages/core/metadata/orchestration/buildGraph
```

Expected: no matches in newly created files. Existing `as ConfigurationContext` in `buildGraph.ts` and `buildGraphForChangedFile.ts` is a narrow cast; either remove it by changing `ImportContext` to extend `ConfigurationContext`, or leave it documented in the next step.

- [ ] **Step 2: Prefer removing the ConfigurationContext casts**

If TypeScript accepts it, modify `packages/core/metadata/orchestration/buildGraph/types.ts`:

```ts
import type { ConfigurationContext } from "~/metadata/context/types"

export interface ImportContext extends Pick<ConfigurationContext, "version" | "defaultLanguage"> {}
```

Then in `buildGraph.ts` and `buildGraphForChangedFile.ts`, remove:

```ts
const importContext: ConfigurationContext = context as ConfigurationContext
```

and pass `context` directly:

```ts
context,
```

If TypeScript rejects this because `ConfigurationContext` has required fields not present in `ImportContext`, keep the narrow cast and add this comment above it in both files:

```ts
// buildGraph публично принимает узкий ImportContext; графовые импортёры ожидают общий ConfigurationContext.
// Расширение контекста вынесено в отдельную задачу, чтобы не смешивать его с развязкой регистраций.
```

- [ ] **Step 3: Run type-check for core**

Run:

```bash
pnpm --filter @nakidka/core type-check
```

Expected: PASS.

- [ ] **Step 4: Run focused graph import tests**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/orchestration/graphImport metadata/orchestration/buildGraph metadata/orchestration/importMetadataFileWithGraph.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit cast cleanup if files changed**

If Step 2 changed files, commit them:

```bash
git add packages/core/metadata/orchestration/buildGraph/types.ts \
  packages/core/metadata/orchestration/buildGraph/buildGraph.ts \
  packages/core/metadata/orchestration/buildGraph/buildGraphForChangedFile.ts
git commit -m "refactor: :recycle: уточнить тип контекста buildGraph"
```

If Step 2 did not change files, do not create an empty commit.

## Task 7: Full Verification

**Files:**
- No planned file changes.

- [ ] **Step 1: Generate Langium files if this is a fresh worktree**

Run:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected: command exits 0. If it changes generated files in this branch, inspect them with `git status --short` and keep only changes that are expected for this repository state.

- [ ] **Step 2: Run full project tests**

Run:

```bash
pnpm test
```

Expected: all package test suites pass.

- [ ] **Step 3: Check final git status**

Run:

```bash
git status --short
```

Expected: either clean working tree, or only intentional files already committed by earlier tasks.

- [ ] **Step 4: Final commit if verification required small fixes**

If verification required a small fix, commit it with the most precise message:

```bash
git add <changed-files>
git commit -m "fix: :bug: исправить универсальный графовый импорт"
```

If there are no changes after verification, do not create a commit.

## Self-Review

Spec coverage:

- Универсальный реестр: Task 1.
- Конкретика вне `orchestration`: Tasks 2 and 3.
- Путь `source -> model -> graph`: Tasks 1 and 4.
- Парные файлы: Tasks 1, 3, and 4.
- Тестовый фиктивный тип: Task 1.
- Защита от direct imports в универсальном ядре: Task 5.
- Минимизация `as any` / `as unknown`: Task 6.
- Полная проверка проекта: Task 7.

Placeholder scan: план не использует незаполненные маркеры; каждый шаг содержит конкретный файл, команду или код.

Type consistency: основные имена едины по плану: `registerGraphImport`, `resolveGraphImportSource`, `importRegisteredMetadataSourceWithGraph`, `declareMetadataItemGraphRoot`, `ensureDefaultGraphImportsRegistered`.
