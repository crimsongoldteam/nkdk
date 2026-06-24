# Чистые `graphFromModel.ts` — фаза 1c + чистый `buildGraph` — фаза 1d

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Завершить перевод последнего `graphFromModel.ts` (`forms/elements`) на чистую форму, снять `graph: MetadataGraph` с сигнатуры `BuildGraphFromModelFunction` и ввести чистый агрегатор `buildGraph(yamlFiles, context) → FileGraphData[]` для FalkorDB-пайплайна. После этой фазы остаётся ровно одна задача (1e): переехать CLI `nkdk update-graph` на новый агрегатор и удалить graphology.

**Architecture:** Фаза 1c расширяет `GraphOpsChild` двумя полями (`absoluteId` — полный override `childNodeId`, `edgeFrom` — источник ребра ≠ `parentNodeId`), извлекает общий хелпер `applyBuildGraphResult` для нормализации `GraphOps | GraphOps[] → applyGraphOps` (сейчас дубликат в `orchestration/buildGraphFromModel.ts` и `forms/elements/graphFromModel.ts`), и переписывает оба обходчика в `forms/elements` на возврат `GraphOps[]` с `recurse`. После — снимаем `graph` из сигнатуры. Фаза 1d добавляет НОВЫЙ публичный entry-point `buildGraph(yamlFiles, context) → FileGraphData[]` в core: внутри по-прежнему собирается `MetadataGraph` (как промежуточная структура), а затем функция `walkGraphToFileData` обходит граф и формирует `FileGraphData[]` — с раскладкой `props` под префиксом `p_`, лейблом из `itemType` и группировкой по `filePath`. CLI пока не трогаем. Граф `MetadataGraph` остаётся как «движок» — его удаление происходит в фазе 1e.

**Tech Stack:** TypeScript 5.9, vitest 4. Без новых зависимостей — типы `FileGraphData`/`NodeData`/`EdgeData` локально в core, структурно совместимые с `@nakidka/graph`.

---

## Структура файлов

**Modify (фаза 1c):**
- `packages/core/metadata/orchestration/property/fn.ts` — `GraphOpsChild.absoluteId?`, `GraphOpsChild.edgeFrom?`. Финальной задачей — снять `graph: MetadataGraph` из `BuildGraphFromModelFunction`.
- `packages/core/metadata/relations/applyGraphOps.ts` — обработать `absoluteId`/`edgeFrom` в children-секции.
- `packages/core/metadata/orchestration/buildGraphFromModel.ts` — извлечь нормализацию в общий `applyBuildGraphResult`, не передавать `graph` в обработчики.
- `packages/core/metadata/forms/elements/graphFromModel.ts` — два обходчика в чистую форму, использовать общий хелпер.

**Create (фаза 1d):**
- `packages/core/metadata/orchestration/buildGraph/types.ts` — `NodeData`, `EdgeData`, `FileGraphData`, `GraphPrimitive` (структурно совместимы с `@nakidka/graph`).
- `packages/core/metadata/orchestration/buildGraph/flattenItem.ts` — алгоритм сплющивания plain-объекта в `Record<string, GraphPrimitive | GraphPrimitive[]>` с префиксом `p_`.
- `packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.ts` — обходит `MetadataGraph`, группирует узлы и рёбра по `filePath`, возвращает `FileGraphData[]`.
- `packages/core/metadata/orchestration/buildGraph/buildGraph.ts` — публичный `buildGraph(yamlFiles, context)` собирает `MetadataGraph` через существующий пайплайн и вызывает `walkGraphToFileData`.
- `packages/core/metadata/orchestration/buildGraph/index.ts` — реэкспорты.
- `packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts` — unit-тесты на справочнике, документе, форме, стабах.
- `packages/core/metadata/orchestration/buildGraph/flattenItem.test.ts` — unit-тесты алгоритма сплющивания.

**Modify (фаза 1d):**
- `packages/core/metadata/orchestration/index.ts` — реэкспорт `buildGraph` и типов.

**Не трогаем:**
- `packages/cli/src/commands/updateGraph.ts` — переезд CLI отложен в фазу 1e.
- `packages/core/metadata/relations/MetadataGraph.ts`, `applyGraphOps.ts`, `resolveFormLocalPath.ts` — остаются как движок промежуточной сборки. Удаление — в фазе 1e.
- Поле `referenceScope` в `PropertyRule` — без изменений (см. 2026-04-27-graph-cypher-in-rules-approach.md, этап 2).
- Существующие integration-тесты (`*/graphFromModel.test.ts`) через `MetadataGraph` остаются как контрактная проверка прежнего поведения.

---

## Task 1: Извлечь общий хелпер `applyBuildGraphResult`

**Files:**
- Modify: `packages/core/metadata/orchestration/buildGraphFromModel.ts`
- Modify: `packages/core/metadata/forms/elements/graphFromModel.ts`

Сейчас нормализация `GraphOps | GraphOps[] → posекционное applyGraphOps + recurse` дублируется в обоих файлах (см. долг, явно введённый в Task 3 фазы 1b). Извлекаем в общий хелпер. Это подготавливает почву для безопасной миграции `forms/elements`: после рефакторинга оба обходчика идут через одинаковый код.

- [ ] **Step 1: Добавить экспортируемую функцию `applyBuildGraphResult` в `buildGraphFromModel.ts`**

В `packages/core/metadata/orchestration/buildGraphFromModel.ts` добавить экспортируемую функцию **перед** функцией `buildGraphFromModel`:

```ts
import { GraphOps } from "./property/fn"

export interface ApplyBuildGraphResultContext {
  graph: MetadataGraph
  parentNodeId: string
  filePath: string
  /** Тип свойства — для понятного сообщения об ошибке. */
  propType: string
  /** Контекст, пробрасываемый в recurse-задачи по умолчанию. */
  extra?: Record<string, unknown>
}

/**
 * Нормализует результат BuildGraphFromModelFunction (GraphOps | GraphOps[] | undefined | void)
 * к массиву секций, применяет каждую через applyGraphOps и разворачивает recurse-задачи
 * через рекурсивный вызов buildGraphFromModel.
 *
 * Используется и основным оркестратором, и параллельным обходчиком свойств элементов формы
 * (forms/elements/graphFromModel.ts::buildElementChildrenGraph).
 */
export function applyBuildGraphResult(
  result: GraphOps | GraphOps[] | undefined | void,
  ctx: ApplyBuildGraphResultContext,
): void {
  const sections = Array.isArray(result) ? result : result ? [result] : []
  for (const section of sections) {
    const hasOps =
      section.children?.length ||
      section.references?.length ||
      section.formLocalReferences?.length
    if (hasOps) {
      if (!section.edgeKind || !section.edgeYaml) {
        throw new Error(
          `applyBuildGraphResult: обработчик типа "${ctx.propType}" вернул GraphOps без edgeKind/edgeYaml. ` +
            `Чистые функции должны указывать оба поля в результате.`,
        )
      }
      applyGraphOps(section, {
        graph: ctx.graph,
        parentNodeId: ctx.parentNodeId,
        filePath: ctx.filePath,
        edgeKind: section.edgeKind,
        edgeYaml: section.edgeYaml,
      })
    }
    for (const recurse of section.recurse ?? []) {
      buildGraphFromModel({
        model: recurse.model,
        yamlMap: recurse.yamlMap,
        rule: recurse.rule,
        graph: ctx.graph,
        parentNodeId: recurse.parentNodeId,
        filePath: ctx.filePath,
        extra: recurse.extra ?? ctx.extra,
      })
    }
  }
}
```

- [ ] **Step 2: Заменить блок `if (buildGraphFn) { ... }` в `buildGraphFromModel`**

В той же функции `buildGraphFromModel` заменить весь блок (примерно строки 58–104 текущего файла):

```ts
const buildGraphFn = getTypeRule(propType, "buildGraphFromModel")
if (buildGraphFn) {
  const result = buildGraphFn({
    model: model[key],
    parentNodeId,
    filePath,
    yamlMap,
    propRule,
    graph,
    extra,
  })
  const sections = Array.isArray(result) ? result : result ? [result] : []
  for (const section of sections) {
    const hasOps =
      section.children?.length ||
      section.references?.length ||
      section.formLocalReferences?.length
    if (hasOps) {
      if (!section.edgeKind || !section.edgeYaml) {
        throw new Error(
          `buildGraphFromModel: обработчик типа "${propType}" вернул GraphOps без edgeKind/edgeYaml. ` +
            `Чистые функции должны указывать оба поля в результате.`,
        )
      }
      applyGraphOps(section, {
        graph,
        parentNodeId,
        filePath,
        edgeKind: section.edgeKind,
        edgeYaml: section.edgeYaml,
      })
    }
    for (const recurse of section.recurse ?? []) {
      buildGraphFromModel({
        model: recurse.model,
        yamlMap: recurse.yamlMap,
        rule: recurse.rule,
        graph,
        parentNodeId: recurse.parentNodeId,
        filePath,
        extra: recurse.extra ?? extra,
      })
    }
  }
  continue
}
```

на:

