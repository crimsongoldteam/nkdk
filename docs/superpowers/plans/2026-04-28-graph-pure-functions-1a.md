# Чистые `graphFromModel.ts` — фаза 1a (тонкая вертикаль)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tracer-bullet: расширить контракт `BuildGraphFromModelFunction` так, чтобы он мог возвращать декларативный `GraphOps` вместо мутации `MetadataGraph`. Перевести `metadataField/graphFromModel.ts` на новый контракт. Поведение в graphology не меняется — оркестратор пропускает результат через `applyGraphOps` так же, как раньше делала сама функция.

**Architecture:** Чистая функция возвращает `GraphOps` с полями `references`/`children` плюс `edgeKind`/`edgeYaml` для маршрутизации в `applyGraphOps`. Оркестратор `buildGraphFromModel.ts` поддерживает обе формы — старые void-мутации (legacy) и новый возврат GraphOps — через union тип `GraphOps | undefined | void`. Это позволяет переводить файлы по одному без breaking-change. После 1a один файл переведён — остальные 10 переедут в 1b с тем же оркестратором.

**Tech Stack:** TypeScript 5.9, vitest 4. Никаких новых зависимостей.

---

## Структура файлов

**Modify:**
- `packages/core/metadata/orchestration/property/fn.ts` — расширить тип `GraphOps` полями `edgeKind?: string`, `edgeYaml?: string`; расширить тип `BuildGraphFromModelFunction` — возврат `GraphOps | undefined | void`.
- `packages/core/metadata/orchestration/buildGraphFromModel.ts` — в ветке `buildGraphFromModel`-обработчиков обработать возврат: если функция вернула GraphOps с references/children + edgeKind + edgeYaml, прогнать через `applyGraphOps`. Иначе (void-возврат) поведение не меняется (мутация уже произошла внутри).
- `packages/core/metadata/commonObjects/metadataField/graphFromModel.ts` — `buildMetadataFieldsGraph` возвращает `GraphOps | undefined`. Параметр `graph` в её теле не используется (но в сигнатуре остаётся — оркестратор передаёт во все обработчики).

**Create:**
- `packages/core/metadata/commonObjects/metadataField/graphFromModel.unit.test.ts` — unit-тест на чистую функцию без `MetadataGraph` и `importMetadataFileWithGraph`. Доказывает, что функция тестируется в изоляции.

**Не трогаем:**
- Существующий `metadataField/graphFromModel.test.ts` — integration-тест через `importMetadataFileWithGraph` остаётся как был. Поведение не меняется.
- `applyGraphOps` — продолжает писать в `MetadataGraph`. Удаление graphology — фаза 1d.
- Остальные 10 `graphFromModel.ts` файлов — переедут в 1b с тем же оркестратором.

---

## Task 1: Расширить тип `GraphOps` и `BuildGraphFromModelFunction`

**Files:**
- Modify: `packages/core/metadata/orchestration/property/fn.ts:74-100`

- [ ] **Step 1: Добавить поля `edgeKind`/`edgeYaml` в `GraphOps`**

Найти определение `GraphOps` в `packages/core/metadata/orchestration/property/fn.ts` (около строк 97–100):

```ts
export interface GraphOps {
  children?: GraphOpsChild[]
  references?: GraphOpsReference[]
}
```

Заменить на:

```ts
export interface GraphOps {
  children?: GraphOpsChild[]
  references?: GraphOpsReference[]
  /** ASCII-метка ребра. Передаётся в applyGraphOps оркестратором, когда BuildGraphFromModelFunction возвращает GraphOps вместо мутации graph. */
  edgeKind?: string
  /** Русский YAML-ключ ребра. Передаётся в applyGraphOps. */
  edgeYaml?: string
}
```

- [ ] **Step 2: Расширить возвращаемый тип `BuildGraphFromModelFunction`**

В том же файле найти определение `BuildGraphFromModelFunction` (около строк 74–83):

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
}) => void
```

Заменить возвращаемый тип `=> void` на `=> GraphOps | undefined | void`:

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
}) => GraphOps | undefined | void
```

`void` оставлен в union для обратной совместимости с теми обработчиками, которые ещё мутируют `graph` напрямую (10 файлов из 11). Они переедут в 1b.

- [ ] **Step 3: Прогнать type-check**

```bash
cd /Users/nikita/git/nakidka-core/.claude/worktrees/graph-pure-functions
pnpm --filter @nakidka/core run type-check
```

Expected: PASS — расширение возвращаемого типа обратно совместимо, существующие void-функции продолжают валидироваться.

- [ ] **Step 4: Прогнать тесты ядра**

```bash
pnpm --filter @nakidka/core test
```

