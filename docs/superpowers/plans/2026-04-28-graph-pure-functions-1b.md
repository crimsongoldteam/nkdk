# Чистые `graphFromModel.ts` — фаза 1b (массовая миграция)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Завершить перевод всех `graphFromModel.ts`-файлов с `BuildGraphFromModelFunction`-обработчиками на чистый контракт «возврат `GraphOps`», начатый в фазе 1a (`metadataField`). После этой фазы ни одна чистая функция не использует параметр `graph`, и параметр снимается с сигнатуры.

**Architecture:** В фазе 1a уже добавлены поля `edgeKind`/`edgeYaml` в `GraphOps` и расширен возврат `BuildGraphFromModelFunction` до `GraphOps | undefined | void`. Здесь по очереди переводим оставшиеся 6 файлов с `BuildGraphFromModelFunction`. По мере необходимости расширяем `GraphOps` дополнительными декларативными полями (`item` на children, `formLocalReferences` для `resolveFormLocalPath`, `recurse` для рекурсивного обхода подмодели по правилу) и обработку этих полей в `applyGraphOps` / оркестраторе. Поведение в `MetadataGraph` идентично прежнему — все integration-тесты остаются зелёными.

Файлы `forms/commonObjects/formCommand/graphFromModel.ts`, `forms/commonObjects/formParameter/graphFromModel.ts`, `commonObjects/typeDescription/graphFromModel.ts` уже чистые — содержат только `registerTypeRule(..., "graphChild" | "extractGraph")`, без `BuildGraphFromModelFunction`, и в этой фазе не трогаются.

**Tech Stack:** TypeScript 5.9, vitest 4. Никаких новых зависимостей.

---

## Структура файлов

**Modify (расширение инфраструктуры):**
- `packages/core/metadata/orchestration/property/fn.ts` — добавить `GraphOpsChild.item?`, `GraphOpsChild.absoluteId?`, `GraphOpsChild.edgeFrom?`, `GraphOps.formLocalReferences?`, `GraphOps.recurse?`. Снять `graph: MetadataGraph` из `BuildGraphFromModelFunction` финальной задачей.
- `packages/core/metadata/relations/applyGraphOps.ts` — обработать новые поля.
- `packages/core/metadata/orchestration/buildGraphFromModel.ts` — поддержать `recurse` в результате обработчика, передавая `extra` дальше.

**Modify (миграция файлов):**
- `packages/core/metadata/commonObjects/metadataRef/graphFromModel.ts`
- `packages/core/metadata/commonObjects/metadataValue/graphFromModel.ts`
- `packages/core/metadata/forms/commonObjects/commandName/graphFromModel.ts`
- `packages/core/metadata/forms/commonObjects/associatedTable/graphFromModel.ts`
- `packages/core/metadata/forms/commonObjects/dataPath/graphFromModel.ts`
- `packages/core/metadata/forms/commonObjects/formAttribute/graphFromModel.ts`

**Не трогаем:**
- `packages/core/metadata/forms/elements/graphFromModel.ts` — самая сложная миграция, плоская раскладка узлов через `formNodeId.Элемент.<name>` с ребром-источником, отличным от `parentNodeId`. Уезжает в отдельную фазу 1c, чтобы 1b остался обозримым по объёму. После 1b у `forms/elements` останется единственный legacy-обработчик с `graph`-параметром; снятие `graph` из сигнатуры (Task 8) сместится в 1c.
- Существующие `*.test.ts` — integration-тесты через `MetadataGraph`/`importMetadataFileWithGraph` остаются как контрактная проверка. Поведение не меняется.
- `applyGraphOps` продолжает писать в `MetadataGraph` — удаление graphology в фазе 1d.

**Уточнение области:** Поскольку `forms/elements` остаётся в 1b с legacy-сигнатурой, **Task 8 (удаление `graph` из сигнатуры) переносится в фазу 1c** — план фазы 1b завершается на Task 7. Финальный шаг 1b — прогон полного `pnpm test` и подведение итога.

---

## Task 1: Перевести `metadataRef/graphFromModel.ts` на чистую форму

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataRef/graphFromModel.ts`

- [ ] **Step 1: Заменить тело `buildMetadataItemLinksGraph`**

Целиком заменить содержимое `packages/core/metadata/commonObjects/metadataRef/graphFromModel.ts` на:

```ts
import { isPair, isScalar, isSeq, YAMLSeq } from "yaml"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import {
  BuildGraphFromModelFunction,
  ExtractGraphFromModelFunction,
  GraphOps,
} from "~/metadata/orchestration/property/fn"
import { findSeqItemOffset } from "~/metadata/orchestration/property/position"
import { extractReferenceFromPath } from "~/metadata/orchestration/property/extractReferenceFromPath"
import { MetadataItemLink, MetadataItemLinks } from "./types"

const EDGE_KIND = "OBJECT"
const EDGE_YAML = "Объект"

const extractMetadataItemLinkGraph: ExtractGraphFromModelFunction = (
  model,
  position,
): GraphOps | undefined => {
  const link = model as MetadataItemLink
  if (!link) return undefined
  const ref = extractReferenceFromPath(link, position)
  if (!ref) return undefined
  return { references: [ref] }
}

const buildMetadataItemLinksGraph: BuildGraphFromModelFunction = ({
  model,
  yamlMap,
  propRule,
}): GraphOps | undefined => {
  const links = model as MetadataItemLinks | undefined
  if (!Array.isArray(links) || links.length === 0) return undefined

  let yamlSeq: YAMLSeq | undefined
  if (yamlMap && propRule.yaml) {
    const pair = yamlMap.items.find(
      (i) => isPair(i) && isScalar(i.key) && i.key.value === propRule.yaml,
    )
    if (pair && isPair(pair) && isSeq(pair.value)) {
      yamlSeq = pair.value as YAMLSeq
    }
  }

  const references = links
    .map((link, index) => {
      const offset = yamlSeq ? findSeqItemOffset(yamlSeq, index) : undefined
      const position = offset !== undefined ? { offset } : undefined
      return extractReferenceFromPath(link, position)
    })
    .filter((ref): ref is NonNullable<typeof ref> => ref !== undefined)

  if (references.length === 0) return undefined

  return { references, edgeKind: EDGE_KIND, edgeYaml: EDGE_YAML }
}