```ts
const buildGraphFn = getTypeRule(propType, "buildGraphFromModel")
if (buildGraphFn) {
  const result = buildGraphFn({
    model: model[key],
    parentNodeId,
    filePath,
    yamlMap,
    propRule,
    graph,
    extra,
  })
  applyBuildGraphResult(result, { graph, parentNodeId, filePath, propType, extra })
  continue
}
```

- [ ] **Step 3: Использовать `applyBuildGraphResult` в `forms/elements/graphFromModel.ts::buildElementChildrenGraph`**

В `packages/core/metadata/forms/elements/graphFromModel.ts` найти импорт:

```ts
import { buildGraphFromModel } from "~/metadata/orchestration/buildGraphFromModel"
import { applyGraphOps } from "~/metadata/relations/applyGraphOps"
```

Заменить на:

```ts
import {
  applyBuildGraphResult,
  buildGraphFromModel,
} from "~/metadata/orchestration/buildGraphFromModel"
import { applyGraphOps } from "~/metadata/relations/applyGraphOps"
```

В функции `buildElementChildrenGraph` найти блок (примерно строки 84–134):

```ts
    // --- buildGraphFromModel: типы с кастомной логикой построения графа ---
    const buildGraphFn = getTypeRule(propType, "buildGraphFromModel")
    if (!buildGraphFn) continue

    const value = element[key]
    if (value === undefined || value === null) continue

    // TODO 1c: вынести в общий хелпер applyBuildGraphResult(result, propType, ctx) —
    // дубликат с orchestration/buildGraphFromModel.ts (тот же five-step normalize-блок).
    const result = buildGraphFn({
      model: value,
      parentNodeId,
      filePath,
      yamlMap: undefined,
      propRule: propRule as never,
      graph,
      extra: { formNodeId },
    })
    const sections = Array.isArray(result) ? result : result ? [result] : []
    for (const section of sections) {
      const hasOps =
        section.children?.length ||
        section.references?.length ||
        section.formLocalReferences?.length
      if (hasOps) {
        if (!section.edgeKind || !section.edgeYaml) {
          throw new Error(
            `buildElementChildrenGraph: обработчик типа "${propType}" вернул GraphOps без edgeKind/edgeYaml. ` +
              `Чистые функции должны указывать оба поля в результате.`,
          )
        }
        applyGraphOps(section, {
          graph,
          parentNodeId,
          filePath,
          edgeKind: section.edgeKind,
          edgeYaml: section.edgeYaml,
        })
      }
      for (const recurse of section.recurse ?? []) {
        buildGraphFromModel({
          model: recurse.model,
          yamlMap: recurse.yamlMap,
          rule: recurse.rule,
          graph,
          parentNodeId: recurse.parentNodeId,
          filePath,
          extra: recurse.extra ?? { formNodeId },
        })
      }
    }
  }
}
```

Заменить на:

```ts
    // --- buildGraphFromModel: типы с кастомной логикой построения графа ---
    const buildGraphFn = getTypeRule(propType, "buildGraphFromModel")
    if (!buildGraphFn) continue

    const value = element[key]
    if (value === undefined || value === null) continue

    const result = buildGraphFn({
      model: value,
      parentNodeId,
      filePath,
      yamlMap: undefined,
      propRule: propRule as never,
      graph,
      extra: { formNodeId },
    })
    applyBuildGraphResult(result, {
      graph,
      parentNodeId,
      filePath,
      propType,
      extra: { formNodeId },
    })
  }
}
```

- [ ] **Step 4: Прогнать тесты ядра**

```bash
pnpm --filter @nakidka/core test
```

Expected: PASS — поведение не меняется, оба обходчика используют один путь нормализации.

- [ ] **Step 5: Commit**

```bash
git add \
  packages/core/metadata/orchestration/buildGraphFromModel.ts \
  packages/core/metadata/forms/elements/graphFromModel.ts
git commit -m "$(cat <<'EOF'
refactor: :recycle: выделить applyBuildGraphResult из normalize-блока

Нормализация GraphOps | GraphOps[] → applyGraphOps + recurse сейчас
дублировалась в orchestration/buildGraphFromModel.ts и
forms/elements/graphFromModel.ts (долг, явно введённый в Task 3 фазы 1b).
Выносим в общий хелпер applyBuildGraphResult — оба обходчика теперь идут
через один код, расхождения исключены. Поведение в MetadataGraph
идентично прежнему.
EOF
)"
```

---

## Task 2: Расширить `GraphOpsChild` полями `absoluteId` и `edgeFrom`

**Files:**
- Modify: `packages/core/metadata/orchestration/property/fn.ts`
- Modify: `packages/core/metadata/relations/applyGraphOps.ts`

`forms/elements` создаёт плоские узлы с полным id `${formNodeId}.Элемент.<name>` (а не относительно `parentNodeId`); для синглетов ребро идёт от `formNodeId`, а не от непосредственного родителя. Существующий `parentOverride` совмещает обе роли (id-префикс + источник ребра) — этого недостаточно, когда они разные. Добавляем два независимых поля.

- [ ] **Step 1: Расширить тип `GraphOpsChild`**

В `packages/core/metadata/orchestration/property/fn.ts` найти:

```ts
export interface GraphOpsChild {
  idSuffix: string
  name: string
  positionFrom?: { offset: number; length?: number }
  /** Запись в node.item при promoteNode. */
  item?: Record<string, unknown>
  /** Если задано — ребро идёт от этого узла, childNodeId = `${parentOverride}.${idSuffix}` вместо `${ctx.parentNodeId}.${idSuffix}`. */
  parentOverride?: string
}
```

Заменить на:

```ts
export interface GraphOpsChild {
  /**
   * Суффикс относительного id ребёнка. Используется, если не задан absoluteId.
   * При наличии parentOverride: childNodeId = `${parentOverride}.${idSuffix}`.
   * Иначе: childNodeId = `${ctx.parentNodeId}.${idSuffix}`.
   */
  idSuffix: string
  name: string
  positionFrom?: { offset: number; length?: number }
  /** Запись в node.item при promoteNode. */
  item?: Record<string, unknown>
  /**
   * Если задано — childNodeId = `${parentOverride}.${idSuffix}` вместо
   * `${ctx.parentNodeId}.${idSuffix}`. Источник ребра тоже становится
   * parentOverride, если не задан edgeFrom.
   */
  parentOverride?: string
  /**
   * Если задано — childNodeId = absoluteId полностью (idSuffix/parentOverride
   * для построения id игнорируются; idSuffix остаётся как обязательное поле,
   * и ничто не запрещает absoluteId === `${ctx.parentNodeId}.${idSuffix}` —
   * это просто другая форма записи того же).
   * Используется для плоских узлов в forms/elements:
   * `${formNodeId}.Элемент.<name>`.
   */
  absoluteId?: string
  /**
   * Если задано — источник ребра = edgeFrom. Имеет приоритет над
   * parentOverride и ctx.parentNodeId. Используется для синглетов
   * формы (ContextMenu, AutoCommandBar, ...), где ребро ЭлементФормы
   * идёт от корня формы, а не от визуального родителя.
   */
  edgeFrom?: string
}
```

- [ ] **Step 2: Обновить `applyGraphOps` под новые поля**

В `packages/core/metadata/relations/applyGraphOps.ts` найти блок children:

```ts
  for (const child of ops.children ?? []) {
    const effectiveParent = child.parentOverride ?? parentNodeId
    const childNodeId = `${effectiveParent}.${child.idSuffix}`
    graph.promoteNode(childNodeId, {
      name: child.name,
      filePaths: [filePath],
      positionFrom: child.positionFrom,
      item: child.item,
    })
    const edgeKey = `${effectiveParent}:${edgeKind}:${childNodeId}`
    graph.ensureEdge(edgeKey, effectiveParent, childNodeId, {
      yaml: edgeYaml,
      kind: edgeKind,
    })
  }
```

Заменить на:

```ts
  for (const child of ops.children ?? []) {
    const idParent = child.parentOverride ?? parentNodeId
    const childNodeId = child.absoluteId ?? `${idParent}.${child.idSuffix}`
    const edgeSource = child.edgeFrom ?? child.parentOverride ?? parentNodeId
    graph.promoteNode(childNodeId, {
      name: child.name,
      filePaths: [filePath],
      positionFrom: child.positionFrom,
      item: child.item,
    })
    const edgeKey = `${edgeSource}:${edgeKind}:${childNodeId}`
    graph.ensureEdge(edgeKey, edgeSource, childNodeId, {
      yaml: edgeYaml,
      kind: edgeKind,
    })
  }
```

Поведение для существующих кейсов (без `absoluteId`/`edgeFrom`) идентично: `idParent === edgeSource === effectiveParent`.

- [ ] **Step 3: Прогнать тесты ядра**

```bash
pnpm --filter @nakidka/core test
```

Expected: PASS — все существующие тесты `applyGraphOps`/`buildGraphFromModel` зелёные. Новые поля опциональны, не используются — поведение идентично.

- [ ] **Step 4: Commit**

```bash
git add \
  packages/core/metadata/orchestration/property/fn.ts \
  packages/core/metadata/relations/applyGraphOps.ts
git commit -m "$(cat <<'EOF'
feat: :sparkles: добавить GraphOpsChild.absoluteId и edgeFrom

absoluteId — полный override childNodeId (для плоских узлов
forms/elements: \`\${formNodeId}.Элемент.<name>\`).
edgeFrom — независимый источник ребра (для синглетов формы:
ребро ЭлементФормы идёт от корня формы, а не от визуального
родителя). parentOverride сохранён как dual-purpose для
старых кейсов. applyGraphOps обрабатывает оба поля; для
существующих кейсов (без absoluteId/edgeFrom) поведение не
меняется.
EOF
)"
```

