import { describe, expect, it } from "vitest"
import { acceptedPropertyFacts } from "./prepareFacts"
import type { DirectImportPropertyFact } from "./propertyFactsYamlView"

describe("принятые факты свойств", () => {
  it("не перечитывает вид свойства на каждом уровне глубокого пути", () => {
    let reads = 0
    const path = ["Корень", ...Array.from({ length: 200 }, (_, index) => `Уровень${index}`)]
    const fact: DirectImportPropertyFact = {
      itemType: "Item", yamlPath: path, value: "значение",
      get propertyKey() { reads++; return "value" },
    }
    const result = acceptedPropertyFacts({ metadata: { events: [{
      kind: "property", propertyType: "string", yamlPath: ["Корень"], rulePath: [{ propertyKey: "value" }],
    }] } }, [fact])
    expect(result).toEqual([fact])
    expect(reads).toBeLessThan(12)
  })

  it("возвращает только свойства заявленных границ в порядке событий", () => {
    const first: DirectImportPropertyFact = { itemType: "Item", propertyKey: "value", yamlPath: ["Первый", "Лист"], value: 1 }
    const second: DirectImportPropertyFact = { itemType: "Item", propertyKey: "value", yamlPath: ["Второй", "Лист"], value: 2 }
    const ignored: DirectImportPropertyFact = { itemType: "Item", propertyKey: "other", yamlPath: ["Прочее"],
      get value(): unknown { throw new Error("Нельзя читать незаявленное значение") } }
    expect(acceptedPropertyFacts({ metadata: { events: ["Второй", "Первый"].map(key => ({
      kind: "property" as const, propertyType: "string", yamlPath: [key], rulePath: [{ propertyKey: "value" }],
    })) } }, [first, ignored, second])).toEqual([second, first])
  })
})
