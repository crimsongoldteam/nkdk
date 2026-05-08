# Graph Package Interface Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Завершить нулевой этап спеки `2026-04-27-graph-package-interface-design.md`: убрать `graphology` и слой `metadata/relations/`, отвязать `buildGraph` от `MetadataGraph`, удалить мёртвый код CLI/extension, оставив только `@nakidka/graph` и чистые правила в `@nakidka/core`.

**Architecture:** Этапы 1a–1d спеки уже завершены: пакет `@nakidka/graph` (`updateGraph`/`withGraph`) реализован, `BuildGraphFromModelFunction` уже чистая, есть `flattenItem`, `walkGraphToFileData`, `buildGraph(yamlFiles, context)`. Однако `buildGraph` всё ещё использует `new MetadataGraph()` как **промежуточный** in-memory буфер на graphology, а слой `metadata/relations/` экспортирует мёртвые потребители (walker, validateProject, referenceScope-функцию, getDependencies, resolveFormLocalPath, ...). Этот план: (1) заменяет `MetadataGraph` на лёгкий plain-`GraphBuilder` (Map+массив, без graphology) внутри `buildGraph/internal/`, (2) удаляет всё, что больше не нужно, (3) убирает зависимость `graphology` из `@nakidka/core`.

**Tech Stack:** TypeScript, Vitest, pnpm workspaces. После миграции `@nakidka/core` теряет зависимость `graphology@^0.26.0`; FalkorDB остаётся только в `@nakidka/graph`.

---

## Файловая структура

**Создаём:**
- `packages/core/metadata/orchestration/buildGraph/internal/GraphBuilder.ts` — plain in-memory структура (Map<id, NodeRecord> + Edge[]) с минимальным API (`ensureNode`, `addFilePath`, `removeFilePath`, `setItem`, `ensureEdge`, `outEdges`, `nodes()`, `getNodeAttributes()`), нужным `applyGraphOps` и `walkGraphToFileData`. Без graphology.
- `packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.ts` — переезд из `metadata/relations/applyGraphOps.ts` с адаптацией под `GraphBuilder`.
- `packages/core/metadata/orchestration/buildGraph/internal/edgeKinds.ts` — переезд `registerEdgeKind`/`getKindByYaml`/`isOwning` из `metadata/relations/edgeKinds.ts` (уже без зависимости от graphology).

**Модифицируем:**
- `packages/core/metadata/orchestration/buildGraph/buildGraph.ts` — `new MetadataGraph()` → `new GraphBuilder()`.
- `packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.ts` — параметр `MetadataGraph` → `GraphBuilder`.
- `packages/core/metadata/orchestration/importMetadataFileWithGraph.ts` — параметр `graph: MetadataGraph` → `GraphBuilder`; импорт `getKindByYaml` — из `internal/edgeKinds`.
- `packages/core/metadata/orchestration/property/types.ts` — импорт типа `ReferenceScope` локализуется (тип переносится сюда же), функцию `validateReferenceScope` не импортирует никто.
- `packages/core/metadata/forms/commonObjects/{associatedTable,commandName,formCommand,dataPath,formAttribute}/graphFromModel.ts` — импорты `registerEdgeKind`/`getKindByYaml` → новый путь `buildGraph/internal/edgeKinds`.
- Тесты `graphFromModel.test.ts` (commonObjects/forms) — `MetadataGraph` + `applyGraphOps` → `GraphBuilder` + новый внутренний `applyGraphOps`.
- `packages/core/metadata/appliedObjects/metadataCatalog/fromYAML.dependencies.test.ts`, `metadataEnumeration/fromYAML.test.ts` — переписать на проверку `FileGraphData[]` через `buildGraph(...)` (или удалить, если дублирует `buildGraph.test.ts`).
- `packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.test.ts` — заменить setup на `GraphBuilder`.
- `packages/core/index.ts` — удалить публичные ре-экспорты `MetadataGraph`, `walk`, `validateReferenceScope`, тип `ReferenceScope` оставить (re-export из `property/types.ts`).
- `packages/core/package.json` — удалить `graphology`.
- `packages/cli/src/commands/updateGraph.ts` — упростить до `await updateGraph(buildGraph(yamlFiles, context))` (цепочка через `MetadataGraph` уходит).
- `packages/extension/src/extension/main.ts` — снять регистрацию provider'ов и `workspaceGraph`.

**Удаляем:**
- `packages/core/metadata/relations/` целиком (все 17 файлов: `MetadataGraph.{ts,test.ts}`, `GraphWalker.{ts,test.ts}`, `applyGraphOps.{ts,test.ts}` — старые версии, `addRelation.{ts,test.ts}`, `edgeKinds.{ts,test.ts}` — старые, `referenceScope.{ts,test.ts}`, `resolveFormLocalPath.{ts,test.ts}`, `autocompletePath.ts`, `existPath.ts`, `getDependencies.ts`, `dependencyQuery.ts`, `graph.ts`).
- `packages/core/metadata/validation/validateProject.ts` (+ его тесты, если есть).
- `packages/core/metadata/forms/commonObjects/dataPath/isDynamicListAttribute.{ts,test.ts}`.
- `packages/cli/src/commands/validate.ts` и регистрация в `cli/src/index.ts`.
- `packages/extension/src/extension/{workspaceGraph,definitionProvider,completionProvider,diagnosticProvider}.ts` (+ их тесты).

---

## Фаза 0: Подготовка ветки

### Task 0.1: Создать рабочую ветку

**Files:** —

- [ ] **Step 1: Создать ветку от develop**

```bash
git checkout develop
git pull
git checkout -b feat/graph-package-interface-migration
```

- [ ] **Step 2: Прогнать `pnpm test`, зафиксировать baseline зелёных тестов**

Run: `pnpm test 2>&1 | tail -40`
Expected: все пакеты зелёные. Если уже что-то падает — это baseline до миграции; запиши число падающих в комментарий следующего коммита, чтобы регрессии было видно.

