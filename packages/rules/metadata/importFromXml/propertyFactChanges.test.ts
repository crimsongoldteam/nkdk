import { describe, expect, it, vi } from "vitest"
import { applyPropertyFactChanges } from "./propertyFactChanges"
import type { DirectImportPropertyFact } from "./propertyFactsYamlView"

describe("адресные изменения фактов", () => {
  it("не ищет родителя заново для каждого отсутствующего свойства", () => {
    let pathReads = 0
    const count = 300
    const facts: DirectImportPropertyFact[] = Array.from({ length: count }, (_, index) => ({
      itemType: "Test", propertyKey: "kind", value: "ПолеВвода",
      get yamlPath() { pathReads += 1; return ["Элементы", String(index), "Вид"] },
    }))
    const changes = facts.map((_, index) => ({
      yamlPath: ["Элементы", String(index), "Путь"], kind: "set" as const, value: "",
    }))
    const result = applyPropertyFactChanges(facts, changes)
    expect(result).toHaveLength(count * 2)
    expect(pathReads).toBeLessThan(count * 4)
  })

  it("последнее удаление отменяет добавление отсутствующего свойства", () => {
    const facts = [{ itemType: "Test", propertyKey: "name", yamlPath: ["Имя"], value: "Объект" }]
    expect(applyPropertyFactChanges(facts, [
      { yamlPath: ["Новое"], kind: "set", value: 1 },
      { yamlPath: ["Новое"], kind: "delete" },
    ])).toEqual(facts)
  })

  it("различает числовой индекс и строковый ключ без сериализации путей", () => {
    const facts = [0, "0"].map(segment => ({
      itemType: "Test", propertyKey: "value", yamlPath: ["Коллекция", segment], value: "Исходное",
    }))
    const stringify = vi.spyOn(JSON, "stringify").mockImplementation(() => { throw new Error("Путь не должен сериализоваться") })
    let result: readonly DirectImportPropertyFact[]
    try {
      result = applyPropertyFactChanges(facts, [{ yamlPath: ["Коллекция", 0], kind: "set", value: "Новое" }])
    } finally {
      stringify.mockRestore()
    }
    expect(result.map(fact => fact.value)).toEqual(["Новое", "Исходное"])
  })
})
