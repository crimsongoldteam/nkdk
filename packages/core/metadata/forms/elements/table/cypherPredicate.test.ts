import { describe, expect, it } from "vitest"
import { mockContextToXML } from "~/tests/mockContext"
import { CypherCache } from "~/metadata/orchestration/property/cypherCache"
import { exportPropertiesToXML } from "~/metadata/orchestration/property/toXML"
import { TableRules } from "./rules"
import type { Table } from "./types"

const dynamicListQuery =
  'MATCH (s {id: $scope})-[:FORM_ATTRIBUTE]->(a:FormAttribute) WHERE "DynamicList" IN a.p_type_type RETURN a.name AS name'

function exportTableWithRows(table: Table, rows: Record<string, unknown>[] | undefined): Record<string, unknown> {
  const context = mockContextToXML()

  if (rows !== undefined) {
    const cache = new CypherCache()
    cache.set(dynamicListQuery, rows)
    context.exportToXML!.cypherCache = cache
  }

  return exportPropertiesToXML({
    context,
    metadata: table,
    rule: TableRules,
  }) as Record<string, unknown>
}

describe("Table CypherPredicate — period и topLevelParent", () => {
  it("экспортирует period и topLevelParent, когда dataPath равен имени DynamicList-реквизита", () => {
    const result = exportTableWithRows(
      {
        itemType: "Table",
        name: "Таблица",
        dataPath: "Список",
        id: undefined,
      },
      [{ name: "Список" }],
    )

    expect(result.Period).toBeDefined()
    expect(result.TopLevelParent).toBeDefined()
  })

  it("экспортирует period и topLevelParent, когда dataPath начинается с имени DynamicList-реквизита", () => {
    const result = exportTableWithRows(
      {
        itemType: "Table",
        name: "Таблица",
        dataPath: "Список.Колонка",
        id: undefined,
      },
      [{ name: "Список" }],
    )

    expect(result.Period).toBeDefined()
    expect(result.TopLevelParent).toBeDefined()
  })

  it("НЕ экспортирует period и topLevelParent, когда dataPath НЕ указывает на DynamicList-реквизит", () => {
    const result = exportTableWithRows(
      {
        itemType: "Table",
        name: "Таблица",
        dataPath: "Список.Колонка",
        id: undefined,
      },
      [{ name: "ДругойРеквизит" }],
    )

    expect(result.Period).toBeUndefined()
    expect(result.TopLevelParent).toBeUndefined()
  })

  it("НЕ экспортирует period и topLevelParent, когда кеш пуст", () => {
    const result = exportTableWithRows(
      {
        itemType: "Table",
        name: "Таблица",
        dataPath: "Список.Колонка",
        id: undefined,
      },
      [],
    )

    expect(result.Period).toBeUndefined()
    expect(result.TopLevelParent).toBeUndefined()
  })

  it("НЕ экспортирует period и topLevelParent, когда кеш отсутствует в контексте", () => {
    const result = exportTableWithRows(
      {
        itemType: "Table",
        name: "Таблица",
        dataPath: "Список.Колонка",
        id: undefined,
      },
      undefined,
    )

    expect(result.Period).toBeUndefined()
    expect(result.TopLevelParent).toBeUndefined()
  })
})