---

## Фаза 1: Внутренний `GraphBuilder` без graphology

Цель: получить лёгкую plain-структуру с тем же поведением, которое сейчас даёт `MetadataGraph` для `applyGraphOps`/`walkGraphToFileData`. Никаких лишних методов (`getBrokenReferences`, `invalidateFile` в полном виде — не нужны после миграции).

### Task 1.1: Зафиксировать минимальный API, нужный потребителям

**Files:**
- Read: `packages/core/metadata/relations/MetadataGraph.ts`
- Read: `packages/core/metadata/relations/applyGraphOps.ts`
- Read: `packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.ts`
- Read: `packages/core/metadata/orchestration/importMetadataFileWithGraph.ts`

- [ ] **Step 1: Выписать список реально вызываемых методов**

Прочитать четыре файла выше и выписать в комментарий следующего коммита (в плане) — какие методы `MetadataGraph` фактически дёргаются. Ожидаемый набор (по разведке):

```
hasNode(id) -> boolean
ensureNode(id, attrs?) -> void               // создать узел или ничего
addFilePath(id, filePath) -> void            // дописать в filePaths
removeFilePath(id, filePath) -> void
setItem(id, item) -> void                    // заменить attrs.item
getNodeAttributes(id) -> { name, item, filePaths }
setNodeAttribute(id, key, value) -> void     // если применимо
ensureEdge(src, tgt, kind, attrs?) -> void   // мульти-граф по (src, tgt, kind)
outEdgeEntries(id) -> Iterable<{ target, attributes }>
outEdges(id) -> Iterable<edgeId>             // если используется
nodes() -> Iterable<id>
```

Если в коде встречается метод вне списка — добавить в `GraphBuilder`. Если есть метод, который вызывается **только** из `metadata/relations/*.ts` (которые мы удалим) — в новый `GraphBuilder` не переносить.

- [ ] **Step 2: Закоммитить эту страницу плана**

```bash
git add docs/superpowers/plans/2026-04-28-graph-package-interface-migration.md
git commit -m "docs: :memo: план миграции пакета graph"
```

### Task 1.2: Создать `GraphBuilder` с тестами (TDD)

**Files:**
- Create: `packages/core/metadata/orchestration/buildGraph/internal/GraphBuilder.ts`
- Test: `packages/core/metadata/orchestration/buildGraph/internal/GraphBuilder.test.ts`

- [ ] **Step 1: Написать падающий тест на ensureNode + getNodeAttributes**

```ts
// GraphBuilder.test.ts
import { describe, expect, it } from "vitest"
import { GraphBuilder } from "./GraphBuilder"

describe("GraphBuilder", () => {
  it("ensureNode создаёт узел с пустыми атрибутами", () => {
    const g = new GraphBuilder()
    g.ensureNode("Справочник.Клиенты")
    expect(g.hasNode("Справочник.Клиенты")).toBe(true)
    expect(g.getNodeAttributes("Справочник.Клиенты")).toEqual({
      name: undefined,
      item: undefined,
      filePaths: [],
    })
  })
})
```

- [ ] **Step 2: Прогнать — должен упасть с "GraphBuilder is not defined"**

Run: `pnpm --filter @nakidka/core test -- GraphBuilder`
Expected: FAIL.

- [ ] **Step 3: Минимальная реализация под этот тест**

```ts
// GraphBuilder.ts
export interface NodeAttributes {
  name?: string
  item?: unknown
  filePaths: string[]
}

export interface EdgeAttributes {
  kind: string
  yaml?: string
  index?: number
  [key: string]: unknown
}

export class GraphBuilder {
  private readonly nodesMap = new Map<string, NodeAttributes>()

  hasNode(id: string): boolean {
    return this.nodesMap.has(id)
  }

  ensureNode(id: string, attrs?: Partial<NodeAttributes>): void {
    const existing = this.nodesMap.get(id)
    if (existing) {
      if (attrs?.name !== undefined && existing.name === undefined) existing.name = attrs.name
      if (attrs?.item !== undefined && existing.item === undefined) existing.item = attrs.item
      return
    }
    this.nodesMap.set(id, {
      name: attrs?.name,
      item: attrs?.item,
      filePaths: attrs?.filePaths ? [...attrs.filePaths] : [],
    })
  }

  getNodeAttributes(id: string): NodeAttributes {
    const a = this.nodesMap.get(id)
    if (!a) throw new Error(`Unknown node: ${id}`)
    return a
  }
}
```

- [ ] **Step 4: Тест зелёный**

Run: `pnpm --filter @nakidka/core test -- GraphBuilder`
Expected: PASS.

- [ ] **Step 5: Тест на addFilePath / removeFilePath**

```ts
it("addFilePath дописывает уникально", () => {
  const g = new GraphBuilder()
  g.ensureNode("X")
  g.addFilePath("X", "a.yaml")
  g.addFilePath("X", "a.yaml")
  g.addFilePath("X", "b.yaml")
  expect(g.getNodeAttributes("X").filePaths).toEqual(["a.yaml", "b.yaml"])
})

it("removeFilePath удаляет указанный путь", () => {
  const g = new GraphBuilder()
  g.ensureNode("X")
  g.addFilePath("X", "a.yaml")
  g.addFilePath("X", "b.yaml")
  g.removeFilePath("X", "a.yaml")
  expect(g.getNodeAttributes("X").filePaths).toEqual(["b.yaml"])
})
```

Реализовать:

```ts
addFilePath(id: string, filePath: string): void {
  const a = this.getNodeAttributes(id)
  if (!a.filePaths.includes(filePath)) a.filePaths.push(filePath)
}

removeFilePath(id: string, filePath: string): void {
  const a = this.getNodeAttributes(id)
  const idx = a.filePaths.indexOf(filePath)
  if (idx >= 0) a.filePaths.splice(idx, 1)
}
```