registerTypeRule("MetadataItemLink", "extractGraph", extractMetadataItemLinkGraph)
registerTypeRule("MetadataItemLink", "graphEdgeFromParent", { kind: EDGE_KIND, yaml: EDGE_YAML })
registerTypeRule("MetadataItemLinks", "buildGraphFromModel", buildMetadataItemLinksGraph)
```

Изменения:
- Удалён импорт `applyGraphOps`.
- Из деструктуризации `buildMetadataItemLinksGraph` убраны `parentNodeId`, `filePath`, `graph`.
- Тело собирает массив `references` и возвращает `GraphOps` с `edgeKind: "OBJECT"`, `edgeYaml: "Объект"`. Пустой результат — `undefined`.

- [ ] **Step 2: Прогнать type-check**

```bash
cd /Users/nikita/git/nakidka-core/.worktrees/graph-pure-functions
pnpm --filter @nakidka/core run type-check
```

Expected: PASS.

- [ ] **Step 3: Прогнать тесты ядра**

```bash
pnpm --filter @nakidka/core test
```

Expected: PASS — поведение не меняется, оркестратор сам прогоняет результат через `applyGraphOps`.

- [ ] **Step 4: Commit**

```bash
git add packages/core/metadata/commonObjects/metadataRef/graphFromModel.ts
git commit -m "$(cat <<'EOF'
refactor: :recycle: перевести buildMetadataItemLinksGraph на чистую форму

Функция возвращает GraphOps { references, edgeKind, edgeYaml } вместо
прямой мутации graph через applyGraphOps. Поведение в MetadataGraph
идентично прежнему — оркестратор сам прогоняет результат через тот же
applyGraphOps.
EOF
)"
```

---

## Task 2: Перевести `metadataValue/graphFromModel.ts` на чистую форму

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataValue/graphFromModel.ts`

`buildMetadataValueGraph` имеет три ветки: `fixedArray`, `formChoiceListDesTimeValue`, простой `ref`/`objectRef`. В fixedArray-ветке элементы могут давать рёбра двух разных kinds (`VALUE` и `OBJECT`), но один вызов `applyGraphOps` берёт только один `edgeKind`. Чтобы не разбивать `GraphOps` на «секции по kind», в этой задаче делаем компромисс: на уровне функции возвращаем `GraphOps` с одним kind'ом, а смешанный fixedArray (редкий случай) обрабатываем через расширение возврата — допускаем, что функция может вернуть **массив** `GraphOps[]`, и оркестратор разворачивает каждую секцию отдельно.

- [ ] **Step 1: Расширить возвращаемый тип `BuildGraphFromModelFunction` до union с массивом**

В `packages/core/metadata/orchestration/property/fn.ts` найти:

```ts
}) => GraphOps | undefined | void
```

Заменить на:

```ts
}) => GraphOps | GraphOps[] | undefined | void
```

- [ ] **Step 2: Адаптировать оркестратор для массива GraphOps**

В `packages/core/metadata/orchestration/buildGraphFromModel.ts` найти ветку `if (buildGraphFn) { ... }`. Заменить блок обработки результата на:

```ts
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
    if (!section.children?.length && !section.references?.length) continue
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
  continue
}
```

Поведение для одиночного `GraphOps` не меняется (одна секция в массиве). `void`/`undefined` пропускается. Массив развёртывается посекционно — каждая секция со своим `edgeKind`.

- [ ] **Step 3: Заменить тело `buildMetadataValueGraph` на чистую форму**

Целиком заменить содержимое `packages/core/metadata/commonObjects/metadataValue/graphFromModel.ts` на:

```ts
import { isPair, isScalar, isSeq, YAMLSeq } from "yaml"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import {
  BuildGraphFromModelFunction,
  GraphOps,
  GraphOpsReference,
} from "~/metadata/orchestration/property/fn"
import { computeValuePosition, findSeqItemOffset, findSubmap } from "~/metadata/orchestration/property/position"
import { extractReferenceFromPath } from "~/metadata/orchestration/property/extractReferenceFromPath"
import { convertPath } from "~/metadata/commonObjects/metadataPath/helper"
import { MetadataValuesRulesToYAML } from "~/metadata/commonObjects/metadataPath/types"
import {
  MetadataFixedArrayValue,
  MetadataFormChoiceListValue,
  MetadataObjectRefValue,
  MetadataRefValue,
  MetadataTypedValue,
  MetadataValue,
} from "./types"

const REF_EDGE_KIND = "VALUE"
const REF_EDGE_YAML = "Значение"
const OBJECT_REF_EDGE_KIND = "OBJECT"
const OBJECT_REF_EDGE_YAML = "Объект"

function convertRefValueToNodeId(refValue: string): string | undefined {
  if (!refValue) return undefined
  let processedPath = refValue
  if (refValue.startsWith("Enum.")) {
    processedPath = refValue.split(".").filter((p) => p !== "EnumValue").join(".")
  }
  const nodeId = convertPath(MetadataValuesRulesToYAML, processedPath)
  const dotInInput = processedPath.indexOf(".")
  const dotInOutput = nodeId.indexOf(".")
  if (dotInInput === -1 || dotInOutput === -1) return undefined
  if (processedPath.substring(0, dotInInput) === nodeId.substring(0, dotInOutput)) return undefined
  return nodeId
}

export function extractSingleValueRef(
  value: MetadataTypedValue,
  position?: { offset: number },
): { ref: GraphOpsReference; kind: string; yaml: string } | undefined {
  if (value.type === "ref") {
    const nodeId = convertRefValueToNodeId((value as MetadataRefValue).value)
    if (!nodeId) return undefined
    const parts = nodeId.split(".")
    const name = parts[parts.length - 1]
    return {
      ref: { id: nodeId, name, positionFrom: position },
      kind: REF_EDGE_KIND,
      yaml: REF_EDGE_YAML,
    }
  }
  if (value.type === "objectRef") {
    const ref = extractReferenceFromPath((value as MetadataObjectRefValue).value, position)
    if (!ref) return undefined
    return { ref, kind: OBJECT_REF_EDGE_KIND, yaml: OBJECT_REF_EDGE_YAML }
  }
  return undefined
}

export const buildMetadataValueGraph: BuildGraphFromModelFunction = ({
  model,
  yamlMap,
  propRule,
}): GraphOps[] | undefined => {
  const value = model as MetadataValue | undefined
  if (!value) return undefined

  if (value.type === "fixedArray") {
    const items = (value as MetadataFixedArrayValue).value
    if (items.length === 0) return undefined

    let yamlSeq: YAMLSeq | undefined
    if (yamlMap && propRule.yaml) {
      const pair = yamlMap.items.find(
        (i) => isPair(i) && isScalar(i.key) && i.key.value === propRule.yaml,
      )
      if (pair && isPair(pair) && isSeq(pair.value)) {
        yamlSeq = pair.value as YAMLSeq
      }
    }

    const refsByKind = new Map<string, { yaml: string; refs: GraphOpsReference[] }>()
    items.forEach((item, index) => {
      const offset = yamlSeq ? findSeqItemOffset(yamlSeq, index) : undefined
      const position = offset !== undefined ? { offset } : undefined
      const extracted = extractSingleValueRef(item, position)
      if (!extracted) return
      const { ref, kind, yaml } = extracted
      let bucket = refsByKind.get(kind)
      if (!bucket) {
        bucket = { yaml, refs: [] }
        refsByKind.set(kind, bucket)
      }
      bucket.refs.push(ref)
    })

    if (refsByKind.size === 0) return undefined
    const sections: GraphOps[] = []
    for (const [kind, { yaml, refs }] of refsByKind) {
      sections.push({ references: refs, edgeKind: kind, edgeYaml: yaml })
    }
    return sections
  }

  if (value.type === "formChoiceListDesTimeValue") {
    const inner = (value as MetadataFormChoiceListValue).value
    if (!inner) return undefined
    let innerPosition: { offset: number } | undefined
    if (yamlMap && propRule.yaml) {
      const innerMap = findSubmap(yamlMap, propRule.yaml)
      if (innerMap) {
        innerPosition = computeValuePosition(innerMap, "Значение")
      } else {
        innerPosition = computeValuePosition(yamlMap, propRule.yaml)
      }
    }
    const extracted = extractSingleValueRef(inner, innerPosition)
    if (!extracted) return undefined
    return [{ references: [extracted.ref], edgeKind: extracted.kind, edgeYaml: extracted.yaml }]
  }

  const position =
    yamlMap && propRule.yaml ? computeValuePosition(yamlMap, propRule.yaml) : undefined
  const extracted = extractSingleValueRef(value, position ?? undefined)
  if (!extracted) return undefined
  return [{ references: [extracted.ref], edgeKind: extracted.kind, edgeYaml: extracted.yaml }]
}

registerTypeRule("MetadataValue", "buildGraphFromModel", buildMetadataValueGraph)
```

