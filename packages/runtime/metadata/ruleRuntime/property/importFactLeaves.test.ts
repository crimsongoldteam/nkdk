import { describe, expect, it } from "vitest"
import { acceptNestedPropertyFactLeaves } from "./importFactLeaves"
import type { DirectImportPropertyFact } from "./importYamlTypes"
import type { MetadataItemRule } from "./types"
import { taggedYAMLScalar } from "../../../yaml/scalarTags"

const itemRule: MetadataItemRule = { itemType: "FactProbe", properties: {} }

describe("acceptNestedPropertyFactLeaves", () => {
  it.each([undefined, null, "текст"])("публикует помеченный скаляр %s одним фактом", value => {
    const facts: DirectImportPropertyFact[] = []
    acceptNestedPropertyFactLeaves({
      facts: { acceptProperty: fact => { facts.push(fact) } },
      itemType: itemRule.itemType, itemRule, propertyKey: "value", yamlPath: ["Значение"],
      value: taggedYAMLScalar("xml/standard-attributes", value), presentInXML: true, retainContainers: true,
    })
    expect(facts).toEqual([expect.objectContaining({
      propertyKey: "value", yamlPath: ["Значение"], value, scalarTag: "xml/standard-attributes",
    })])
  })
  it.each([false, true])("читает следующее значение после публикации предыдущего; контейнеры: %s", (retainContainers) => {
    const facts: DirectImportPropertyFact[] = []
    let readAhead = false
    const value = {
      Первый: ["один", "два"],
      get Второй() { readAhead = facts.length !== (retainContainers ? 4 : 2); return "три" },
      Пустой: [],
    }
    acceptNestedPropertyFactLeaves({
      facts: { acceptProperty: fact => { facts.push(fact) } },
      itemType: itemRule.itemType, itemRule, propertyKey: "value", yamlPath: ["Значение"],
      value, presentInXML: true, retainContainers,
    })
    expect(readAhead).toBe(false)
    expect(facts.map(({ yamlPath, value }) => ({ yamlPath, value }))).toEqual([
      ...(retainContainers ? [
        { yamlPath: ["Значение"], value: {} },
        { yamlPath: ["Значение", "Первый"], value: [] },
      ] : []),
      { yamlPath: ["Значение", "Первый", 0], value: "один" },
      { yamlPath: ["Значение", "Первый", 1], value: "два" },
      { yamlPath: ["Значение", "Второй"], value: "три" },
      { yamlPath: ["Значение", "Пустой"], value: [] },
    ])
    expect(facts.at(-1)?.propertyKey).toBe(retainContainers ? "$container:value" : "value")
  })

  it("публикует глубокий лист без рекурсии и промежуточных фактов контейнеров", () => {
    const facts: DirectImportPropertyFact[] = []
    let value: unknown = "лист"
    for (let index = 0; index < 12000; index++) value = { Узел: value }
    acceptNestedPropertyFactLeaves({
      facts: { acceptProperty: fact => { facts.push(fact) } },
      itemType: itemRule.itemType, itemRule, propertyKey: "value", yamlPath: [],
      value, presentInXML: true, retainContainers: false,
    })
    expect(facts).toHaveLength(1)
    expect(facts[0]?.yamlPath).toHaveLength(12000)
    expect(facts[0]?.yamlPath.every(segment => segment === "Узел")).toBe(true)
    expect(facts[0]?.value).toBe("лист")
  })
})