Run: `pnpm --filter @nakidka/core test -- GraphBuilder`
Expected: PASS.

- [ ] **Step 6: Тест и реализация setItem**

```ts
it("setItem заменяет item на узле", () => {
  const g = new GraphBuilder()
  g.ensureNode("X")
  g.setItem("X", { itemType: "MetadataCatalog", name: "Клиенты" })
  expect(g.getNodeAttributes("X").item).toEqual({ itemType: "MetadataCatalog", name: "Клиенты" })
})
```

```ts
setItem(id: string, item: unknown): void {
  const a = this.getNodeAttributes(id)
  a.item = item
  if (item && typeof item === "object" && "name" in item && typeof (item as { name: unknown }).name === "string") {
    a.name = (item as { name: string }).name
  }
}
```

Run: `pnpm --filter @nakidka/core test -- GraphBuilder`
Expected: PASS.

- [ ] **Step 7: Тест и реализация ensureEdge + outEdgeEntries**

```ts
it("ensureEdge добавляет ребро (мульти-граф по kind)", () => {
  const g = new GraphBuilder()
  g.ensureNode("A"); g.ensureNode("B")
  g.ensureEdge("A", "B", "VALUE", { yaml: "Значение" })
  g.ensureEdge("A", "B", "OBJECT", { yaml: "Объект" })
  const out = [...g.outEdgeEntries("A")]
  expect(out).toEqual([
    { target: "B", attributes: { kind: "VALUE", yaml: "Значение" } },
    { target: "B", attributes: { kind: "OBJECT", yaml: "Объект" } },
  ])
})

it("ensureEdge идемпотентен по (src, tgt, kind)", () => {
  const g = new GraphBuilder()
  g.ensureNode("A"); g.ensureNode("B")
  g.ensureEdge("A", "B", "VALUE", { yaml: "v1" })
  g.ensureEdge("A", "B", "VALUE", { yaml: "v2" })   // обновляет attrs
  expect([...g.outEdgeEntries("A")]).toEqual([
    { target: "B", attributes: { kind: "VALUE", yaml: "v2" } },
  ])
})
```

Реализация:

```ts
private readonly edges: Array<{ src: string; tgt: string; attrs: EdgeAttributes }> = []

ensureEdge(src: string, tgt: string, kind: string, attrs: Omit<EdgeAttributes, "kind"> = {}): void {
  const existing = this.edges.find(e => e.src === src && e.tgt === tgt && e.attrs.kind === kind)
  if (existing) {
    Object.assign(existing.attrs, attrs)
    return
  }
  this.edges.push({ src, tgt, attrs: { kind, ...attrs } })
}

*outEdgeEntries(src: string): Iterable<{ target: string; attributes: EdgeAttributes }> {
  for (const e of this.edges) {
    if (e.src === src) yield { target: e.tgt, attributes: e.attrs }
  }
}
```

Run: `pnpm --filter @nakidka/core test -- GraphBuilder`
Expected: PASS.

- [ ] **Step 8: Тест и реализация nodes()**

```ts
it("nodes() обходит все добавленные узлы", () => {
  const g = new GraphBuilder()
  g.ensureNode("A"); g.ensureNode("B"); g.ensureNode("C")
  expect([...g.nodes()].sort()).toEqual(["A", "B", "C"])
})
```

```ts
*nodes(): Iterable<string> {
  for (const id of this.nodesMap.keys()) yield id
}
```

Run: `pnpm --filter @nakidka/core test -- GraphBuilder`
Expected: PASS.

- [ ] **Step 9: Коммит**

```bash
git add packages/core/metadata/orchestration/buildGraph/internal/GraphBuilder.ts \
        packages/core/metadata/orchestration/buildGraph/internal/GraphBuilder.test.ts
git commit -m "feat: :sparkles: GraphBuilder — внутренний in-memory буфер без graphology"
```

### Task 1.3: Дополнить `GraphBuilder` методами, выявленными при сверке с `applyGraphOps`/`importMetadataFileWithGraph`

**Files:**
- Modify: `packages/core/metadata/orchestration/buildGraph/internal/GraphBuilder.ts`
- Test: `packages/core/metadata/orchestration/buildGraph/internal/GraphBuilder.test.ts`

- [ ] **Step 1: Прочитать `applyGraphOps.ts` и `importMetadataFileWithGraph.ts`, выписать пропущенные вызовы**

Run: `grep -n "graph\." packages/core/metadata/relations/applyGraphOps.ts packages/core/metadata/orchestration/importMetadataFileWithGraph.ts`

Для каждого `graph.<метод>` — проверить, есть ли он в `GraphBuilder`. Если нет — следующий step добавить.

- [ ] **Step 2 ... N: Под каждый недостающий метод — TDD-цикл (тест → fail → реализация → pass → коммит)**

Шаблон шага:

```ts
it("<имя метода>: ожидаемое поведение", () => {
  // ... фиксируется поведение из вызывающего кода
})
```

Реализация — по существующему API `MetadataGraph.ts`. Не копировать наследование graphology — только plain Map/Array.

- [ ] **Step Final: Все тесты GraphBuilder зелёные**

Run: `pnpm --filter @nakidka/core test -- GraphBuilder`
Expected: PASS, все методы покрыты.

```bash
git add packages/core/metadata/orchestration/buildGraph/internal/GraphBuilder.{ts,test.ts}
git commit -m "feat: :sparkles: GraphBuilder — добавлены недостающие методы"
```

---

## Фаза 2: Перенос `applyGraphOps` и `edgeKinds` в `buildGraph/internal/`

Цель: обрезать связь `applyGraphOps` со старым `metadata/relations/`, чтобы дальше можно было удалить эту папку целиком.

### Task 2.1: Перенести `edgeKinds.ts` в `buildGraph/internal/`

