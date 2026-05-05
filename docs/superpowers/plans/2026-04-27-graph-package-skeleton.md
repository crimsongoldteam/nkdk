# Скелет пакета `@nakidka/graph` — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Превратить `@nakidka/graph` из low-level FalkorDB-обёртки (`connect`/`query`/`close`/`ensureIndex`) в пакет с двумя публичными high-level функциями `updateGraph(files, opts?)` и `withGraph(fn, opts?)`, согласно дизайн-документу [`2026-04-27-graph-package-interface-design.md`](../specs/2026-04-27-graph-package-interface-design.md). Изолированно, без изменений в core/cli — старый API остаётся для обратной совместимости.

**Architecture:** `updateGraph` собирает узлы и рёбра из `FileGraphData[]`, делает 4 шага в одной транзакции FalkorDB: (1) удаление узлов по `filePath` с превращением ref-targets в stub'ы, (2) merge новых узлов батчами по 5000 с группировкой по label, (3) merge рёбер с группировкой по kind, (4) очистка orphan-stub'ов. `withGraph` открывает соединение, передаёт `query`-callback и закрывает. Низкоуровневые `connect/close/query/ensureIndex` живут в `src/internal/connection.ts`, реэкспортируются из `index.ts` для совместимости.

**Tech Stack:** TypeScript 5.9, vitest 4, FalkorDB 6.6 (через `falkordb` npm-пакет), testcontainers для интеграционных тестов.

---

## Структура файлов

**Создать:**
- `packages/graph/src/types.ts` — публичные типы (`NodeData`, `EdgeData`, `FileGraphData`, `ConnectionOptions`, `GraphPrimitive`).
- `packages/graph/src/internal/connection.ts` — `connect`, `close`, `query`, `ensureIndex` (перенос из `index.ts`).
- `packages/graph/src/internal/operations.ts` — операции графа: `ensureLabelIndexes`, `deleteByFilePaths`, `mergeNodes`, `mergeEdges`, `cleanupOrphanStubs`.
- `packages/graph/src/updateGraph.ts` — публичный `updateGraph`.
- `packages/graph/src/withGraph.ts` — публичный `withGraph`.
- `packages/graph/tests/operations.test.ts` — unit-тесты операций с моками.
- `packages/graph/tests/updateGraph.test.ts` — unit-тесты оркестратора с моками.
- `packages/graph/tests/withGraph.test.ts` — unit-тесты `withGraph` с моками.
- `packages/graph/tests/integration/setup.ts` — `beforeAll`/`afterAll` хуки testcontainers.
- `packages/graph/tests/integration/updateGraph.integration.test.ts` — end-to-end на реальной FalkorDB.
- `packages/graph/vitest.integration.config.ts` — отдельный конфиг (только `tests/integration/**`).

**Модифицировать:**
- `packages/graph/src/index.ts` — добавить экспорты `updateGraph`, `withGraph`, типы; реэкспортировать существующие из `internal/connection`.
- `packages/graph/package.json` — добавить скрипт `test:integration`, devDep `testcontainers`.

**Не удалять.** Существующий low-level API остаётся доступным — фаза 4 уберёт его, когда CLI переедет.

---

## Task 1: Установить testcontainers и завести `test:integration`

**Files:**
- Modify: `packages/graph/package.json`
- Create: `packages/graph/vitest.integration.config.ts`

- [ ] **Step 1: Установить testcontainers как devDependency**

```bash
cd /Users/nikita/git/nakidka-core/packages/graph
pnpm add -D testcontainers@^11
```

Expected: `testcontainers` появляется в `devDependencies` package.json, lock-файл обновляется.

- [ ] **Step 2: Создать `vitest.integration.config.ts`**

```ts
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["tests/integration/**/*.integration.test.ts"],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    fileParallelism: false,
  },
})
```

Файл `packages/graph/vitest.integration.config.ts`. Параметры: `testTimeout` 60 секунд (старт контейнера), `fileParallelism: false` — один контейнер на весь набор.

- [ ] **Step 3: Добавить скрипт `test:integration` в `package.json`**

В `packages/graph/package.json`, секция `scripts`:

```json
"scripts": {
  "test": "vitest run",
  "test:integration": "vitest run --config vitest.integration.config.ts",
  "type-check": "tsc --noEmit"
}
```

- [ ] **Step 4: Проверить, что unit-тесты по-прежнему запускаются**

```bash
cd /Users/nikita/git/nakidka-core/packages/graph
pnpm test
```

Expected: PASS, существующие тесты в `tests/graph.test.ts` зелёные.

- [ ] **Step 5: Commit**

```bash
git add packages/graph/package.json packages/graph/vitest.integration.config.ts pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
chore: :wrench: добавить testcontainers и скрипт test:integration

Подготовка к интеграционным тестам пакета graph: отдельный
vitest.integration.config.ts для набора tests/integration/, без
параллелизма и с таймаутом 60с под старт docker-контейнера.
Основной pnpm test (рекурсивный из корня) интеграционных не
включает — Docker не должен быть требованием базовых тестов.
EOF
)"
```

---

## Task 2: Вынести низкоуровневые функции в `internal/connection.ts`

Чистый рефакторинг. Существующее поведение и тесты не меняются — `index.ts` продолжает экспортировать те же символы.

**Files:**
- Create: `packages/graph/src/internal/connection.ts`
- Modify: `packages/graph/src/index.ts`

- [ ] **Step 1: Создать `src/internal/connection.ts`**

Целиком переносим тело из текущего `src/index.ts`:

```ts
import { FalkorDB } from "falkordb"

const DEFAULT_URL = "redis://localhost:6379"
const DEFAULT_GRAPH_NAME = "nakidka"

export interface GraphOptions {
  url?: string
  graphName?: string
}

declare const graphConnectionBrand: unique symbol
export type GraphConnection = { readonly [graphConnectionBrand]: true }

type InternalGraphConnection = {
  client: Awaited<ReturnType<typeof FalkorDB.connect>>
  graph: ReturnType<Awaited<ReturnType<typeof FalkorDB.connect>>["selectGraph"]>
}

const asInternal = (conn: GraphConnection): InternalGraphConnection =>
  conn as unknown as InternalGraphConnection

const asExternal = (conn: InternalGraphConnection): GraphConnection =>
  conn as unknown as GraphConnection

export const connect = async (opts?: GraphOptions): Promise<GraphConnection> => {
  const url = opts?.url ?? process.env["NKDK_GRAPH_URL"] ?? DEFAULT_URL
  const graphName = opts?.graphName ?? process.env["NKDK_GRAPH_NAME"] ?? DEFAULT_GRAPH_NAME
  const client = await FalkorDB.connect({ url })
  const graph = client.selectGraph(graphName)
  return asExternal({ client, graph })
}

export const close = async (conn: GraphConnection): Promise<void> => {
  await asInternal(conn).client.close()
}

export const query = async (
  conn: GraphConnection,
  cypher: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: Record<string, unknown>,
): Promise<unknown> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const opts = params !== undefined ? { params: params as any } : undefined
  return await asInternal(conn).graph.query(cypher, opts)
}

export const ensureIndex = async (
  conn: GraphConnection,
  label: string,
  prop: string,
): Promise<void> => {
  try {
    await asInternal(conn).graph.query(`CREATE INDEX FOR (n:${label}) ON (n.${prop})`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (!/already indexed|equivalent index|index already exists/i.test(msg)) throw err
  }
}
```