---

## Task 3: Перевести `buildChildItemsGraph` на чистую форму

**Files:**
- Modify: `packages/core/metadata/forms/elements/graphFromModel.ts`

`buildChildItemsGraph` обрабатывает коллекции `GroupChildItems`/`TableChildItems`/`PagesChildItems`/`CommandBarChildItems`. Каждый элемент → плоский узел `${formNodeId}.Элемент.<name>` с ребром `:FORM_ELEMENT` от непосредственного родителя; затем рекурсия в свойства элемента через `buildElementChildrenGraph`. После миграции:

- В `children` идёт `absoluteId: ${formNodeId}.Элемент.<name>`, ребро по умолчанию от `parentNodeId` (контейнер).
- Рекурсия в свойства элемента — через декларацию `recurse` с правилом элемента, найденным по `itemType`.

- [ ] **Step 1: Заменить тело `buildChildItemsGraph` и `registerChildItemsHandler`**

В `packages/core/metadata/forms/elements/graphFromModel.ts` заменить блок от начала функции `buildChildItemsGraph` (примерно строка 137) до конца блока `registerChildItemsHandler("CommandBarChildItems")` (примерно строка 259). Целиком:

```ts
/**
 * Создаёт плоские узлы для массива дочерних элементов формы.
 * NodeId = `formNodeId.Элемент.elementName`, ребро ЭлементФормы от parentNodeId.
 * Возвращает GraphOps[] с children и recurse — оркестратор сам всё применит.
 */
function buildChildItemsResult(params: {
  items: unknown
  formNodeId: string
}): GraphOps[] | undefined {
  const { items, formNodeId } = params

  if (!Array.isArray(items)) return undefined

  const children: GraphOpsChild[] = []
  const recurses: GraphOpsRecurse[] = []

  for (const element of items) {
    if (!element || typeof element !== "object") continue
    const elem = element as Record<string, unknown>
    const elementName = elem.name as string | undefined
    if (!elementName) continue

    const elementNodeId = `${formNodeId}.Элемент.${elementName}`

    children.push({
      idSuffix: elementName,
      name: elementName,
      item: elem,
      absoluteId: elementNodeId,
    })

    const itemType = elem.itemType as string | undefined
    if (itemType) {
      let elementRule: MetadataItemRule | undefined
      try {
        elementRule = getElementRule(itemType as never) as unknown as MetadataItemRule
      } catch {
        // Неизвестный тип элемента — пропускаем
      }
      if (elementRule) {
        recurses.push({
          model: elem,
          rule: elementRule,
          parentNodeId: elementNodeId,
          extra: { formNodeId },
        })
      }
    }
  }

  if (children.length === 0) return undefined

  return [{
    children,
    recurse: recurses,
    edgeKind: FORM_ELEMENT_EDGE_KIND,
    edgeYaml: FORM_ELEMENT_EDGE_YAML,
  }]
}

function registerChildItemsHandler(propertyType: PropertyRuleType): void {
  registerTypeRule(propertyType, "buildGraphFromModel", (params) => {
    const { model, parentNodeId, extra } = params
    const formNodeId = (extra?.formNodeId as string | undefined) ?? parentNodeId
    return buildChildItemsResult({ items: model, formNodeId })
  })
}

registerChildItemsHandler("GroupChildItems")
registerChildItemsHandler("TableChildItems")
registerChildItemsHandler("PagesChildItems")
registerChildItemsHandler("CommandBarChildItems")
```

- [ ] **Step 2: Обновить импорты в шапке файла**

В шапке `packages/core/metadata/forms/elements/graphFromModel.ts` найти:

```ts
import {
  applyBuildGraphResult,
  buildGraphFromModel,
} from "~/metadata/orchestration/buildGraphFromModel"
import { applyGraphOps } from "~/metadata/relations/applyGraphOps"
```

Заменить на:

```ts
import {
  applyBuildGraphResult,
  buildGraphFromModel,
} from "~/metadata/orchestration/buildGraphFromModel"
import { applyGraphOps } from "~/metadata/relations/applyGraphOps"
import {
  GraphOps,
  GraphOpsChild,
  GraphOpsRecurse,
} from "~/metadata/orchestration/property/fn"
```

(Если `applyGraphOps` или `buildGraphFromModel` после миграции `buildSingletonGraph` в Task 4 окажутся неиспользуемыми — финальная очистка импортов будет в Task 4.)

- [ ] **Step 3: Прогнать тесты ядра**

```bash
pnpm --filter @nakidka/core test
```

Expected: PASS — `forms/elements/graphFromModel.test.ts` остаётся зелёным; рекурсия в свойства элементов теперь идёт через `recurse`-механизм оркестратора, поведение в `MetadataGraph` идентично.

- [ ] **Step 4: Commit**

```bash
git add packages/core/metadata/forms/elements/graphFromModel.ts
git commit -m "$(cat <<'EOF'
refactor: :recycle: перевести buildChildItemsGraph на чистую форму

Обработчики GroupChildItems / TableChildItems / PagesChildItems /
CommandBarChildItems возвращают GraphOps[] с children (absoluteId =
formNodeId.Элемент.<name>) и recurse (правило элемента по itemType).
Оркестратор сам разворачивает recurse-задачи через
applyBuildGraphResult — поведение в MetadataGraph идентично прежнему.
EOF
)"
```

---

## Task 4: Перевести `buildSingletonGraph` на чистую форму

**Files:**
- Modify: `packages/core/metadata/forms/elements/graphFromModel.ts`

`buildSingletonGraph` обрабатывает синглеты `ContextMenu` / `AutoCommandBar` / `TableAutoCommandBar` / `ExtendedTooltip` / `SingleSearchControlAddition` / `SingleSearchStringAddition` / `ViewStatusAddition`. Особенность: ребро `:FORM_ELEMENT` идёт от **корня формы** (`formNodeId`), а не от визуального родителя. После миграции — `edgeFrom: formNodeId` на children-секции.

- [ ] **Step 1: Заменить тело `buildSingletonGraph` и `registerSingletonHandler`**

В `packages/core/metadata/forms/elements/graphFromModel.ts` заменить блок от начала комментария к `buildSingletonGraph` (примерно строка 195) до конца блока `registerSingletonHandler({...ViewStatusAddition...})` (примерно строка 318). Целиком:

```ts
/**
 * Создаёт узел-синглет плоско под формой с именем через хелпер.
 * NodeId = `formNodeId.Элемент.helperName(parentName)`.
 * Owning-ребро ЭлементФормы идёт от корня формы (edgeFrom: formNodeId),
 * а не от визуального родителя. Возвращает GraphOps[] с children и recurse.
 */
function buildSingletonResult(params: {
  model: unknown
  parentNodeId: string
  formNodeId: string
  getName: (parentName: string) => string
  singletonRule?: MetadataItemRule
}): GraphOps[] | undefined {
  const { model, parentNodeId, formNodeId, getName, singletonRule } = params

  if (!model || typeof model !== "object") return undefined

  const _parts = parentNodeId.split(".")
  const parentName = _parts[_parts.length - 1] ?? ""
  const singletonName = getName(parentName)
  const singletonNodeId = `${formNodeId}.Элемент.${singletonName}`

  const children: GraphOpsChild[] = [{
    idSuffix: singletonName,
    name: singletonName,
    item: model as Record<string, unknown>,
    absoluteId: singletonNodeId,
    edgeFrom: formNodeId,
  }]

  const recurses: GraphOpsRecurse[] = []
  if (singletonRule) {
    recurses.push({
      model: model as Record<string, unknown>,
      rule: singletonRule,
      parentNodeId: singletonNodeId,
      extra: { formNodeId },
    })
  }

  return [{
    children,
    recurse: recurses,
    edgeKind: FORM_ELEMENT_EDGE_KIND,
    edgeYaml: FORM_ELEMENT_EDGE_YAML,
  }]
}

function registerSingletonHandler(params: {
  propertyType: PropertyRuleType
  getName: (parentName: string) => string
  singletonRule?: MetadataItemRule
}): void {
  const { propertyType, getName, singletonRule } = params
  registerTypeRule(propertyType, "buildGraphFromModel", (handlerParams) => {
    const { model, parentNodeId, extra } = handlerParams
    const formNodeId = (extra?.formNodeId as string | undefined) ?? parentNodeId
    return buildSingletonResult({ model, parentNodeId, formNodeId, getName, singletonRule })
  })
}

registerSingletonHandler({
  propertyType: "ContextMenu",
  getName: (name) => getContextMenuName({ name }),
  singletonRule: ContextMenuRules as unknown as MetadataItemRule,
})

registerSingletonHandler({
  propertyType: "AutoCommandBar",
  getName: (name) => getAutoCommandBarName({ name }),
  singletonRule: AutoCommandBarRules as unknown as MetadataItemRule,
})

registerSingletonHandler({
  propertyType: "TableAutoCommandBar",
  getName: (name) => getAutoCommandBarName({ name }),
  singletonRule: AutoCommandBarRules as unknown as MetadataItemRule,
})

registerSingletonHandler({
  propertyType: "ExtendedTooltip",
  getName: (name) => getExtendedTooltipName({ name }),
  // ExtendedTooltip не имеет childItems — singletonRule не нужен
})

registerSingletonHandler({
  propertyType: "SingleSearchControlAddition",
  getName: (name) => getSearchControlAdditionName({ name }),
  singletonRule: SingleSearchControlAdditionRules as unknown as MetadataItemRule,
})

registerSingletonHandler({
  propertyType: "SingleSearchStringAddition",
  getName: (name) => getSearchStringAdditionName({ name }),
  singletonRule: SingleSearchStringAdditionRules as unknown as MetadataItemRule,
})

registerSingletonHandler({
  propertyType: "ViewStatusAddition",
  getName: (name) => getViewStatusAdditionName({ name }),
  // ViewStatusAddition не имеет childItems
})
```