**Files:**
- Create: `packages/core/metadata/orchestration/buildGraph/internal/edgeKinds.ts`
- Read: `packages/core/metadata/relations/edgeKinds.ts`

- [ ] **Step 1: Скопировать содержимое `metadata/relations/edgeKinds.ts` в новый файл**

Run: `cp packages/core/metadata/relations/edgeKinds.ts packages/core/metadata/orchestration/buildGraph/internal/edgeKinds.ts`

- [ ] **Step 2: Точечно поправить импорты в новом файле, если они ссылаются обратно на `metadata/relations/`**

Если внутри edgeKinds.ts нет relative-импортов на graphology — пропустить шаг.

- [ ] **Step 3: Создать тесты-обёртки на тот же API**

Перенести `metadata/relations/edgeKinds.test.ts` тем же путём (`internal/edgeKinds.test.ts`), точечно обновить импорты, удостовериться что тесты зелёные.

Run: `pnpm --filter @nakidka/core test -- internal/edgeKinds`
Expected: PASS.

- [ ] **Step 4: Заменить импорты `~/metadata/relations/edgeKinds` на новый путь во всех файлах**

Run:
```bash
grep -rln "metadata/relations/edgeKinds" packages/core --include="*.ts"
```

Для каждого файла из выдачи — `Edit` на новом пути:
- `~/metadata/orchestration/buildGraph/internal/edgeKinds`

(затронутые: `forms/commonObjects/{associatedTable,commandName,formCommand,dataPath}/graphFromModel.ts`, `orchestration/importMetadataFileWithGraph.ts`, `validation/validateProject.ts` — если ещё есть)

- [ ] **Step 5: pnpm test (full)**

Run: `pnpm test 2>&1 | tail -20`
Expected: всё зелёное (или такое же baseline, как в Task 0.1).

- [ ] **Step 6: Коммит**

```bash
git add packages/core
git commit -m "refactor: :recycle: edgeKinds переезжает в buildGraph/internal"
```

### Task 2.2: Перенести и адаптировать `applyGraphOps` под `GraphBuilder`

**Files:**
- Read: `packages/core/metadata/relations/applyGraphOps.ts`, `applyGraphOps.test.ts`
- Create: `packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.ts`
- Test: `packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.test.ts`

- [ ] **Step 1: Скопировать `applyGraphOps.{ts,test.ts}` в новую локацию**

```bash
cp packages/core/metadata/relations/applyGraphOps.ts \
   packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.ts
cp packages/core/metadata/relations/applyGraphOps.test.ts \
   packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.test.ts
```

- [ ] **Step 2: Заменить импорты `MetadataGraph` → `GraphBuilder` в обоих файлах**

Все вхождения:
- `import { MetadataGraph } from "~/metadata/relations/MetadataGraph"` → `import { GraphBuilder } from "./GraphBuilder"`
- Тип параметра `graph: MetadataGraph` → `graph: GraphBuilder`

- [ ] **Step 3: Поправить относительный импорт `edgeKinds`**

Внутри `applyGraphOps.ts`: `~/metadata/relations/edgeKinds` → `./edgeKinds`.

- [ ] **Step 4: Прогнать тесты**

Run: `pnpm --filter @nakidka/core test -- internal/applyGraphOps`
Expected: PASS. Если падает — выяснить, какой метод `MetadataGraph` использовался, и докрутить `GraphBuilder` (Task 1.3 — итеративно).

- [ ] **Step 5: Коммит**

```bash
git add packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.{ts,test.ts}
git commit -m "refactor: :recycle: applyGraphOps переезжает в buildGraph/internal и работает на GraphBuilder"
```

### Task 2.3: Переключить публичный orchestrator `buildGraphFromModel.ts` на новый `applyGraphOps`

**Files:**
- Modify: `packages/core/metadata/orchestration/buildGraphFromModel.ts`

- [ ] **Step 1: Найти импорт `applyGraphOps` в `buildGraphFromModel.ts`**

Run: `grep -n "applyGraphOps" packages/core/metadata/orchestration/buildGraphFromModel.ts`

- [ ] **Step 2: Заменить путь импорта**

`~/metadata/relations/applyGraphOps` → `./buildGraph/internal/applyGraphOps`

Если в orchestrator-е есть параметр типа `MetadataGraph` — заменить на `GraphBuilder`. Если этот orchestrator вызывается извне с `MetadataGraph`, оставить адаптер на следующий шаг.

- [ ] **Step 3: Прогнать full test**

Run: `pnpm test 2>&1 | tail -20`
Expected: zelёное.

- [ ] **Step 4: Коммит**

```bash
git add packages/core/metadata/orchestration/buildGraphFromModel.ts
git commit -m "refactor: :recycle: buildGraphFromModel использует internal/applyGraphOps"
```

---

## Фаза 3: Перевести `buildGraph` и `walkGraphToFileData` на `GraphBuilder`

### Task 3.1: `walkGraphToFileData(graph: GraphBuilder)`

**Files:**
- Modify: `packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.ts`
- Modify: `packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.test.ts`

- [ ] **Step 1: Поменять тип параметра в реализации**

```ts
// walkGraphToFileData.ts
import { GraphBuilder } from "./internal/GraphBuilder"
// ...
export function walkGraphToFileData(graph: GraphBuilder): FileGraphData[] {
  // тело — как было, поскольку API GraphBuilder симметричен MetadataGraph
}
```

- [ ] **Step 2: Поменять setup в тестах**

В `walkGraphToFileData.test.ts` все `new MetadataGraph()` → `new GraphBuilder()`. Импорт — `from "./internal/GraphBuilder"`.

- [ ] **Step 3: Прогнать тесты**

Run: `pnpm --filter @nakidka/core test -- walkGraphToFileData`
Expected: PASS.

- [ ] **Step 4: Коммит**

```bash
git add packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.{ts,test.ts}
git commit -m "refactor: :recycle: walkGraphToFileData принимает GraphBuilder"
```