- [ ] **Step 2: Заменить `src/index.ts` на реэкспорт**

```ts
export {
  close,
  connect,
  ensureIndex,
  query,
  type GraphConnection,
  type GraphOptions,
} from "./internal/connection"
```

- [ ] **Step 3: Прогнать существующие тесты**

```bash
cd /Users/nikita/git/nakidka-core/packages/graph
pnpm test
```

Expected: PASS — все тесты `tests/graph.test.ts` остаются зелёными (импорт `from "../src/index"` продолжает работать через реэкспорт).

- [ ] **Step 4: Прогнать type-check**

```bash
cd /Users/nikita/git/nakidka-core/packages/graph
pnpm type-check
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/graph/src/internal/connection.ts packages/graph/src/index.ts
git commit -m "$(cat <<'EOF'
refactor: :recycle: вынести низкоуровневые функции graph в internal

connect/close/query/ensureIndex переезжают в internal/connection.ts,
index.ts становится реэкспортом. Подготовка к появлению
updateGraph/withGraph в index.ts — новые модули будут импортировать
низкоуровневые функции из internal без циклических зависимостей.
Поведение и публичный API не меняются.
EOF
)"
```

---

## Task 3: Публичные типы графа в `src/types.ts`

**Files:**
- Create: `packages/graph/src/types.ts`
- Modify: `packages/graph/src/index.ts`
- Test: type-only (через `tsc --noEmit`)

- [ ] **Step 1: Создать `src/types.ts`**

```ts
/**
 * Примитивные значения, поддерживаемые FalkorDB в `props` узлов и рёбер.
 * Массивы — только массивы примитивов; вложенные объекты не поддерживаются.
 */
export type GraphPrimitive = string | number | boolean | null

export interface NodeData {
  /** Полный YAML-путь узла. Уникальный идентификатор в графе. */
  id: string
  /** Семантическая метка в Cypher (`MetadataCatalog`, `Form`, ...). PascalCase. */
  label: string
  /** Свойства узла. Только примитивы и их массивы — ограничение FalkorDB. */
  props: Record<string, GraphPrimitive | GraphPrimitive[]>
}

export interface EdgeData {
  /** id узла-источника. */
  src: string
  /** id узла-цели. */
  tgt: string
  /** Тип отношения, SCREAMING_SNAKE_CASE (`VALUE`, `OBJECT`, `REF_TYPE`, ...). */
  kind: string
  /** Координаты ребра (`index` для упорядоченных коллекций, `yaml` для диагностики). */
  props?: Record<string, GraphPrimitive>
}

export interface FileGraphData {
  /** Абсолютный или относительный путь YAML-файла. */
  filePath: string
  nodes: NodeData[]
  edges: EdgeData[]
}

export interface ConnectionOptions {
  /** URL FalkorDB. По умолчанию — env `NKDK_GRAPH_URL` или `redis://localhost:6379`. */
  url?: string
  /** Имя графа. По умолчанию — env `NKDK_GRAPH_NAME` или `nakidka`. */
  graphName?: string
}
```

- [ ] **Step 2: Реэкспортировать типы из `index.ts`**

Дописать в `src/index.ts`:

```ts
export {
  close,
  connect,
  ensureIndex,
  query,
  type GraphConnection,
  type GraphOptions,
} from "./internal/connection"

export type {
  ConnectionOptions,
  EdgeData,
  FileGraphData,
  GraphPrimitive,
  NodeData,
} from "./types"
```

- [ ] **Step 3: Прогнать type-check**

```bash
cd /Users/nikita/git/nakidka-core/packages/graph
pnpm type-check
```

Expected: PASS — типы валидны.

- [ ] **Step 4: Прогнать тесты**

```bash
pnpm test
```

Expected: PASS, ничего не сломано.

- [ ] **Step 5: Commit**

```bash
git add packages/graph/src/types.ts packages/graph/src/index.ts
git commit -m "$(cat <<'EOF'
feat: :sparkles: добавить публичные типы графа в @nakidka/graph

NodeData, EdgeData, FileGraphData, ConnectionOptions, GraphPrimitive
по контракту из дизайн-документа. Используются как формат входа
для будущей updateGraph: пакет принимает уже посчитанные узлы и
рёбра из core, не зная ничего о YAML или модели.
EOF
)"
```

---

## Task 4: Операция `mergeNodes` — батчевый MERGE с группировкой по label

**Files:**
- Create: `packages/graph/src/internal/operations.ts`
- Test: `packages/graph/tests/operations.test.ts`

- [ ] **Step 1: Написать failing-тест для `mergeNodes`**

`packages/graph/tests/operations.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest"

const queryMock = vi.fn()
const selectGraphMock = vi.fn()
const connectMock = vi.fn()
const closeMock = vi.fn()

vi.mock("falkordb", () => ({
  FalkorDB: { connect: (opts?: unknown) => connectMock(opts) },
}))

import { connect } from "../src/internal/connection"
import { mergeNodes } from "../src/internal/operations"
import type { NodeData } from "../src/types"

beforeEach(() => {
  queryMock.mockReset().mockResolvedValue({})
  selectGraphMock.mockReset().mockReturnValue({ query: queryMock })
  connectMock.mockReset().mockResolvedValue({ selectGraph: selectGraphMock, close: closeMock })
  closeMock.mockReset().mockResolvedValue(undefined)
})