Expected: PASS — никаких изменений в поведении, оркестратор пока не использует новые поля.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/orchestration/property/fn.ts
git commit -m "$(cat <<'EOF'
refactor: :recycle: разрешить BuildGraphFromModelFunction возврат GraphOps

Расширение контракта: возвращаемый тип становится GraphOps | undefined | void.
Старые void-обработчики продолжают валидироваться без изменений; новые могут
вернуть декларативный GraphOps с edgeKind/edgeYaml для маршрутизации
в applyGraphOps оркестратором. Подготовка к переходу graphFromModel.ts
на чистые функции — фаза 1.
EOF
)"
```

---

## Task 2: Адаптировать оркестратор для возврата GraphOps

**Files:**
- Modify: `packages/core/metadata/orchestration/buildGraphFromModel.ts:58-63`

- [ ] **Step 1: Прочитать существующий оркестратор**

В `packages/core/metadata/orchestration/buildGraphFromModel.ts` найти ветку `buildGraphFromModel`-обработчиков (около строк 58–63):

```ts
// --- buildGraphFromModel: типы с кастомной логикой построения графа ---
const buildGraphFn = getTypeRule(propType, "buildGraphFromModel")
if (buildGraphFn) {
  buildGraphFn({ model: model[key], parentNodeId, filePath, yamlMap, propRule, graph, extra })
  continue
}
```

- [ ] **Step 2: Адаптировать ветку — обработать возврат GraphOps**

Заменить блок выше на:

```ts
// --- buildGraphFromModel: типы с кастомной логикой построения графа ---
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
  if (result && (result.children?.length || result.references?.length)) {
    if (!result.edgeKind || !result.edgeYaml) {
      throw new Error(
        `buildGraphFromModel: обработчик типа "${propType}" вернул GraphOps без edgeKind/edgeYaml. ` +
          `Чистые функции должны указывать оба поля в результате.`,
      )
    }
    applyGraphOps(result, {
      graph,
      parentNodeId,
      filePath,
      edgeKind: result.edgeKind,
      edgeYaml: result.edgeYaml,
    })
  }
  continue
}
```

Поведение:
- Если функция вернула `void`/`undefined` (legacy) — мутация уже произошла, ничего больше не делаем.
- Если функция вернула `GraphOps` без `children`/`references` (пустой результат) — ничего не делаем, оркестратор молча пропускает.
- Если функция вернула непустой `GraphOps` без `edgeKind`/`edgeYaml` — это ошибка контракта чистой функции, бросаем явную ошибку с указанием типа.
- Если всё на месте — прогоняем через тот же `applyGraphOps`, что и раньше.

- [ ] **Step 3: Прогнать type-check**

```bash
pnpm --filter @nakidka/core run type-check
```

Expected: PASS.

- [ ] **Step 4: Прогнать тесты ядра**

```bash
pnpm --filter @nakidka/core test
```

Expected: PASS — поведение не меняется (все 10 текущих обработчиков `buildGraphFromModel` возвращают void). Новая ветка обработки result активируется только когда функция явно вернёт GraphOps.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/orchestration/buildGraphFromModel.ts
git commit -m "$(cat <<'EOF'
feat: :sparkles: оркестратор пропускает GraphOps от чистых функций через applyGraphOps

Если зарегистрированная BuildGraphFromModelFunction вернула непустой GraphOps,
оркестратор автоматически прогоняет его через applyGraphOps, используя
edgeKind/edgeYaml из самого результата. Старые void-обработчики продолжают
работать без изменений: они уже мутировали graph внутри, оркестратор
просто игнорирует пустой возврат.

Бросаем явную ошибку, если чистая функция вернула непустой GraphOps без
edgeKind/edgeYaml — это нарушение контракта.
EOF
)"
```

---

