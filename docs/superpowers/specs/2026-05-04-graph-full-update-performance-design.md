# Оптимизация полного обновления графа

## Контекст

При запуске `nkdk update-graph /Users/nikita/git/erp_nkdk` полный проект собрался за `~29 сек`, но запись в FalkorDB остановилась на фазе `mergeEdges`.

Инструментальный прогон показал:

- `readProjectFileList`: `13462` файлов проекта.
- Сборка: `13456` файловых сегментов, `385892` узла, `520428` рёбер, `4` предупреждения.
- `ensureFileIndexes`: `~3 мс`.
- `ensureLabelIndexes`: `~35 мс`.
- `deleteByFiles`: `~7.9 сек`.
- `mergeFiles`: `~0.9 сек`.
- `mergeNodes`: `~57 сек`.
- `mergeEdges`: не завершился за несколько минут.

Дополнительная проверка формы рёбер показала `78284` ребра без известной метки целевого узла. Для таких рёбер Cypher строится как `MATCH (t {id: e.tgt})`, без label и без подходящего индекса. Это превращает `mergeEdges` в широкий поиск по графу.

## Цель

Сделать полный `nkdk update-graph` измеримым и существенно быстрее на большом ERP-проекте, не ломая `update-graph --file` и `nkdk watch`.

Целевой результат:

- полный update не выглядит зависшим;
- `mergeEdges` не использует широкий `MATCH (n {id})`;
- full update учитывает paired `Форма.nkdk`;
- код сборки full/single/watch не расходится в двух независимых реализациях.

Ожидаемая экономия после первых двух оптимизаций: полный update должен уйти из режима `mergeEdges > 4 мин без завершения` к ориентиру `1.5-3 мин` на текущем ERP-каталоге. Точная цифра подтверждается только повторным замером на FalkorDB.

## Подход

Делаем три изменения вместе:

1. Общая сборка проекта для full update.
2. Общий label `GraphNode` и fallback-индекс для поиска по `id`.
3. Прогресс записи по фазам и батчам.

### 1. Общая сборка проекта

Текущий CLI full update строит граф циклом `buildGraphForChangedFile(...)` по каждому YAML-файлу. Это удобно переиспользовало single-file путь, но плохо подходит для полного графа: stub/reference-узлы могут оказаться в отфильтрованном сегменте `filePath === ""`, а `labelByNodeId` теряет часть target labels.

Нужно вернуть full update к общей сборке одним `GraphBuilder`, но не потерять paired `Форма.nkdk`.

Предлагаемый core API:

- `buildGraph(projectFiles, context)` остаётся агрегатором полного графа.
- Вход переходит с `Map<string, string>` на source records: `{ filePath, text, pairedText?, fileStats? }`. Для `Форма.yaml` paired `.nkdk` передаётся в `pairedText`.
- `buildGraphForChangedFile` остаётся API для `--file` и `watch`, но использует общие helper-части разбора формы и paired sources.

CLI получает один общий helper чтения проекта:

- читает `Свойства.yaml`, `Форма.yaml`, `Форма.nkdk`;
- для full update передаёт все source records в `buildGraph`;
- для single-file update продолжает вызывать `buildGraphForChangedFile`, но использует те же `pairedFormPath`, `absoluteProjectFile`, `readFileStats`.

Главный принцип: знание о том, как pairing формы превращается в graph sources, живёт в одном месте, а не копируется в full update, `--file` и `watch`.

### 2. `GraphNode` fallback

В `@nakidka/graph` добавляем общий label для всех предметных узлов:

```cypher
(:GraphNode {id})
```

Изменения:

- `ensureLabelIndexes` или отдельный `ensureGraphNodeIndexes` создаёт индекс `GraphNode(id)`.
- `mergeNodes` пишет каждый узел с его предметной меткой и общей меткой: `MERGE (m:<Label>:GraphNode {id: n.id})`.
- `mergeEdges` при известной метке продолжает использовать точный `MATCH (t:<Label> {id})`.
- Если метка source/target неизвестна, fallback становится `MATCH (n:GraphNode {id})`, а не `MATCH (n {id})`.

Это не заменяет правильную full-сборку, но страхует single-file/watch и неполные графовые сегменты.

Важно: `File`-узлы не должны получать `GraphNode`, потому что это служебные узлы синхронизации, а не предметные metadata-узлы.

### 3. Прогресс записи

Добавляем необязательный progress callback в `@nakidka/graph.updateGraph`:

```ts
onProgress?.({
  phase: "mergeEdges",
  done,
  total,
})
```

Фазы:

- `ensureFileIndexes`
- `ensureLabelIndexes`
- `deleteByFiles`
- `mergeFiles`
- `mergeNodes`
- `mergeEdges`
- `mergeFileLinks`
- `cleanupOrphanStubs`

Для батчевых фаз `done/total` считаются по батчам или элементам. CLI печатает короткие строки прогресса, например:

```text
mergeEdges       120/1041 batches
mergeEdges       done — 84.2 сек
```

Graph package остаётся владельцем фаз и батчей; CLI только отображает. Это не должно смешивать логику записи с логикой командной строки.

## Неграницы

- Не исправляем 4 предупреждения сборки ERP-проекта в этой задаче:
  - `path.split is not a function` для двух форм;
  - `Cannot read properties of undefined (reading 'type')` для двух документов.
- Не меняем правила NKDK-грамматики из-за Chevrotain ambiguous alternatives.
- Не меняем Cypher-семантику пользовательских правил.
- Не оптимизируем все свойства/flatten props.

## Проверка

Минимальные проверки:

- unit-тесты `@nakidka/graph` на `GraphNode` label/index и fallback `MATCH`.
- core-тесты на full `buildGraph` с paired `Форма.nkdk`.
- CLI-тесты helpers/update paths, если меняется слой чтения проекта.
- `pnpm --filter @nakidka/graph test`.
- `pnpm --filter @nakidka/core exec vitest run metadata/orchestration/buildGraph`.
- `pnpm --filter @nakidka/cli test`.

Ручной performance-check:

1. Запустить `nkdk update-graph /Users/nikita/git/erp_nkdk`.
2. Зафиксировать:
   - время сборки;
   - время `mergeNodes`;
   - время `mergeEdges`;
   - общее время;
   - количество узлов/рёбер.
3. Убедиться, что `mergeEdges` завершился и прогресс печатается.

## Риски

- Добавление общей метки `GraphNode` меняет форму уже записанных узлов. Full update должен проставить её всем предметным узлам при следующей записи.
- Если fallback `GraphNode` используется для узла, который ещё не создан, ребро не создастся. Это текущее поведение `MATCH`, его не меняем.
- При полной сборке с paired `.nkdk` важно не продублировать ownership: `Форма.yaml` владеет корнем формы, `Форма.nkdk` владеет визуальными элементами и contributes в корень.
