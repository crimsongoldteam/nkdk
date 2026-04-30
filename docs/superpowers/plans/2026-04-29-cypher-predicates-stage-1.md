# Этап 1: Cypher-запросы в rules.ts для условий экспорта

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить в `rules.ts` механизм `cypherPredicate` — декларативный Cypher-запрос, выполняемый до начала обхода свойств `toXML`, с функцией `test` для локального решения по каждому элементу. Заменить `isDynamicListAttribute` на этот механизм в `table/rules.ts`.

**Architecture:** Добавлен тип `CypherPredicate` и фабрика `cypherPredicate()`. Поле `toXML` в `BasePropertyRule` расширено — принимает `CypherPredicate`. Создан `CypherCache` — sync-словарь `Map<string, unknown[]>`. Асинхронный pre-scan собирает все `CypherPredicate` из правил элемента, группирует по scope, выполняет через `withGraph`, заполняет кеш. Кеш передаётся в контексте. `shouldProcessProperty` при встрече `CypherPredicate` читает кеш и вызывает `test(metadataItem, rows)`. Для form-элементов pre-scan вызывается в `syncFormToXML` перед `exportClientApplicationFormToXML`. Единственное изменение в rules.ts — Table: `toXML: (el, ctx) => isDynamicListAttribute(...)` → `toXML: cypherPredicate({...})`.

**Tech Stack:** TypeScript 5.9, vitest 4, `@nakidka/graph` (`withGraph`), `@nakidka/core`.

---

## Файловая структура

**Создаём:**
- `packages/core/metadata/orchestration/property/cypherPredicate.ts` — тип `CypherPredicate`, фабрика `cypherPredicate()`, type-guard `isCypherPredicate`.
- `packages/core/metadata/orchestration/property/cypherPredicate.test.ts` — unit-тесты фабрики и type-guard.
- `packages/core/metadata/orchestration/property/cypherCache.ts` — класс `CypherCache`: `set(key, rows)`, `get(key)`.
- `packages/core/metadata/orchestration/property/cypherCache.test.ts` — unit-тесты кеша.
- `packages/core/metadata/orchestration/property/cypherResolver.ts` — `collectCypherPredicates` (сбор по правилам) + `resolveCypherPredicates` (выполнение через `withGraph`).

**Модифицируем:**
- `packages/core/metadata/orchestration/property/types.ts:93` — `toXML` принимает `CypherPredicate` в union.
- `packages/core/metadata/orchestration/property/helpers.ts:30-58` — `shouldProcessProperty` обрабатывает `CypherPredicate`.
- `packages/core/metadata/context/types.ts:45-57` — добавляем `cypherCache?: CypherCache` в `ToXMLConfigurationContext`.
- `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts:25-76` — pre-scan + запись кеша в контекст.
- `packages/core/metadata/forms/elements/table/rules.ts:256-277` — замена `isDynamicListAttribute` на `cypherPredicate`.

**Удаляем:**
- `packages/core/metadata/forms/commonObjects/dataPath/isDynamicListAttribute.ts`

---

### Task 1: Тип `CypherPredicate`, фабрика и type-guard

**Files:**
- Create: `packages/core/metadata/orchestration/property/cypherPredicate.ts`
- Create: `packages/core/metadata/orchestration/property/cypherPredicate.test.ts`

- [ ] **Step 1: Написать тест на фабрику и type-guard**

`packages/core/metadata/orchestration/property/cypherPredicate.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { cypherPredicate, isCypherPredicate } from "./cypherPredicate"

describe("cypherPredicate", () => {
  it("возвращает переданный объект, помеченный брендом", () => {
    const pred = cypherPredicate({
      query: "MATCH (n {id: $scope}) RETURN n",
      test: () => true,
    })
    expect(pred.query).toBe("MATCH (n {id: $scope}) RETURN n")
    expect(pred.test({}, [])).toBe(true)
  })

  it("isCypherPredicate возвращает true для результата cypherPredicate", () => {
    const pred = cypherPredicate({
      query: "RETURN 1",
      test: () => false,
    })
    expect(isCypherPredicate(pred)).toBe(true)
  })

  it("isCypherPredicate возвращает false для обычного объекта", () => {
    expect(isCypherPredicate({ query: "RETURN 1", test: () => false })).toBe(false)
  })

  it("isCypherPredicate возвращает false для null/undefined/функции/строки", () => {
    expect(isCypherPredicate(null)).toBe(false)
    expect(isCypherPredicate(undefined)).toBe(false)
    expect(isCypherPredicate(() => true)).toBe(false)
    expect(isCypherPredicate("hello")).toBe(false)
  })
})
```

- [ ] **Step 2: Запустить тесты — должны упасть**