## Task 3: Перевести `metadataField/graphFromModel.ts` на чистую форму

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataField/graphFromModel.ts`

- [ ] **Step 1: Заменить тело `buildMetadataFieldsGraph` на чистую форму**

Целиком заменить содержимое `packages/core/metadata/commonObjects/metadataField/graphFromModel.ts` на:

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
import { MetadataField, MetadataFields } from "./types"

const EDGE_KIND = "FIELD"
const EDGE_YAML = "Поле"

const extractMetadataFieldGraph: ExtractGraphFromModelFunction = (
  model,
  position,
): GraphOps | undefined => {
  const field = model as MetadataField
  if (!field) return undefined
  const ref = extractReferenceFromPath(field, position)
  if (!ref) return undefined
  return { references: [ref] }
}

const buildMetadataFieldsGraph: BuildGraphFromModelFunction = ({
  model,
  yamlMap,
  propRule,
}): GraphOps | undefined => {
  const fields = model as MetadataFields | undefined
  if (!Array.isArray(fields) || fields.length === 0) return undefined

  let yamlSeq: YAMLSeq | undefined
  if (yamlMap && propRule.yaml) {
    const pair = yamlMap.items.find(
      (i) => isPair(i) && isScalar(i.key) && i.key.value === propRule.yaml,
    )
    if (pair && isPair(pair) && isSeq(pair.value)) {
      yamlSeq = pair.value as YAMLSeq
    }
  }

  const references = fields
    .map((field, index) => {
      const offset = yamlSeq ? findSeqItemOffset(yamlSeq, index) : undefined
      const position = offset !== undefined ? { offset } : undefined
      return extractReferenceFromPath(field, position)
    })
    .filter((ref): ref is NonNullable<typeof ref> => ref !== undefined)

  if (references.length === 0) return undefined

  return { references, edgeKind: EDGE_KIND, edgeYaml: EDGE_YAML }
}

registerTypeRule("MetadataField", "extractGraph", extractMetadataFieldGraph)
registerTypeRule("MetadataField", "graphEdgeFromParent", { kind: EDGE_KIND, yaml: EDGE_YAML })
registerTypeRule("MetadataFields", "buildGraphFromModel", buildMetadataFieldsGraph)
```

Изменения относительно прежнего файла:
- Импорт `applyGraphOps` удалён — функция больше не используется.
- В сигнатуре деструктуризации `buildMetadataFieldsGraph` убраны `parentNodeId`, `filePath`, `graph` — они теперь не нужны (оркестратор сам передаст их в `applyGraphOps`).
- Тело функции собирает массив `references` и возвращает `GraphOps` с `edgeKind`/`edgeYaml`. На пустом входе — `undefined`.

- [ ] **Step 2: Прогнать type-check**

```bash
pnpm --filter @nakidka/core run type-check
```

Expected: PASS.

- [ ] **Step 3: Прогнать integration-тест metadataField**

```bash
cd packages/core
pnpm vitest run metadata/commonObjects/metadataField/graphFromModel.test.ts
```

Expected: PASS — все 6 существующих тестов зелёные. Они проверяют рёбра `kind === "FIELD"` в `MetadataGraph` через `importMetadataFileWithGraph`, и эта цепочка работает через новый оркестратор → `applyGraphOps`. Поведение не меняется.

- [ ] **Step 4: Прогнать полный тестовый набор core**

```bash
cd /Users/nikita/git/nakidka-core/.claude/worktrees/graph-pure-functions
pnpm --filter @nakidka/core test
```

Expected: PASS — все ~2527 тестов остаются зелёными.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/commonObjects/metadataField/graphFromModel.ts
git commit -m "$(cat <<'EOF'
refactor: :recycle: перевести buildMetadataFieldsGraph на чистую форму

Функция возвращает GraphOps { references, edgeKind, edgeYaml } вместо
мутации graph через applyGraphOps. Оркестратор сам прогоняет результат
через тот же applyGraphOps — поведение в MetadataGraph не меняется,
все 6 integration-тестов graphFromModel.test.ts остаются зелёными.

Это первый из 11 graphFromModel.ts, переведённых на чистый контракт.
Tracer-bullet фазы 1: остальные 10 — в 1b.
EOF
)"
```

---

## Task 4: Unit-тест на чистую функцию

**Files:**
- Create: `packages/core/metadata/commonObjects/metadataField/graphFromModel.unit.test.ts`

- [ ] **Step 1: Написать unit-тест без MetadataGraph**

Создать `packages/core/metadata/commonObjects/metadataField/graphFromModel.unit.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import "~/metadata/commonObjects" // регистрация type rules
import { getTypeRule } from "~/metadata/orchestration/formElement/factory"
import type { BuildGraphFromModelFunction, GraphOps } from "~/metadata/orchestration/property/fn"

const buildMetadataFieldsGraph = getTypeRule(
  "MetadataFields",
  "buildGraphFromModel",
) as BuildGraphFromModelFunction

const noopParams = {
  parentNodeId: "Справочник.Товары",
  filePath: "test/Свойства.yaml",
  yamlMap: undefined,
  propRule: { type: "MetadataFields", yaml: "ВводПоСтроке" } as never,
  graph: undefined as never,
}

