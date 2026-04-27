# Интерфейс пакета `@nakidka/graph` и переезд core на чистые функции

Дата: 2026-04-27
Тип: дизайн-документ. Нулевой этап для подхода [Граф FalkorDB и Cypher в правилах метаданных](2026-04-27-graph-cypher-in-rules-approach.md).

## Контекст и проблема

Подход с Cypher-запросами в `rules.ts` предполагает, что:

1. Граф в FalkorDB **синхронен** с YAML-файлами.
2. Чтобы это было так, `fromYAML` должен писать в FalkorDB **штатно**, а не через отдельную CLI-команду.
3. Слой графа должен быть единственным — без параллельного in-memory графа (graphology).

Сейчас система устроена иначе:

- `MetadataGraph` на graphology — каноничный движок графа в core. В него пишут все `graphFromModel.ts` через мутацию параметра `graph`.
- FalkorDB наполняется **вручную** командой `nkdk update-graph`, которая сначала строит graphology в памяти, потом перекладывает узлы и рёбра в FalkorDB.
- Расширение VSCode имеет потребителей graphology (`workspaceGraph`, `definitionProvider`, `completionProvider`, `diagnosticProvider`), но они не работают на практике — это мёртвый код.
- CLI-валидация (`nkdk validate`, `validateProject.ts`, `getBrokenReferences`) — единственный живой потребитель graphology, кроме самого `update-graph`.

При прямом удалении graphology каскадно ломаются:

- `update-graph` — теряет источник данных.
- Все `graphFromModel.ts` (десятки файлов) — теряют целевой интерфейс `graph.ensureNode/ensureEdge`.
- `nkdk validate` — теряет `getBrokenReferences`.
- Walker и алгоритмы в `metadata/relations/*` — становятся бессмысленными без graphology.
- Все unit-тесты, использующие `new MetadataGraph()` в setup'ах, требуют переписывания.

Спека `2026-04-27-graph-cypher-in-rules-approach.md` явно выделяет миграцию `MetadataGraph → FalkorDB` в отдельный дизайн (этот документ), не входящий в этапы 1–5 основной спеки.

## Решение в одной фразе

Перевести `BuildGraphFromModelFunction` в форму **чистой функции**, возвращающей операции над графом, и спрятать всю работу с FalkorDB за двумя функциями пакета `@nakidka/graph`: `updateGraph(files)` и `withGraph(fn)`.

## Принципы

1. **`graphFromModel.ts` — чистые функции.** Принимают модель, возвращают узлы и рёбра. Никаких параметров типа `graph`, никаких побочных эффектов.
2. **`buildGraph(yamlFiles)` — чистая функция-агрегатор.** Принимает YAML как `Map<filePath, yamlText>`, возвращает `FileGraphData[]` — готовую структуру для записи. Никакого FS, никакой сети.
3. **`@nakidka/graph` инкапсулирует всё, что касается FalkorDB.** Подключение, очистка, MERGE, индексы, батчи, обработка stub-узлов, обнаружение конфликтов между файлами — всё внутри.
4. **Внешний API пакета — две функции.** `updateGraph(files)` для записи, `withGraph(fn)` для чтения через Cypher.
5. **Метки узлов — семантические** (`Form`, `Catalog`, `FormAttribute`, `Type`), берутся из `itemType` в правилах. Никакой общей метки `:MetadataNode`.
6. **Метки рёбер — ASCII SCREAMING_SNAKE_CASE** по словарю из [2026-04-26-graph-edge-labels-ascii-design.md](2026-04-26-graph-edge-labels-ascii-design.md).
7. **JS-модель остаётся каноном при экспорте** на этом этапе. Граф — обогащённый индекс для будущих Cypher-запросов из правил, а не источник данных для `toXML`.

## Интерфейсы

### Пакет `@nakidka/graph`

