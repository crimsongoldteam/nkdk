# Перевод меток рёбер графа на ASCII (SCREAMING_SNAKE_CASE)

**Дата:** 2026-04-26
**Статус:** дизайн утверждён, готов к плану реализации

## Контекст и проблема

Граф метаданных хранит на каждом ребре два значения, которые сейчас совпадают:

- `kind` — семантический вид ребра, используется логикой (`isOwning`, `registerEdgeKind`) и подставляется в Cypher как **тип отношения**.
- `yaml` — YAML-ключ для round-trip и человекочитаемого отображения.

В `addRelation.ts:30` и в большинстве `graphFromModel.ts` оба поля установлены в одну русскую строку (`Реквизит`, `Тип`, `ДополнительнаяКолонка`, …). При выгрузке в FalkorDB `kind` подставляется в Cypher через backticks, и сама вставка работает.

Однако **FalkorDB Browser** при клике по чипу типа отношения генерирует запрос без backticks:

```
MATCH p=()-[:ДополнительнаяКолонка]-() RETURN p LIMIT 300
```

UTF-8 теряется по пути, парсер падает с ошибкой:

```
errMsg: Invalid input '�': expected a relationship type line: 1, column: 14, offset: 13
```

Это ограничение веб-консоли (она не цитирует unicode-идентификаторы и/или плохо проксирует UTF-8), и оно не подконтрольно проекту.

## Решение

Разделить два понятия, которые сегодня смешаны: `kind` становится ASCII-меткой для Cypher и логики, `yaml` остаётся русским YAML-ключом для round-trip и человекочитаемости.

**Соглашение об именовании kind:** `SCREAMING_SNAKE_CASE` (канон Cypher-сообщества).

| Поле на ребре | Назначение | Язык | Пример |
|---|---|---|---|
| `kind` | Идентификатор для логики (isOwning) и тип отношения в Cypher | ASCII, `SCREAMING_SNAKE_CASE` | `ATTRIBUTE` |
| `yaml` | YAML-ключ для round-trip и человекочитаемое имя | Русский | `Реквизит` |

### Таблица переводов

| Русский (yaml) | Cypher (kind) |
|---|---|
| Реквизит | `ATTRIBUTE` |
| ТабличнаяЧасть | `TABULAR_SECTION` |
| СтандартныйРеквизит | `STANDARD_ATTRIBUTE` |
| ЗначениеПеречисления | `ENUM_VALUE` |
| ПустаяСсылка | `EMPTY_REF` |
| MetadataCatalog | `METADATA_CATALOG` |
| MetadataDocument | `METADATA_DOCUMENT` |
| MetadataEnumeration | `METADATA_ENUMERATION` |
| Форма | `FORM` |
| РеквизитФормы | `FORM_ATTRIBUTE` |
| ПараметрФормы | `FORM_PARAMETER` |
| КолонкаФормы | `FORM_COLUMN` |
| ЭлементФормы | `FORM_ELEMENT` |
| ДополнениеТаблицы | `TABLE_EXTENSION` |
| ДополнительнаяКолонка | `ADDITIONAL_COLUMN` |
| Родитель | `PARENT` |
| Тип | `TYPE` |
| Объект | `OBJECT` |
| Поле | `FIELD` |
| Значение | `VALUE` |
| ТипЗначения | `VALUE_TYPE` |
| ОграничениеТипа | `TYPE_RESTRICTION` |
| Таблица | `TABLE` |

### Что НЕ меняется

- `nodeSegment` — структурные сегменты в node ID остаются русскими (`Catalogs.Контрагенты.Реквизит.ИНН`).
- `compressMetadataFieldPath`, `metadataPath/types.ts`, `metadataPath/compressPath.ts` — не трогаем.
- YAML-фикстуры (`tests/fixtures/**`) — источник истины (AGENTS.md явно запрещает изменения).
- YAML round-trip — `yaml` поле сохраняет русское значение.
- Property `yaml` на ребре в FalkorDB — остаётся русским (это property, не identifier; UTF-8 в значениях работает).
- Сигнатуры публичного API (`addRelation`, `MetadataGraph.ensureEdge`, `isOwning`, `registerEdgeKind`).