describe("buildMetadataFieldsGraph (чистая функция)", () => {
  it("возвращает undefined на пустом массиве полей", () => {
    const result = buildMetadataFieldsGraph({ ...noopParams, model: [] })
    expect(result).toBeUndefined()
  })

  it("возвращает undefined на undefined-модели", () => {
    const result = buildMetadataFieldsGraph({ ...noopParams, model: undefined })
    expect(result).toBeUndefined()
  })

  it("возвращает GraphOps с edgeKind/edgeYaml для непустого массива", () => {
    const result = buildMetadataFieldsGraph({
      ...noopParams,
      model: ["Справочник.X.Реквизит.Y"],
    }) as GraphOps
    expect(result).toBeDefined()
    expect(result.edgeKind).toBe("FIELD")
    expect(result.edgeYaml).toBe("Поле")
    expect(result.references).toHaveLength(1)
    expect(result.references?.[0]?.id).toBe("Справочник.X.Реквизит.Y")
  })

  it("формирует по ссылке на каждый элемент массива", () => {
    const result = buildMetadataFieldsGraph({
      ...noopParams,
      model: [
        "Справочник.A.Реквизит.П1",
        "Справочник.B.Реквизит.П2",
        "Справочник.C.Реквизит.П3",
      ],
    }) as GraphOps
    expect(result.references).toHaveLength(3)
    const ids = result.references?.map((r) => r.id).sort()
    expect(ids).toEqual([
      "Справочник.A.Реквизит.П1",
      "Справочник.B.Реквизит.П2",
      "Справочник.C.Реквизит.П3",
    ])
  })
})
```

Тест демонстрирует, что чистая функция тестируется в изоляции, без `MetadataGraph` и без `importMetadataFileWithGraph`. Параметры `parentNodeId`/`filePath`/`graph` функции теперь безразличны.

- [ ] **Step 2: Прогнать новый тест**

```bash
cd /Users/nikita/git/nakidka-core/.claude/worktrees/graph-pure-functions/packages/core
pnpm vitest run metadata/commonObjects/metadataField/graphFromModel.unit.test.ts
```

Expected: PASS — 4 теста зелёные.

- [ ] **Step 3: Прогнать полный тестовый набор core**

```bash
cd /Users/nikita/git/nakidka-core/.claude/worktrees/graph-pure-functions
pnpm --filter @nakidka/core test
```

Expected: PASS — старые тесты + 4 новых.

- [ ] **Step 4: Commit**

```bash
git add packages/core/metadata/commonObjects/metadataField/graphFromModel.unit.test.ts
git commit -m "$(cat <<'EOF'
test: :white_check_mark: unit-тесты на чистую buildMetadataFieldsGraph

Тестируем функцию без MetadataGraph и importMetadataFileWithGraph —
напрямую вызывая зарегистрированный обработчик и проверяя возвращённый
GraphOps. Это доказывает, что после перевода на чистую форму функция
действительно тестируется в изоляции; integration-тест в graphFromModel.test.ts
по-прежнему остаётся как контракт-проверка через MetadataGraph.
EOF
)"
```

---

## Самопроверка

После выполнения всех 4 задач:

- Тип `BuildGraphFromModelFunction` принимает `GraphOps | undefined | void` — обратная совместимость со всеми 10 ещё-не-переведёнными обработчиками.
- Оркестратор `buildGraphFromModel.ts` маршрутизирует возврат GraphOps через тот же `applyGraphOps`, что и раньше.
- `metadataField/graphFromModel.ts::buildMetadataFieldsGraph` — чистая функция, не использует параметр `graph` и `applyGraphOps`. Возвращает `GraphOps` с `edgeKind: "FIELD"`, `edgeYaml: "Поле"`.
- Существующий integration-тест `graphFromModel.test.ts` (6 кейсов) остаётся зелёным — поведение в `MetadataGraph` идентично прежнему.
- Новый unit-тест `graphFromModel.unit.test.ts` (4 кейса) проверяет чистый контракт без интеграции.
- Полный `pnpm --filter @nakidka/core test` зелёный (~2527 тестов + 4 новых).

## Что НЕ входит в этот план (следующие под-фазы)

- **1b**: перевод остальных 10 `graphFromModel.ts` (metadataValue, typeDescription, formAttribute, formCommand, dataPath, formParameter, associatedTable, commandName, formElements/elements, metadataRef) на чистый контракт.
- **1c**: чистый агрегатор `buildGraph(yamlFiles, context) → FileGraphData[]` с собственным `flattenOps` (превращающим декларативный GraphOps в плоские NodeData/EdgeData для `@nakidka/graph`). Используется в тестах, не подключается к CLI.
- **1d**: переезд CLI `nkdk update-graph` на `buildGraph + updateGraph(@nakidka/graph)`. Удаление `MetadataGraph`, `applyGraphOps`, `GraphWalker`, `validateProject`, dead-кода в extension. Большой ломающий PR.

После всех под-фаз graphology удалён, CLI работает через FalkorDB напрямую.