describe("mergeNodes", () => {
  it("ничего не делает на пустом массиве", async () => {
    const conn = await connect()
    await mergeNodes(conn, [])
    expect(queryMock).not.toHaveBeenCalled()
  })

  it("группирует узлы по label и шлёт по одному UNWIND-MERGE на label", async () => {
    const conn = await connect()
    const nodes: NodeData[] = [
      { id: "Справочник.A", label: "MetadataCatalog", props: { name: "A", filePath: "a.yaml" } },
      { id: "Справочник.B", label: "MetadataCatalog", props: { name: "B", filePath: "b.yaml" } },
      { id: "Документ.X", label: "MetadataDocument", props: { name: "X", filePath: "x.yaml" } },
    ]
    await mergeNodes(conn, nodes)

    expect(queryMock).toHaveBeenCalledTimes(2)
    const [catalogCall, documentCall] = queryMock.mock.calls
    expect(catalogCall[0]).toBe(
      "UNWIND $batch AS n MERGE (m:MetadataCatalog {id: n.id}) SET m += n.props",
    )
    expect(catalogCall[1]).toEqual({
      params: {
        batch: [
          { id: "Справочник.A", props: { name: "A", filePath: "a.yaml" } },
          { id: "Справочник.B", props: { name: "B", filePath: "b.yaml" } },
        ],
      },
    })
    expect(documentCall[0]).toBe(
      "UNWIND $batch AS n MERGE (m:MetadataDocument {id: n.id}) SET m += n.props",
    )
  })

  it("режет на батчи по 5000", async () => {
    const conn = await connect()
    const nodes: NodeData[] = Array.from({ length: 12_000 }, (_, i) => ({
      id: `id${i}`,
      label: "MetadataCatalog",
      props: { name: `n${i}` },
    }))
    await mergeNodes(conn, nodes)

    expect(queryMock).toHaveBeenCalledTimes(3)
    expect(
      (queryMock.mock.calls[0][1] as { params: { batch: unknown[] } }).params.batch,
    ).toHaveLength(5000)
    expect(
      (queryMock.mock.calls[2][1] as { params: { batch: unknown[] } }).params.batch,
    ).toHaveLength(2000)
  })
})
```

- [ ] **Step 2: Запустить тест — должен упасть**

```bash
cd /Users/nikita/git/nakidka-core/packages/graph
pnpm test tests/operations.test.ts
```

Expected: FAIL с "Failed to resolve import" или "mergeNodes is not a function" — модуль `../src/internal/operations` ещё не существует.

- [ ] **Step 3: Реализовать `mergeNodes`**

`packages/graph/src/internal/operations.ts`:

```ts
import { query } from "./connection"
import type { GraphConnection } from "./connection"
import type { NodeData } from "../types"

export const BATCH_SIZE = 5000

const groupBy = <T, K extends string>(
  items: readonly T[],
  key: (item: T) => K,
): Map<K, T[]> => {
  const result = new Map<K, T[]>()
  for (const item of items) {
    const k = key(item)
    const bucket = result.get(k)
    if (bucket === undefined) result.set(k, [item])
    else bucket.push(item)
  }
  return result
}

const sendBatches = async <T>(
  conn: GraphConnection,
  items: readonly T[],
  cypher: string,
  paramName = "batch",
): Promise<void> => {
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    await query(conn, cypher, { [paramName]: items.slice(i, i + BATCH_SIZE) })
  }
}

export const mergeNodes = async (
  conn: GraphConnection,
  nodes: readonly NodeData[],
): Promise<void> => {
  if (nodes.length === 0) return
  const byLabel = groupBy(nodes, (n) => n.label)
  for (const [label, group] of byLabel) {
    const payload = group.map((n) => ({ id: n.id, props: n.props }))
    await sendBatches(
      conn,
      payload,
      `UNWIND $batch AS n MERGE (m:${label} {id: n.id}) SET m += n.props`,
    )
  }
}
```

- [ ] **Step 4: Прогнать тест — должен пройти**

```bash
pnpm test tests/operations.test.ts
```

Expected: PASS — все три случая зелёные.

- [ ] **Step 5: Commit**

```bash
git add packages/graph/src/internal/operations.ts packages/graph/tests/operations.test.ts
git commit -m "$(cat <<'EOF'
feat: :sparkles: операция mergeNodes для @nakidka/graph

Принимает NodeData[], группирует по label, шлёт батч-UNWIND-MERGE
по 5000 на каждый label. Динамическая label-метка собирается в
строку Cypher — это требование FalkorDB (нельзя параметризовать
метку через $param). Унутренний хелпер sendBatches переиспользуется
mergeEdges и операциями удаления в следующих задачах.
EOF
)"
```

---

## Task 5: Операция `mergeEdges` — батчевый MERGE рёбер с группировкой по kind

**Files:**
- Modify: `packages/graph/src/internal/operations.ts`
- Modify: `packages/graph/tests/operations.test.ts`

- [ ] **Step 1: Дописать failing-тест для `mergeEdges`**

В конец `tests/operations.test.ts`:

```ts
import { mergeEdges } from "../src/internal/operations"
import type { EdgeData } from "../src/types"