### Task 3.2: `buildGraph` использует `GraphBuilder`

**Files:**
- Modify: `packages/core/metadata/orchestration/buildGraph/buildGraph.ts`

- [ ] **Step 1: Заменить импорт и инстанс**

```ts
// buildGraph.ts
import { GraphBuilder } from "./internal/GraphBuilder"
// ...
const graph = new GraphBuilder()
```

- [ ] **Step 2: Прогнать тесты**

Run: `pnpm --filter @nakidka/core test -- buildGraph`
Expected: PASS (включая существующие 5 smoke-тестов).

- [ ] **Step 3: Коммит**

```bash
git add packages/core/metadata/orchestration/buildGraph/buildGraph.ts
git commit -m "refactor: :recycle: buildGraph использует GraphBuilder, не MetadataGraph"
```

### Task 3.3: `importMetadataFileWithGraph` принимает `GraphBuilder`

**Files:**
- Modify: `packages/core/metadata/orchestration/importMetadataFileWithGraph.ts`
- Modify: `packages/core/metadata/orchestration/importMetadataFileWithGraph.test.ts`

- [ ] **Step 1: Заменить тип параметра**

В `importMetadataFileWithGraph.ts`:
- `import type { MetadataGraph } from "~/metadata/relations/MetadataGraph"` → `import type { GraphBuilder } from "./buildGraph/internal/GraphBuilder"`
- параметр `graph: MetadataGraph` → `graph: GraphBuilder`

- [ ] **Step 2: Заменить setup в тесте**

`new MetadataGraph()` → `new GraphBuilder()` (импорт из `./buildGraph/internal/GraphBuilder`).

- [ ] **Step 3: Прогнать тесты**

Run: `pnpm --filter @nakidka/core test -- importMetadataFileWithGraph`
Expected: PASS.

- [ ] **Step 4: Коммит**

```bash
git add packages/core/metadata/orchestration/importMetadataFileWithGraph.{ts,test.ts}
git commit -m "refactor: :recycle: importMetadataFileWithGraph принимает GraphBuilder"
```

---

## Фаза 4: Миграция тестов `graphFromModel.test.ts`

Цель: после этой фазы ни один файл core не импортирует из `metadata/relations/`. Тесты `graphFromModel.test.ts` (commonObjects/forms) сейчас делают `new MetadataGraph()` + `applyGraphOps()` — нужно переключить их на `GraphBuilder` + новый `applyGraphOps` из `buildGraph/internal/`.

### Task 4.1: Переключить тесты commonObjects

**Files:**
- Modify: `packages/core/metadata/commonObjects/typeDescription/graphFromModel.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/graphFromModel.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataField/graphFromModel.test.ts`

- [ ] **Step 1: Заменить импорты в каждом файле**

Везде заменить:
- `import { MetadataGraph } from "~/metadata/relations/MetadataGraph"` → `import { GraphBuilder } from "~/metadata/orchestration/buildGraph/internal/GraphBuilder"`
- `import { applyGraphOps } from "~/metadata/relations/applyGraphOps"` → `import { applyGraphOps } from "~/metadata/orchestration/buildGraph/internal/applyGraphOps"`
- В коде: `new MetadataGraph()` → `new GraphBuilder()`

- [ ] **Step 2: Прогнать**

Run: `pnpm --filter @nakidka/core test -- commonObjects`
Expected: PASS.

- [ ] **Step 3: Коммит**

```bash
git add packages/core/metadata/commonObjects
git commit -m "test: :white_check_mark: commonObjects/graphFromModel — на GraphBuilder"
```

### Task 4.2: Переключить тесты forms/commonObjects

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/{associatedTable,formAttribute,commandName,dataPath,formCommand}/graphFromModel.test.ts`
- Modify: `packages/core/metadata/forms/elements/graphFromModel.test.ts`
- Modify: `packages/core/metadata/forms/elements/__tests__/fixtures.ts` (если использует MetadataGraph)
- Modify: `packages/core/metadata/forms/elements/table/rules.ts` (если импортирует из relations)
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/graphFromModel.ts` (если импортирует из relations)

- [ ] **Step 1: grep потребителей**

Run: `grep -rln "metadata/relations" packages/core/metadata/forms --include="*.ts"`

- [ ] **Step 2: Обновить каждый файл по тому же паттерну, что в Task 4.1**

Для каждого файла из выдачи — `Edit` импортов:
- `MetadataGraph` → `GraphBuilder` (новый путь)
- `applyGraphOps`, `edgeKinds`, `addRelation` (если используется) — на новые пути / на удаление

`addRelation` после фазы 5 удаляется. Если `forms/elements/table/rules.ts` импортирует `addRelation` — заменить на прямой `applyGraphOps` или эквивалентный конструктор `EdgeData`. Если нетривиально — выделить как **Task 4.2.X**: TDD → новая реализация в `internal/`.

- [ ] **Step 3: Прогнать**

Run: `pnpm --filter @nakidka/core test -- forms`
Expected: PASS.

- [ ] **Step 4: Коммит**

```bash
git add packages/core/metadata/forms
git commit -m "test: :white_check_mark: forms/graphFromModel — на GraphBuilder"
```

### Task 4.3: Тесты `appliedObjects` с `getDependencies` / `dependencyQuery`

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataCatalog/fromYAML.dependencies.test.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataEnumeration/fromYAML.test.ts`

- [ ] **Step 1: Понять, что проверяют эти тесты**

Прочитать каждый. Если они проверяют наличие конкретных рёбер/узлов — переписать на `buildGraph(yamlFiles, context)` + поиск нужных рёбер/узлов в `FileGraphData[]`.

- [ ] **Step 2: Переписать тесты**

Шаблон:

```ts
import { buildGraph } from "~/metadata/orchestration/buildGraph"