Изменения:
- Удалён импорт `applyGraphOps`.
- Из деструктуризации `buildMetadataValueGraph` убраны `parentNodeId`, `filePath`, `graph`.
- Каждая ветка возвращает либо `undefined`, либо массив секций `GraphOps[]` с готовыми `edgeKind`/`edgeYaml`. Простой одиночный `ref`/`objectRef` тоже отдаётся массивом из одной секции — это унифицирует тип возврата.

- [ ] **Step 4: Обновить existing-тест `metadataValue/graphFromModel.test.ts`**

В `packages/core/metadata/commonObjects/metadataValue/graphFromModel.test.ts` каждый вызов `buildMetadataValueGraph({ ..., graph })` использует параметр `graph` для проверки рёбер через `outEdgeEntries`. Поведение функции изменилось — она теперь возвращает `GraphOps[]` вместо мутации graph. Чтобы тесты остались валидными контрактом, нужно либо:
1. Переписать их на проверку возвращённых `GraphOps[]` напрямую, либо
2. Прогонять результат через `applyGraphOps` в самом тесте.

Выбираем (2) — это сохраняет integration-характер тестов и даёт меньше изменений. Найти в начале файла:

```ts
import { extractSingleValueRef, buildMetadataValueGraph } from "./graphFromModel"
```

И добавить ниже:

```ts
import { applyGraphOps } from "~/metadata/relations/applyGraphOps"
```

Создать локальный helper после `makeGraph`:

```ts
function runBuild(params: Parameters<typeof buildMetadataValueGraph>[0]) {
  const result = buildMetadataValueGraph(params)
  const sections = Array.isArray(result) ? result : result ? [result] : []
  for (const section of sections) {
    if (!section.edgeKind || !section.edgeYaml) continue
    applyGraphOps(section, {
      graph: params.graph,
      parentNodeId: params.parentNodeId,
      filePath: params.filePath,
      edgeKind: section.edgeKind,
      edgeYaml: section.edgeYaml,
    })
  }
}
```

Заменить все вызовы `buildMetadataValueGraph({...})` в `describe("buildMetadataValueGraph", ...)` на `runBuild({...})`.

- [ ] **Step 5: Прогнать тесты ядра**

```bash
pnpm --filter @nakidka/core test
```

Expected: PASS — все ~2531 тестов остаются зелёными.

- [ ] **Step 6: Commit**

```bash
git add \
  packages/core/metadata/orchestration/property/fn.ts \
  packages/core/metadata/orchestration/buildGraphFromModel.ts \
  packages/core/metadata/commonObjects/metadataValue/graphFromModel.ts \
  packages/core/metadata/commonObjects/metadataValue/graphFromModel.test.ts
git commit -m "$(cat <<'EOF'
refactor: :recycle: перевести buildMetadataValueGraph на чистую форму

Функция возвращает GraphOps[] (массив секций по edgeKind) вместо мутации
graph. Расширен возврат BuildGraphFromModelFunction до GraphOps | GraphOps[] |
undefined | void; оркестратор разворачивает каждую секцию через applyGraphOps.
Это нужно для fixedArray-ветки, где элементы могут давать рёбра kind=VALUE и
kind=OBJECT одновременно — разделение на секции позволяет описать обе.

Тесты graphFromModel.test.ts адаптированы через локальный helper runBuild,
прогоняющий результат через applyGraphOps — поведение в MetadataGraph
идентично прежнему.
EOF
)"
```

---