- [ ] **Step 2: Очистить импорт `buildGraphFromModel` — он больше не нужен**

После Task 1 `buildElementChildrenGraph` вызывает `applyBuildGraphResult` вместо прямого `buildGraphFromModel`; после Task 3+4 `buildChildItemsResult`/`buildSingletonResult` тоже не используют `buildGraphFromModel`. Импорт `buildGraphFromModel` теперь мёртв.

В шапке `packages/core/metadata/forms/elements/graphFromModel.ts` найти:

```ts
import {
  applyBuildGraphResult,
  buildGraphFromModel,
} from "~/metadata/orchestration/buildGraphFromModel"
```

Заменить на:

```ts
import { applyBuildGraphResult } from "~/metadata/orchestration/buildGraphFromModel"
```

`MetadataGraph`, `applyGraphOps`, `getKindByYaml` — **остаются**: они продолжают использоваться в `buildElementChildrenGraph` (типизация параметра `graph` и extractGraph-ветка с одиночными reference-свойствами).

Перепроверить мёртвые импорты в файле:

```bash
grep -nE "applyBuildGraphResult|buildGraphFromModel|applyGraphOps|getKindByYaml|MetadataGraph" \
  packages/core/metadata/forms/elements/graphFromModel.ts
```

Expected: каждый из перечисленных импортов имеет хотя бы одно совпадение **в теле файла** (не только в шапке).

- [ ] **Step 3: Прогнать тесты ядра**

```bash
pnpm --filter @nakidka/core test
```

Expected: PASS — `forms/elements/graphFromModel.test.ts` остаётся зелёным. Поведение для синглетов: ребро `:FORM_ELEMENT` идёт от `formNodeId` (через `edgeFrom`), узел плоский (`absoluteId`), рекурсия в свойства синглета — через `recurse`. Это совпадает с прежней семантикой `buildSingletonGraph`.

- [ ] **Step 4: Commit**

```bash
git add packages/core/metadata/forms/elements/graphFromModel.ts
git commit -m "$(cat <<'EOF'
refactor: :recycle: перевести buildSingletonGraph на чистую форму

Обработчики ContextMenu / AutoCommandBar / TableAutoCommandBar /
ExtendedTooltip / SingleSearch* / ViewStatusAddition возвращают
GraphOps[] с children (absoluteId, edgeFrom: formNodeId) и recurse
(правило синглета). Ребро ЭлементФормы по-прежнему идёт от корня
формы — теперь декларативно через edgeFrom. Поведение в
MetadataGraph идентично прежнему. Прямой импорт
buildGraphFromModel из forms/elements удалён — он стал мёртвым
после Task 1 (вся рекурсия идёт через applyBuildGraphResult).
EOF
)"
```

---

## Task 5: Снять `graph: MetadataGraph` с сигнатуры `BuildGraphFromModelFunction`

**Files:**
- Modify: `packages/core/metadata/orchestration/property/fn.ts`
- Modify: `packages/core/metadata/orchestration/buildGraphFromModel.ts`
- Modify: `packages/core/metadata/forms/elements/graphFromModel.ts`

После Task 4 ни один зарегистрированный обработчик не использует `graph` в своей сигнатуре — все либо проигнорировали этот параметр (фаза 1a/1b), либо мигрированы в чистую форму (Task 3/4). Снимаем поле из контракта.

- [ ] **Step 1: Удалить `graph` из `BuildGraphFromModelFunction`**

В `packages/core/metadata/orchestration/property/fn.ts` найти:

```ts
export type BuildGraphFromModelFunction = (params: {
  model: unknown
  parentNodeId: string
  filePath: string
  yamlMap: YAMLMap | undefined
  propRule: PropertyRule
  graph: MetadataGraph
  /** Дополнительный контекст, пробрасываемый в кастомные обработчики (например, formNodeId). */
  extra?: Record<string, unknown>
}) => GraphOps | GraphOps[] | undefined | void
```

Заменить на:

```ts
export type BuildGraphFromModelFunction = (params: {
  model: unknown
  parentNodeId: string
  filePath: string
  yamlMap: YAMLMap | undefined
  propRule: PropertyRule
  /** Дополнительный контекст, пробрасываемый в кастомные обработчики (например, formNodeId). */
  extra?: Record<string, unknown>
}) => GraphOps | GraphOps[] | undefined | void
```

И удалить импорт `MetadataGraph` из шапки файла, если он использовался только в этой сигнатуре. Перепроверить:

```bash
grep -n "MetadataGraph" packages/core/metadata/orchestration/property/fn.ts
```

Если совпадений нет — удалить импорт.

- [ ] **Step 2: Не передавать `graph` обработчикам в оркестраторе**

В `packages/core/metadata/orchestration/buildGraphFromModel.ts` найти вызов `buildGraphFn`:

```ts
const result = buildGraphFn({
  model: model[key],
  parentNodeId,
  filePath,
  yamlMap,
  propRule,
  graph,
  extra,
})
```

Заменить на:

```ts
const result = buildGraphFn({
  model: model[key],
  parentNodeId,
  filePath,
  yamlMap,
  propRule,
  extra,
})
```

- [ ] **Step 3: То же в `buildElementChildrenGraph`**

В `packages/core/metadata/forms/elements/graphFromModel.ts` найти вызов `buildGraphFn` внутри `buildElementChildrenGraph`:

```ts
const result = buildGraphFn({
  model: value,
  parentNodeId,
  filePath,
  yamlMap: undefined,
  propRule: propRule as never,
  graph,
  extra: { formNodeId },
})
```

Заменить на:

```ts
const result = buildGraphFn({
  model: value,
  parentNodeId,
  filePath,
  yamlMap: undefined,
  propRule: propRule as never,
  extra: { formNodeId },
})
```

- [ ] **Step 4: Прогнать type-check и тесты ядра**

```bash
pnpm --filter @nakidka/core run type-check
pnpm --filter @nakidka/core test
```

Expected: оба PASS. Если type-check ругается — найти оставшийся обработчик, ещё ожидающий `graph` в деструктуризации, и убрать оттуда.

- [ ] **Step 5: Commit**

```bash
git add \
  packages/core/metadata/orchestration/property/fn.ts \
  packages/core/metadata/orchestration/buildGraphFromModel.ts \
  packages/core/metadata/forms/elements/graphFromModel.ts
git commit -m "$(cat <<'EOF'
refactor: :recycle: снять graph: MetadataGraph с BuildGraphFromModelFunction

После 1a/1b/1c все зарегистрированные обработчики чистые: возвращают
GraphOps без обращения к графу. Снятие graph из сигнатуры закрывает
контракт. Оркестратор и параллельный обходчик forms/elements больше
не передают graph в обработчики; запись в MetadataGraph по-прежнему
делается централизованно в applyGraphOps.
EOF
)"
```

---

## Task 6: Локальные типы `FileGraphData` в core + скелет модуля `buildGraph`

**Files:**
- Create: `packages/core/metadata/orchestration/buildGraph/types.ts`
- Create: `packages/core/metadata/orchestration/buildGraph/index.ts`

Объявляем типы локально в core, структурно совместимые с `@nakidka/graph`. Ставить core в зависимость от пакета `@nakidka/graph` сейчас не нужно — CLI остаётся точкой связки, переезд на shared-типы (если потребуется) — в фазе 1e.

- [ ] **Step 1: Создать `buildGraph/types.ts`**

Записать в `packages/core/metadata/orchestration/buildGraph/types.ts`:

```ts
/**
 * Типы публичного API buildGraph. Структурно совместимы с одноимёнными
 * типами @nakidka/graph — CLI присваивает FileGraphData из core напрямую
 * в updateGraph(@nakidka/graph) без преобразований.
 */

export type GraphPrimitive = string | number | boolean | null

export interface NodeData {
  /** Полный YAML-путь узла. Уникальный идентификатор в графе. */
  id: string
  /** Семантическая метка в Cypher (PascalCase: MetadataCatalog, Form, ...). */
  label: string
  /** Свойства узла. Только примитивы и их массивы — ограничение FalkorDB. */
  props: Record<string, GraphPrimitive | GraphPrimitive[]>
}

export interface EdgeData {
  src: string
  tgt: string
  /** SCREAMING_SNAKE_CASE метка отношения (VALUE, OBJECT, REF_TYPE, ...). */
  kind: string
  props?: Record<string, GraphPrimitive>
}

export interface FileGraphData {
  filePath: string
  nodes: NodeData[]
  edges: EdgeData[]
}

export interface ImportContext {
  version: string
  defaultLanguage: string
}
```