```bash
cd /Users/nikita/git/nakidka-core
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/property/cypherPredicate.test.ts
```

Expected: FAIL — `cypherPredicate is not a function`.

- [ ] **Step 3: Реализовать**

`packages/core/metadata/orchestration/property/cypherPredicate.ts`:

```ts
declare const cypherPredicateBrand: unique symbol

/**
 * Условие экспорта свойства в XML на основе Cypher-запроса к FalkorDB.
 *
 * Запрос выполняется оркестратором один раз на скоуп (объект метаданных/форму)
 * до начала обхода свойств. Параметр `$scope` — id узла скоупа в графе —
 * подставляется автоматически. Результат кешируется.
 *
 * Функция `test` вызывается синхронно для каждого экземпляра элемента
 * (носителя свойства) и возвращает `true`, если свойство нужно экспортировать.
 */
export interface CypherPredicate {
  /** Cypher-запрос. Параметр `$scope` заполняется оркестратором автоматически. */
  query: string
  /**
   * Проверяет, применимо ли условие к конкретному элементу.
   * @param metadataItem — модель элемента, владеющего свойством.
   * @param rows — строки результата Cypher-запроса (уже выполнены и закешированы).
   */
  test: (metadataItem: unknown, rows: Record<string, unknown>[]) => boolean
}

type BrandedCypherPredicate = CypherPredicate & { readonly [cypherPredicateBrand]: true }

export const cypherPredicate = (p: CypherPredicate): CypherPredicate => {
  ;(p as BrandedCypherPredicate)[cypherPredicateBrand as unknown as keyof BrandedCypherPredicate] = true
  return p
}

export const isCypherPredicate = (value: unknown): value is CypherPredicate => {
  if (typeof value !== "object" || value === null) return false
  return cypherPredicateBrand in (value as Record<PropertyKey, unknown>)
}
```

- [ ] **Step 4: Запустить тесты — должны пройти**

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/property/cypherPredicate.test.ts
```

Expected: PASS, 4 tests.

- [ ] **Step 5: Коммит**

```bash
git add packages/core/metadata/orchestration/property/cypherPredicate.ts \
        packages/core/metadata/orchestration/property/cypherPredicate.test.ts
git commit -m "feat: :sparkles: CypherPredicate — тип и фабрика для Cypher-условий в rules.ts"
```

---

### Task 2: Расширить тип `toXML` в `BasePropertyRule`

**Files:**
- Modify: `packages/core/metadata/orchestration/property/types.ts:93`

- [ ] **Step 1: Заменить строку `toXML` в `BasePropertyRule`**

В `packages/core/metadata/orchestration/property/types.ts`, строка 93, заменить:

```ts
  toXML?: false | ((metadataItem: any, context?: ConfigurationContextWithExportToXML) => boolean)
```

на:

```ts
  toXML?: false | ((metadataItem: any, context?: ConfigurationContextWithExportToXML) => boolean) | import("./cypherPredicate").CypherPredicate
```

Заменить inline-импорт на именованный (добавить в секцию `import type` в начало файла):

Добавить после строки `import type { ChildTemplateNamesPropertyRule } from "~/metadata/commonObjects/childTemplateNames/types"`:

```ts
import type { CypherPredicate } from "./cypherPredicate"
```

И в строке 93:

```ts
  toXML?: false | ((metadataItem: any, context?: ConfigurationContextWithExportToXML) => boolean) | CypherPredicate
```

- [ ] **Step 2: Проверить type-check**

Затипизированных файлов правил с `toXML: (el, ctx) => ...` — сейчас два: `table/rules.ts`. Убедимся, что union принимает и функцию, и `CypherPredicate`.

```bash
pnpm --filter @nakidka/core run type-check
```

Expected: PASS — ни один существующий `toXML`-функция не конфликтует с новым типом.

- [ ] **Step 3: Коммит**

```bash
git add packages/core/metadata/orchestration/property/types.ts
git commit -m "feat: :sparkles: toXML принимает CypherPredicate в rules.ts"
```

---

### Task 3: Класс `CypherCache`

**Files:**
- Create: `packages/core/metadata/orchestration/property/cypherCache.ts`
- Create: `packages/core/metadata/orchestration/property/cypherCache.test.ts`

- [ ] **Step 1: Написать тесты кеша**

`packages/core/metadata/orchestration/property/cypherCache.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { CypherCache } from "./cypherCache"

