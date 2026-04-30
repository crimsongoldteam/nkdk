import { describe, expect, it } from "vitest"
import { mockContextToXML } from "~/tests/mockContext"
import { CypherCache } from "~/metadata/orchestration/property/cypherCache"
import { exportPropertiesToXML } from "~/metadata/orchestration/property/toXML"
import { TableRules } from "./rules"
import type { Table } from "./types"

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

    expect((result as Record<string, unknown>).Period).toBeDefined()
    expect((result as Record<string, unknown>).TopLevelParent).toBeDefined()
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

    expect((result as Record<string, unknown>).Period).toBeUndefined()
    expect((result as Record<string, unknown>).TopLevelParent).toBeUndefined()
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

    expect((result as Record<string, unknown>).Period).toBeUndefined()
    expect((result as Record<string, unknown>).TopLevelParent).toBeUndefined()
  })

  it("НЕ экспортирует period и topLevelParent, когда кеш отсутствует в контексте", () => {
    const context = mockContextToXML()

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

    expect((result as Record<string, unknown>).Period).toBeUndefined()
    expect((result as Record<string, unknown>).TopLevelParent).toBeUndefined()
  })
})