describe("mergeEdges", () => {
  it("ничего не делает на пустом массиве", async () => {
    const conn = await connect()
    await mergeEdges(conn, [])
    expect(queryMock).not.toHaveBeenCalled()
  })

  it("группирует рёбра по kind и шлёт по одному UNWIND-MERGE на kind", async () => {
    const conn = await connect()
    const edges: EdgeData[] = [
      { src: "A", tgt: "B", kind: "VALUE", props: { yaml: "Значение" } },
      { src: "A", tgt: "C", kind: "VALUE", props: { yaml: "Значение" } },
      { src: "A", tgt: "D", kind: "REF_TYPE", props: { index: 0 } },
    ]
    await mergeEdges(conn, edges)

    expect(queryMock).toHaveBeenCalledTimes(2)
    const calls = queryMock.mock.calls
    const valueCall = calls.find((c) => (c[0] as string).includes(":VALUE"))!
    const refCall = calls.find((c) => (c[0] as string).includes(":REF_TYPE"))!
    expect(valueCall[0]).toBe(
      "UNWIND $batch AS e MATCH (s {id: e.src}), (t {id: e.tgt}) MERGE (s)-[r:VALUE]->(t) SET r = e.props",
    )
    expect((valueCall[1] as { params: { batch: unknown[] } }).params.batch).toHaveLength(2)
    expect(refCall[0]).toBe(
      "UNWIND $batch AS e MATCH (s {id: e.src}), (t {id: e.tgt}) MERGE (s)-[r:REF_TYPE]->(t) SET r = e.props",
    )
  })

  it("отправляет props={} если у ребра не указаны свойства", async () => {
    const conn = await connect()
    const edges: EdgeData[] = [{ src: "A", tgt: "B", kind: "FORM" }]
    await mergeEdges(conn, edges)

    expect(queryMock).toHaveBeenCalledTimes(1)
    const batch = (queryMock.mock.calls[0][1] as { params: { batch: Array<{ props: object }> } })
      .params.batch
    expect(batch[0]?.props).toEqual({})
  })
})
```

- [ ] **Step 2: Запустить — должен упасть**

```bash
pnpm test tests/operations.test.ts
```

Expected: FAIL — `mergeEdges is not a function`.

- [ ] **Step 3: Реализовать `mergeEdges`**

В `src/internal/operations.ts` дополнить импорт типов и добавить функцию:

```ts
import type { EdgeData, NodeData } from "../types"
```

(заменяет существующий импорт `import type { NodeData } from "../types"`)

```ts
export const mergeEdges = async (
  conn: GraphConnection,
  edges: readonly EdgeData[],
): Promise<void> => {
  if (edges.length === 0) return
  const byKind = groupBy(edges, (e) => e.kind)
  for (const [kind, group] of byKind) {
    const payload = group.map((e) => ({ src: e.src, tgt: e.tgt, props: e.props ?? {} }))
    await sendBatches(
      conn,
      payload,
      `UNWIND $batch AS e MATCH (s {id: e.src}), (t {id: e.tgt}) MERGE (s)-[r:${kind}]->(t) SET r = e.props`,
    )
  }
}
```

- [ ] **Step 4: Прогнать тесты**

```bash
pnpm test tests/operations.test.ts
```

Expected: PASS, все случаи зелёные.

- [ ] **Step 5: Commit**

```bash
git add packages/graph/src/internal/operations.ts packages/graph/tests/operations.test.ts
git commit -m "$(cat <<'EOF'
feat: :sparkles: операция mergeEdges для @nakidka/graph

Принимает EdgeData[], группирует по kind, шлёт батч-UNWIND-MERGE.
MATCH без меток узлов — потому что src и tgt могут быть стабом
без полной метки (стабы получают метку только при первой полной
записи). Свойства ребра заменяются целиком (SET r = e.props), а не
докидываются — это согласуется с lossless-снимком модели: если
свойство пропало в новом наборе, оно должно пропасть и в графе.
EOF
)"
```

---

## Task 6: Операция `deleteByFilePaths` — удаление узлов и превращение ref-targets в stub

**Files:**
- Modify: `packages/graph/src/internal/operations.ts`
- Modify: `packages/graph/tests/operations.test.ts`

- [ ] **Step 1: Дописать failing-тест**

В `tests/operations.test.ts`:

```ts
import { deleteByFilePaths } from "../src/internal/operations"

describe("deleteByFilePaths", () => {
  it("ничего не делает на пустом массиве", async () => {
    const conn = await connect()
    await deleteByFilePaths(conn, [])
    expect(queryMock).not.toHaveBeenCalled()
  })

  it("удаляет outgoing-рёбра, превращает узлы со входящими в stub, остальные DETACH DELETE", async () => {
    const conn = await connect()
    await deleteByFilePaths(conn, ["a.yaml", "b.yaml"])

    expect(queryMock).toHaveBeenCalledTimes(3)
    const [edgesCall, stubCall, deleteCall] = queryMock.mock.calls
    expect(edgesCall[0]).toBe(
      "MATCH (n) WHERE n.filePath IN $filePaths MATCH (n)-[r]->() DELETE r",
    )
    expect(edgesCall[1]).toEqual({ params: { filePaths: ["a.yaml", "b.yaml"] } })
    expect(stubCall[0]).toBe(
      "MATCH (n) WHERE n.filePath IN $filePaths AND ()-->(n) SET n = {id: n.id}",
    )
    expect(stubCall[1]).toEqual({ params: { filePaths: ["a.yaml", "b.yaml"] } })
    expect(deleteCall[0]).toBe(
      "MATCH (n) WHERE n.filePath IN $filePaths AND NOT ()-->(n) DETACH DELETE n",
    )
  })
})
```

- [ ] **Step 2: Запустить — должен упасть**

```bash
pnpm test tests/operations.test.ts
```

Expected: FAIL — `deleteByFilePaths is not a function`.

- [ ] **Step 3: Реализовать `deleteByFilePaths`**

Добавить в `src/internal/operations.ts`:

```ts
export const deleteByFilePaths = async (
  conn: GraphConnection,
  filePaths: readonly string[],
): Promise<void> => {
  if (filePaths.length === 0) return
  const params = { filePaths: [...filePaths] }
  await query(
    conn,
    "MATCH (n) WHERE n.filePath IN $filePaths MATCH (n)-[r]->() DELETE r",
    params,
  )
  await query(
    conn,
    "MATCH (n) WHERE n.filePath IN $filePaths AND ()-->(n) SET n = {id: n.id}",
    params,
  )
  await query(
    conn,
    "MATCH (n) WHERE n.filePath IN $filePaths AND NOT ()-->(n) DETACH DELETE n",
    params,
  )
}
```

- [ ] **Step 4: Прогнать тесты**

```bash
pnpm test tests/operations.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/graph/src/internal/operations.ts packages/graph/tests/operations.test.ts
git commit -m "$(cat <<'EOF'
feat: :sparkles: операция deleteByFilePaths для @nakidka/graph

Три шага в одной операции:
1. Удаляем все исходящие рёбра узлов с указанными filePath.
2. Узлы со входящими рёбрами превращаем в stub: SET n = {id: n.id}
   стирает все props кроме id, метка узла остаётся (она хранится
   отдельно от props в FalkorDB).
3. Узлы без входящих рёбер удаляем через DETACH DELETE.

Stub-маркер — отсутствие props.filePath (решение №3 спеки).
EOF
)"
```

---

## Task 7: Операция `cleanupOrphanStubs` — удалить стабы без входящих рёбер

**Files:**
- Modify: `packages/graph/src/internal/operations.ts`
- Modify: `packages/graph/tests/operations.test.ts`

- [ ] **Step 1: Дописать failing-тест**

```ts
import { cleanupOrphanStubs } from "../src/internal/operations"