it("<сценарий>", () => {
  const result = buildGraph(new Map([
    ["Справочник/К/Свойства.yaml", "..."],
    // ...
  ]), { version: "8.3.21", defaultLanguage: "ru" })

  const allEdges = result.flatMap(f => f.edges)
  expect(allEdges).toContainEqual(expect.objectContaining({
    src: "Справочник.К.Реквизит.X",
    kind: "REF_TYPE",
    tgt: "Справочник.Y",
  }))
})
```

- [ ] **Step 3: Прогнать**

Run: `pnpm --filter @nakidka/core test -- appliedObjects`
Expected: PASS.

- [ ] **Step 4: Коммит**

```bash
git add packages/core/metadata/appliedObjects
git commit -m "test: :white_check_mark: appliedObjects fromYAML — проверка через buildGraph"
```

### Task 4.4: Сверить, что больше никто не импортирует из `metadata/relations/`

**Files:** —

- [ ] **Step 1: Grep оставшихся импортов**

Run: `grep -rln "metadata/relations" packages --include="*.ts" | grep -v "metadata/relations/"`

(Исключая сами файлы внутри папки.)

Expected: пустой вывод. Если что-то осталось — Task 4.X на этот файл (тот же паттерн).

- [ ] **Step 2: Прогнать full test**

Run: `pnpm test 2>&1 | tail -20`
Expected: всё зелёное.

---

## Фаза 5: Удалить `metadata/relations/`, мёртвый код в CLI и extension

### Task 5.1: Удалить публичные ре-экспорты из `packages/core/index.ts`

**Files:**
- Modify: `packages/core/index.ts`
- Modify: `packages/core/metadata/orchestration/property/types.ts` (перенос типа)

- [ ] **Step 1: Перенести тип `ReferenceScope` в `property/types.ts`**

Прочитать `packages/core/metadata/relations/referenceScope.ts`, скопировать **только декларации типов** (`ReferenceScope`, `ReferenceScopeThis`, `ReferenceScopeTopLevel`) в `property/types.ts` (или в новый файл `property/referenceScope.ts`, если уютнее). Функцию `validateReferenceScope` **не переносить** — её удаляем целиком.

- [ ] **Step 2: Обновить импорт `ReferenceScope` в `property/types.ts`**

Если до этого был `import type { ReferenceScope } from "~/metadata/relations/referenceScope"` — заменить на локальный.

- [ ] **Step 3: Удалить из `packages/core/index.ts` четыре строки**

```ts
// удалить:
export { MetadataGraph } from "./metadata/relations/MetadataGraph"
export { walk } from "./metadata/relations/GraphWalker"
export { validateReferenceScope } from "./metadata/relations/referenceScope"
export type { ReferenceScope } from "./metadata/relations/referenceScope"
```

При необходимости добавить:

```ts
export type { ReferenceScope } from "./metadata/orchestration/property/referenceScope"
```

- [ ] **Step 4: Проверить, что extension/cli не сломались на компиляции**

Run: `pnpm -r run type-check 2>&1 | tail -30`
Expected: либо чисто, либо ошибки **только** в файлах, которые удалим в следующих task'ах (workspaceGraph, validate, validateProject).

- [ ] **Step 5: Коммит**

```bash
git add packages/core/index.ts packages/core/metadata/orchestration/property
git commit -m "refactor: :fire: убраны публичные экспорты MetadataGraph/walk/validateReferenceScope"
```

### Task 5.2: Удалить мёртвый код в `packages/extension/`

**Files:**
- Delete: `packages/extension/src/extension/workspaceGraph.ts`
- Delete: `packages/extension/src/extension/definitionProvider.ts`
- Delete: `packages/extension/src/extension/completionProvider.ts`
- Delete: `packages/extension/src/extension/diagnosticProvider.ts`
- Delete: соответствующие `*.test.ts`, если есть
- Modify: `packages/extension/src/extension/main.ts`

- [ ] **Step 1: Прочитать `main.ts`, найти регистрации удаляемых provider'ов**

Run: `grep -n "workspaceGraph\|definitionProvider\|completionProvider\|diagnosticProvider" packages/extension/src/extension/main.ts`

- [ ] **Step 2: Удалить регистрации и импорты в `main.ts`**

Применить `Edit` к каждой строке регистрации и импорта.

- [ ] **Step 3: Удалить файлы**

```bash
git rm packages/extension/src/extension/workspaceGraph.ts \
       packages/extension/src/extension/definitionProvider.ts \
       packages/extension/src/extension/completionProvider.ts \
       packages/extension/src/extension/diagnosticProvider.ts
```

Если есть тесты этих файлов — также удалить.

- [ ] **Step 4: Прогнать тесты и type-check**

Run:
```
pnpm --filter @nakidka/extension type-check
pnpm test 2>&1 | tail -20
```
Expected: zelёное.

- [ ] **Step 5: Коммит**

```bash
git add packages/extension
git commit -m "refactor: :fire: удалён мёртвый код провайдеров расширения"
```

### Task 5.3: Удалить `nkdk validate` и `validateProject.ts`

**Files:**
- Delete: `packages/cli/src/commands/validate.ts`
- Delete: `packages/core/metadata/validation/validateProject.ts` (+ его тесты, если есть)
- Modify: `packages/cli/src/index.ts` (или там где регистрируется команда)

- [ ] **Step 1: Найти регистрацию команды validate**

Run: `grep -rn "validate" packages/cli/src --include="*.ts" | head`

- [ ] **Step 2: Снять регистрацию команды**

Удалить импорт `validate.ts` и его подключение к Commander/yargs.

- [ ] **Step 3: Удалить файлы**

```bash
git rm packages/cli/src/commands/validate.ts \
       packages/core/metadata/validation/validateProject.ts