## Task 3: Перевести `commandName/graphFromModel.ts` на чистую форму

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/commandName/graphFromModel.ts`

Текущая функция создаёт stub-узел и reference-ребро на узел команды формы. Это укладывается в `references` секцию `GraphOps`.

- [ ] **Step 1: Заменить тело обработчика на чистую форму**

Целиком заменить содержимое `packages/core/metadata/forms/commonObjects/commandName/graphFromModel.ts` на:

```ts
/**
 * Регистрирует buildGraphFromModel для типа CommandName.
 *
 * PRD #121: свойство commandName на кнопках формы — имя команды в текущей форме.
 * Материализуется как reference-ребро «ИмяКоманды» от узла кнопки к узлу команды формы.
 *
 * Если команды с таким именем нет в форме — создаётся заглушка через ensureNode
 * в applyGraphOps. formNodeId пробрасывается через extra от forms/elements.
 */

import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { registerEdgeKind } from "~/metadata/relations/edgeKinds"
import {
  BuildGraphFromModelFunction,
  GraphOps,
} from "~/metadata/orchestration/property/fn"

const EDGE_KIND = "COMMAND_NAME"
const EDGE_YAML = "ИмяКоманды"

registerEdgeKind(EDGE_KIND, { yaml: EDGE_YAML, owning: false })

const buildCommandNameGraph: BuildGraphFromModelFunction = ({
  model,
  extra,
}): GraphOps | undefined => {
  if (typeof model !== "string" || !model) return undefined
  const formNodeId = extra?.formNodeId as string | undefined
  if (!formNodeId) return undefined

  const targetId = `${formNodeId}.Команда.${model}`
  return {
    references: [{ id: targetId, name: model }],
    edgeKind: EDGE_KIND,
    edgeYaml: EDGE_YAML,
  }
}

registerTypeRule("CommandName", "buildGraphFromModel", buildCommandNameGraph)
```

Изменения:
- Из деструктуризации убраны `parentNodeId`, `graph`.
- Возвращается `GraphOps` с одним reference на узел команды; оркестратор сам сделает `ensureNode` + `ensureEdge` через `applyGraphOps`.

- [ ] **Step 2: Прогнать тесты ядра**

```bash
pnpm --filter @nakidka/core test
```

Expected: PASS — `commandName/graphFromModel.test.ts` остаётся зелёным.

- [ ] **Step 3: Commit**

```bash
git add packages/core/metadata/forms/commonObjects/commandName/graphFromModel.ts
git commit -m "$(cat <<'EOF'
refactor: :recycle: перевести CommandName buildGraphFromModel на чистую форму

Функция возвращает GraphOps с одним reference вместо ensureNode+ensureEdge
напрямую. Оркестратор прогоняет результат через applyGraphOps — поведение
идентично.
EOF
)"
```

---

## Task 4: Перевести `associatedTable/graphFromModel.ts` на чистую форму

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/associatedTable/graphFromModel.ts`

Идентичная структура с `commandName`: один stub-узел + reference-ребро.

- [ ] **Step 1: Заменить тело обработчика на чистую форму**

Целиком заменить содержимое `packages/core/metadata/forms/commonObjects/associatedTable/graphFromModel.ts` на:

```ts
/**
 * Регистрирует buildGraphFromModel для типа AssociatedTable.
 *
 * PRD #119: свойство table на элементах формы и командах формы — ссылка на
 * элемент-таблицу внутри той же формы (по имени элемента). Материализуется как
 * reference-ребро «СвязаннаяТаблица» от узла элемента к узлу таблицы.
 *
 * Если узел таблицы не существует — applyGraphOps создаст заглушку.
 * formNodeId пробрасывается через extra от forms/elements.
 */

import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { registerEdgeKind } from "~/metadata/relations/edgeKinds"
import {
  BuildGraphFromModelFunction,
  GraphOps,
} from "~/metadata/orchestration/property/fn"

const EDGE_KIND = "ASSOCIATED_TABLE"
const EDGE_YAML = "СвязаннаяТаблица"

registerEdgeKind(EDGE_KIND, { yaml: EDGE_YAML, owning: false })

const buildAssociatedTableGraph: BuildGraphFromModelFunction = ({
  model,
  extra,
}): GraphOps | undefined => {
  if (typeof model !== "string" || !model) return undefined
  const formNodeId = extra?.formNodeId as string | undefined
  if (!formNodeId) return undefined

  const targetId = `${formNodeId}.Элемент.${model}`
  return {
    references: [{ id: targetId, name: model }],
    edgeKind: EDGE_KIND,
    edgeYaml: EDGE_YAML,
  }
}

registerTypeRule("AssociatedTable", "buildGraphFromModel", buildAssociatedTableGraph)
```

- [ ] **Step 2: Прогнать тесты ядра**

```bash
pnpm --filter @nakidka/core test
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/core/metadata/forms/commonObjects/associatedTable/graphFromModel.ts
git commit -m "$(cat <<'EOF'
refactor: :recycle: перевести AssociatedTable buildGraphFromModel на чистую форму

Функция возвращает GraphOps с одним reference вместо прямой мутации graph.
Поведение идентично: applyGraphOps создаёт заглушку и ребро.
EOF
)"
```

---

## Task 5: Расширить `GraphOps` декларациями `formLocalReferences`, мигрировать `dataPath`

**Files:**
- Modify: `packages/core/metadata/orchestration/property/fn.ts`
- Modify: `packages/core/metadata/relations/applyGraphOps.ts`
- Modify: `packages/core/metadata/forms/commonObjects/dataPath/graphFromModel.ts`

`dataPath` отличается от `commandName`/`associatedTable` тем, что цель ссылки резолвится через `resolveFormLocalPath` — функцию, которая обходит граф (рёбра формы) и при необходимости создаёт заглушку. Чтобы вынести `graph` из чистой функции, добавляем декларацию `formLocalReferences` — оркестратор сам вызывает `resolveFormLocalPath` при применении.

- [ ] **Step 1: Добавить тип `GraphOpsFormLocalReference` и поле в `GraphOps`**

В `packages/core/metadata/orchestration/property/fn.ts` после интерфейса `GraphOpsReference` (около строки 95) добавить:

```ts
export interface GraphOpsFormLocalReference {
  /** Form-local путь, например "Объект.Договор.Владелец". */
  formLocalPath: string
  /** Корневой узел формы — стартовая точка резолвинга. */
  formNodeId: string
  positionFrom?: { offset: number; length?: number }
}
```

Расширить `GraphOps`:

