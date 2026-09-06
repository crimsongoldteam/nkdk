import { describe, expect, it } from "vitest"
import { selectImportPropertyValues } from "./selectedPropertyFacts"

describe("отбор свойств из фактов", () => {
  it("не читает посторонние значения и разделяет уже выбранное значение между потребителями", () => {
    const values = selectImportPropertyValues([
      { itemType: "Item", propertyKey: "name", yamlPath: ["Имя"], value: "Объект" },
      { itemType: "Item", propertyKey: "other", yamlPath: ["Прочее"], get value(): unknown { throw new Error("Лишнее чтение") } },
    ], ["Имя", "Имя"])
    expect([...values]).toEqual([["Имя", "Объект"]])
  })

  it("сохраняет форму пустого списка и явно присутствующий пустой элемент", () => {
    const values = selectImportPropertyValues([
      { itemType: "Item", propertyKey: "entry", yamlPath: ["Список", 0], value: undefined, presentInXML: true },
      { itemType: "Item", propertyKey: "$container:list", yamlPath: ["Список"], value: [] },
      { itemType: "Item", propertyKey: "$container:empty", yamlPath: ["Пустой"], value: [] },
    ], ["Список", "Пустой"])
    expect(values.get("Список")).toEqual([undefined])
    expect(values.get("Пустой")).toEqual([])
  })
})