## Архитектура

### Компоненты под изменение

**1. `packages/core/metadata/relations/edgeKinds.ts`**

Заменить содержимое наборов `_owning`/`_known` с русских строк на ASCII по таблице переводов выше.

Добавить экспорт для проверки инварианта:

```ts
export function getKnownKinds(): readonly string[] {
  return [..._known]
}
```

**2. `packages/core/metadata/relations/addRelation.ts`**

```ts
const RelationTypes = {
  parent:    { yaml: "Родитель", kind: "PARENT" },
  attribute: { defaultRelation: true, yaml: "Реквизит", kind: "ATTRIBUTE" },
} as const

// внутри addRelation:
const edgeKey = `${fromId}:${relConfig.kind}:${toId}`
graph.ensureEdge(edgeKey, fromId, toId, { yaml: relConfig.yaml, kind: relConfig.kind })
```

**3. Все `graphFromModel.ts` (формы и common):**

- `forms/commonObjects/formAttribute/graphFromModel.ts` (4 константы: `COLUMN_EDGE`, `ADDITION_EDGE`, `TABLE_EDGE`, `ADDITIONAL_COLUMN_EDGE`)
- `forms/commonObjects/associatedTable/graphFromModel.ts`
- `forms/commonObjects/commandName/graphFromModel.ts`
- `forms/commonObjects/dataPath/graphFromModel.ts`
- `forms/elements/graphFromModel.ts`
- `commonObjects/metadataRef/graphFromModel.ts`
- `commonObjects/metadataValue/graphFromModel.ts`
- `commonObjects/metadataField/graphFromModel.ts`

Шаблон правки:

```ts
const EDGE_KIND = "OBJECT"   // было: "Объект"
const EDGE_YAML = "Объект"   // новое
// ...
graph.ensureEdge(edgeKey, src, tgt, { kind: EDGE_KIND, yaml: EDGE_YAML })
```

**4. `register.ts` для типов с `graphChild`:**

- `commonObjects/metadataAttribute/register.ts`
- `commonObjects/metadataTabularSection/register.ts`
- (и любые другие места, где `registerTypeRule(..., "graphChild", { edgeName, ... })`)

Расширить тип `GraphChildConfig` в `orchestration/` полем `edgeYaml: string`. `edgeName` становится ASCII kind:

```ts
graphChild: {
  idFrom: "name",
  edgeName: "ATTRIBUTE",   // kind для Cypher и логики
  edgeYaml: "Реквизит",    // YAML round-trip
  nodeSegment: "Реквизит", // остаётся как было
}
```

Обработчик `graphChild` в orchestration (там, где сейчас читается `edgeName` и подставляется в `ensureEdge` дважды как `kind` и `yaml`) меняется на использование `edgeName` для `kind` и `edgeYaml` для `yaml`.

**5. `MetadataGraph.ts`**

API не меняется — `MetadataEdgeAttrs` уже содержит и `kind`, и `yaml`. Просто значения теперь разные.

**6. `cli/src/commands/updateGraph.ts`**

Изменений не требуется. `attributes.kind` уже подставляется в Cypher как тип отношения, `attributes.yaml` сохраняется как property. Backticks вокруг kind можно сохранить (избыточны для ASCII, но безопасны).

## Поток данных

### Build

```
.yaml файл
   ↓ rules.ts (yaml: "Тип" — ключ для парсинга, не трогаем)
   ↓ graphFromModel.ts → graph.ensureEdge(key, src, tgt, { kind: "TYPE", yaml: "Тип" })
   ↓ MetadataGraph (graphology, in-memory) — хранит обе строки
```

### Выгрузка в FalkorDB

```
graph.outEdgeEntries(nodeId) → { kind, yaml, ... }
   ↓ группировка по kind (updateGraph.ts:170-172)
   ↓ для каждой группы:
     UNWIND $batch AS e ... CREATE (s)-[:`TYPE` { yaml: e.yaml }]->(t)
   ↓ FalkorDB: relationship type = "TYPE" (ASCII), property yaml = "Тип"
```