```ts
export interface GraphOps {
  children?: GraphOpsChild[]
  references?: GraphOpsReference[]
  /** Reference-рёбра, цель которых нужно резолвить через resolveFormLocalPath. */
  formLocalReferences?: GraphOpsFormLocalReference[]
  edgeKind?: string
  edgeYaml?: string
}
```

- [ ] **Step 2: Расширить `applyGraphOps` обработкой `formLocalReferences`**

В `packages/core/metadata/relations/applyGraphOps.ts` заменить файл целиком на:

```ts
import { GraphOps } from "../orchestration/property/fn"
import { resolveFormLocalPath } from "./resolveFormLocalPath"
import { MetadataGraph } from "./MetadataGraph"

export interface ApplyGraphOpsContext {
  graph: MetadataGraph
  parentNodeId: string
  filePath: string
  edgeKind: string
  edgeYaml: string
}

export function applyGraphOps(ops: GraphOps, ctx: ApplyGraphOpsContext): void {
  const { graph, parentNodeId, filePath, edgeKind, edgeYaml } = ctx

  for (const child of ops.children ?? []) {
    const childNodeId = `${parentNodeId}.${child.idSuffix}`
    graph.promoteNode(childNodeId, {
      name: child.name,
      filePaths: [filePath],
      positionFrom: child.positionFrom,
    })
    const edgeKey = `${parentNodeId}:${edgeKind}:${childNodeId}`
    graph.ensureEdge(edgeKey, parentNodeId, childNodeId, {
      yaml: edgeYaml,
      kind: edgeKind,
    })
  }

  for (const ref of ops.references ?? []) {
    graph.ensureNode(ref.id, { name: ref.name })
    const edgeKey = `${parentNodeId}:${edgeKind}:${ref.id}`
    graph.ensureEdge(edgeKey, parentNodeId, ref.id, {
      yaml: edgeYaml,
      kind: edgeKind,
      positionFrom: ref.positionFrom,
    })
  }

  for (const local of ops.formLocalReferences ?? []) {
    const resolved = resolveFormLocalPath({
      formNodeId: local.formNodeId,
      path: local.formLocalPath,
      graph,
    })
    if (!resolved) continue
    const edgeKey = `${parentNodeId}:${edgeKind}:${resolved.targetId}`
    graph.ensureEdge(edgeKey, parentNodeId, resolved.targetId, {
      yaml: edgeYaml,
      kind: edgeKind,
      positionFrom: local.positionFrom,
    })
  }
}
```

- [ ] **Step 3: Заменить тело `dataPath`-обработчика на чистую форму**

Целиком заменить содержимое `packages/core/metadata/forms/commonObjects/dataPath/graphFromModel.ts` на:

```ts
/**
 * Регистрирует buildGraphFromModel для типа DataPath.
 *
 * PRD #118: dataPath-свойства элементов формы превращаются в reference-рёбра
 * от узла элемента к узлу целевого реквизита/колонки.
 *
 * Kind ребра определяется по правилу yaml-name (PRD #114):
 * propRule.graphEdgeKind ?? getKindByYaml(propRule.yaml).
 *
 * Резолвинг цели делегирован applyGraphOps через formLocalReferences —
 * оркестратор вызовет resolveFormLocalPath при записи в граф.
 */

import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { getKindByYaml, registerEdgeKind } from "~/metadata/relations/edgeKinds"
import {
  BuildGraphFromModelFunction,
  GraphOps,
} from "~/metadata/orchestration/property/fn"

registerEdgeKind("DATA_PATH", { yaml: "ПутьКДанным", owning: false })
registerEdgeKind("FOOTER_DATA_PATH", { yaml: "ПутьКДаннымПодвала", owning: false })
registerEdgeKind("TITLE_DATA_PATH", { yaml: "ПутьКДаннымЗаголовка", owning: false })
registerEdgeKind("ROW_PICTURE_DATA_PATH", { yaml: "ПутьКДаннымКартинкиСтроки", owning: false })

const buildDataPathGraph: BuildGraphFromModelFunction = ({
  model,
  propRule,
  extra,
}): GraphOps | undefined => {
  if (typeof model !== "string" || !model) return undefined
  const formNodeId = extra?.formNodeId as string | undefined
  if (!formNodeId) return undefined

  const edgeYaml = propRule.yaml
  if (!edgeYaml) return undefined
  const edgeKind =
    ((propRule as Record<string, unknown>).graphEdgeKind as string | undefined) ??
    getKindByYaml(edgeYaml)
  if (!edgeKind) return undefined

  return {
    formLocalReferences: [{ formLocalPath: model, formNodeId }],
    edgeKind,
    edgeYaml,
  }
}

registerTypeRule("DataPath", "buildGraphFromModel", buildDataPathGraph)
```

Изменения:
- Удалены импорты `resolveFormLocalPath` и `graph`-параметра.
- Возвращается `GraphOps` с `formLocalReferences` — оркестратор резолвит при применении.

- [ ] **Step 4: Прогнать тесты ядра**

```bash
pnpm --filter @nakidka/core test
```

Expected: PASS — `dataPath/graphFromModel.test.ts` остаётся зелёным. `applyGraphOps` теперь сам делегирует `resolveFormLocalPath`.

- [ ] **Step 5: Commit**

```bash
git add \
  packages/core/metadata/orchestration/property/fn.ts \
  packages/core/metadata/relations/applyGraphOps.ts \
  packages/core/metadata/forms/commonObjects/dataPath/graphFromModel.ts
git commit -m "$(cat <<'EOF'
refactor: :recycle: перевести DataPath buildGraphFromModel на чистую форму

GraphOps расширен декларацией formLocalReferences для целей, резолвимых
через resolveFormLocalPath. applyGraphOps сам вызывает резолвинг и
создаёт ребро (с заглушкой при отсутствии целевого узла). DataPath-обработчик
становится чистой функцией: возвращает декларацию пути и edgeKind/edgeYaml,
без обращения к graph.
EOF
)"
```

---

## Task 6: Расширить `GraphOps` декларациями `item`/`parentOverride`/`recurse`, мигрировать `formAttribute` (FormAttributeColumns)

**Files:**
- Modify: `packages/core/metadata/orchestration/property/fn.ts`
- Modify: `packages/core/metadata/relations/applyGraphOps.ts`
- Modify: `packages/core/metadata/orchestration/buildGraphFromModel.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/graphFromModel.ts`