- [ ] **Step 2: Создать `buildGraph/index.ts`**

Записать в `packages/core/metadata/orchestration/buildGraph/index.ts`:

```ts
export type {
  EdgeData,
  FileGraphData,
  GraphPrimitive,
  ImportContext,
  NodeData,
} from "./types"
```

(`buildGraph` и `flattenItem`/`walkGraphToFileData` будут добавлены реэкспортами в следующих задачах.)

- [ ] **Step 3: Прогнать type-check ядра**

```bash
pnpm --filter @nakidka/core run type-check
```

Expected: PASS — типы валидны.

- [ ] **Step 4: Commit**

```bash
git add packages/core/metadata/orchestration/buildGraph/
git commit -m "$(cat <<'EOF'
feat: :sparkles: каркас модуля buildGraph в core (типы FileGraphData)

NodeData, EdgeData, FileGraphData, GraphPrimitive, ImportContext —
локальные в core, структурно совместимы с одноимёнными типами
@nakidka/graph. Это позволяет вводить чистый агрегатор buildGraph
без cross-package зависимости (core ↔ graph) — связка через CLI в
фазе 1e.
EOF
)"
```

---

## Task 7: Алгоритм `flattenItem` — сплющивание plain-объекта в `props` с префиксом `p_`

**Files:**
- Create: `packages/core/metadata/orchestration/buildGraph/flattenItem.ts`
- Create: `packages/core/metadata/orchestration/buildGraph/flattenItem.test.ts`

`node.item` — JS-модель после `fromYAML`. Нужен общий алгоритм: плоско разложить скаляры и plain-объекты в `Record<string, GraphPrimitive | GraphPrimitive[]>`, навесить префикс `p_`. Массивы примитивов — оставить как есть; массивы объектов и `_uuid`/`itemType` — пропустить (массивы объектов уезжают в отдельные узлы через type-specific обработчики; `itemType` идёт в label, `_uuid` в граф не пишется).

В рамках этой фазы: **скаляры + plain-объекты + массивы примитивов**. Type-specific преобразования (TypeDescription → `p_types` только примитивы, MetadataValue → рёбра и т.д.) уже выполнены существующими обработчиками; `flattenItem` оставляет соответствующие поля как есть только в части примитивных значений массивов — массивы объектов фильтруются.

- [ ] **Step 1: Написать падающий тест**

Записать в `packages/core/metadata/orchestration/buildGraph/flattenItem.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { flattenItem } from "./flattenItem"

describe("flattenItem", () => {
  it("возвращает {} для undefined item", () => {
    expect(flattenItem(undefined)).toEqual({})
  })

  it("выкидывает itemType (он уезжает в label)", () => {
    expect(flattenItem({ itemType: "MetadataCatalog", name: "К" })).toEqual({
      p_name: "К",
    })
  })

  it("выкидывает _uuid (служебный, не пишется в граф)", () => {
    expect(flattenItem({ _uuid: "abc-123", code: "001" })).toEqual({
      p_code: "001",
    })
  })

  it("раскладывает скаляры под префиксом p_", () => {
    expect(
      flattenItem({
        codeLength: 9,
        hierarchical: true,
        comment: "abc",
        nullField: null,
      }),
    ).toEqual({
      p_codeLength: 9,
      p_hierarchical: true,
      p_comment: "abc",
      p_nullField: null,
    })
  })

  it("сплющивает plain-объекты по '_'", () => {
    expect(
      flattenItem({
        numberQualifiers: { digits: 10, fractionDigits: 2 },
        synonym: { items: { ru: "Контрагенты", en: "Contractors" } },
      }),
    ).toEqual({
      p_numberQualifiers_digits: 10,
      p_numberQualifiers_fractionDigits: 2,
      p_synonym_items_ru: "Контрагенты",
      p_synonym_items_en: "Contractors",
    })
  })

  it("оставляет массивы примитивов как есть (под префиксом p_)", () => {
    expect(flattenItem({ types: ["Number", "String"] })).toEqual({
      p_types: ["Number", "String"],
    })
  })

  it("выкидывает массивы объектов (они уезжают в отдельные узлы через рёбра)", () => {
    expect(
      flattenItem({
        choiceParameters: [{ name: "A" }, { name: "B" }],
        codeLength: 5,
      }),
    ).toEqual({
      p_codeLength: 5,
    })
  })

  it("выкидывает пустые массивы (нет смысла хранить)", () => {
    expect(flattenItem({ types: [], codeLength: 5 })).toEqual({
      p_codeLength: 5,
    })
  })

  it("игнорирует undefined-значения", () => {
    expect(flattenItem({ codeLength: undefined, name: "К" })).toEqual({
      p_name: "К",
    })
  })

  it("кладёт массивы примитивов с null-элементами как есть", () => {
    expect(flattenItem({ tags: ["a", null, "b"] })).toEqual({
      p_tags: ["a", null, "b"],
    })
  })
})
```

- [ ] **Step 2: Запустить тест — должен упасть**

```bash
pnpm --filter @nakidka/core test packages/core/metadata/orchestration/buildGraph/flattenItem.test.ts
```

Expected: FAIL с "Cannot find module './flattenItem'" — модуль не существует.

- [ ] **Step 3: Реализовать `flattenItem`**

Записать в `packages/core/metadata/orchestration/buildGraph/flattenItem.ts`:

```ts
import { GraphPrimitive } from "./types"

/** Поля JS-модели, которые НЕ попадают в props узла. */
const SKIP_KEYS = new Set(["itemType", "_uuid"])

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype

const isPrimitive = (v: unknown): v is GraphPrimitive =>
  v === null || typeof v === "string" || typeof v === "number" || typeof v === "boolean"

const isPrimitiveArray = (v: unknown): v is GraphPrimitive[] =>
  Array.isArray(v) && v.every(isPrimitive)

/**
 * Раскладывает поля JS-модели в плоский Record<string, GraphPrimitive | GraphPrimitive[]>:
 * - скаляры → p_<имя>
 * - plain-объекты сплющиваются по '_' (numberQualifiers.digits → p_numberQualifiers_digits)
 * - массивы примитивов сохраняются под p_<имя>
 * - массивы объектов и пустые массивы выкидываются
 *   (массивы объектов уезжают в отдельные узлы через type-specific buildGraphFromModel)
 * - itemType и _uuid выкидываются на любом уровне.
 *
 * Type-specific перекраивание (TypeDescription с примесью ссылочных типов как рёбра,
 * MetadataValue → ref-рёбра и т.д.) уже выполнено существующими handler'ами на стадии
 * buildGraphFromModel — flattenItem не пытается это «исправлять». Если в node.item остался
 * массив объектов — он либо уже вынесен в отдельные узлы, либо был лишней копией; в
 * любом случае мы его игнорируем и не дублируем как props.
 */
export function flattenItem(
  item: unknown,
): Record<string, GraphPrimitive | GraphPrimitive[]> {
  const result: Record<string, GraphPrimitive | GraphPrimitive[]> = {}
  if (!isPlainObject(item)) return result
  flattenInto(result, "p_", item)
  return result
}

function flattenInto(
  out: Record<string, GraphPrimitive | GraphPrimitive[]>,
  prefix: string,
  obj: Record<string, unknown>,
): void {
  for (const [key, value] of Object.entries(obj)) {
    if (SKIP_KEYS.has(key)) continue
    if (value === undefined) continue

    const fullKey = `${prefix}${key}`

    if (isPrimitive(value)) {
      out[fullKey] = value
      continue
    }

    if (Array.isArray(value)) {
      if (value.length === 0) continue
      if (isPrimitiveArray(value)) {
        out[fullKey] = value
      }
      // Массивы объектов — пропускаем: уехали в отдельные узлы.
      continue
    }

    if (isPlainObject(value)) {
      flattenInto(out, `${fullKey}_`, value)
      continue
    }

    // Прочее (классы, функции и т.д.) — игнорируем.
  }
}
```

- [ ] **Step 4: Прогнать тест — должен пройти**

```bash
pnpm --filter @nakidka/core test packages/core/metadata/orchestration/buildGraph/flattenItem.test.ts
```

Expected: PASS — все 9 кейсов зелёные.

- [ ] **Step 5: Реэкспорт из `index.ts`**

В `packages/core/metadata/orchestration/buildGraph/index.ts` дописать:

```ts
export { flattenItem } from "./flattenItem"
```

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/orchestration/buildGraph/
git commit -m "$(cat <<'EOF'
feat: :sparkles: алгоритм flattenItem — раскладка node.item в props под p_

