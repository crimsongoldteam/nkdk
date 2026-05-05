# Этап 2: CypherSet — декларация типа и первое правило

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить тип `CypherSet` (по образцу `CypherPredicate`), поле `allowedValues` в `BasePropertyRule` и исправить `binaryDataStorageLocationUseField` с `type: "boolean"` на `type: "string"` + `allowedValues`.

**Architecture:** `CypherSet` живёт в том же файле `cypherPredicate.ts` с тем же паттерном брендирования (`unique symbol`). Потребителей нет — `allowedValues` игнорируется всеми текущими обработчиками (`toJSONSchema`, `validateFile`, extension). Только декларация типа и коррекция одного правила.

**Tech Stack:** TypeScript 5.9, vitest 4, `@nakidka/core`.

---

## Файловая структура

**Модифицируем:**
- `packages/core/metadata/orchestration/property/cypherPredicate.ts` — добавляем `CypherSet`, `cypherSet()`, `isCypherSet()`
- `packages/core/metadata/orchestration/property/cypherPredicate.test.ts` — добавляем тесты `cypherSet`
- `packages/core/metadata/orchestration/property/types.ts` — `allowedValues?: CypherSet` в `BasePropertyRule`
- `packages/core/metadata/commonObjects/metadataAttribute/rules.ts` — `binaryDataStorageLocationUseField`: `type: "string"` + `allowedValues`

---

### Task 1: Тип `CypherSet`, фабрика и type-guard

**Files:**
- Modify: `packages/core/metadata/orchestration/property/cypherPredicate.ts`
- Modify: `packages/core/metadata/orchestration/property/cypherPredicate.test.ts`

- [ ] **Step 1: Добавить тесты на `cypherSet` и `isCypherSet`**

В `packages/core/metadata/orchestration/property/cypherPredicate.test.ts`, заменить строку 2:

Было:
```ts
import { cypherPredicate, isCypherPredicate } from "./cypherPredicate"
```

Стало:
```ts
import { cypherPredicate, cypherSet, isCypherPredicate, isCypherSet } from "./cypherPredicate"
```

В конец файла (после строки 32) добавить:

```ts

describe("cypherSet", () => {
  it("возвращает переданный объект, помеченный брендом", () => {
    const s = cypherSet({
      query: "MATCH (n {id: $scope}) RETURN n.name AS name",
    })
    expect(s.query).toBe("MATCH (n {id: $scope}) RETURN n.name AS name")
  })

  it("isCypherSet возвращает true для результата cypherSet", () => {
    const s = cypherSet({ query: "RETURN 1" })
    expect(isCypherSet(s)).toBe(true)
  })

  it("isCypherSet возвращает false для обычного объекта", () => {
    expect(isCypherSet({ query: "RETURN 1" })).toBe(false)
  })

  it("isCypherSet возвращает false для null/undefined/функции/строки", () => {
    expect(isCypherSet(null)).toBe(false)
    expect(isCypherSet(undefined)).toBe(false)
    expect(isCypherSet(() => true)).toBe(false)
    expect(isCypherSet("hello")).toBe(false)
  })

  it("cypherSet не возвращает true для isCypherPredicate", () => {
    const s = cypherSet({ query: "RETURN 1" })
    expect(isCypherPredicate(s)).toBe(false)
  })

  it("cypherPredicate не возвращает true для isCypherSet", () => {
    const p = cypherPredicate({ query: "RETURN 1", test: () => true })
    expect(isCypherSet(p)).toBe(false)
  })
})
```

- [ ] **Step 2: Запустить тесты — должны упасть**

```bash
cd /Users/nikita/git/nakidka-core
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/property/cypherPredicate.test.ts
```

Expected: FAIL — `cypherSet is not a function`, `isCypherSet is not defined`.

- [ ] **Step 3: Реализовать `CypherSet`, `cypherSet()`, `isCypherSet()`**