`FormAttributeColumns` создаёт многоуровневые узлы с собственным `item` и рекурсивно вызывает `buildGraphFromModel` оркестратора, чтобы пройтись по правилу `FormAttributeColumnRules`. В `additional`-ветке появляется прокси-узел, к которому прикрепляются и колонки-дети, и `formLocalReferences` ребра «Таблица», т.е. источник ребра ≠ `parentNodeId`.

Расширения `GraphOps` (вводятся одним пакетом, прежде чем мигрировать сам файл):
- `GraphOpsChild.item?: Record<string, unknown>` — записывается в `graph.promoteNode({ item })`.
- `GraphOpsChild.parentOverride?: string` — если задано, ребро идёт от этого узла, и `childNodeId = parentOverride + "." + idSuffix`.
- `GraphOpsFormLocalReference.parentOverride?: string` — аналогично для form-local рёбер.
- `GraphOps.recurse?: GraphOpsRecurse[]` — список «рекурсивных задач»: оркестратор пройдёт по подмодели с указанным правилом после применения локальных ops.

- [ ] **Step 1: Расширить типы в `fn.ts`**

В `packages/core/metadata/orchestration/property/fn.ts` найти:

```ts
export interface GraphOpsChild {
  idSuffix: string
  name: string
  positionFrom?: { offset: number; length?: number }
}
```

Заменить на:

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

Найти `GraphOpsFormLocalReference` (введён в Task 5):

```ts
export interface GraphOpsFormLocalReference {
  formLocalPath: string
  formNodeId: string
  positionFrom?: { offset: number; length?: number }
}
```

Заменить на:

```ts
export interface GraphOpsFormLocalReference {
  formLocalPath: string
  formNodeId: string
  positionFrom?: { offset: number; length?: number }
  /** Если задано — ребро идёт от этого узла к резолвимой цели вместо ctx.parentNodeId. */
  parentOverride?: string
}
```

После `GraphOpsFormLocalReference` добавить новый интерфейс:

```ts
export interface GraphOpsRecurse {
  /** Подмодель, для которой нужно повторно вызвать обход правила. */
  model: Record<string, unknown>
  /** YAML-фрагмент подмодели для координат. Опционально. */
  yamlMap?: YAMLMap
  /** Правило обхода подмодели. */
  rule: MetadataItemRule
  /** Узел, относительно которого пойдёт обход — становится parentNodeId внутри. */
  parentNodeId: string
  /** Дополнительный контекст, пробрасываемый в обработчики. По умолчанию наследуется от вызывающего. */
  extra?: Record<string, unknown>
}
```

`YAMLMap` и `MetadataItemRule` уже импортированы в этом файле — дополнительные импорты не нужны.

Найти `GraphOps`:

```ts
export interface GraphOps {
  children?: GraphOpsChild[]
  references?: GraphOpsReference[]
  formLocalReferences?: GraphOpsFormLocalReference[]
  edgeKind?: string
  edgeYaml?: string
}
```

Заменить на:

```ts
export interface GraphOps {
  children?: GraphOpsChild[]
  references?: GraphOpsReference[]
  formLocalReferences?: GraphOpsFormLocalReference[]
  /** Рекурсивные задачи: оркестратор пройдёт по правилу для каждой подмодели после применения локальных ops. */
  recurse?: GraphOpsRecurse[]
  edgeKind?: string
  edgeYaml?: string
}
```

- [ ] **Step 2: Адаптировать `applyGraphOps`**

Целиком заменить содержимое `packages/core/metadata/relations/applyGraphOps.ts` на:

```ts
import { GraphOps } from "../orchestration/property/fn"
import { resolveFormLocalPath } from "./resolveFormLocalPath"
import { MetadataGraph } from "./MetadataGraph"

export interface ApplyGraphOpsContext {
  graph: MetadataGraph
  parentNodeId: string
  filePath: string
  edgeKind: string
  edgeYaml: string
}

export function applyGraphOps(ops: GraphOps, ctx: ApplyGraphOpsContext): void {
  const { graph, parentNodeId, filePath, edgeKind, edgeYaml } = ctx

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

  for (const ref of ops.references ?? []) {
    graph.ensureNode(ref.id, { name: ref.name })
    const edgeKey = `${parentNodeId}:${edgeKind}:${ref.id}`
    graph.ensureEdge(edgeKey, parentNodeId, ref.id, {
      yaml: edgeYaml,
      kind: edgeKind,
      positionFrom: ref.positionFrom,
    })
  }

  for (const local of ops.formLocalReferences ?? []) {
    const effectiveParent = local.parentOverride ?? parentNodeId
    const resolved = resolveFormLocalPath({
      formNodeId: local.formNodeId,
      path: local.formLocalPath,
      graph,
    })
    if (!resolved) continue
    const edgeKey = `${effectiveParent}:${edgeKind}:${resolved.targetId}`
    graph.ensureEdge(edgeKey, effectiveParent, resolved.targetId, {
      yaml: edgeYaml,
      kind: edgeKind,
      positionFrom: local.positionFrom,
    })
  }
}
```

- [ ] **Step 3: Адаптировать оркестратор `buildGraphFromModel.ts` под `recurse`**

В `packages/core/metadata/orchestration/buildGraphFromModel.ts` заменить весь блок ветки `if (buildGraphFn) { ... }` на:

```ts
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

Поведение: после применения каждой секции оркестратор разворачивает её `recurse`-задачи через рекурсивный вызов `buildGraphFromModel` с новой моделью, новым правилом и новым `parentNodeId`. `extra` пробрасывается без изменений, если в задаче не задан собственный.

- [ ] **Step 4: Перевести `formAttribute/graphFromModel.ts` на чистую форму**

Целиком заменить содержимое `packages/core/metadata/forms/commonObjects/formAttribute/graphFromModel.ts` на:

```ts
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { findSubmap } from "~/metadata/orchestration/property/position"
import {
  BuildGraphFromModelFunction,
  GraphOps,
  GraphOpsChild,
  GraphOpsRecurse,
} from "~/metadata/orchestration/property/fn"
import { FormAttributeColumnRules, FormAttributeRules } from "./rules"
import type { FormAttributeAdditionalColumns, FormAttributeColumn } from "./types"