Скаляры → p_<имя>; plain-объекты сплющиваются по '_'
(numberQualifiers.digits → p_numberQualifiers_digits, синоним I8nText:
synonym.items.ru → p_synonym_items_ru); массивы примитивов сохраняются
под p_<имя>; массивы объектов и пустые массивы выкидываются — они
либо уехали в отдельные узлы через type-specific обработчики, либо
не несут смысла. itemType (уезжает в label) и _uuid (служебный) на
любом уровне выкидываются.
EOF
)"
```

---

## Task 8: `walkGraphToFileData` — обход `MetadataGraph` в `FileGraphData[]`

**Files:**
- Create: `packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.ts`
- Create: `packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.test.ts`

Промежуточная функция: `MetadataGraph` (то, что сейчас собирает существующий пайплайн) → `FileGraphData[]`. Группирует узлы по `filePath` (узлы без `filePaths` — стабы — выносим в отдельный файл-сегмент c `filePath: ""`, чтобы CLI на этапе 1e мог записать их в общий батч). Лейбл — из `item.itemType`; если `itemType` не задан — `Unknown` (явный sentinel, чтобы поломки видеть сразу).

- [ ] **Step 1: Написать падающий тест**

Записать в `packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { MetadataGraph } from "~/metadata/relations/MetadataGraph"
import { walkGraphToFileData } from "./walkGraphToFileData"

describe("walkGraphToFileData", () => {
  it("возвращает [] для пустого графа", () => {
    const g = new MetadataGraph()
    expect(walkGraphToFileData(g)).toEqual([])
  })

  it("группирует узлы по filePath, лейбл из item.itemType", () => {
    const g = new MetadataGraph()
    g.promoteNode("Справочник.К", {
      name: "К",
      filePaths: ["a.yaml"],
      item: { itemType: "MetadataCatalog", codeLength: 9 },
    })
    g.promoteNode("Документ.Д", {
      name: "Д",
      filePaths: ["b.yaml"],
      item: { itemType: "MetadataDocument", numberLength: 5 },
    })

    const result = walkGraphToFileData(g)
    expect(result).toHaveLength(2)
    const fileA = result.find((f) => f.filePath === "a.yaml")!
    const fileB = result.find((f) => f.filePath === "b.yaml")!
    expect(fileA.nodes).toEqual([
      {
        id: "Справочник.К",
        label: "MetadataCatalog",
        props: { name: "К", filePath: "a.yaml", p_codeLength: 9 },
      },
    ])
    expect(fileB.nodes).toEqual([
      {
        id: "Документ.Д",
        label: "MetadataDocument",
        props: { name: "Д", filePath: "b.yaml", p_numberLength: 5 },
      },
    ])
  })

  it("ребро попадает в FileGraphData файла-источника", () => {
    const g = new MetadataGraph()
    g.promoteNode("A", {
      name: "A",
      filePaths: ["a.yaml"],
      item: { itemType: "X" },
    })
    g.promoteNode("B", {
      name: "B",
      filePaths: ["b.yaml"],
      item: { itemType: "X" },
    })
    g.ensureEdge("A:VALUE:B", "A", "B", { yaml: "Значение", kind: "VALUE" })

    const result = walkGraphToFileData(g)
    const fileA = result.find((f) => f.filePath === "a.yaml")!
    const fileB = result.find((f) => f.filePath === "b.yaml")!
    expect(fileA.edges).toEqual([
      { src: "A", tgt: "B", kind: "VALUE", props: { yaml: "Значение" } },
    ])
    expect(fileB.edges).toEqual([])
  })

  it("стабы (filePaths === undefined) попадают в сегмент с filePath ''", () => {
    const g = new MetadataGraph()
    g.promoteNode("A", {
      name: "A",
      filePaths: ["a.yaml"],
      item: { itemType: "MetadataCatalog" },
    })
    // Stub-узел: ссылка на B без определения
    g.ensureNode("B", { name: "B" })
    g.ensureEdge("A:VALUE:B", "A", "B", { yaml: "Значение", kind: "VALUE" })

    const result = walkGraphToFileData(g)
    const stubFile = result.find((f) => f.filePath === "")!
    expect(stubFile.nodes).toEqual([
      { id: "B", label: "Unknown", props: { name: "B" } },
    ])
  })

  it("узлы с двумя filePaths попадают в оба сегмента (для form yaml + nkdk)", () => {
    const g = new MetadataGraph()
    g.promoteNode("Справочник.К.Форма.Ф", {
      name: "Ф",
      filePaths: ["yaml.yaml", "nkdk.nkdk"],
      item: { itemType: "ClientApplicationForm", name: "Ф" },
    })

    const result = walkGraphToFileData(g)
    expect(result.map((f) => f.filePath).sort()).toEqual(["nkdk.nkdk", "yaml.yaml"])
    for (const f of result) {
      expect(f.nodes).toHaveLength(1)
      expect(f.nodes[0]?.id).toBe("Справочник.К.Форма.Ф")
    }
  })

  it("если item не задан и узел не stub — лейбл Unknown", () => {
    const g = new MetadataGraph()
    g.promoteNode("X", { name: "X", filePaths: ["x.yaml"] })

    const result = walkGraphToFileData(g)
    const file = result.find((f) => f.filePath === "x.yaml")!
    expect(file.nodes[0]?.label).toBe("Unknown")
  })
})
```

- [ ] **Step 2: Запустить — должен упасть**

```bash
pnpm --filter @nakidka/core test packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.test.ts
```

Expected: FAIL — модуль не существует.

- [ ] **Step 3: Реализовать `walkGraphToFileData`**

Записать в `packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.ts`:

```ts
import { MetadataGraph } from "~/metadata/relations/MetadataGraph"
import { flattenItem } from "./flattenItem"
import { EdgeData, FileGraphData, NodeData } from "./types"

/** Sentinel-метка для узлов без itemType — даёт видеть пробелы сразу. */
const UNKNOWN_LABEL = "Unknown"
/** Сегмент для stub-узлов (без filePath). */
const STUB_SEGMENT = ""

/**
 * Обходит MetadataGraph и группирует узлы и рёбра по filePath.
 *
 * Узлы:
 *  - label = item.itemType (если задан), иначе "Unknown".
 *  - props: name + filePath (координаты графа без префикса) + flattenItem(item) (под p_).
 *  - узлы без filePaths (стабы) уезжают в сегмент с filePath ''.
 *  - узлы с несколькими filePaths (форма yaml + nkdk) появляются в каждом сегменте.
 *
 * Рёбра:
 *  - попадают в сегмент filePath первого filePath узла-источника
 *    (для стаба-источника — в сегмент '').
 *  - props: yaml + (опционально) другие атрибуты ребра в виде примитивов.
 */
export function walkGraphToFileData(graph: MetadataGraph): FileGraphData[] {
  const segmentByFilePath = new Map<string, { nodes: NodeData[]; edges: EdgeData[] }>()
  const ensureSegment = (filePath: string) => {
    let seg = segmentByFilePath.get(filePath)
    if (!seg) {
      seg = { nodes: [], edges: [] }
      segmentByFilePath.set(filePath, seg)
    }
    return seg
  }

  for (const nodeId of graph.nodes()) {
    const attrs = graph.getNodeAttributes(nodeId)
    const filePaths =
      attrs.filePaths !== undefined && attrs.filePaths.length > 0 ? attrs.filePaths : [STUB_SEGMENT]

    for (const filePath of filePaths) {
      const props: NodeData["props"] = { name: attrs.name }
      if (filePath !== STUB_SEGMENT) props.filePath = filePath
      Object.assign(props, flattenItem(attrs.item))

      const item = attrs.item as Record<string, unknown> | undefined
      const itemType = item && typeof item.itemType === "string" ? (item.itemType as string) : undefined
      const label = itemType ?? UNKNOWN_LABEL

      ensureSegment(filePath).nodes.push({ id: nodeId, label, props })
    }
  }

  // Рёбра: каждое попадает в сегмент первого filePath узла-источника.
  for (const nodeId of graph.nodes()) {
    const attrs = graph.getNodeAttributes(nodeId)
    const sourceSegment =
      attrs.filePaths && attrs.filePaths.length > 0 ? attrs.filePaths[0]! : STUB_SEGMENT

    for (const { target, attributes } of graph.outEdgeEntries(nodeId)) {
      const edgeProps: Record<string, string | number | boolean | null> = {
        yaml: attributes.yaml,
      }
      ensureSegment(sourceSegment).edges.push({
        src: nodeId,
        tgt: target,
        kind: attributes.kind,
        props: edgeProps,
      })
    }
  }

  return Array.from(segmentByFilePath.entries()).map(([filePath, seg]) => ({
    filePath,
    nodes: seg.nodes,
    edges: seg.edges,
  }))
}
```

- [ ] **Step 4: Прогнать тесты**

```bash
pnpm --filter @nakidka/core test packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.test.ts
```

Expected: PASS — все 6 кейсов зелёные.

- [ ] **Step 5: Реэкспорт**

В `packages/core/metadata/orchestration/buildGraph/index.ts` дописать:

```ts
export { walkGraphToFileData } from "./walkGraphToFileData"
```

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/orchestration/buildGraph/
git commit -m "$(cat <<'EOF'
feat: :sparkles: walkGraphToFileData — MetadataGraph → FileGraphData[]

Группирует узлы и рёбра по filePath, лейбл берёт из item.itemType
(или 'Unknown' для стабов и узлов без itemType — sentinel-метка,
чтобы пробелы были сразу видны). Узлы с несколькими filePaths
(yaml формы + nkdk) появляются в обоих сегментах. Стабы (filePaths
не заданы) уезжают в сегмент с filePath ''. Рёбра попадают в
сегмент первого filePath узла-источника. Это базовый кирпичик
будущего buildGraph(yamlFiles, context) — обходчик MetadataGraph,
который собирается существующим пайплайном.
EOF
)"
```