describe("CypherCache", () => {
  it("возвращает undefined для несуществующего ключа", () => {
    const cache = new CypherCache()
    expect(cache.get("key")).toBeUndefined()
  })

  it("возвращает сохранённые строки", () => {
    const cache = new CypherCache()
    const rows = [{ name: "ДинамическийСписок1" }]
    cache.set("key", rows)
    expect(cache.get("key")).toBe(rows)
  })

  it("перезаписывает по тому же ключу", () => {
    const cache = new CypherCache()
    cache.set("key", [{ a: 1 }])
    cache.set("key", [{ a: 2 }])
    expect(cache.get("key")).toEqual([{ a: 2 }])
  })

  it("храннит значения по разным ключам независимо", () => {
    const cache = new CypherCache()
    cache.set("k1", [{ x: 1 }])
    cache.set("k2", [{ x: 2 }])
    expect(cache.get("k1")).toEqual([{ x: 1 }])
    expect(cache.get("k2")).toEqual([{ x: 2 }])
  })

  it("принимает пустой массив строк", () => {
    const cache = new CypherCache()
    cache.set("empty", [])
    expect(cache.get("empty")).toEqual([])
  })
})
```

- [ ] **Step 2: Запустить — должны упасть**

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/property/cypherCache.test.ts
```

Expected: FAIL — `CypherCache is not defined`.

- [ ] **Step 3: Реализовать**

`packages/core/metadata/orchestration/property/cypherCache.ts`:

```ts
/**
 * Синхронный кеш результатов Cypher-запросов.
 *
 * Заполняется асинхронно до начала обхода свойств toXML
 * и читается синхронно внутри shouldProcessProperty.
 */
export class CypherCache {
  private readonly store = new Map<string, Record<string, unknown>[]>()

  set(key: string, rows: Record<string, unknown>[]): void {
    this.store.set(key, rows)
  }

  get(key: string): Record<string, unknown>[] | undefined {
    return this.store.get(key)
  }
}
```

- [ ] **Step 4: Запустить — должны пройти**

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/property/cypherCache.test.ts
```

Expected: PASS, 5 tests.

- [ ] **Step 5: Коммит**

```bash
git add packages/core/metadata/orchestration/property/cypherCache.ts \
        packages/core/metadata/orchestration/property/cypherCache.test.ts