```ts
export type GraphPrimitive = string | number | boolean | null

export interface NodeData {
  /** Полный YAML-путь узла. Уникальный идентификатор в графе. */
  id: string
  /** Семантическая метка в Cypher (`Form`, `Catalog`, `FormAttribute`, ...). */
  label: string
  /** Свойства узла. Только примитивы и их массивы — ограничение FalkorDB. */
  props: Record<string, GraphPrimitive | GraphPrimitive[]>
}

export interface EdgeData {
  src: string
  tgt: string
  /** ASCII-тип отношения в Cypher (`ATTRIBUTE`, `VALUE_TYPE`, ...). */
  kind: string
  props?: Record<string, GraphPrimitive>
}

export interface FileGraphData {
  filePath: string
  nodes: NodeData[]
  edges: EdgeData[]
}

export interface ConnectionOptions {
  url?: string
  graphName?: string
}

/** Обновляет содержимое графа по списку файлов:
 *  - удаляет узлы и рёбра, привязанные к этим файлам;
 *  - наливает новые;
 *  - узлы со входящими reference-рёбрами становятся stub'ами, а не удаляются. */
export const updateGraph: (
  files: FileGraphData[],
  opts?: ConnectionOptions,
) => Promise<void>

/** Выполняет несколько Cypher-запросов в одной сессии. */
export const withGraph: <T>(
  fn: (graph: {
    query: <R = Record<string, unknown>>(
      cypher: string,
      params?: Record<string, unknown>,
    ) => Promise<R[]>
  }) => Promise<T>,
  opts?: ConnectionOptions,
) => Promise<T>

export class GraphConflictError extends Error {
  conflicts: Array<{
    id: string
    oldLabel: string
    newLabel: string
    oldFile: string
    newFile: string
  }>
}
```

### Пакет `@nakidka/core`

```ts
export interface GraphOps {
  nodes: NodeData[]
  edges: EdgeData[]
}

export type BuildGraphFromModelFunction = (params: {
  model: unknown
  parentNodeId: string
  filePath: string
  yamlMap: YAMLMap | undefined
  propRule: PropertyRule
  extra?: Record<string, unknown>
}) => GraphOps

export interface ImportContext {
  version: string
  defaultLanguage: string
}

/** Чистый агрегатор: YAML-файлы → готовые данные для updateGraph. */
export const buildGraph: (
  yamlFiles: Map<string, string>,
  context: ImportContext,
) => FileGraphData[]
```

## Поведение `updateGraph`

### Шаги внутри одного вызова

1. **Удаление по `filePath`.** Для каждого файла из входа:
   - находит все узлы с этим `filePath`;
   - удаляет их исходящие рёбра;
   - узлы со входящими reference-рёбрами превращает в stub'ы (стирает `props`, кроме `id` и `label`); остальные узлы удаляет полностью;
   - чистит orphan-stub'ы (без `props.filePath` и без входящих рёбер).
2. **Pre-check на конфликты.** Перед записью пакет ищет конфликты:
   - внутри входного батча (два файла объявляют один `id` с разным `label`);
   - между входом и оставшимся в БД (узел существует с другим `label`, чем хочет назначить вход).

   Если находит — собирает в массив и бросает `GraphConflictError`, не модифицируя БД. Конкретный алгоритм (один большой Cypher или несколько мелких) — деталь реализации.
3. **Merge nodes.** Одним батчевым `UNWIND ... MERGE` по динамически собранному label. Stub'ы сливаются с full-узлами автоматически.
4. **Create edges.** Одним батчевым `UNWIND ... MERGE` по `(src, kind, tgt)`. Свойства ребра обновляются на existing.

Размер чанка в `UNWIND` — 5000 (как сейчас в `update-graph.ts`).

### Сценарии вызова

- **Полная сборка проекта** (CLI `nkdk update-graph`): один вызов `updateGraph(allFiles)`. Внутри — батчи по 5000.
- **Инкрементальный апдейт** (когда вернётся расширение или появится watcher): один вызов с подмножеством файлов.

Семантика одинакова. Производительность зависит только от объёма входа.

## Конфликты и слияние

| Сценарий | Поведение |
|---|---|
| Файл объявляет узел, другой ссылается (full + stub) | Сливаем. Stub-узлы добавляют только то, что у них есть; full затирает. |
| Два файла создают stub на один узел | Сливаем. Дубликаты схлопываются в `MERGE`. |
| Два файла объявляют один узел с разным `label` | `GraphConflictError`. Запись не происходит. |
| Два файла объявляют один узел с одинаковым `label`, разными `props` | Сливаем `props` (последний выигрывает). Допустимо только в особых случаях (общие узлы), нормальный путь — один файл-владелец. |
| Дубликат ребра в `UNWIND`-батче | Свернётся через `MERGE`. |