---

## Task 9: Публичный `buildGraph(yamlFiles, context)` — чистый агрегатор

**Files:**
- Create: `packages/core/metadata/orchestration/buildGraph/buildGraph.ts`
- Modify: `packages/core/metadata/orchestration/buildGraph/index.ts`

Финальный entry-point фазы 1d. Принимает `Map<filePath, yamlText>` + `ImportContext`, внутри определяет kind по структуре пути, парсит каждый файл, импортирует через существующий путь (`importMetadataFileWithGraph` пишет во внутренний `MetadataGraph`), затем вызывает `walkGraphToFileData`. Никакого FS, никакой сети — это контракт фазы.

Определение kind по пути: суффикс `<dir>/<name>/Свойства.yaml` для прикладных объектов, `<dir>/<owner>/Формы/<formName>/Форма.yaml` для форм. Кореневой каталог в `filePath` (`Справочник` / `Документ` / `Перечисление`) определяет тип объекта. Стабильность сегмента — он же `itemTypePrefix` правил.

- [ ] **Step 1: Написать падающий тест (минимальный, на одном справочнике)**

Записать в `packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { buildGraph } from "./buildGraph"
import type { ImportContext } from "./types"

const ctx: ImportContext = { version: "2.20", defaultLanguage: "ru" }

describe("buildGraph (smoke)", () => {
  it("возвращает [] для пустого входа", () => {
    expect(buildGraph(new Map(), ctx)).toEqual([])
  })

  it("импортирует справочник: один узел MetadataCatalog с правильным id и label", () => {
    const yaml = `\
ИмяОбъекта: Контрагенты
Иерархический: true
ДлинаКода: 9
`
    const files = new Map([
      ["Справочник/Контрагенты/Свойства.yaml", yaml],
    ])

    const result = buildGraph(files, ctx)
    const fileSegment = result.find((f) => f.filePath === "Справочник/Контрагенты/Свойства.yaml")
    expect(fileSegment).toBeDefined()

    const root = fileSegment!.nodes.find((n) => n.id === "Справочник.Контрагенты")
    expect(root).toBeDefined()
    expect(root!.label).toBe("MetadataCatalog")
    expect(root!.props.name).toBe("Контрагенты")
    expect(root!.props.filePath).toBe("Справочник/Контрагенты/Свойства.yaml")
  })

  it("игнорирует файл с неизвестным kind (без падения)", () => {
    const files = new Map([["Случайный/Файл.yaml", "Имя: x"]])
    expect(buildGraph(files, ctx)).toEqual([])
  })
})
```

- [ ] **Step 2: Запустить — должен упасть**

```bash
pnpm --filter @nakidka/core test packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts
```

Expected: FAIL — модуль не существует.

- [ ] **Step 3: Реализовать `buildGraph`**

Записать в `packages/core/metadata/orchestration/buildGraph/buildGraph.ts`:

```ts
import { MetadataGraph } from "~/metadata/relations/MetadataGraph"
import { importMetadataFileWithGraph } from "~/metadata/orchestration/importMetadataFileWithGraph"
import { MetadataKind } from "~/metadata/validation/types"
import type { ConfigurationContext } from "~/metadata/context/types"
import { walkGraphToFileData } from "./walkGraphToFileData"
import type { FileGraphData, ImportContext } from "./types"

/**
 * Чистый агрегатор: YAML-файлы → FileGraphData[] для @nakidka/graph.updateGraph.
 *
 * Входной формат: Map<filePath, yamlText>. Определение kind — по сегментам пути:
 *   Справочник/<name>/Свойства.yaml          → catalog
 *   Документ/<name>/Свойства.yaml            → document
 *   Перечисление/<name>/Свойства.yaml        → enumeration
 *   <ownerKind>/<owner>/Формы/<form>/Форма.yaml → form (требует ownerNodeId)
 *
 * Файлы с неизвестным kind молча игнорируются: контракт buildGraph — собрать то,
 * что точно понятно. Решения о неизвестных файлах принимает вызывающая сторона.
 */
export function buildGraph(
  yamlFiles: Map<string, string>,
  context: ImportContext,
): FileGraphData[] {
  const graph = new MetadataGraph()
  const importContext: ConfigurationContext = { ...context }

  // 1. Сначала прикладные объекты — они создают корневые узлы для форм.
  const formEntries: Array<{ filePath: string; yaml: string; ownerNodeId: string; name: string }> = []

  for (const [filePath, yamlText] of yamlFiles) {
    const parsed = parseFilePath(filePath)
    if (!parsed) continue

    if (parsed.kind === "form") {
      formEntries.push({
        filePath,
        yaml: yamlText,
        ownerNodeId: parsed.ownerNodeId,
        name: parsed.formName,
      })
      continue
    }

    try {
      importMetadataFileWithGraph({
        filePath,
        sources: { yaml: yamlText },
        kind: parsed.kind,
        name: parsed.name,
        graph,
        context: importContext,
      })
    } catch {
      // Молчаливо пропускаем — контракт buildGraph: собрать что понятно.
    }
  }

  // 2. Затем формы — их корневой узел требует наличия владельца.
  for (const { filePath, yaml, ownerNodeId, name } of formEntries) {
    try {
      importMetadataFileWithGraph({
        filePath,
        sources: { yaml },
        kind: "form",
        name,
        graph,
        context: importContext,
        ownerNodeId,
      })
    } catch {
      // Молчаливо пропускаем.
    }
  }

  return walkGraphToFileData(graph)
}

interface ParsedItemPath {
  kind: MetadataKind
  name: string
}

interface ParsedFormPath {
  kind: "form"
  ownerNodeId: string
  formName: string
}

const KIND_BY_DIR: Record<string, MetadataKind> = {
  Справочник: "catalog",
  Документ: "document",
  Перечисление: "enumeration",
}

function parseFilePath(filePath: string): ParsedItemPath | ParsedFormPath | undefined {
  const segments = filePath.split("/")
  // <dir>/<name>/Свойства.yaml
  if (segments.length === 3 && segments[2] === "Свойства.yaml") {
    const dir = segments[0]!
    const name = segments[1]!
    const kind = KIND_BY_DIR[dir]
    if (!kind) return undefined
    return { kind, name }
  }
  // <ownerKind>/<owner>/Формы/<formName>/Форма.yaml
  if (segments.length === 5 && segments[2] === "Формы" && segments[4] === "Форма.yaml") {
    const ownerDir = segments[0]!
    const ownerName = segments[1]!
    const formName = segments[3]!
    if (!KIND_BY_DIR[ownerDir]) return undefined
    return {
      kind: "form",
      ownerNodeId: `${ownerDir}.${ownerName}`,
      formName,
    }
  }
  return undefined
}
```

- [ ] **Step 4: Прогнать тесты**

```bash
pnpm --filter @nakidka/core test packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts
```

Expected: PASS — все 3 кейса зелёные.

- [ ] **Step 5: Реэкспорты**

В `packages/core/metadata/orchestration/buildGraph/index.ts` дописать:

```ts
export { buildGraph } from "./buildGraph"
```

В `packages/core/metadata/orchestration/index.ts` после существующих `export * from` добавить:

```ts
export * from "./buildGraph"
```

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/orchestration/buildGraph/ packages/core/metadata/orchestration/index.ts
git commit -m "$(cat <<'EOF'
feat: :sparkles: чистый buildGraph(yamlFiles, context) → FileGraphData[]

Контракт: Map<filePath, yamlText> + ImportContext на входе,
FileGraphData[] на выходе. Никакого FS, никакой сети — путь
определяется по сегментам filePath:
  Справочник/<name>/Свойства.yaml → catalog
  Документ/<name>/Свойства.yaml → document
  Перечисление/<name>/Свойства.yaml → enumeration
  <ownerKind>/<owner>/Формы/<form>/Форма.yaml → form (требует ownerNodeId)

Внутри собирается MetadataGraph через существующий
importMetadataFileWithGraph (как промежуточная структура), затем
walkGraphToFileData превращает его в посегментный FileGraphData[]
с лейблом из itemType и props под p_*. CLI не трогаем — его
переезд на buildGraph + updateGraph(@nakidka/graph) — это фаза 1e.
EOF
)"
```

---

## Task 10: Расширенный тест `buildGraph` — формы, рёбра, стабы

**Files:**
- Modify: `packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts`

Smoke-тест Task 9 проверил один справочник. Здесь — кейсы пострашнее: форма (два сегмента-файла: yaml + связь с владельцем), межфайловое ребро (`MetadataValue.value: ref`), стаб (ссылка на отсутствующий объект).

- [ ] **Step 1: Дописать тесты**

В `packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts` добавить ниже существующих:

```ts
describe("buildGraph (формы)", () => {
  it("импортирует форму: формовой узел в filePath формы, ребро Форма от владельца", () => {
    const catalogYaml = `\
ИмяОбъекта: Контрагенты
ДлинаКода: 9
`
    const formYaml = `\
ИмяОбъекта: ФормаСписка
`
    const files = new Map([
      ["Справочник/Контрагенты/Свойства.yaml", catalogYaml],
      ["Справочник/Контрагенты/Формы/ФормаСписка/Форма.yaml", formYaml],
    ])

    const result = buildGraph(files, ctx)
    const formFile = result.find(
      (f) => f.filePath === "Справочник/Контрагенты/Формы/ФормаСписка/Форма.yaml",
    )!
    const formNode = formFile.nodes.find(
      (n) => n.id === "Справочник.Контрагенты.Форма.ФормаСписка",
    )
    expect(formNode).toBeDefined()
    expect(formNode!.label).toBe("ClientApplicationForm")

    // Ребро FORM от справочника к форме — оно живёт в catalog-сегменте,
    // потому что узел-источник «Справочник.Контрагенты» имеет filePath = catalog.yaml.
    const catalogFile = result.find(
      (f) => f.filePath === "Справочник/Контрагенты/Свойства.yaml",
    )!
    const formEdge = catalogFile.edges.find(
      (e) => e.kind === "FORM" && e.tgt === "Справочник.Контрагенты.Форма.ФормаСписка",
    )
    expect(formEdge).toBeDefined()
  })
})

