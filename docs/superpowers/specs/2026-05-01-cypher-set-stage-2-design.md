# Этап 2: CypherSet — декларация типа и первое правило

Дата: 2026-05-01
Тип: дизайн-документ. Этап 2 подхода [Граф FalkorDB и Cypher в правилах метаданных](2026-04-27-graph-cypher-in-rules-approach.md).

## Контекст

В `rules.ts` есть свойства, чьё значение — имя другого реквизита того же объекта-владельца (пример: `binaryDataStorageLocationUseField` — имя реквизита, у которого тип `boolean`). Сегодня тип такого свойства объявлен некорректно (`type: "boolean"` вместо `type: "string"`), а допустимое множество значений никак не описано.

Подход с Cypher предполагает, что для таких полей в `rules.ts` указывается `allowedValues: cypherSet({ query: "..." })` — Cypher-запрос, возвращающий множество допустимых значений.

## Решение в одной фразе

Объявить тип `CypherSet`, поле `allowedValues` в `BasePropertyRule`, и исправить `binaryDataStorageLocationUseField` с `type: "boolean"` на `type: "string"` + `allowedValues`. Без потребителей — только декларация.

## Принципы

1. **`CypherSet` — по образцу `CypherPredicate`.** Тот же файл, тот же паттерн брендирования.
2. **Только `query`.** Никакого `valueColumn`, `test`, `extract` — по соглашению, первая возвращаемая колонка = множество значений. Детали извлечения уточнятся, когда появятся потребители.
3. **Потребители не реализуются.** `exportPropertyToJSONSchema`, `validateFile.ts`, расширение — без изменений. `allowedValues` игнорируется всеми текущими обработчиками.
4. **`type` меняется с `"boolean"` на `"string"`.** Это корректирует семантику: поле хранит строку-имя реквизита, а не булево значение. TypeBox будет принимать любую строку — ошибок не возникнет.
5. **`referenceScope` не трогается.** Остаётся парковкой до этапа 3+.

## Интерфейсы

### `CypherSet` — в `cypherPredicate.ts` (рядом с `CypherPredicate`)

```ts
const cypherSetBrand: unique symbol = Symbol("cypherSet")

/** Ограничение допустимых значений поля — множество из Cypher-запроса. */
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

### `BasePropertyRule` — новое поле

```ts
export interface BasePropertyRule {
  // ... существующие поля
  /** Множество допустимых значений из Cypher-запроса к FalkorDB. Используется для валидации и автодополнения. */
  allowedValues?: CypherSet
}
```

### `binaryDataStorageLocationUseField` — исправленное правило

```ts
binaryDataStorageLocationUseField: {
  yaml: "ПолеИспользованияХраненияВХранилищеДвоичныхДанных",
  xml: "BinaryDataStorageLocationUseField",
  type: "string",                    // было: "boolean"
  xmlParents: ["Properties"],
  order: 31,
  allowedValues: cypherSet({
    query: "MATCH (scope {id: $scope})-[:ATTRIBUTE]->(a:Attribute)-[:VALUE_TYPE]->(:Type {name: 'Boolean'}) RETURN a.name AS name",
  }),
},
```

## Что меняется

| Файл | Изменение |
|---|---|
| `orchestration/property/cypherPredicate.ts` | Добавляется `CypherSet`, `cypherSet()`, `isCypherSet()` |
| `orchestration/property/cypherPredicate.test.ts` | Тесты на фабрику и type-guard для `CypherSet` |
| `orchestration/property/types.ts` | `allowedValues?: CypherSet` в `BasePropertyRule` |
| `commonObjects/metadataAttribute/rules.ts` | `binaryDataStorageLocationUseField`: `type: "string"` + `allowedValues` |

## Что НЕ меняется

- `exportPropertyToJSONSchema` — `allowedValues` игнорируется
- `validateFile.ts` / `validateItem.ts` — без изменений
- Расширение — без изменений
- `referenceScope` — не трогается
- `cypherResolver.ts` / `cypherCache.ts` — без изменений (не собирают `CypherSet`)

## Тесты

```ts
describe("cypherSet", () => {
  it("возвращает переданный объект, помеченный брендом", () => {
    const s = cypherSet({
      query: "MATCH (n) RETURN n.name AS name",
    })
    expect(s.query).toBe("MATCH (n) RETURN n.name AS name")
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

## Связанные документы

- [`2026-04-27-graph-cypher-in-rules-approach.md`](2026-04-27-graph-cypher-in-rules-approach.md) — основная спека, этап 2 которой детализирует этот документ.
- [`2026-04-27-graph-package-interface-design.md`](2026-04-27-graph-package-interface-design.md) — нулевой этап, уже реализован.
- `cypherPredicate.ts` — эталонный паттерн брендирования.