Маркировка stub-узла — открытый вопрос (см. ниже №3); в дизайне принимаем «отсутствие `props.filePath`» как рабочую гипотезу, но решение зафиксируем по результатам имплементации первого Cypher-запроса.

## Контракт на стороне core

`graphFromModel.ts` после миграции выглядит так:

```ts
export const buildMetadataValueGraph: BuildGraphFromModelFunction = (params) => {
  const ops: GraphOps = { nodes: [], edges: [] }

  if (value.type === "ref") {
    ops.nodes.push({ id: targetId, label: "Catalog", props: {} }) // stub
    ops.edges.push({ src: parentNodeId, tgt: targetId, kind: "VALUE", props: { yaml: "Значение" } })
  }
  // ... остальные ветки

  return ops
}
```

Никакого `applyGraphOps`, никакого `graph` в параметрах. Тесты:

```ts
test("ref → ребро VALUE", () => {
  const result = buildMetadataValueGraph({ model: ..., parentNodeId: "...", ... })
  expect(result).toEqual({ nodes: [...], edges: [...] })
})
```

`buildGraph` накапливает результаты всех правил по каждому файлу:

```ts
export const buildGraph = (yamlFiles, context) => {
  const result: FileGraphData[] = []
  for (const [filePath, yamlText] of yamlFiles) {
    const fileOps = invokeAllRulesForFile(filePath, yamlText, context)
    result.push({ filePath, ...flattenOps(fileOps) })
  }
  return result
}
```

`invokeAllRulesForFile` — внутренняя процедура core, которая знает, какие правила применять к какому виду YAML (`catalog`, `document`, `form`, `enumeration`).

## Что удаляется

| Слой | Файлы | Причина |
|---|---|---|
| `@nakidka/extension` | `workspaceGraph.ts`, `definitionProvider.ts`, `completionProvider.ts`, `diagnosticProvider.ts`, регистрация в `main.ts` | Не работает в проде |
| `@nakidka/core/metadata/relations` | `MetadataGraph.ts`, `GraphWalker.ts`, `applyGraphOps.ts`, `addRelation.ts`, `referenceScope.ts`, `getDependencies.ts`, `resolveFormLocalPath.ts`, `autocompletePath.ts`, `existPath.ts`, `graph.ts` | Все потребители graphology |
| `@nakidka/core/metadata/validation` | `validateProject.ts` | Зависит от walker'а graphology |
| `@nakidka/cli/src/commands` | `validate.ts` | Использует `validateProject` |
| `@nakidka/core/metadata/forms/commonObjects/dataPath` | `isDynamicListAttribute.ts` | Замещается Cypher-правилом на этапе 1 спеки |
| `package.json` | dependency `graphology` | Больше не используется |

`referenceScope` в `metadata/appliedObjects/*/rules.ts` — оставляем декларации как «парковка» до этапа 2 спеки (Cypher-валидация значений). Поле `referenceScope` в `PropertyRule` остаётся в типе.

## Что остаётся

- Все `graphFromModel.ts` — переписываются на возврат `GraphOps`, но логика «что считается узлом, что ребром» остаётся той же.
- `applyGraphOps` — превращается во внутренний хелпер `flattenOps` (без `graph`-параметра, конкатенирует `children/references` в плоские `nodes/edges`).
- `update-graph` CLI — упрощается до `await updateGraph(buildGraph(yamlFiles, context))`.

## Тесты

| Слой | Где живут | FalkorDB? |
|---|---|---|
| `graphFromModel.ts` (десятки файлов) | unit-тесты рядом с файлами | нет |
| `buildGraph` (агрегатор) | `packages/core/metadata/orchestration/buildGraph.test.ts` | нет |
| `updateGraph` (`@nakidka/graph`) | `packages/graph/tests/updateGraph.test.ts` | да (интеграционные) |
| Конфликты, stub'ы, инвалидация | там же | да |
| Cypher-правила (этап 1 спеки) | в правилах прикладных объектов | да |