describe("cleanupOrphanStubs", () => {
  it("удаляет узлы без filePath и без входящих рёбер", async () => {
    const conn = await connect()
    await cleanupOrphanStubs(conn)
    expect(queryMock).toHaveBeenCalledTimes(1)
    expect(queryMock.mock.calls[0][0]).toBe(
      "MATCH (n) WHERE n.filePath IS NULL AND NOT ()-->(n) DETACH DELETE n",
    )
    expect(queryMock.mock.calls[0][1]).toBeUndefined()
  })
})
```

- [ ] **Step 2: Запустить — должен упасть**

```bash
pnpm test tests/operations.test.ts
```

Expected: FAIL — `cleanupOrphanStubs is not a function`.

- [ ] **Step 3: Реализовать**

Добавить в `src/internal/operations.ts`:

```ts
export const cleanupOrphanStubs = async (conn: GraphConnection): Promise<void> => {
  await query(
    conn,
    "MATCH (n) WHERE n.filePath IS NULL AND NOT ()-->(n) DETACH DELETE n",
  )
}
```

- [ ] **Step 4: Прогнать тесты**

```bash
pnpm test tests/operations.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/graph/src/internal/operations.ts packages/graph/tests/operations.test.ts
git commit -m "$(cat <<'EOF'
feat: :sparkles: операция cleanupOrphanStubs для @nakidka/graph

После merge новых данных могут остаться stub-узлы (filePath = NULL),
на которые никто больше не ссылается — например, удалили файл
со ссылкой на справочник, и других ссылок на него больше нет.
Удаляем такие висячие стабы.
EOF
)"
```

---

## Task 8: Операция `ensureLabelIndexes` — индексы по `id` для встретившихся меток

**Files:**
- Modify: `packages/graph/src/internal/operations.ts`
- Modify: `packages/graph/tests/operations.test.ts`

- [ ] **Step 1: Дописать failing-тест**

```ts
import { ensureLabelIndexes } from "../src/internal/operations"