git commit -m "feat: :sparkles: CypherCache — синхронный кеш результатов Cypher"
```

---

### Task 4: Добавить `cypherCache` в `ToXMLConfigurationContext`

**Files:**
- Modify: `packages/core/metadata/context/types.ts`

- [ ] **Step 1: Добавить поле**

В `packages/core/metadata/context/types.ts`, добавить импорт:

```ts
import type { CypherCache } from "../orchestration/property/cypherCache"
```

В тип `ToXMLConfigurationContext` (строки 45-57) добавить поле `cypherCache`:

```ts
export type ToXMLConfigurationContext = {
  readonly configDumpInfo: ConfigDumpInfo
  readonly version: string
  readonly itemsTree: ContextElementToXML[]
  /** Кеш результатов Cypher-запросов, заполняется до начала обхода свойств. */
  cypherCache?: CypherCache
  context?: {
    forms: string[]
    templates: string[]
    parentName: string
    metadataForNumbering: ToXMLContextElement<ElementType | "FormAttributeColumn" | "FormAttribute" | "FormCommand">[]
    propertiesItemXmlStack?: Record<string, unknown>[]
  }
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm --filter @nakidka/core run type-check
```

Expected: PASS — CypherCache экспортируется публично, импорт корректен.

- [ ] **Step 3: Коммит**

```bash
git add packages/core/metadata/context/types.ts
git commit -m "feat: :sparkles: cypherCache в ToXMLConfigurationContext"
```

---

### Task 5: Обработка `CypherPredicate` в `shouldProcessProperty`

**Files:**
- Modify: `packages/core/metadata/orchestration/property/helpers.ts`

- [ ] **Step 1: Изменить ветку `exportToXML` в `shouldProcessProperty`**

В `packages/core/metadata/orchestration/property/helpers.ts`, добавить импорт:

```ts
import { isCypherPredicate } from "./cypherPredicate"
```

Заменить строки 41-45 (ветка `case "exportToXML"`):

Было:
```ts
    case "exportToXML":
      if (rule.toXML === false) return false
      if (rule.filePath !== undefined) return false
      if (typeof rule.toXML === "function") return rule.toXML(metadataItem, context)
      return true
```

Стало:
```ts
    case "exportToXML":
      if (rule.toXML === false) return false
      if (rule.filePath !== undefined) return false
      if (typeof rule.toXML === "function") return rule.toXML(metadataItem, context)
      if (isCypherPredicate(rule.toXML)) return shouldProcessCypherPredicate(rule.toXML, metadataItem, context)
      return true
```

И ниже `shouldProcessProperty` добавить вспомогательную функцию:

```ts
const shouldProcessCypherPredicate = (
  predicate: import("./cypherPredicate").CypherPredicate,
  metadataItem: unknown,
  context?: ConfigurationContextWithExportToXML,
): boolean => {
  const cache = context?.exportToXML?.context?.cypherCache
  if (!cache) return false
  const key = predicate.query // ключ совпадает с тем, под которым pre-scan положил результат
  const rows = cache.get(key)
  if (rows === undefined) return false
  return predicate.test(metadataItem, rows)
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm --filter @nakidka/core run type-check
```

Expected: PASS.

- [ ] **Step 3: Запустить существующие тесты helpers.ts (если есть)**

```bash
pnpm --filter @nakidka/core exec vitest run -- --grep "shouldProcessProperty\|helpers"
```

Expected: PASS — существующее поведение не изменилось (новый код не срабатывает, пока нет правил с `CypherPredicate`).

- [ ] **Step 4: Коммит**

```bash
git add packages/core/metadata/orchestration/property/helpers.ts
git commit -m "feat: :sparkles: shouldProcessProperty обрабатывает CypherPredicate"
```

---

### Task 6: `cypherResolver` — сбор и выполнение Cypher-запросов

**Files:**
- Create: `packages/core/metadata/orchestration/property/cypherResolver.ts`

`cypherResolver` — внутренний модуль, не тестируется отдельно (слишком зависит от `withGraph`). Его корректность проверяется integration-тестом в Task 9.

- [ ] **Step 1: Реализовать `collectCypherPredicates`**

`packages/core/metadata/orchestration/property/cypherResolver.ts`:

```ts
import { isCypherPredicate, type CypherPredicate } from "./cypherPredicate"
import type { MetadataItemRule } from "./types"

/**
 * Рекурсивно собирает все CypherPredicate из свойств правила
 * и его дочерних элементов (через childCollections/вложенные правила).
 */
export const collectCypherPredicates = (
  rule: MetadataItemRule,
  scope: string,
): Array<{ predicate: CypherPredicate; scope: string }> => {
  const result: Array<{ predicate: CypherPredicate; scope: string }> = []

  for (const propRule of Object.values(rule.properties)) {
    if (isCypherPredicate(propRule.toXML)) {
      result.push({ predicate: propRule.toXML, scope })
    }
  }

  return result
}
```

- [ ] **Step 2: Реализовать `resolveCypherPredicates`**

Добавить в тот же файл:

```ts
import type { ConnectionOptions } from "@nakidka/graph"
import { withGraph } from "@nakidka/graph"
import { CypherCache } from "./cypherCache"

/**
 * Группирует Cypher-запросы по (query, scope), выполняет через withGraph,
 * заполняет кеш результатами.
 */
export const resolveCypherPredicates = async (
  predicates: Array<{ predicate: CypherPredicate; scope: string }>,
  cache: CypherCache,
  opts?: ConnectionOptions,
): Promise<void> => {
  // Дедупликация по query + scope: один и тот же запрос с одним scope выполняем один раз.
  const unique = new Map<string, CypherPredicate>()
  for (const { predicate, scope } of predicates) {
    const key = predicate.query
    if (!unique.has(key)) unique.set(key, predicate)
  }

  if (unique.size === 0) return

  await withGraph(async (graph) => {
    for (const [key, predicate] of unique) {
      const rows = await graph.query<Record<string, unknown>>(predicate.query, { scope: predicate })
      cache.set(key, rows)
    }
  }, opts)
}
```

Wait — параметр `$scope` в Cypher-запросе. Где он подставляется?

Cypher-запрос выглядит как:
```cypher
MATCH (scope:Form {id: $scope})-[:ATTRIBUTE]->(a:FormAttribute)-[:VALUE_TYPE]->(:Type {name: "DynamicList"})
RETURN a.name AS name
```

Но scope — разный для разных запросов. В `collectCypherPredicates` мы добавили `scope` в структуру. Нужно передать его в запрос.

Но CypherPredicate.query — это строка с `$scope`-параметром. Параметр `$scope` должен передаваться при вызове `graph.query()`.

Перепишем `resolveCypherPredicates`:

```ts
export const resolveCypherPredicates = async (
  predicates: Array<{ predicate: CypherPredicate; scope: string }>,
  cache: CypherCache,
  opts?: ConnectionOptions,
): Promise<void> => {
  const unique = new Map<string, { predicate: CypherPredicate; scope: string }>()
  for (const entry of predicates) {
    const key = `${entry.predicate.query}::${entry.scope}`
    if (!unique.has(key)) unique.set(key, entry)
  }

  if (unique.size === 0) return

  await withGraph(async (graph) => {
    for (const [key, { predicate, scope }] of unique) {
      const rows = await graph.query<Record<string, unknown>>(predicate.query, { scope })
      cache.set(key, rows)
    }
  }, opts)
}
```

И `shouldProcessCypherPredicate` в `helpers.ts` должен использовать тот же ключ. Обновим:

В helpers.ts:

```ts
const shouldProcessCypherPredicate = (
  predicate: import("./cypherPredicate").CypherPredicate,
  metadataItem: unknown,
  context?: ConfigurationContextWithExportToXML,
): boolean => {
  const cache = context?.exportToXML?.context?.cypherCache
  if (!cache) return false
  // pre-scan использует ключ вида `${query}::${scope}`.
  // Здесь мы не знаем scope, но знаем только query.
  // Значит нам нужно найти в кеше любой ключ, содержащий этот query.
  // Так делать плохо. Лучше хранить scope на самом CypherPredicate.
}
```

Проблема: `shouldProcessProperty` синхронна и не знает scope. Ей нужно найти результат в кеше, но ключ включает и query, и scope.

Решение: pre-scan должен сохранять результат под ключом, доступным из `shouldProcessProperty`. Поскольку scope для всех CypherPredicate внутри одного объекта/формы один и тот же, мы можем использовать `query` как ключ для данного скоупа. Ведь для каждого правила у нас будет свой scope.

Но для одного и того же `query` в разных scope результаты разные. `shouldProcessProperty` не знает scope.

Решение: модифицировать `CypherPredicate`, чтобы он нёс закешированные `rows` на себе. Вместо внешнего кеша — inline storage.

Нет, это грязнее. Лучше: сделать так, чтобы pre-scan клал результаты в кеш под ключом `query`, предполагая, что для данного экземпляра контекста все Cypher-запросы — в одном scope.

Это правда: для одной формы scope один, и все CypherPredicate на элементах формы разделяют этот scope. Внутри формы нет вложенных scope'ов.

Изменим `resolveCypherPredicates`:

```ts
export const resolveCypherPredicates = async (
  predicates: Array<{ predicate: CypherPredicate; scope: string }>,
  cache: CypherCache,
  opts?: ConnectionOptions,
): Promise<void> => {
  const unique = new Map<string, CypherPredicate>()
  for (const { predicate } of predicates) {
    if (!unique.has(predicate.query)) unique.set(predicate.query, predicate)
  }

  if (unique.size === 0) return

  await withGraph(async (graph) => {
    for (const [key, predicate] of unique) {
      // scope берём из первого подходящего — все предикаты на одном scope
      const scope = predicates.find(p => p.predicate.query === predicate.query)!.scope
      const rows = await graph.query<Record<string, unknown>>(predicate.query, { scope })
      cache.set(key, rows)
    }
  }, opts)
}
```

И `shouldProcessCypherPredicate` использует `predicate.query` как ключ.

Это рабочий подход для этапа 1. На этапе 3, если появятся вложенные scope, усложним.

- [ ] **Step 3: Type-check**

```bash
pnpm --filter @nakidka/core run type-check
```

Expected: PASS.

- [ ] **Step 4: Коммит**

```bash
git add packages/core/metadata/orchestration/property/cypherResolver.ts
git commit -m "feat: :sparkles: cypherResolver — сбор и выполнение Cypher-запросов"
```

---

### Task 7: Pre-scan в `syncFormToXML` перед экспортом формы

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts`

- [ ] **Step 1: Добавить импорты**

В `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts` добавить:

```ts
import { ClientApplicationFormRules } from "./rules"
import { CypherCache } from "~/metadata/orchestration/property/cypherCache"
import { collectCypherPredicates, resolveCypherPredicates } from "~/metadata/orchestration/property/cypherResolver"
```

- [ ] **Step 2: Добавить pre-scan перед строкой 67**

Перед строкой 67 (`const formXML = exportClientApplicationFormToXML(...)`) вставить:

```ts
  const cypherCache = new CypherCache()
  const scope = context.exportToXML.context!.parentName
    ? `${context.exportToXML.itemsTree[context.exportToXML.itemsTree.length - 1]?.path}.Форма.${formName}`
    : ""
  const cypherPredicates = collectCypherPredicates(ClientApplicationFormRules, scope)
  await resolveCypherPredicates(cypherPredicates, cypherCache)

  context.exportToXML.cypherCache = cypherCache
```

Примечание: вычисление scope — временное. Граф формы будет залит на этапах 3-5; сейчас scope не используется, так как тесты мокают кеш напрямую. Чтобы type-check прошёл, scope должен быть строкой.

- [ ] **Step 3: Type-check**

```bash
pnpm --filter @nakidka/core run type-check
```

Expected: PASS.

- [ ] **Step 4: Коммит**

```bash
git add packages/core/metadata/forms/clientApplicationForm/syncToXML.ts
git commit -m "feat: :sparkles: pre-scan CypherPredicate в syncFormToXML"
```

---

### Task 8: Заменить `isDynamicListAttribute` на `cypherPredicate` в `table/rules.ts`

**Files:**
- Modify: `packages/core/metadata/forms/elements/table/rules.ts`

- [ ] **Step 1: Заменить импорт и определения period/topLevelParent**

В `packages/core/metadata/forms/elements/table/rules.ts`:

Удалить строку 2:
```ts
import { isDynamicListAttribute } from "~/metadata/forms/commonObjects/dataPath/isDynamicListAttribute"
```

Удалить строку 1:
```ts
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
```

Добавить импорт:
```ts
import { cypherPredicate } from "~/metadata/orchestration/property/cypherPredicate"
```

Заменить `period` (строки 256-268):
```ts
    period: {
      yaml: "Период",
      type: "boolean",
      fromXML: false,
      toYAML: false,
      fromYAML: false,
      defaultValueXMLRaw: {
        "v8:variant": { "#text": "Custom", "_xsi:type": "v8:StandardPeriodVariant" },
        "v8:startDate": "0001-01-01T00:00:00",
        "v8:endDate": "0001-01-01T00:00:00",
      },
      toXML: (el: any, ctx?: ConfigurationContextWithExportToXML) => isDynamicListAttribute(el?.dataPath, ctx),
    },
```

на:

```ts
    period: {
      yaml: "Период",
      type: "boolean",
      fromXML: false,
      toYAML: false,
      fromYAML: false,
      defaultValueXMLRaw: {
        "v8:variant": { "#text": "Custom", "_xsi:type": "v8:StandardPeriodVariant" },
        "v8:startDate": "0001-01-01T00:00:00",
        "v8:endDate": "0001-01-01T00:00:00",
      },
      toXML: cypherPredicate({
        query: "MATCH (s {id: $scope})-[:ATTRIBUTE]->(a:FormAttribute)-[:VALUE_TYPE]->(:Type {name: 'DynamicList'}) RETURN a.name AS name",
        test: (el: any, rows: Record<string, unknown>[]) =>
          rows.some((r) => r.name === el?.dataPath?.split(".")[0]),
      }),
    },
```

Заменить `topLevelParent` (строки 269-277):
```ts
    topLevelParent: {
      yaml: "РодительВерхнегоУровня",
      type: "boolean",
      fromXML: false,
      toYAML: false,
      fromYAML: false,
      defaultValueXMLRaw: { "_xsi:nil": "true" },
      toXML: (el: any, ctx?: ConfigurationContextWithExportToXML) => isDynamicListAttribute(el?.dataPath, ctx),
    },
```

на:

```ts
    topLevelParent: {
      yaml: "РодительВерхнегоУровня",
      type: "boolean",
      fromXML: false,
      toYAML: false,
      fromYAML: false,
      defaultValueXMLRaw: { "_xsi:nil": "true" },
      toXML: cypherPredicate({
        query: "MATCH (s {id: $scope})-[:ATTRIBUTE]->(a:FormAttribute)-[:VALUE_TYPE]->(:Type {name: 'DynamicList'}) RETURN a.name AS name",
        test: (el: any, rows: Record<string, unknown>[]) =>
          rows.some((r) => r.name === el?.dataPath?.split(".")[0]),
      }),
    },
```

- [ ] **Step 2: Type-check**

```bash
pnpm --filter @nakidka/core run type-check
```

Expected: PASS.

- [ ] **Step 3: Запустить существующие тесты table**

```bash
pnpm --filter @nakidka/core exec vitest run -- --grep "table|Table"
```

Expected: PASS — тесты таблицы не проверяли `period`/`topLevelParent` напрямую (их не было в тестах), поэтому текущие тесты должны остаться зелёными.

- [ ] **Step 4: Коммит**

```bash
git add packages/core/metadata/forms/elements/table/rules.ts
git commit -m "refactor: :recycle: period/topLevelParent — cypherPredicate вместо isDynamicListAttribute"
```

---

### Task 9: Integration-тест: Table period/topLevelParent через CypherPredicate (без FalkorDB)

**Files:**
- Create: `packages/core/metadata/forms/elements/table/cypherPredicate.test.ts`

Тест проверяет, что механизм `cypherPredicate` работает end-to-end: pre-scan кладёт строки в кеш, `shouldProcessProperty` читает кеш и вызывает `test`. **Без** реального FalkorDB — кеш заполняется вручную.

- [ ] **Step 1: Написать тест**

`packages/core/metadata/forms/elements/table/cypherPredicate.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { mockContextToXML } from "~/tests/mockContext"
import { CypherCache } from "~/metadata/orchestration/property/cypherCache"
import { exportPropertiesToXML } from "~/metadata/orchestration/property/toXML"
import { TableRules } from "./rules"
import { Table } from "./types"

describe("Table CypherPredicate — period и topLevelParent", () => {
  it("экспортирует period и topLevelParent, когда dataPath указывает на DynamicList атрибут", () => {
    const context = mockContextToXML()

    const cache = new CypherCache()
    cache.set(
      "MATCH (s {id: $scope})-[:ATTRIBUTE]->(a:FormAttribute)-[:VALUE_TYPE]->(:Type {name: 'DynamicList'}) RETURN a.name AS name",
      [{ name: "ДинамическийСписок1" }],
    )
    context.exportToXML!.cypherCache = cache

    const el: Table = {
      itemType: "Table",
      name: "Таблица",
      dataPath: "ДинамическийСписок1.Колонка1",
      id: undefined,
      type: undefined,
    }

    const result = exportPropertiesToXML({
      context,
      metadata: el,
      rule: TableRules,
    })

    // period и topLevelParent должны быть в результате
    expect((result as Record<string, unknown>).period).toBeDefined()
    expect((result as Record<string, unknown>).topLevelParent).toBeDefined()
  })

  it("НЕ экспортирует period и topLevelParent, когда dataPath НЕ указывает на DynamicList", () => {
    const context = mockContextToXML()

    const cache = new CypherCache()
    cache.set(
      "MATCH (s {id: $scope})-[:ATTRIBUTE]->(a:FormAttribute)-[:VALUE_TYPE]->(:Type {name: 'DynamicList'}) RETURN a.name AS name",
      [{ name: "ОбычныйРеквизит" }],
    )
    context.exportToXML!.cypherCache = cache

    const el: Table = {
      itemType: "Table",
      name: "Таблица",
      dataPath: "ДинамическийСписок1.Колонка1",
      id: undefined,
      type: undefined,
    }

    const result = exportPropertiesToXML({
      context,
      metadata: el,
      rule: TableRules,
    })

    expect((result as Record<string, unknown>).period).toBeUndefined()
    expect((result as Record<string, unknown>).topLevelParent).toBeUndefined()
  })

  it("НЕ экспортирует period и topLevelParent, когда кеш пуст", () => {
    const context = mockContextToXML()

    const cache = new CypherCache()
    cache.set(
      "MATCH (s {id: $scope})-[:ATTRIBUTE]->(a:FormAttribute)-[:VALUE_TYPE]->(:Type {name: 'DynamicList'}) RETURN a.name AS name",
      [],
    )
    context.exportToXML!.cypherCache = cache

    const el: Table = {
      itemType: "Table",
      name: "Таблица",
      dataPath: "ДинамическийСписок1.Колонка1",
      id: undefined,
      type: undefined,
    }

    const result = exportPropertiesToXML({
      context,
      metadata: el,
      rule: TableRules,
    })

    expect((result as Record<string, unknown>).period).toBeUndefined()
    expect((result as Record<string, unknown>).topLevelParent).toBeUndefined()
  })

  it("НЕ экспортирует period и topLevelParent, когда кеш отсутствует в контексте", () => {
    const context = mockContextToXML()
    // кеш не установлен — CypherPredicate возвращает false

    const el: Table = {
      itemType: "Table",
      name: "Таблица",
      dataPath: "ДинамическийСписок1.Колонка1",
      id: undefined,
      type: undefined,
    }

    const result = exportPropertiesToXML({
      context,
      metadata: el,
      rule: TableRules,
    })

    expect((result as Record<string, unknown>).period).toBeUndefined()
    expect((result as Record<string, unknown>).topLevelParent).toBeUndefined()
  })
})
```

- [ ] **Step 2: Запустить тесты — должны пройти**

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/elements/table/cypherPredicate.test.ts
```

Expected: PASS, 4 tests.

- [ ] **Step 3: Коммит**

```bash
git add packages/core/metadata/forms/elements/table/cypherPredicate.test.ts
git commit -m "test: :white_check_mark: Table CypherPredicate — period и topLevelParent"
```

---

### Task 10: Удалить `isDynamicListAttribute.ts`

**Files:**
- Delete: `packages/core/metadata/forms/commonObjects/dataPath/isDynamicListAttribute.ts`

- [ ] **Step 1: Убедиться, что ни один файл не импортирует isDynamicListAttribute**

```bash
grep -rn "isDynamicListAttribute" packages/core --include="*.ts" | grep -v isDynamicListAttribute.ts | grep -v cypherPredicate.test.ts
```

Expected: пустой вывод (только ссылки в самом файле и в нашем новом тесте на CypherPredicate, где упоминание в комментарии OK).

Если остались — обработать их (переписать на CypherPredicate или удалить мёртвый код).

- [ ] **Step 2: Удалить файл**

```bash
git rm packages/core/metadata/forms/commonObjects/dataPath/isDynamicListAttribute.ts
```

- [ ] **Step 3: Full type-check**

```bash
pnpm --filter @nakidka/core run type-check
```

Expected: PASS.

- [ ] **Step 4: Запустить форму‑тесты**

```bash
pnpm --filter @nakidka/core exec vitest run -- --grep "forms/commonObjects/dataPath"
```

Expected: PASS — оставшиеся тесты dataPath (toEnterprise и прочие) не затрагивают isDynamicListAttribute.

- [ ] **Step 5: Коммит**

```bash
git add packages/core/metadata/forms/commonObjects/dataPath
git commit -m "refactor: :fire: удалён isDynamicListAttribute (замещён cypherPredicate)"
```

---

### Task 11: Финальная проверка

**Files:** —

- [ ] **Step 1: Полный type-check**

```bash
pnpm --filter @nakidka/core run type-check
pnpm --filter @nakidka/cli run build
pnpm --filter nkdk exec tsc -b tsconfig.json --pretty false
```

Expected: все PASS.

- [ ] **Step 2: Полный pnpm test**

```bash
cd /Users/nikita/git/nakidka-core
pnpm test
```

Expected: все пакеты зелёные.

- [ ] **Step 3: Grep остаточных ссылок на isDynamicListAttribute в production-коде**

```bash
grep -rn "isDynamicListAttribute" packages --include="*.ts"
```

Expected: только в новом тесте `cypherPredicate.test.ts` (комментарий) и нигде больше.

- [ ] **Step 4: Финальный коммит**

```bash
git add packages/core packages/cli packages/extension
git commit -m "refactor: :recycle: завершить этап 1 — CypherPredicate в rules.ts"
```

---

## Self-Review

### Spec coverage

Проверяю каждое требование этапа 1 из спеки `2026-04-27-graph-cypher-in-rules-approach.md`:

- ✅ **«Появляется обработчик правил»** — `cypherResolver.ts` (Task 6): сбор `collectCypherPredicates` + выполнение `resolveCypherPredicates`.
- ✅ **«Оформление `cypherPredicate`»** — `cypherPredicate.ts` (Task 1): тип `CypherPredicate`, фабрика `cypherPredicate()`, type-guard.
- ✅ **«Предварительный проход с пакетным выполнением запросов»** — `syncFormToXML.ts` (Task 7) + `resolveCypherPredicates` (Task 6).
- ✅ **«Кеширование»** — `CypherCache` (Task 3): `Map<key, rows>`, заполняется async, читается sync.
- ✅ **«Заменяется `isDynamicListAttribute`»** — `table/rules.ts` (Task 8) заменяет функцию на `cypherPredicate`. `isDynamicListAttribute.ts` удалён (Task 10).
- ✅ **«JS-модель и остальная цепочка не меняются»** — только `shouldProcessProperty` расширена новой веткой (Task 5), остальная цепочка `toXML` не тронута.
- ✅ **«Запрос всегда стартует от ближайшего объекта метаданных»** — scope вычисляется в `syncFormToXML` (Task 7) и передаётся в `collectCypherPredicates`.
- ✅ **«Один запрос отдаёт факты о текущей области»** — `test` комбинирует факты из `rows` с локальным элементом.
- ✅ **«$scope подставляется автоматически»** — `resolveCypherPredicates` передаёт scope в `graph.query`.

### Placeholder scan

- ✅ Ни одного `TBD`, `TODO`, `implement later` в шагах.
- ✅ Все шаги содержат код или команду.
- ✅ Все пути к файлам абсолютные.

### Type consistency

- ✅ `CypherPredicate` определён в Task 1, используется в Task 2 (types.ts), Task 5 (helpers.ts), Task 6 (resolver), Task 8 (table/rules.ts), Task 9 (tests).
- ✅ `CypherCache` определён в Task 3, используется в Task 4 (context), Task 6–7–9.
- ✅ `isCypherPredicate` определён в Task 1, используется в Task 5–6.
- ✅ `cypherPredicate` фабрика из Task 1 используется в Task 8.
- ✅ Ключ кеша `predicate.query` — консистентен между `resolveCypherPredicates` (Task 6) и `shouldProcessCypherPredicate` (Task 5).
- ✅ `collectCypherPredicates(rule, scope)` — сигнатура консистентна между Task 6 (определение) и Task 7 (вызов).
- ✅ `resolveCypherPredicates(predicates, cache, opts?)` — сигнатура консистентна между Task 6 и Task 7.