В FalkorDB Browser клик по чипу теперь генерирует валидный запрос:

```
MATCH p=()-[:TYPE]-() RETURN p LIMIT 300
```

В попапе ребра property `yaml` показывает русское «Тип».

### YAML round-trip

YAML-сериализация использует `yaml`-поле ребра (или `yaml`-ключи из rules.ts). Изменений нет — русские ключи сохраняются.

### Walker

`GraphWalker` сравнивает сегменты путей с `nodeSegment` в node ID. `nodeSegment` остаётся русским — изменений нет.

## Миграция

В `updateGraph.ts:141` каждый запуск выполняет `MATCH (n:MetadataNode)-[r]->() DELETE r`. Поэтому при первом запуске после изменения старые русские relationship types исчезнут, появятся новые ASCII. **Отдельный миграционный скрипт не требуется** — достаточно одного `pnpm nakidka graph update`.

Узлы `MetadataNode` остаются с теми же ID — структура не меняется.

## Тесты

### Обновляемые тесты

1. **`packages/core/metadata/relations/MetadataGraph.test.ts`** — все литералы `kind: "Реквизит"`, `kind: "Тип"`, `kind: "MetadataCatalog"` и аналогичные → ASCII по таблице. `edgeKey`-строки в формате `${id}:${kind}:${id}` тоже обновить.
2. **`packages/core/metadata/relations/referenceScope.test.ts`** — `kind: "Реквизит"` (строка 125) и аналогичные → ASCII.
3. **`packages/core/metadata/orchestration/importMetadataFileWithGraph.test.ts`** — литералы вида `ДополнительнаяКолонка` → ASCII.
4. **Snapshot-тесты `graphFromModel`** — пересобрать через `pnpm test -u`. Diff должен затрагивать ТОЛЬКО `kind`, а `yaml` оставаться русским.
5. **`addRelation`-зависимые тесты** — обновить любые assert'ы про edge `kind`.

### Новые тесты

В `packages/core/metadata/relations/edgeKinds.test.ts` (создать или дополнить существующий):

```ts
import { describe, expect, test } from "vitest"
import { getKnownKinds } from "./edgeKinds"

describe("edgeKinds: ASCII invariant", () => {
  test("все известные kinds — валидные ASCII Cypher identifiers", () => {
    for (const kind of getKnownKinds()) {
      expect(kind).toMatch(/^[A-Z][A-Z0-9_]*$/)
    }
  })
})
```

Защита от регрессии: предотвращает случайную регистрацию русского kind через `registerEdgeKind`.

### Тесты, которые НЕ меняются

- YAML-фикстуры (`tests/fixtures/**`) — источник истины.
- YAML round-trip — `yaml`-поле осталось русским.
- Walker-тесты, оперирующие `nodeSegment` — `nodeSegment` остался русским.

## Критерии успеха

1. `pnpm test` зелёный (включая обновлённые snapshots).
2. `pnpm typecheck` (или `tsc --noEmit` в `packages/core`) — без ошибок типизации после добавления `edgeYaml` в `GraphChildConfig`.
3. В FalkorDB Browser клик по любому чипу relationship type выполняет запрос вида `MATCH p=()-[:ADDITIONAL_COLUMN]-() RETURN p LIMIT 300` без ошибки.
4. В попапе ребра property `yaml` показывает русское название.
5. YAML round-trip не сломан — никаких изменений в YAML-файлах при `pnpm nakidka import/export`.
6. Тест ASCII-инварианта проходит для всех зарегистрированных kinds.

## План проверки

1. После каждого этапа правок — `pnpm test`. Критичные пакеты: `packages/core/metadata/relations/`, `packages/core/metadata/forms/`, `packages/core/metadata/orchestration/`.
2. Ручная проверка FalkorDB:
   - Запустить FalkorDB локально (`redis://localhost:6379`).
   - `pnpm nakidka graph update <путь к конфигурации>`.
   - Открыть FalkorDB Browser, кликнуть по чипу любого типа отношения.
   - Убедиться, что запрос выполняется и показывает рёбра.
   - В попапе ребра убедиться, что property `yaml` содержит русское название.