describe("ensureLabelIndexes", () => {
  it("создаёт индекс по id для каждой уникальной label", async () => {
    const conn = await connect()
    await ensureLabelIndexes(conn, ["MetadataCatalog", "MetadataDocument", "MetadataCatalog"])

    expect(queryMock).toHaveBeenCalledTimes(2)
    const queries = queryMock.mock.calls.map((c) => c[0])
    expect(queries).toContain("CREATE INDEX FOR (n:MetadataCatalog) ON (n.id)")
    expect(queries).toContain("CREATE INDEX FOR (n:MetadataDocument) ON (n.id)")
  })

  it("глотает 'already indexed' / 'equivalent index'", async () => {
    queryMock.mockRejectedValueOnce(new Error("already indexed for label"))
    const conn = await connect()
    await expect(
      ensureLabelIndexes(conn, ["MetadataCatalog"]),
    ).resolves.toBeUndefined()
  })

  it("ничего не делает на пустом массиве", async () => {
    const conn = await connect()
    await ensureLabelIndexes(conn, [])
    expect(queryMock).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Запустить — должен упасть**

```bash
pnpm test tests/operations.test.ts
```

Expected: FAIL — `ensureLabelIndexes is not a function`.

- [ ] **Step 3: Реализовать**

Добавить в `src/internal/operations.ts`:

```ts
import { ensureIndex } from "./connection"

export const ensureLabelIndexes = async (
  conn: GraphConnection,
  labels: readonly string[],
): Promise<void> => {
  const unique = new Set(labels)
  for (const label of unique) {
    await ensureIndex(conn, label, "id")
  }
}
```

- [ ] **Step 4: Прогнать тесты**

```bash
pnpm test tests/operations.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/graph/src/internal/operations.ts packages/graph/tests/operations.test.ts
git commit -m "$(cat <<'EOF'
feat: :sparkles: операция ensureLabelIndexes для @nakidka/graph

В новой архитектуре метки узлов динамические (MetadataCatalog,
MetadataDocument, Form, ...), общей метки MetadataNode больше нет.
Перед массовыми MATCH/MERGE по id создаём индекс на каждую
встретившуюся метку. Errored "already indexed" глотается —
повторный запуск идемпотентен.
EOF
)"
```

---

## Task 9: Публичный `updateGraph` — оркестратор всех операций

**Files:**
- Create: `packages/graph/src/updateGraph.ts`
- Create: `packages/graph/tests/updateGraph.test.ts`
- Modify: `packages/graph/src/index.ts`

- [ ] **Step 1: Написать failing-тест для `updateGraph`**

`packages/graph/tests/updateGraph.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest"

const queryMock = vi.fn()
const selectGraphMock = vi.fn()
const connectMock = vi.fn()
const closeMock = vi.fn()

vi.mock("falkordb", () => ({
  FalkorDB: { connect: (opts?: unknown) => connectMock(opts) },
}))

import { updateGraph } from "../src/updateGraph"
import type { FileGraphData } from "../src/types"

beforeEach(() => {
  queryMock.mockReset().mockResolvedValue({})
  selectGraphMock.mockReset().mockReturnValue({ query: queryMock })
  closeMock.mockReset().mockResolvedValue(undefined)
  connectMock
    .mockReset()
    .mockResolvedValue({ selectGraph: selectGraphMock, close: closeMock })
})

describe("updateGraph", () => {
  it("проходит полный цикл: index → delete → merge nodes → merge edges → cleanup → close", async () => {
    const files: FileGraphData[] = [
      {
        filePath: "a.yaml",
        nodes: [
          { id: "Справочник.A", label: "MetadataCatalog", props: { name: "A", filePath: "a.yaml" } },
        ],
        edges: [{ src: "Справочник.A", tgt: "Справочник.B", kind: "VALUE" }],
      },
    ]
    await updateGraph(files)

    const cypher = queryMock.mock.calls.map((c) => c[0] as string)
    expect(cypher).toContainEqual(expect.stringContaining("CREATE INDEX FOR (n:MetadataCatalog)"))
    expect(cypher).toContainEqual(expect.stringContaining("MATCH (n) WHERE n.filePath IN $filePaths MATCH (n)-[r]->() DELETE r"))
    expect(cypher).toContainEqual(expect.stringContaining("MATCH (n) WHERE n.filePath IN $filePaths AND ()-->(n) SET n = {id: n.id}"))
    expect(cypher).toContainEqual(expect.stringContaining("MATCH (n) WHERE n.filePath IN $filePaths AND NOT ()-->(n) DETACH DELETE n"))
    expect(cypher).toContainEqual(expect.stringContaining("MERGE (m:MetadataCatalog"))
    expect(cypher).toContainEqual(expect.stringContaining(":VALUE]"))
    expect(cypher).toContainEqual(expect.stringContaining("MATCH (n) WHERE n.filePath IS NULL AND NOT ()-->(n) DETACH DELETE n"))
    expect(closeMock).toHaveBeenCalledTimes(1)
  })

  it("закрывает соединение даже при падении одной из операций", async () => {
    queryMock.mockReset()
    queryMock.mockResolvedValueOnce({}) // CREATE INDEX
    queryMock.mockRejectedValueOnce(new Error("boom"))

    const files: FileGraphData[] = [
      { filePath: "a.yaml", nodes: [{ id: "A", label: "X", props: {} }], edges: [] },
    ]
    await expect(updateGraph(files)).rejects.toThrow("boom")
    expect(closeMock).toHaveBeenCalledTimes(1)
  })

  it("ничего не отправляет в FalkorDB при пустом входе, но всё равно закрывает соединение", async () => {
    await updateGraph([])
    // Только индексы (нет) и cleanup orphan stubs (всегда выполняется)
    const cypher = queryMock.mock.calls.map((c) => c[0] as string)
    expect(cypher).toEqual([
      "MATCH (n) WHERE n.filePath IS NULL AND NOT ()-->(n) DETACH DELETE n",
    ])
    expect(closeMock).toHaveBeenCalledTimes(1)
  })

  it("прокидывает ConnectionOptions в connect", async () => {
    await updateGraph([], { url: "redis://h:1", graphName: "g" })
    expect(connectMock).toHaveBeenCalledWith({ url: "redis://h:1" })
    expect(selectGraphMock).toHaveBeenCalledWith("g")
  })
})
```

- [ ] **Step 2: Запустить — должен упасть**

```bash
cd /Users/nikita/git/nakidka-core/packages/graph
pnpm test tests/updateGraph.test.ts
```

Expected: FAIL — модуль `../src/updateGraph` не существует.

- [ ] **Step 3: Реализовать `updateGraph`**

`packages/graph/src/updateGraph.ts`:

```ts
import { close, connect } from "./internal/connection"
import {
  cleanupOrphanStubs,
  deleteByFilePaths,
  ensureLabelIndexes,
  mergeEdges,
  mergeNodes,
} from "./internal/operations"
import type { ConnectionOptions, FileGraphData } from "./types"

/**
 * Обновляет содержимое графа по списку файлов:
 *  - удаляет узлы и рёбра, привязанные к этим файлам;
 *  - наливает новые;
 *  - узлы со входящими reference-рёбрами становятся стабами, а не удаляются;
 *  - удаляет orphan-стабы, которые после merge остались без входящих рёбер.
 */
export const updateGraph = async (
  files: readonly FileGraphData[],
  opts?: ConnectionOptions,
): Promise<void> => {
  const allNodes = files.flatMap((f) => f.nodes)
  const allEdges = files.flatMap((f) => f.edges)
  const filePaths = files.map((f) => f.filePath)
  const labels = allNodes.map((n) => n.label)

  const conn = await connect(opts)
  try {
    await ensureLabelIndexes(conn, labels)
    await deleteByFilePaths(conn, filePaths)
    await mergeNodes(conn, allNodes)
    await mergeEdges(conn, allEdges)
    await cleanupOrphanStubs(conn)
  } finally {
    await close(conn)
  }
}
```

- [ ] **Step 4: Реэкспортировать из `index.ts`**

Финальный вид `packages/graph/src/index.ts`:

```ts
export {
  close,
  connect,
  ensureIndex,
  query,
  type GraphConnection,
  type GraphOptions,
} from "./internal/connection"

export type {
  ConnectionOptions,
  EdgeData,
  FileGraphData,
  GraphPrimitive,
  NodeData,
} from "./types"

export { updateGraph } from "./updateGraph"
```

- [ ] **Step 5: Прогнать тесты**

```bash
pnpm test
```

Expected: PASS — все тесты пакета зелёные (старые `graph.test.ts`, новые `operations.test.ts`, новые `updateGraph.test.ts`).

- [ ] **Step 6: Commit**

```bash
git add packages/graph/src/updateGraph.ts packages/graph/src/index.ts packages/graph/tests/updateGraph.test.ts
git commit -m "$(cat <<'EOF'
feat: :sparkles: публичный updateGraph для @nakidka/graph

Связывает в одну транзакцию: ensureLabelIndexes → deleteByFilePaths
→ mergeNodes → mergeEdges → cleanupOrphanStubs. Соединение закрывается
в finally — даже при падении одного из шагов клиент не утечёт.
Принимает ConnectionOptions; старый низкоуровневый API остаётся
доступным до фазы 4.
EOF
)"
```

---

## Task 10: Публичный `withGraph` — обёртка для нескольких Cypher-запросов

**Files:**
- Create: `packages/graph/src/withGraph.ts`
- Create: `packages/graph/tests/withGraph.test.ts`
- Modify: `packages/graph/src/index.ts`

- [ ] **Step 1: Написать failing-тест**

`packages/graph/tests/withGraph.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest"

const queryMock = vi.fn()
const selectGraphMock = vi.fn()
const connectMock = vi.fn()
const closeMock = vi.fn()

vi.mock("falkordb", () => ({
  FalkorDB: { connect: (opts?: unknown) => connectMock(opts) },
}))

import { withGraph } from "../src/withGraph"

beforeEach(() => {
  queryMock.mockReset()
  selectGraphMock.mockReset().mockReturnValue({ query: queryMock })
  closeMock.mockReset().mockResolvedValue(undefined)
  connectMock
    .mockReset()
    .mockResolvedValue({ selectGraph: selectGraphMock, close: closeMock })
})

describe("withGraph", () => {
  it("открывает соединение, передаёт query в callback и закрывает", async () => {
    queryMock.mockResolvedValue({ data: [{ n: 42 }] })

    const result = await withGraph(async (g) => {
      return await g.query<{ n: number }>("MATCH (n) RETURN n.value AS n")
    })

    expect(connectMock).toHaveBeenCalledTimes(1)
    expect(queryMock).toHaveBeenCalledWith("MATCH (n) RETURN n.value AS n", undefined)
    expect(closeMock).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ data: [{ n: 42 }] })
  })

  it("прокидывает params в query", async () => {
    queryMock.mockResolvedValue({})
    await withGraph(async (g) => g.query("MATCH (n {id: $id})", { id: "X" }))
    expect(queryMock).toHaveBeenCalledWith("MATCH (n {id: $id})", { params: { id: "X" } })
  })

  it("закрывает соединение даже если callback кинул ошибку", async () => {
    await expect(
      withGraph(async () => {
        throw new Error("user error")
      }),
    ).rejects.toThrow("user error")
    expect(closeMock).toHaveBeenCalledTimes(1)
  })

  it("прокидывает ConnectionOptions в connect", async () => {
    queryMock.mockResolvedValue({})
    await withGraph(async () => undefined, { url: "redis://h:1", graphName: "g" })
    expect(connectMock).toHaveBeenCalledWith({ url: "redis://h:1" })
    expect(selectGraphMock).toHaveBeenCalledWith("g")
  })

  it("возвращает значение, которое вернул callback", async () => {
    const v = await withGraph(async () => 123)
    expect(v).toBe(123)
  })
})
```

- [ ] **Step 2: Запустить — должен упасть**

```bash
pnpm test tests/withGraph.test.ts
```

Expected: FAIL — модуль не существует.

- [ ] **Step 3: Реализовать `withGraph`**

`packages/graph/src/withGraph.ts`:

```ts
import { close, connect, query } from "./internal/connection"
import type { ConnectionOptions } from "./types"

export interface GraphSession {
  query: <R = Record<string, unknown>>(
    cypher: string,
    params?: Record<string, unknown>,
  ) => Promise<R[]>
}

/**
 * Открывает соединение с FalkorDB, передаёт сессию в callback и закрывает.
 * Используется для нескольких Cypher-запросов в рамках одного логического действия
 * (валидация правил, обогащение модели). Соединение закрывается в finally.
 */
export const withGraph = async <T>(
  fn: (graph: GraphSession) => Promise<T>,
  opts?: ConnectionOptions,
): Promise<T> => {
  const conn = await connect(opts)
  try {
    const session: GraphSession = {
      query: async <R>(cypher: string, params?: Record<string, unknown>) =>
        (await query(conn, cypher, params)) as R[],
    }
    return await fn(session)
  } finally {
    await close(conn)
  }
}
```

- [ ] **Step 4: Реэкспортировать**

Дописать в `packages/graph/src/index.ts`:

```ts
export { withGraph, type GraphSession } from "./withGraph"
```

Финальный `index.ts`:

```ts
export {
  close,
  connect,
  ensureIndex,
  query,
  type GraphConnection,
  type GraphOptions,
} from "./internal/connection"

export type {
  ConnectionOptions,
  EdgeData,
  FileGraphData,
  GraphPrimitive,
  NodeData,
} from "./types"

export { updateGraph } from "./updateGraph"
export { withGraph, type GraphSession } from "./withGraph"
```

- [ ] **Step 5: Прогнать тесты**

```bash
pnpm test
```

Expected: PASS — все тесты пакета зелёные.

- [ ] **Step 6: Commit**

```bash
git add packages/graph/src/withGraph.ts packages/graph/src/index.ts packages/graph/tests/withGraph.test.ts
git commit -m "$(cat <<'EOF'
feat: :sparkles: публичный withGraph для @nakidka/graph

Открывает соединение, передаёт сессию с query-методом в callback,
закрывает в finally. Используется будущими Cypher-правилами и
валидацией для нескольких запросов в рамках одной логической
операции — без ручного управления connect/close.
EOF
)"
```

---

## Task 11: Integration-тест на реальной FalkorDB через testcontainers

**Files:**
- Create: `packages/graph/tests/integration/setup.ts`
- Create: `packages/graph/tests/integration/updateGraph.integration.test.ts`

- [ ] **Step 1: Создать setup для testcontainers**

`packages/graph/tests/integration/setup.ts`:

```ts
import { GenericContainer, type StartedTestContainer } from "testcontainers"

let container: StartedTestContainer | undefined

export const startFalkorDB = async (): Promise<{ url: string }> => {
  container = await new GenericContainer("falkordb/falkordb:latest")
    .withExposedPorts(6379)
    .start()
  const port = container.getMappedPort(6379)
  return { url: `redis://localhost:${port}` }
}

export const stopFalkorDB = async (): Promise<void> => {
  if (container !== undefined) {
    await container.stop()
    container = undefined
  }
}
```

- [ ] **Step 2: Написать integration-тест**

`packages/graph/tests/integration/updateGraph.integration.test.ts`:

```ts
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { startFalkorDB, stopFalkorDB } from "./setup"
import { updateGraph, withGraph } from "../../src/index"
import type { FileGraphData } from "../../src/index"

let url: string
const graphName = "test_nakidka"

beforeAll(async () => {
  ;({ url } = await startFalkorDB())
}, 60_000)

afterAll(async () => {
  await stopFalkorDB()
}, 30_000)

beforeEach(async () => {
  await withGraph(
    async (g) => {
      await g.query("MATCH (n) DETACH DELETE n")
    },
    { url, graphName },
  )
})

const opts = () => ({ url, graphName })

describe("updateGraph (integration)", () => {
  it("создаёт узлы с динамическими метками и свойствами", async () => {
    const files: FileGraphData[] = [
      {
        filePath: "a.yaml",
        nodes: [
          {
            id: "Справочник.Контрагенты",
            label: "MetadataCatalog",
            props: { name: "Контрагенты", filePath: "a.yaml", p_hierarchical: true },
          },
        ],
        edges: [],
      },
    ]
    await updateGraph(files, opts())

    const rows = await withGraph(
      async (g) =>
        await g.query<{ id: string; name: string; hier: boolean }>(
          "MATCH (n:MetadataCatalog) RETURN n.id AS id, n.name AS name, n.p_hierarchical AS hier",
        ),
      opts(),
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      id: "Справочник.Контрагенты",
      name: "Контрагенты",
      hier: true,
    })
  })

  it("создаёт ребро между узлами по (src, kind, tgt)", async () => {
    const files: FileGraphData[] = [
      {
        filePath: "a.yaml",
        nodes: [
          { id: "A", label: "MetadataCatalog", props: { name: "A", filePath: "a.yaml" } },
          { id: "B", label: "MetadataCatalog", props: { name: "B", filePath: "a.yaml" } },
        ],
        edges: [{ src: "A", tgt: "B", kind: "VALUE", props: { yaml: "Значение" } }],
      },
    ]
    await updateGraph(files, opts())

    const rows = await withGraph(
      async (g) =>
        await g.query<{ src: string; tgt: string; yaml: string }>(
          "MATCH (s)-[r:VALUE]->(t) RETURN s.id AS src, t.id AS tgt, r.yaml AS yaml",
        ),
      opts(),
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]).toEqual({ src: "A", tgt: "B", yaml: "Значение" })
  })

  it("превращает ref-target в stub при удалении файла-определения", async () => {
    // 1. Создаём A → ref → B (B определена в b.yaml)
    await updateGraph(
      [
        {
          filePath: "a.yaml",
          nodes: [
            { id: "A", label: "MetadataCatalog", props: { name: "A", filePath: "a.yaml" } },
          ],
          edges: [{ src: "A", tgt: "B", kind: "VALUE" }],
        },
        {
          filePath: "b.yaml",
          nodes: [
            { id: "B", label: "MetadataCatalog", props: { name: "B", filePath: "b.yaml", p_hierarchical: false } },
          ],
          edges: [],
        },
      ],
      opts(),
    )

    // 2. Перепосылаем только b.yaml без B (B исчез из определений)
    await updateGraph(
      [{ filePath: "b.yaml", nodes: [], edges: [] }],
      opts(),
    )

    // B должен остаться как stub (есть входящее ребро от A)
    const rows = await withGraph(
      async (g) =>
        await g.query<{ id: string; fp: string | null; hier: boolean | null }>(
          "MATCH (n) WHERE n.id = 'B' RETURN n.id AS id, n.filePath AS fp, n.p_hierarchical AS hier",
        ),
      opts(),
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]?.fp).toBeNull()
    expect(rows[0]?.hier).toBeNull()
  })

  it("удаляет orphan-stub при cleanup", async () => {
    // 1. Создаём A → ref → B и определение B
    await updateGraph(
      [
        {
          filePath: "a.yaml",
          nodes: [
            { id: "A", label: "MetadataCatalog", props: { name: "A", filePath: "a.yaml" } },
          ],
          edges: [{ src: "A", tgt: "B", kind: "VALUE" }],
        },
        {
          filePath: "b.yaml",
          nodes: [
            { id: "B", label: "MetadataCatalog", props: { name: "B", filePath: "b.yaml" } },
          ],
          edges: [],
        },
      ],
      opts(),
    )

    // 2. Удаляем a.yaml (исчезает ребро A→B и сам узел A)
    //    и b.yaml (B становится orphan-stub)
    await updateGraph(
      [
        { filePath: "a.yaml", nodes: [], edges: [] },
        { filePath: "b.yaml", nodes: [], edges: [] },
      ],
      opts(),
    )

    const rows = await withGraph(
      async (g) =>
        await g.query<{ cnt: number }>(
          "MATCH (n) WHERE n.id IN ['A', 'B'] RETURN count(n) AS cnt",
        ),
      opts(),
    )
    expect(rows[0]?.cnt).toBe(0)
  })

  it("повторный updateGraph не создаёт дубликатов", async () => {
    const files: FileGraphData[] = [
      {
        filePath: "a.yaml",
        nodes: [
          { id: "A", label: "MetadataCatalog", props: { name: "A", filePath: "a.yaml" } },
        ],
        edges: [],
      },
    ]
    await updateGraph(files, opts())
    await updateGraph(files, opts())

    const rows = await withGraph(
      async (g) =>
        await g.query<{ cnt: number }>("MATCH (n:MetadataCatalog) RETURN count(n) AS cnt"),
      opts(),
    )
    expect(rows[0]?.cnt).toBe(1)
  })
})
```

- [ ] **Step 3: Прогнать integration-тесты**

```bash
cd /Users/nikita/git/nakidka-core/packages/graph
pnpm test:integration
```

Expected: PASS — Docker поднимает контейнер `falkordb/falkordb:latest`, все 5 тестов зелёные. Первый запуск может занять ~30 секунд (pull образа); последующие — ~10–15 секунд.

Если падает с ошибкой типа `Could not find a working container runtime` — проверить, что Docker запущен (`docker ps`).

- [ ] **Step 4: Убедиться, что `pnpm test` (без integration) проходит**

```bash
pnpm test
```

Expected: PASS — обычный набор тестов не пытается запустить Docker.

- [ ] **Step 5: Прогнать корневой `pnpm test` — убедиться, что ничего не сломалось**

```bash
cd /Users/nikita/git/nakidka-core
pnpm test
```

Expected: PASS во всех пакетах (`core`, `cli`, `language`, `graph`). Integration-тесты не запускаются (другой скрипт).

- [ ] **Step 6: Commit**

```bash
git add packages/graph/tests/integration/
git commit -m "$(cat <<'EOF'
test: :white_check_mark: интеграционные тесты updateGraph на FalkorDB