const COLUMN_EDGE_KIND = "FORM_COLUMN"
const COLUMN_EDGE_YAML = "КолонкаФормы"
const ADDITION_EDGE_KIND = "TABLE_EXTENSION"
const ADDITION_EDGE_YAML = "ДополнениеТаблицы"
const TABLE_EDGE_KIND = "TABLE"
const TABLE_EDGE_YAML = "Таблица"
const ADDITIONAL_COLUMN_EDGE_KIND = "ADDITIONAL_COLUMN"
const ADDITIONAL_COLUMN_EDGE_YAML = "ДополнительнаяКолонка"

/**
 * graphChild для коллекции FormAttributes — оркестратор сам создаёт дочерние узлы.
 */
registerTypeRule("FormAttributes", "graphChild", {
  idFrom: "name",
  edgeKind: "FORM_ATTRIBUTE",
  edgeYaml: "РеквизитФормы",
  nodeSegment: "Реквизит",
  itemRule: FormAttributeRules,
})

/**
 * Обрабатывает коллекцию колонок реквизита формы.
 *
 * - inner: тип реквизита = ТаблицаЗначений / ДеревоЗначений / СписокВыбора.
 *   Колонка → дочерний узел `<реквизит>.<колонка>` + ребро «КолонкаФормы»
 *   + recurse по FormAttributeColumnRules для типов колонки.
 * - additional: дополнительные колонки к реквизитам прикладного объекта.
 *   Прокси-узел `<реквизит>.<lastSeg(table)>` + ребро «ДополнениеТаблицы»,
 *   ребро «Таблица» от прокси к ТЧ через formLocalReferences,
 *   per-column узлы под прокси + рёбра «ДополнительнаяКолонка»
 *   + recurse по FormAttributeColumnRules.
 */
const buildFormAttributeColumnsGraph: BuildGraphFromModelFunction = ({
  model,
  parentNodeId,
  yamlMap,
  propRule,
}): GraphOps[] | undefined => {
  if (!Array.isArray(model) || model.length === 0) return undefined

  const first = model[0] as Record<string, unknown>

  // ---- Additional columns (PRD #116) ----
  if (typeof first.table === "string") {
    // parentNodeId = <formNodeId>.Реквизит.<attrName>; формируем formNodeId обратным путём
    const formNodeId = parentNodeId.split(".").slice(0, -2).join(".")
    const sections: GraphOps[] = []

    for (const raw of model) {
      const group = raw as FormAttributeAdditionalColumns
      const tablePath = group.table
      const lastSegment = tablePath.split(".").pop()
      if (!lastSegment) continue

      const proxyNodeId = `${parentNodeId}.${lastSegment}`

      // (1) Прокси-узел: owning-ребро «ДополнениеТаблицы» от реквизита к прокси
      sections.push({
        children: [{
          idSuffix: lastSegment,
          name: lastSegment,
          item: { itemType: "AdditionalColumnsProxy", table: tablePath },
        }],
        edgeKind: ADDITION_EDGE_KIND,
        edgeYaml: ADDITION_EDGE_YAML,
      })

      // (2) Reference-ребро «Таблица» от прокси к ТЧ через resolveFormLocalPath
      sections.push({
        formLocalReferences: [{
          formLocalPath: tablePath,
          formNodeId,
          parentOverride: proxyNodeId,
        }],
        edgeKind: TABLE_EDGE_KIND,
        edgeYaml: TABLE_EDGE_YAML,
      })

      // (3) Дочерние колонки прокси + рекурсия по FormAttributeColumnRules
      const columnChildren: GraphOpsChild[] = []
      const columnRecurses: GraphOpsRecurse[] = []
      for (const column of group.columns) {
        const columnName = column.name
        if (!columnName) continue
        columnChildren.push({
          idSuffix: columnName,
          name: columnName,
          item: column as unknown as Record<string, unknown>,
          parentOverride: proxyNodeId,
        })
        columnRecurses.push({
          model: column as unknown as Record<string, unknown>,
          rule: FormAttributeColumnRules,
          parentNodeId: `${proxyNodeId}.${columnName}`,
        })
      }
      if (columnChildren.length > 0) {
        sections.push({
          children: columnChildren,
          recurse: columnRecurses,
          edgeKind: ADDITIONAL_COLUMN_EDGE_KIND,
          edgeYaml: ADDITIONAL_COLUMN_EDGE_YAML,
        })
      }
    }

    return sections.length > 0 ? sections : undefined
  }

  // ---- Inner columns ----
  const columnsKey = propRule.yaml // "Колонки"
  const columnsYamlMap = columnsKey && yamlMap ? findSubmap(yamlMap, columnsKey) : undefined

  const children: GraphOpsChild[] = []
  const recurses: GraphOpsRecurse[] = []
  for (const raw of model) {
    const column = raw as FormAttributeColumn
    const columnName = column.name
    if (!columnName) continue

    children.push({
      idSuffix: columnName,
      name: columnName,
      item: column as unknown as Record<string, unknown>,
    })
    recurses.push({
      model: column as unknown as Record<string, unknown>,
      yamlMap: columnsYamlMap ? findSubmap(columnsYamlMap, columnName) : undefined,
      rule: FormAttributeColumnRules,
      parentNodeId: `${parentNodeId}.${columnName}`,
    })
  }

  if (children.length === 0) return undefined

  return [{
    children,
    recurse: recurses,
    edgeKind: COLUMN_EDGE_KIND,
    edgeYaml: COLUMN_EDGE_YAML,
  }]
}

registerTypeRule("FormAttributeColumns", "buildGraphFromModel", buildFormAttributeColumnsGraph)
```

Изменения относительно прежнего файла:
- Удалены импорты `buildGraphFromModel` (внешнего рекурсивного вызова) и `resolveFormLocalPath` — оба теперь делегированы оркестратору и `applyGraphOps`.
- Из деструктуризации убран `graph`.
- Все мутации заменены на возврат секций `GraphOps[]` с декларациями `children`/`formLocalReferences`/`recurse`.
- В `additional`-ветке три отдельные секции: прокси, ребро TABLE, колонки. У каждой — собственный `parentOverride` где нужно.

- [ ] **Step 5: Прогнать тесты ядра**

```bash
pnpm --filter @nakidka/core test
```

Expected: PASS — `formAttribute/graphFromModel.test.ts` остаётся зелёным. Все три кейса (inner / additional / mixed) проходят через новый поток.

- [ ] **Step 6: Commit**

```bash
git add \
  packages/core/metadata/orchestration/property/fn.ts \
  packages/core/metadata/relations/applyGraphOps.ts \
  packages/core/metadata/orchestration/buildGraphFromModel.ts \
  packages/core/metadata/forms/commonObjects/formAttribute/graphFromModel.ts