CI поднимает FalkorDB только для тестов в `packages/graph/tests/` и для тестов Cypher-правил. Основная масса тестов проекта (`pnpm test` в core) от FalkorDB не зависит.

## Открытые вопросы

1. **Что хранить в `props` узла.** Минимум — `name`, `filePath`, `offset`, `length`, `resolved`. Максимум — все поля JS-модели объекта (имя, флаги, типы как массив строк, ...). Подход спеки — «обогащённый индекс», то есть ближе к максимуму. Но FalkorDB принимает только примитивы и массивы примитивов; вложенные структуры (`type: { type: ["String", "Number"] }`) надо разворачивать или сериализовать в JSON-строку. Решение зависит от первого Cypher-запроса в `rules.ts`.

2. **Множественные `filePaths` на узле.** В graphology узел может принадлежать нескольким файлам (форма — `Форма.yaml` и `Форма.nkdk`). Нужно ли это в FalkorDB или сводим к одному `filePath` с правилами «какой файл считается каноническим»? Влияет на алгоритм инвалидации.

3. **Маркировка stub-узлов.** Варианты: (а) отсутствие `filePath` в `props`, (б) отдельная метка `:Stub` в дополнение к семантической, (в) явный `props.resolved: false`. Влияет на форму Cypher-запросов.

4. **Производительность `updateGraph` при 100k+ узлах.** Нужна ли стримовая обработка (передавать чанки по 5000 файлов внутрь, не держать всё в куче)? Не критично сейчас, но точка для замера в boundary-случаях.

5. **Connection pooling.** `updateGraph` и `withGraph` сейчас независимы — каждый открывает соединение, закрывает. Если в одном процессе они вызываются часто (например, watcher после правки YAML делает `updateGraph` и сразу `withGraph` для проверки) — нужен ли пул? До появления реальной нагрузки — нет.

6. **Какие именно поля считаются конфликтом.** Сейчас сказано «разный `label`». Должны ли расхождения в конкретных `props` (например, разные `itemType` при одинаковом `label`) тоже считаться конфликтом? Ответ зависит от того, что попадёт в `props` (вопрос 1).

7. **Источник `label` для узла.** Берём ли его из `propRule.itemType` (значит, всегда строка-литерал в правиле) или из факта регистрации правила (`registerTypeRule("Form", ...)`)? Влияет на API чистых функций — могут ли они выводить `label` сами или получают его параметром.

8. **Стандартные реквизиты.** Решение №18 архитектуры графа: всегда создаются как узлы при импорте объекта (`Ссылка`, `ПометкаУдаления`, `Дата`, ...), набор определяется типом объекта из `rules.ts`. После переезда на чистые функции — это либо отдельная функция-генератор стандартных реквизитов, вызываемая из `buildGraph`, либо часть правила прикладного объекта. Уточнить при имплементации.

9. **Тестовая инфраструктура для `@nakidka/graph`.** Поднимаем FalkorDB в CI через Docker, через `redis-stack`, через testcontainers, или ожидаем уже запущенный сервис? Локально — то же самое. Это бытовой DevOps-вопрос, отделить от дизайна.

10. **Удаление `validateProject` без замены.** CLI `nkdk validate` сейчас запускается отдельной командой и проверяет битые ссылки. После удаления вместо «валидация недоступна» можно вернуть «валидация переехала в `nkdk update-graph`» (он же может бросать на конфликтах) — или вернётся как Cypher-команда на этапе 2 спеки. Решить, оставлять ли заглушку.

## Связанные документы

- [`2026-04-27-graph-cypher-in-rules-approach.md`](2026-04-27-graph-cypher-in-rules-approach.md) — основная спека, для которой этот документ — нулевой этап.
- [`2026-04-26-graph-edge-labels-ascii-design.md`](2026-04-26-graph-edge-labels-ascii-design.md) — словарь меток рёбер.
- [`architecture-orchestration.md`](../../architecture-orchestration.md) — слой orchestration, где живут правила.
- Запись в памяти `project_graph_architecture.md` — 18 решений по графу, на которые опирается этот дизайн.