Через testcontainers поднимается реальный контейнер
falkordb/falkordb:latest, тесты проверяют end-to-end сценарии:
создание узлов и рёбер, превращение ref-target в stub при
удалении файла-определения, cleanup orphan-stub'ов и идемпотентность
повторного updateGraph. Запускается только pnpm test:integration —
основной pnpm test от Docker не зависит.
EOF
)"
```

---

## Самопроверка плана

После выполнения всех 11 задач:

- Публичный API пакета `@nakidka/graph` соответствует разделу «Интерфейсы» дизайн-документа: `updateGraph(files, opts?)`, `withGraph(fn, opts?)`, типы `NodeData`, `EdgeData`, `FileGraphData`, `ConnectionOptions`, `GraphPrimitive`.
- Поведение `updateGraph` реализует все 4 шага раздела «Поведение updateGraph»: удаление по `filePath` с stub'ификацией → merge nodes → merge edges → cleanup orphan stubs.
- Stub-маркер — `props.filePath IS NULL` (решение №3 спеки).
- Динамические метки узлов и рёбер собираются строкой Cypher per-batch (FalkorDB не позволяет параметризовать метки через `$param`).
- Размер чанка — 5000 (константа `BATCH_SIZE`, согласовано со спекой).
- Старый low-level API (`connect`/`close`/`query`/`ensureIndex`) сохранён через реэкспорт из `internal/connection` — CLI продолжает работать без изменений до фазы 4.
- Unit-тесты пакета не зависят от Docker, integration-тесты в отдельном скрипте.
- Conflict detection между файлами (вопрос №6 спеки) сознательно не реализована — добавим по факту первого инцидента.

## Что НЕ входит в этот план (следующие фазы)

- Фаза 1: чистые `graphFromModel.ts` + `buildGraph` агрегатор (переписать 11 файлов в `packages/core/metadata/**/graphFromModel.ts` на возврат `GraphOps`).
- Фаза 2: раскладка свойств модели (общий алгоритм сплющивания, type-specific обработчики для `MetadataValue`, `TypeDescription`, массивов объектов и т. п.).
- Фаза 3: `BuildModelFromGraphFunction` для двухступенчатого `toXML`.
- Фаза 4: удаление `MetadataGraph`/graphology, `validateProject`, dead extension code; CLI `update-graph` упрощается до `await updateGraph(buildGraph(...))`.
- Фаза 5: настройка CI на FalkorDB-зависимые тесты.
