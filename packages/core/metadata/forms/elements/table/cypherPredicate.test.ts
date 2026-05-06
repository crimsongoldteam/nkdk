import { describe, expect, it } from "vitest"
import { mockContextToXML } from "~/tests/mockContext"
import { CypherCache } from "~/metadata/orchestration/property/cypherCache"
import { exportPropertiesToXML } from "~/metadata/orchestration/property/toXML"
import { TableRules, dynamicListFormAttributeQuery, valueTableFormAttributeQuery } from "./rules"
import type { Table } from "./types"

function exportTableWithRows(
  table: Table,
  rows:
    | {
        dynamicList?: Record<string, unknown>[]
        valueTable?: Record<string, unknown>[]
      }
    | undefined,
): Record<string, unknown> {
  const context = mockContextToXML()

  if (rows !== undefined) {
    const cache = new CypherCache()
    if (rows.dynamicList !== undefined) {
      cache.set(dynamicListFormAttributeQuery, rows.dynamicList)
    }
    if (rows.valueTable !== undefined) {
      cache.set(valueTableFormAttributeQuery, rows.valueTable)
    }
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
      { dynamicList: [{ name: "Список" }] },
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
      { dynamicList: [{ name: "Список" }] },
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
      { dynamicList: [{ name: "ДругойРеквизит" }] },
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
      { dynamicList: [] },
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

describe("Table CypherPredicate — rowFilter", () => {
  it("экспортирует rowFilter, когда dataPath равен имени ValueTable-реквизита", () => {
    const result = exportTableWithRows(
      {
        itemType: "Table",
        name: "Таблица",
        dataPath: "Таблица",
        id: undefined,
      },
      { valueTable: [{ name: "Таблица" }] },
    )

    expect(result.RowFilter).toEqual({ "_xsi:nil": "true" })
  })

  it("экспортирует rowFilter, когда dataPath начинается с имени ValueTable-реквизита", () => {
    const result = exportTableWithRows(
      {
        itemType: "Table",
        name: "Таблица",
        dataPath: "Таблица.Колонка",
        id: undefined,
      },
      { valueTable: [{ name: "Таблица" }] },
    )

    expect(result.RowFilter).toEqual({ "_xsi:nil": "true" })
  })

  it("НЕ экспортирует rowFilter для DynamicList-реквизита", () => {
    const result = exportTableWithRows(
      {
        itemType: "Table",
        name: "Таблица",
        dataPath: "ДинамическийСписок",
        id: undefined,
      },
      {
        dynamicList: [{ name: "ДинамическийСписок" }],
        valueTable: [],
      },
    )

    expect(result.RowFilter).toBeUndefined()
    expect(result.Period).toBeDefined()
    expect(result.TopLevelParent).toBeDefined()
  })

  it("НЕ экспортирует rowFilter, когда кеш пуст", () => {
    const result = exportTableWithRows(
      {
        itemType: "Table",
        name: "Таблица",
        dataPath: "Таблица",
        id: undefined,
      },
      { valueTable: [] },
    )

    expect(result.RowFilter).toBeUndefined()
  })

  it("НЕ экспортирует rowFilter, когда кеш отсутствует в контексте", () => {
    const result = exportTableWithRows(
      {
        itemType: "Table",
        name: "Таблица",
        dataPath: "Таблица",
        id: undefined,
      },
      undefined,
    )

    expect(result.RowFilter).toBeUndefined()
  })
})