```

Если есть `validateProject.test.ts` — тоже удалить.

- [ ] **Step 4: Прогнать**

Run: `pnpm test 2>&1 | tail -20`
Expected: zelёное.

- [ ] **Step 5: Коммит**

```bash
git add packages/cli packages/core/metadata/validation
git commit -m "refactor: :fire: удалена команда nkdk validate и validateProject"
```

### Task 5.4: Удалить `isDynamicListAttribute.ts`

**Files:**
- Delete: `packages/core/metadata/forms/commonObjects/dataPath/isDynamicListAttribute.{ts,test.ts}`
- Modify: потребители (если есть)

- [ ] **Step 1: Найти потребителей**

Run: `grep -rn "isDynamicListAttribute" packages --include="*.ts" -l | grep -v "isDynamicListAttribute"`

- [ ] **Step 2: Если потребителей нет — удалить**

```bash
git rm packages/core/metadata/forms/commonObjects/dataPath/isDynamicListAttribute.ts
```

И тест (если есть).

- [ ] **Step 3: Если потребители есть — переписать на чистую функцию или удалить вместе с ними**

(По спеке: «замещается Cypher-правилом на этапе 1 спеки» — то есть на этом этапе код просто исчезает; потребители тоже.)

- [ ] **Step 4: Прогнать**

Run: `pnpm test 2>&1 | tail -20`
Expected: zelёное.

- [ ] **Step 5: Коммит**

```bash
git add packages/core/metadata/forms
git commit -m "refactor: :fire: удалён isDynamicListAttribute (заместит Cypher-правило)"
```

### Task 5.5: Удалить `metadata/relations/` целиком

**Files:**
- Delete: `packages/core/metadata/relations/` (всё содержимое)

- [ ] **Step 1: Финальная проверка отсутствия импортов**

Run: `grep -rln "metadata/relations" packages --include="*.ts"`
Expected: пустой вывод.

Если что-то осталось — вернуться в Фазу 4 и разобрать конкретный файл.

- [ ] **Step 2: Удалить всю папку**

```bash
git rm -r packages/core/metadata/relations
```

- [ ] **Step 3: Прогнать full test + type-check**

Run:
```
pnpm -r run type-check
pnpm test 2>&1 | tail -30
```
Expected: zelёное.

- [ ] **Step 4: Коммит**

```bash
git add -A
git commit -m "refactor: :fire: удалён слой metadata/relations (graphology)"
```

---

## Фаза 6: Удалить `graphology` из зависимостей и упростить CLI

### Task 6.1: Снять `graphology` с `@nakidka/core/package.json`

**Files:**
- Modify: `packages/core/package.json`

- [ ] **Step 1: Удалить строку `"graphology": "^0.26.0"` из `dependencies`**

```diff
-    "graphology": "^0.26.0",
```

- [ ] **Step 2: Перезаписать lockfile**

Run: `pnpm install`
Expected: lockfile обновлён, нет ошибок про missing modules.

- [ ] **Step 3: Полный test + type-check**

Run:
```
pnpm -r run type-check
pnpm test 2>&1 | tail -30
```
Expected: zelёное.

- [ ] **Step 4: Коммит**

```bash
git add packages/core/package.json pnpm-lock.yaml
git commit -m "chore: :wastebasket: убрана зависимость graphology"
```

### Task 6.2: Упростить `nkdk update-graph`

**Files:**
- Modify: `packages/cli/src/commands/updateGraph.ts`

- [ ] **Step 1: Прочитать текущую реализацию**

Сейчас CLI читает YAML, строит `MetadataGraph`, вызывает `walkGraphToFileData`, передаёт в `@nakidka/graph.updateGraph`.

После миграции `buildGraph` — это всё инкапсулировано. CLI должен:
1. Прочитать YAML-файлы из FS → `Map<filePath, yamlText>`.
2. Вызвать `buildGraph(yamlFiles, context)` → `FileGraphData[]`.
3. Вызвать `updateGraph(fileGraphData, opts)` (из `@nakidka/graph`).

- [ ] **Step 2: Переписать**

```ts
// packages/cli/src/commands/updateGraph.ts
import { buildGraph } from "@nakidka/core/metadata/orchestration/buildGraph"
import { updateGraph as writeToFalkor } from "@nakidka/graph"
import { readAllYamlFiles } from "../io/readYaml" // или эквивалент

