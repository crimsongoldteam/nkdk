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
5. **Метки узлов — `:PascalCase`** (`:MetadataCatalog`, `:Form`, `:FormAttribute`, `:Type`), берутся из `itemType` в правилах **как есть** (в правилах уже PascalCase). Никакой общей метки `:MetadataNode`. Чистая функция `BuildGraphFromModelFunction` возвращает узлы без `label` (`{ id, props }`); оркестратор проставляет `label` из `itemType` зарегистрированного правила.
6. **Метки рёбер — `:SCREAMING_SNAKE_CASE`** по словарю из [2026-04-26-graph-edge-labels-ascii-design.md](2026-04-26-graph-edge-labels-ascii-design.md). Канон Cypher: `:PascalCase` для узлов, `:SCREAMING_SNAKE_CASE` для рёбер — взгляд на запрос сразу различает «существительные» (узлы) и «связи» (рёбра).
7. **Граф — источник данных для `toXML` через JS-модель.** Конвейер двухступенчатый: `граф → модель → XML`. Граф хранит семантический lossless-снимок модели; XML-специфика (порядок атрибутов, `_xsi:nil`, namespace-префиксы) — ответственность стадии `toXML`, как и сейчас. Подробности раскладки — в разделе [Свойства узлов и рёбра](#свойства-узлов-и-рёбра).

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

```

Конфликт-детекция (два файла объявляют узел с разным `label` или `name`) сейчас **не делается** — это будущий слой над `updateGraph`. Полагаемся на `MERGE` FalkorDB; если конфликт случится, поведение определяется порядком батчей. По факту первого реального инцидента — добавим явную проверку и тип ошибки.

### Пакет `@nakidka/core`

```ts
/** Узел, возвращаемый чистой функцией. Без `label` — его проставит оркестратор
 *  по `itemType` зарегистрированного правила. */
export interface NodeOps {
  id: string
  props: Record<string, GraphPrimitive | GraphPrimitive[]>
}

/** Stub-цель ссылки. Создаётся, когда функция эмитит ребро на ещё неизвестный узел. */
export interface StubOps {
  id: string
  name?: string
}

export interface GraphOps {
  nodes: NodeOps[]
  stubs?: StubOps[]
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
2. **Merge nodes.** Одним батчевым `UNWIND ... MERGE` по динамически собранному label. Stub'ы сливаются с full-узлами автоматически.
3. **Create edges.** Одним батчевым `UNWIND ... MERGE` по `(src, kind, tgt)`. Свойства ребра обновляются на existing.

Размер чанка в `UNWIND` — 5000 (как сейчас в `update-graph.ts`).

### Сценарии вызова

- **Полная сборка проекта** (CLI `nkdk update-graph`): один вызов `updateGraph(allFiles)`. Внутри — батчи по 5000.
- **Инкрементальный апдейт** (когда вернётся расширение или появится watcher): один вызов с подмножеством файлов.

Семантика одинакова. Производительность зависит только от объёма входа.

## Конфликты и слияние

Все случаи слияния разруливаются `MERGE` в FalkorDB:

| Сценарий | Поведение |
|---|---|
| Файл объявляет узел, другой ссылается (full + stub) | Сливаем. Stub добавляет только то, что у него есть; full затирает. |
| Два файла создают stub на один узел | Сливаем. Дубликаты схлопываются в `MERGE`. |
| Два файла объявляют один узел с разным `label` | По факту — баг в построении `id`. Сейчас не ловим явно; FalkorDB добавит обе метки на узел. Если столкнёмся в реальности — добавим проверку. |
| Два файла объявляют один узел с одинаковым `label`, разными `props` | Сливаем `props` (последний выигрывает). |
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

## Свойства узлов и рёбра

### Принципы

1. **Граф — lossless-снимок JS-модели по семантике.** Двухступенчатый канон: `граф → модель → XML`. Из графа можно восстановить ту же модель, что была на входе; XML-специфика (порядок атрибутов, `_xsi:nil`, namespace-префиксы) — ответственность стадии `toXML`, в графе её нет.
2. **Координаты графа — без префикса.** На узлах: `id`, `name`, `filePath`, `line`, `col`. На рёбрах: `index` (для упорядоченных коллекций), `yaml` (исходное YAML-имя свойства, для диагностики).
3. **Свойства модели — под префиксом `p_`.** Любое поле JS-модели, попадая в `props` узла, получает префикс `p_`. Это даёт гигиеничное разделение «координаты vs семантика»: `n.filePath` — координата, `n.p_codeLength` — данные.
4. **Конвенция имён модели — camelCase без `_`.** Иначе биекция сплющивания вложенных объектов ломается.
5. **Метки рёбер — `:SCREAMING_SNAKE_CASE`, существительным**, без префикса `HAS_`. Имя ребра — это **роль целевого узла относительно источника** (`:FORM`, `:TEMPLATE`, `:ATTRIBUTE`, `:VALUE`, `:OBJECT`, `:REF_TYPE`).

### Скалярные типы

| Тип в правиле | В графе |
|---|---|
| `boolean` | `p_<имя>: true \| false` |
| `number` | `p_<имя>: <число>` |
| `string` (не-ref) | `p_<имя>: "<строка>"` |
| `SystemEnumeration` | `p_<имя>: "<значение>"` (как строка из enum'а) |
| `uuid` (не служебный `_uuid`) | `p_<имя>: "<строка>"` |

Служебный `_uuid` объекта в графе **не хранится** (см. ниже).

### Композитные plain-объекты

Сплющиваются общим алгоритмом по `_`:

```
{ numberQualifiers: { digits: 10, fractionDigits: 2 } }
→ p_numberQualifiers_digits: 10
  p_numberQualifiers_fractionDigits: 2
```

`I8nText`/`FormattedI8nText` — частный случай того же алгоритма, не требует type-specific обработчика:

```
synonym: { items: { ru: "Номенклатура", en: "Goods" } }
→ p_synonym_items_ru: "Номенклатура"
  p_synonym_items_en: "Goods"
```

Локализованные значения экспортируются обратно тем же алгоритмом — `toModel` собирает их в `{ items: { … } }` по ключам, начинающимся с `p_synonym_items_`.

### Массивы объектов и деревья

Каждый элемент массива объектов (`choiceParameters`, `characteristics`, `MetadataValueCollection`, `predefined`, …) — **отдельный узел** с типизированной меткой, связанный ребром от родителя:

```
(:MetadataAttribute {id: "Справочник.К.Реквизит.Менеджер"})
  -[:CHOICE_PARAMETER {index: 0}]->
(:ChoiceParameter {id: "Справочник.К.Реквизит.Менеджер.ПараметрВыбора[0]",
                   name: "Отбор.Контрагент"})
  -[:VALUE]-> (:MetadataCatalog {id: "Справочник.Контрагенты"})
```

Свойство `index` на ребре сохраняет порядок и используется только там, где **порядок семантичен**:

| Семантичный порядок (нужен `index`) | Несемантичный (без `index`) |
|---|---|
| `:ATTRIBUTE`, `:TABULAR_SECTION`, `:COMMAND` | `:FORM`, `:TEMPLATE` |
| `:CHOICE_PARAMETER`, `:CHOICE_PARAMETER_LINK` | |
| `:REF_TYPE` (для воспроизведения порядка в YAML) | |
| `:CHARACTERISTIC` | |

`predefined` — естественное дерево узлов `:PredefinedItem`, рёбра `:PREDEFINED_ITEM` от родителя к корням, между уровнями — те же `:PREDEFINED_ITEM` с `index`.

### Рёбра вместо строк

Отношения, которые в модели лежат как строки или служебные коллекции, в графе превращаются в рёбра:

| Случай | Ребро |
|---|---|
| `TypeDescription` ссылочные типы (`CatalogRef.X`, `DocumentRef.Y`) | `(:Attr)-[:REF_TYPE {index}]->(:MetadataCatalog \| :MetadataDocument \| …)`. В `p_types` остаются **только примитивы 1С** (`["Number", "String", "Date", …]`) |
| `forms` коллекция справочника/документа | `(:MetadataCatalog)-[:FORM]->(:ClientApplicationForm)` (создаётся со стороны узла формы при `buildGraph` файла `Форма.yaml`) |
| `templates` | `(:MetadataCatalog)-[:TEMPLATE]->(:Template)` |
| `objectModule`, `managerModule` | `(:MetadataCatalog)-[:OBJECT_MODULE \| :MANAGER_MODULE]->(:Module {p_path})`. Содержимое `.bsl` в граф **не пишется** |
| `help` | `(:MetadataCatalog)-[:HELP]->(:Help)`. Поля `Help` сплющиваются обычным правилом |
| `MetadataValue` ref (уже было) | `[:VALUE]` |
| `MetadataValue` objectRef (уже было) | `[:OBJECT]` |

### Что не пишется в граф

- **`InternalInfo`** — служебная мета XML-сериализации, в Cypher-правилах не нужна.
- **`xmlRoot`** — XML-специфика, восстанавливается из шаблона на стадии `toXML`.
- **`_uuid`** объекта — не хранится ни в модели, ни в графе. На стадии `toXML` берётся из отдельного канала или генерируется (текущее поведение, графа не касается).
- **Метаданные правил** из `rules.ts` (`xmlParents`, `defaultValueXML`, `defaultValueXMLRaw`, `xml`, `referenceScope`) — это конфигурация конвейера, не данные.
- **Содержимое модулей** — только координаты файла (`p_path`), сам BSL-текст в граф не попадает.

### Свойства с `toYAML: false` / `fromYAML: false`

Например, `objectBelonging: { type: "SystemEnumeration", toYAML: false, fromYAML: false, implicitValueYAML: "Native" }`. Они есть в JS-модели после `fromXML`/`fromYAML` (за счёт `implicitValueYAML` или `ImportContext`), и обрабатываются общим механизмом `p_*`. Источник значения для них — `implicitValueYAML` или контекст, не сам YAML. Никакого отдельного канала не требуется.

### Type-specific обработчики vs общий алгоритм

Общий алгоритм сплющивания (`{a: {b: 1}} → p_a_b: 1`) покрывает: примитивы, plain-объекты (`numberQualifiers`, `dateQualifiers`, …), `I8nText`/`FormattedI8nText`. Восстановление модели из графа для этих случаев — тоже общий алгоритм, без знания схемы.

Type-specific `BuildGraphFromModelFunction` нужны там, где есть **рёбра** или **отдельные узлы**:

- `MetadataValue` — ref/objectRef → рёбра `:VALUE` / `:OBJECT`.
- `MetadataValueCollection` — массив значений с возможными refs → отдельные узлы `:MetadataValueItem`.
- `TypeDescription` — ссылочные типы → рёбра `:REF_TYPE`, примитивы → `p_types`.
- Массивы объектов с внутренними композитами (`choiceParameters`, `characteristics`, …) → отдельные узлы с метками.
- `predefined` — дерево узлов `:PredefinedItem`.

Для каждого type-specific обработчика — симметричный `BuildModelFromGraphFunction`, регистрируемый в той же таблице `registerTypeRule(typeName, "buildModelFromGraph", fn)`.

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

## Решения и отложенные вопросы

1. **Что хранить в `props` узла.** Решено: граф — lossless-снимок JS-модели. Координаты графа — `id`, `name`, `filePath`, `line`, `col` — лежат на узле без префикса. Все свойства модели — под префиксом `p_` (`p_hierarchical`, `p_codeLength`, `p_synonym_items_ru`). Plain-объекты сплющиваются по `_` (`numberQualifiers.digits` → `p_numberQualifiers_digits`). Массивы объектов и составные значения со ссылками — отдельные узлы с типизированными метками. Никакого `data: string` с JSON. Полные правила раскладки — в разделе [Свойства узлов и рёбра](#свойства-узлов-и-рёбра).

2. **Многофайловые логические сущности.** Решено: один узел = один файл, межфайловые связи делаются через рёбра, а не через массив `filePaths`. Для формы это значит: элемент формы — отдельный узел в `Форма.nkdk` (идентичность, структура), его свойства — **отдельные `:Property`-узлы в `Форма.yaml`**, по одному на каждое значение. Связь — ребро `(:FormElement)-[:PROPERTY]->(:Property)`. Преимущества: каждый узел имеет точные `line/col` своего файла; инвалидация любого файла затрагивает только его узлы; Cypher-фильтры по свойствам работают через метку `:Property`.

3. **Маркировка stub-узлов.** Решено: stub = `props.filePath IS NULL`. Один источник истины, без избыточного `resolved`-флага и без отдельной метки `:Stub`. Cypher: `WHERE n.filePath IS NULL`.

4. **Производительность `updateGraph` при 100k+ узлах.** Отложено: нужна ли стримовая обработка (чанки по 5000 файлов внутрь, не держать всё в куче) — замерим по факту, оптимизируем если упрёмся.

5. **Connection pooling.** Отложено: пока `updateGraph` и `withGraph` независимы, каждый со своим соединением. Пул появится, если в одном процессе будет частый цикл «обнови граф → проверь Cypher».

6. **Конфликт-детекция между файлами.** Отложено: разный `label` или `name` на одном `id` — баг построения id, но сейчас явно не ловим. Полагаемся на `MERGE` FalkorDB. Добавим проверку и `GraphConflictError` по факту первого реального инцидента (с тестом).

7. **Источник `label` для узла.** Решено: `label` берётся из `itemType` зарегистрированного правила; чистая функция `BuildGraphFromModelFunction` возвращает `{ id, props }` без `label`, оркестратор проставляет его сам по контексту вызова. Это держит чистые функции минимальными и сосредоточивает назначение меток в одном месте.

8. **Стандартные реквизиты.** Решено: обычная `BuildGraphFromModelFunction` для типа `StandardAttributeDescriptions`. Она читает `propRule.standartAttributeNames` и эмитит по узлу `:StandardAttribute` на каждое имя из набора (`Ссылка`, `ПометкаУдаления`, `Дата`, ...), плюс при наличии в YAML — дополняет props переопределениями. Без спецслучаев в оркестраторе.

9. **Тестовая инфраструктура для `@nakidka/graph`.** Отложено к плану реализации: поднимаем FalkorDB в CI через testcontainers, docker-compose или внешний redis-stack — DevOps-вопрос, не для дизайна.

10. **Удаление `validateProject` и `nkdk validate`.** Решено: команду `nkdk validate` и `validateProject.ts` удаляем целиком, без заглушки. Вернётся под другим именем на этапе 2 основной спеки, когда появится Cypher-валидация.

## Связанные документы

- [`2026-04-27-graph-cypher-in-rules-approach.md`](2026-04-27-graph-cypher-in-rules-approach.md) — основная спека, для которой этот документ — нулевой этап.
- [`2026-04-26-graph-edge-labels-ascii-design.md`](2026-04-26-graph-edge-labels-ascii-design.md) — словарь меток рёбер.
- [`architecture-orchestration.md`](../../architecture-orchestration.md) — слой orchestration, где живут правила.
- Запись в памяти `project_graph_architecture.md` — 18 решений по графу, на которые опирается этот дизайн.