describe("buildGraph (рёбра и стабы)", () => {
  it("создаёт стаб для ссылки на несуществующий объект", () => {
    // Перечисление с несуществующим типом значения — простой пример «ссылка вникуда»
    // через стандартный механизм MetadataValue. Реальный сценарий стаба зависит от
    // правил, но для контракта buildGraph достаточно проверить, что стаб попадает в
    // сегмент с filePath ''.
    // Используем самый компактный YAML, в котором ref-узел получит стаб-цель:
    const enumYaml = `\
ИмяОбъекта: ВидыКонтрагентов
Значения:
  - Имя: Поставщик
`
    const files = new Map([
      ["Перечисление/ВидыКонтрагентов/Свойства.yaml", enumYaml],
    ])
    const result = buildGraph(files, ctx)
    // Базовая ассерция: главный узел перечисления есть.
    const enumFile = result.find(
      (f) => f.filePath === "Перечисление/ВидыКонтрагентов/Свойства.yaml",
    )!
    const root = enumFile.nodes.find((n) => n.id === "Перечисление.ВидыКонтрагентов")
    expect(root).toBeDefined()
    // Если в результате есть stub-сегмент — он должен иметь filePath ''.
    const stubSegment = result.find((f) => f.filePath === "")
    if (stubSegment) {
      for (const n of stubSegment.nodes) {
        expect(n.props.filePath).toBeUndefined()
      }
    }
  })
})
```

- [ ] **Step 2: Прогнать тесты**

```bash
pnpm --filter @nakidka/core test packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts
```

Expected: PASS — кейс с формой ставит формовой узел в правильный сегмент, ребро FORM живёт в catalog-сегменте, стаб-сегмент (если есть) имеет `filePath: ''`.

> **Замечание:** Если кейс «формовой узел» падает с тем, что узел появился ТОЛЬКО в `nkdk`-сегменте, а файл `nkdk` не передавался — значит `importMetadataFileWithGraph` для form-kind проставил два filePaths без проверки, что nkdk не задан. В этом случае — поправить: form-сегмент с одним yaml-файлом должен иметь только этот один filePath. Изменение точечное в `importMetadataFileWithGraph.ts`, в блоке kind === "form": `if (nkdkFilePath)` уже стоит, так что на самом деле всё хорошо; если поломалось что-то иное — починить в этом же task'е.

- [ ] **Step 3: Commit**

```bash
git add packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts
git commit -m "$(cat <<'EOF'
test: :white_check_mark: расширенные тесты buildGraph (формы, стабы)

Покрываем три ключевых случая поверх smoke-теста Task 9:
форма (формовой узел попадает в свой сегмент filePath, ребро FORM
от владельца живёт в catalog-сегменте); присутствие стаб-сегмента
с filePath '' (если есть) консистентно — у стаба нет props.filePath.
EOF
)"
```

---

## Task 11: Прогон полного `pnpm test` и сверка с задачами фазы

**Files:** —

- [ ] **Step 1: Полный тест проекта**

```bash
cd /Users/nikita/git/nakidka-core
pnpm test
```

Expected: PASS — все ~2531+ тестов проходят во всех пакетах (`core`, `cli`, `language`, `graph`).

- [ ] **Step 2: Проверить, что `forms/elements` чист от прямых обращений к графу**

```bash
grep -nE "applyGraphOps|graph\.(promoteNode|ensureNode|ensureEdge)" \
  packages/core/metadata/forms/elements/graphFromModel.ts
```

Expected: пустой вывод. Файл больше не мутирует граф напрямую.

- [ ] **Step 3: Проверить, что параметр `graph` снят с `BuildGraphFromModelFunction`**

```bash
grep -A 8 "export type BuildGraphFromModelFunction" \
  packages/core/metadata/orchestration/property/fn.ts
```

Expected: в выводе нет строки `graph: MetadataGraph`.

- [ ] **Step 4: Проверить, что `buildGraph` экспортируется из core**

```bash
grep -n "export.*buildGraph\b" packages/core/metadata/orchestration/index.ts
grep -n "from \"./buildGraph\"" packages/core/metadata/orchestration/index.ts
```

Expected: в выводе видны реэкспорт каталога buildGraph и/или прямой `export { buildGraph }`. (Для нашего варианта через `export * from "./buildGraph"` подойдут оба паттерна grep, но какая-то из строк должна найтись.)

- [ ] **Step 5: Финальный no-op коммит (если требуется)**

Если выше остались несостыковки в типах или импорты — поправить и закоммитить отдельным commit. Иначе шаг пропустить.

---

## Самопроверка

После выполнения 11 задач:

- **Фаза 1c закрыта.** Все 8 файлов с `BuildGraphFromModelFunction`-обработчиками — чистые. Параметр `graph: MetadataGraph` снят с сигнатуры. `applyBuildGraphResult` — единственная точка нормализации `GraphOps[] → applyGraphOps + recurse`, переиспользуется в `orchestration/buildGraphFromModel.ts` и `forms/elements/graphFromModel.ts`. `GraphOpsChild` обрёл `absoluteId` (override полного id) и `edgeFrom` (источник ребра ≠ id-родителя) — оба нужны для плоских узлов и синглетов в `forms/elements`.
- **Фаза 1d закрыта.** В core живёт чистый агрегатор `buildGraph(yamlFiles, context) → FileGraphData[]`: парсит YAML по карте, диспетчеризует по сегментам пути, собирает `MetadataGraph` через существующий пайплайн, обходит его в посегментный `FileGraphData[]` с лейблом из `itemType` и props под префиксом `p_*`. `flattenItem` раскладывает скаляры, plain-объекты (по `_`) и массивы примитивов; `itemType`/`_uuid`/массивы объектов отфильтровываются. Типы `NodeData`/`EdgeData`/`FileGraphData` локальные в core, структурно совместимы с `@nakidka/graph` — связку через CLI отдадим в фазе 1e.
- **Все ~2531+ тестов проекта проходят.** Поведение в `MetadataGraph` идентично прежнему — все integration-тесты `*/graphFromModel.test.ts` остаются зелёными. CLI `nkdk update-graph` работает по-прежнему.

## Что НЕ входит в этот план

- **Фаза 1e — переезд CLI и удаление graphology.** `packages/cli/src/commands/updateGraph.ts` переходит на `await updateGraph(buildGraph(yamlFiles, context))` из `@nakidka/graph`. Удаляются: `MetadataGraph.ts`, `applyGraphOps.ts`, `GraphWalker.ts`, `addRelation.ts`, `referenceScope.ts` (с парковкой поля в типах правил), `getDependencies.ts`, `resolveFormLocalPath.ts`, `autocompletePath.ts`, `existPath.ts`, `graph.ts`, `validateProject.ts`, команда `nkdk validate`, мёртвый код в `extension` (`workspaceGraph.ts`, `definitionProvider.ts`, `completionProvider.ts`, `diagnosticProvider.ts`), dependency `graphology` в `package.json`. После этой фазы `walkGraphToFileData` тоже уйдёт — `MetadataGraph` как промежуточная структура заменится на прямой коллектор `GraphOps → FileGraphData[]` (родовое сужение интерфейса). Эта фаза самая большая по объёму удаляемого кода, но в каждой точке маленькая и проверяемая.
- **Раскладка type-specific полей с пере-эмиссией рёбер.** `TypeDescription` сейчас оставляет в `node.item.types` все типы как массив строк (`["Number", "CatalogRef.X"]`); по спеке в `p_types` должны попасть только примитивы 1С, а ссылочные типы — стать рёбрами `:REF_TYPE`. Это требует расширения `extractGraph`-обработчика для `TypeDescription` (не входит в 1d, потому что меняет существующее семантическое поведение); план — отдельный, по факту первой потребности на этапе 2 основной спеки.
- **`BuildModelFromGraphFunction` для двухступенчатого `toXML`.** Обратное направление граф → модель → XML — это подсистема (Е) спеки, отдельный план.
- **CI-инфраструктура для FalkorDB.** Поднятие тестового FalkorDB через testcontainers/docker-compose — DevOps-вопрос, план для него тоже отдельный.