export async function updateGraphCommand({ projectPath, url, graphName, version, defaultLanguage }) {
  const yamlFiles = await readAllYamlFiles(projectPath)
  const fileData = buildGraph(yamlFiles, { version, defaultLanguage })
  await writeToFalkor(fileData, { url, graphName })
  console.log(`Loaded ${fileData.length} files into FalkorDB`)
}
```

(Точные имена функций FS/чтения — взять из текущего файла.)

- [ ] **Step 3: Удалить промежуточные хелперы CLI, которые больше не нужны**

Если в `updateGraph.ts` есть `importFormsForOwner`, `BATCH_SIZE`, прямые работы с `MetadataGraph` — всё это уходит.

- [ ] **Step 4: Smoke-тест CLI вручную**

Run на реальном проекте (если есть docker FalkorDB локально):
```
pnpm --filter @nakidka/cli build
node packages/cli/dist/index.js update-graph --project tempTest/...
```

Если нет docker — пропустить, положиться на интеграционные тесты `@nakidka/graph`.

- [ ] **Step 5: Прогнать `pnpm test`**

Run: `pnpm test 2>&1 | tail -20`
Expected: zelёное.

- [ ] **Step 6: Коммит**

```bash
git add packages/cli/src/commands/updateGraph.ts
git commit -m "refactor: :recycle: nkdk update-graph упрощён до buildGraph + updateGraph"
```

---

## Фаза 7: Финальная проверка

### Task 7.1: Полный прогон и сверка с инвариантами спеки

**Files:** —

- [ ] **Step 1: Полный pnpm test**

Run: `pnpm test 2>&1 | tail -50`
Expected: все зелёные.

- [ ] **Step 2: Type-check во всех пакетах**

Run: `pnpm -r run type-check 2>&1 | tail -30`
Expected: zelёное.

- [ ] **Step 3: Поиск осиротевших артефактов**

Команды:

```bash
# graphology не должен встречаться нигде, кроме pnpm-lock (если там след — это след transitive, ок)
grep -rln "graphology" packages --include="*.ts"
grep -rln "graphology" packages/*/package.json

# metadata/relations не должен импортироваться
grep -rln "metadata/relations" packages --include="*.ts"

# applyGraphOps вне buildGraph/internal — не должно быть
grep -rn "applyGraphOps" packages --include="*.ts" | grep -v "buildGraph/internal" | grep -v ".test.ts"

# MetadataGraph не должен встречаться в production-коде
grep -rln "MetadataGraph" packages --include="*.ts"
```

Все четыре — ожидаются пустыми (или только в самой папке `buildGraph/internal/`).

- [ ] **Step 4: Архитектурный инвариант orchestration**

Прочитать `docs/architecture-orchestration.md` и сверить, что после миграции инварианты по-прежнему держатся. При необходимости — обновить документ (см. AGENTS.md: «при необходимости обновить»).

- [ ] **Step 5: Если документ обновлён — отдельный коммит**

```bash
git add docs/architecture-orchestration.md
git commit -m "docs: :memo: orchestration после ухода graphology"
```

### Task 7.2: Pull request

**Files:** —

- [ ] **Step 1: Обновить develop, перебазироваться**

```bash
git fetch origin
git rebase origin/develop
```

- [ ] **Step 2: Финальный pnpm test**

Run: `pnpm test 2>&1 | tail -20`
Expected: zelёное.

- [ ] **Step 3: Push + создание PR**

```bash
git push -u origin feat/graph-package-interface-migration
gh pr create --title "feat: миграция на @nakidka/graph и удаление graphology" --body "..."
```

В body — список изменений по фазам и явное указание, что закрывает миграцию из `docs/superpowers/specs/2026-04-27-graph-package-interface-design.md` (нулевой этап основной спеки `2026-04-27-graph-cypher-in-rules-approach.md`).

---

## Self-Review

**Покрытие спеки:**

- ✅ § «Решение в одной фразе»: `BuildGraphFromModelFunction` уже чистая (фаза 1a–1d сделана), `buildGraph` становится чистой без graphology (Фаза 3), `@nakidka/graph` уже инкапсулирует FalkorDB (готово).
- ✅ § «Принципы 3» (`@nakidka/graph` инкапсулирует FalkorDB): уже выполнено.
- ✅ § «Принцип 4» (внешний API — две функции): уже выполнено в `@nakidka/graph`.
- ✅ § «Что удаляется» — Фазы 5–6 покрывают все строки таблицы (расширение, relations, validateProject, validate.ts, isDynamicListAttribute, dependency graphology).
- ✅ § «Что остаётся» — `applyGraphOps → flattenOps`-эквивалент: переезжает в `buildGraph/internal/applyGraphOps`, остаётся как внутренний хелпер. Ремарка: спека буквально просит «без `graph`-параметра, конкатенирует children/references в плоские nodes/edges». Поскольку для разрешения `parentOverride`/`recurse` всё равно нужна структура с возможностью lookup'а по `id`, прагматичная интерпретация — использовать `GraphBuilder` как plain-структуру; функционально это эквивалентно «плоским массивам с индексом», только кодом проще. Если ревью настоит на буквальном чтении — выделим Task в Фазу 4: переписать `applyGraphOps` так, чтобы он принимал `nodes: Map<id, NodeOps>; edges: EdgeData[]` напрямую, без класса.
- ✅ § «Тесты»: тесты `graphFromModel.ts` остаются unit, без FalkorDB (Фаза 4). Интеграционные `@nakidka/graph/tests/integration/` уже работают через testcontainers.
- ⚠️ § «Свойства узлов и рёбра»: `flattenItem` уже сплющивает по `_` под `p_`. Тонкость: спека требует, чтобы `forms`, `templates`, `objectModule`, `managerModule`, `help` создавались как **рёбра**, а не как массивы строк в props. Это работа в `BuildGraphFromModelFunction` для соответствующих типов и **не входит в данный план миграции** — это часть основной спеки `graph-cypher-in-rules-approach.md`. Для нулевого этапа достаточно того, что текущие правила уже эмитят узлы/рёбра, как они сейчас построены.
- ⚠️ § «Принцип 7 о метках»: спека требует, чтобы оркестратор проставлял `label` из `itemType` зарегистрированного правила, а чистая функция возвращала `{ id, props }` без `label`. Сейчас `walkGraphToFileData` берёт `label` из `attrs.item.itemType`. Технически — соответствует. Если ревью обнаружит места, где `label` собирается иначе (явно в чистой функции), — это отдельный таск, выявится при поиске на Фазе 4.

**Placeholder-скан:** ни одного «TBD/TODO/implement later» в плане; все шаги содержат либо точный код, либо точную команду; единственная ветвь «если потребители есть» в Task 5.4 — пред определена («переписать или удалить вместе») и обоснована тем, что наперёд непонятно, есть ли потребители.

**Type-консистентность:** `GraphBuilder.ensureNode/ensureEdge/...` — одно и то же имя по всему плану. `applyGraphOps` (function) — одно имя. `buildGraph(yamlFiles, context)` — одна сигнатура. `updateGraph(files, opts?)` — одна сигнатура (внешняя из `@nakidka/graph`). `FileGraphData/NodeData/EdgeData` — структурно совпадают между `core/buildGraph/types.ts` и `@nakidka/graph/types.ts`, как уже зафиксировано в `types.ts` обоих пакетов.

**Совпадение с AGENTS.md:** все коммиты следуют формату gitmoji с эмодзи-кодами; перед закрытием — `pnpm test`. Сообщения коммитов и пользовательские объяснения — на русском.