В `packages/core/metadata/orchestration/property/cypherPredicate.ts`, в конец файла (после строки 32) добавить:

```ts

const cypherSetBrand: unique symbol = Symbol("cypherSet")

/**
 * Множество допустимых значений поля, определяемое Cypher-запросом к FalkorDB.
 *
 * Запрос выполняется оркестратором один раз на скоуп (объект метаданных/форму).
 * Параметр `$scope` — id узла скоупа в графе — подставляется автоматически.
 *
 * По соглашению, первая возвращаемая колонка — множество значений.
 * Используется для валидации YAML и автодополнения в IDE.
 */
export interface CypherSet {
  query: string
}

export const cypherSet = (s: CypherSet): CypherSet => {
  ;(s as unknown as Record<PropertyKey, unknown>)[cypherSetBrand] = true
  return s
}

export const isCypherSet = (value: unknown): value is CypherSet => {
  if (typeof value !== "object" || value === null) return false
  return cypherSetBrand in (value as Record<PropertyKey, unknown>)
}
```

- [ ] **Step 4: Запустить тесты — должны пройти**

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/property/cypherPredicate.test.ts
```

Expected: PASS — 10 тестов (4 существующих `cypherPredicate` + 6 новых `cypherSet`).

- [ ] **Step 5: Коммит**

```bash
git add packages/core/metadata/orchestration/property/cypherPredicate.ts \
        packages/core/metadata/orchestration/property/cypherPredicate.test.ts
git commit -m "feat: :sparkles: CypherSet — тип, фабрика и type-guard для ограничений на значения"
```

---

### Task 2: Поле `allowedValues` в `BasePropertyRule`

**Files:**
- Modify: `packages/core/metadata/orchestration/property/types.ts`

- [ ] **Step 1: Добавить импорт `CypherSet` и поле `allowedValues`**

В `packages/core/metadata/orchestration/property/types.ts`, строка 8, заменить:

Было:
```ts
import type { CypherPredicate } from "./cypherPredicate"
```

Стало:
```ts
import type { CypherPredicate, CypherSet } from "./cypherPredicate"
```

После строки 118 (`referenceScope?: ReferenceScope`) добавить:

```ts

  /** Множество допустимых значений из Cypher-запроса к FalkorDB. Используется для валидации и автодополнения. */
  allowedValues?: CypherSet
```

- [ ] **Step 2: Type-check**

```bash
pnpm --filter @nakidka/core run type-check
```

Expected: PASS — `CypherSet` экспортирован из `cypherPredicate.ts`, union `PropertyRule` не конфликтует с опциональным полем.

- [ ] **Step 3: Коммит**

```bash
git add packages/core/metadata/orchestration/property/types.ts
git commit -m "feat: :sparkles: allowedValues?: CypherSet в BasePropertyRule"
```

---

### Task 3: Исправить `binaryDataStorageLocationUseField` в `metadataAttribute/rules.ts`

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataAttribute/rules.ts`

- [ ] **Step 1: Заменить `type: "boolean"` на `type: "string"` и добавить `allowedValues`**

В `packages/core/metadata/commonObjects/metadataAttribute/rules.ts`, заменить строки 1–5:

Было:
```ts
import { addDefaultLanguageNameToSynonym } from "~/metadata/helpers/synonymHelpers"
import { ConfigurationContext } from "~/metadata/context/types"
import { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import { uuidPropertyRule } from "~/metadata/commonObjects/uuid/rule"
```

Стало:
```ts
import { addDefaultLanguageNameToSynonym } from "~/metadata/helpers/synonymHelpers"
import { ConfigurationContext } from "~/metadata/context/types"
import { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import { cypherSet } from "~/metadata/orchestration/property/cypherPredicate"
import { uuidPropertyRule } from "~/metadata/commonObjects/uuid/rule"
```

Заменить строки 267–275:

Было:
```ts
const binaryDataStorageLocationUseFieldProperty = {
  binaryDataStorageLocationUseField: {
    yaml: "ПолеИспользованияХраненияВХранилищеДвоичныхДанных",
    xml: "BinaryDataStorageLocationUseField",
    type: "boolean",
    xmlParents: ["Properties"],
    order: 31,
  },
} as const satisfies Record<string, PropertyRule>
```

Стало:
```ts
const binaryDataStorageLocationUseFieldProperty = {
  binaryDataStorageLocationUseField: {
    yaml: "ПолеИспользованияХраненияВХранилищеДвоичныхДанных",
    xml: "BinaryDataStorageLocationUseField",
    type: "string",
    xmlParents: ["Properties"],
    order: 31,
    allowedValues: cypherSet({
      query: "MATCH (scope {id: $scope})-[:ATTRIBUTE]->(a:Attribute)-[:VALUE_TYPE]->(:Type {name: 'Boolean'}) RETURN a.name AS name",
    }),
  },
} as const satisfies Record<string, PropertyRule>
```

- [ ] **Step 2: Проверить, что нигде не используется логика, завязанная на `type: "boolean"`**

```bash
grep -rn "binaryDataStorageLocationUseField" packages/core --include="*.ts"
```

Expected: только `rules.ts` и, возможно, тестовые фикстуры. Тестов на это поле нет — менять нечего.

- [ ] **Step 3: Type-check**

```bash
pnpm --filter @nakidka/core run type-check
```

Expected: PASS — `cypherSet` возвращает `CypherSet`, который совместим с `allowedValues?` в `BasePropertyRule`.

- [ ] **Step 4: Коммит**

```bash
git add packages/core/metadata/commonObjects/metadataAttribute/rules.ts
git commit -m "refactor: :recycle: binaryDataStorageLocationUseField — string + allowedValues (CypherSet)"
```

---

### Task 4: Финальная проверка

**Files:** —

- [ ] **Step 1: Type-check core**

```bash
pnpm --filter @nakidka/core run type-check
```

Expected: PASS.

- [ ] **Step 2: Полный прогон тестов**

```bash
cd /Users/nikita/git/nakidka-core
pnpm test
```

Expected: все пакеты зелёные.

- [ ] **Step 3: Проверить, что `allowedValues` не сломал генерацию JSON Schema**

```bash
pnpm --filter @nakidka/core exec vitest run -- --grep "toJSONSchema|exportToJSON"
```

Expected: PASS — `allowedValues` игнорируется в `exportPropertyToJSONSchema`, существующее поведение не меняется.

- [ ] **Step 4: Финальный коммит**

```bash
git add packages/core
git commit -m "refactor: :recycle: завершить этап 2 — CypherSet в rules.ts"
```

---

## Self-Review

### Spec coverage

- ✅ **«Тип `CypherSet`, фабрика `cypherSet()`, type-guard `isCypherSet()`»** — Task 1
- ✅ **«Паттерн брендирования по образцу `CypherPredicate`»** — Task 1 (тот же файл, `unique symbol`)
- ✅ **«Поле `allowedValues` в `BasePropertyRule`»** — Task 2
- ✅ **«Исправить `binaryDataStorageLocationUseField`: `type: "boolean"` → `type: "string"` + `allowedValues`»** — Task 3
- ✅ **«Потребители не реализуются»** — Tasks 2–3 не трогают `toJSONSchema`, `validateFile`, extension
- ✅ **«`referenceScope` не трогается»** — нет изменений

### Placeholder scan

- ✅ Нет TBD, TODO, incomplete sections
- ✅ Все шаги содержат код или команду
- ✅ Все пути абсолютные

### Type consistency

- ✅ `CypherSet` определён в Task 1, импортирован из `cypherPredicate.ts` в Task 2 (`types.ts`) и Task 3 (`rules.ts`)
- ✅ Сигнатура `cypherSet({ query })` консистентна: Task 1 → Task 3
- ✅ `isCypherSet(value): value is CypherSet` консистентна: Task 1 → тесты