git commit -m "$(cat <<'EOF'
refactor: :recycle: перевести FormAttributeColumns buildGraphFromModel на чистую форму

GraphOps расширен: GraphOpsChild.item для записи node.item при promoteNode,
GraphOpsChild.parentOverride / GraphOpsFormLocalReference.parentOverride для
рёбер от не-parentNodeId узла, GraphOps.recurse для рекурсивного обхода
подмодели по правилу. Оркестратор сам разворачивает recurse-задачи через
повторный вызов buildGraphFromModel.

FormAttributeColumns обработчик стал чистой функцией: возвращает GraphOps[]
с декларациями children/formLocalReferences/recurse — и для inner-, и для
additional-ветки. Поведение в MetadataGraph идентично прежнему.
EOF
)"
```

---

## Task 7: Самопроверка фазы 1b и подведение итога

**Files:** —

- [ ] **Step 1: Прогнать полный тестовый набор проекта**

```bash
cd /Users/nikita/git/nakidka-core/.worktrees/graph-pure-functions
pnpm test
```

Expected: PASS — все ~2531 тестов остаются зелёными во всех пакетах.

- [ ] **Step 2: Убедиться, что 6 файлов мигрированы**

```bash
grep -l "applyGraphOps\b" \
  packages/core/metadata/commonObjects/metadataValue/graphFromModel.ts \
  packages/core/metadata/commonObjects/metadataRef/graphFromModel.ts \
  packages/core/metadata/forms/commonObjects/commandName/graphFromModel.ts \
  packages/core/metadata/forms/commonObjects/associatedTable/graphFromModel.ts \
  packages/core/metadata/forms/commonObjects/dataPath/graphFromModel.ts \
  packages/core/metadata/forms/commonObjects/formAttribute/graphFromModel.ts \
  2>/dev/null
```

Expected: пустой вывод — `applyGraphOps` ни в одном из шести файлов не вызывается.

```bash
grep -E "(\bgraph\b\s*[,:]\s*MetadataGraph|graph\.(promoteNode|ensureNode|ensureEdge))" \
  packages/core/metadata/commonObjects/metadataValue/graphFromModel.ts \
  packages/core/metadata/commonObjects/metadataRef/graphFromModel.ts \
  packages/core/metadata/forms/commonObjects/commandName/graphFromModel.ts \
  packages/core/metadata/forms/commonObjects/associatedTable/graphFromModel.ts \
  packages/core/metadata/forms/commonObjects/dataPath/graphFromModel.ts \
  packages/core/metadata/forms/commonObjects/formAttribute/graphFromModel.ts \
  2>/dev/null
```

Expected: пустой вывод — никаких прямых обращений к `graph.*`.

- [ ] **Step 3: Подтвердить, что `forms/elements` остался единственным legacy-обработчиком**

```bash
grep -l "applyGraphOps\|graph\.\(promoteNode\|ensureNode\|ensureEdge\)" $(find packages/core/metadata -name "graphFromModel.ts")
```

Expected: только `packages/core/metadata/forms/elements/graphFromModel.ts`. Это подтверждает, что 1b закрыта, а `forms/elements` уезжает в 1c.

- [ ] **Step 4: Финальный commit (если остались no-op изменения, иначе пропустить)**

Если выше остались несостыковки в типах или импорты — поправить и закоммитить отдельным commit. Иначе шаг пропустить.

---

## Самопроверка

После выполнения 7 задач:

- 6 файлов `graphFromModel.ts` (все, кроме `forms/elements`) переведены на чистый возврат `GraphOps`/`GraphOps[]` без обращения к `graph` и `applyGraphOps`. В сумме с `metadataField` (фаза 1a) — 7 из 8 файлов с `BuildGraphFromModelFunction`-обработчиками чистые.
- `GraphOps` обогащён декларативными полями: `children.item`, `children.parentOverride`, `formLocalReferences` (с `parentOverride`), `recurse`. `applyGraphOps` и оркестратор обрабатывают новые поля.
- Возврат `BuildGraphFromModelFunction` расширен до `GraphOps | GraphOps[] | undefined | void` для поддержки многосекционного результата (`metadataValue.fixedArray` со смешанными kind'ами VALUE/OBJECT).
- Поведение в `MetadataGraph` идентично прежнему — все integration-тесты `*/graphFromModel.test.ts` остаются зелёными.
- Все ~2531 тестов проекта проходят.

## Что НЕ входит в этот план

- **Фаза 1c — `forms/elements/graphFromModel.ts`.** Самая сложная миграция: плоская раскладка узлов через `formNodeId.Элемент.<name>`, ребро от `formNodeId` (а не от непосредственного контейнера) для синглетов, дублированный обход свойств через `buildElementChildrenGraph`. Требует расширения `GraphOpsChild.absoluteId` (полный override childNodeId, а не только parentNodeId) и `edgeFrom` (источник ребра ≠ parentOverride). Дополнительно — выделить общий хелпер `applyBuildGraphResult(result, propType, ctx)` для нормализации `GraphOps | GraphOps[] → posекционное applyGraphOps`, переиспользуемый в `buildElementChildrenGraph` и основном `orchestration/buildGraphFromModel.ts` (сейчас дублируется; долг введён в Task 3 фазы 1b как минимально-необходимая мера, без которой чистый возврат в свойствах элементов формы молча игнорировался). После 1c: снимаем `graph: MetadataGraph` из сигнатуры `BuildGraphFromModelFunction`.
- **Фаза 1d — чистый агрегатор `buildGraph(yamlFiles, context) → FileGraphData[]` + `flattenOps`.** Подсистема (Г) спеки.
- **Фаза 1e — переезд CLI `nkdk update-graph` на `buildGraph + updateGraph(@nakidka/graph)` и удаление graphology, `MetadataGraph`, `applyGraphOps`, `GraphWalker`, `validateProject`, dead-кода в extension.** Подсистемы (В)+(Е) спеки.
