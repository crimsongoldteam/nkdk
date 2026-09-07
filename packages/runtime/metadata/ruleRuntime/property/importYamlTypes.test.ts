import { describe, expect, it } from "vitest"
import { createDirectImportFactsCollector } from "./importYamlTypes"

describe("direct import fact paths", () => {
  it("отбрасывает ненужный факт до чтения значения и копирования пути", () => {
    const collector = createDirectImportFactsCollector(fact => fact.propertyKey === "type")
    collector.acceptProperty({
      itemType: "MetadataAttribute", propertyKey: "title",
      get yamlPath(): string[] { throw new Error("Путь не нужен") },
      get value(): unknown { throw new Error("Значение не нужно") },
    })
    collector.acceptProperty({ itemType: "MetadataAttribute", propertyKey: "type", yamlPath: ["Тип"], value: "Строка" })
    expect(collector.finish()).toEqual([
      { itemType: "MetadataAttribute", propertyKey: "type", yamlPath: ["Тип"], sourceYamlPath: ["Тип"], value: "Строка" },
    ])
  })
  it.each([false, true])("отделяет совпадающие пути одной копией; исходный задан: %s", (explicit) => {
    const yamlPath = ["Реквизиты", "Получатель", "Тип"]
    const sourceYamlPath = [...yamlPath]
    const collector = createDirectImportFactsCollector()
    collector.acceptProperty({
      itemType: "MetadataAttribute", propertyKey: "type", value: "Строка",
      yamlPath, ...(explicit ? { sourceYamlPath } : {}),
    })
    yamlPath[1] = "Изменённый"
    sourceYamlPath[1] = "Другой"

    const [fact] = collector.finish()
    expect(fact?.yamlPath).toEqual(["Реквизиты", "Получатель", "Тип"])
    expect(fact?.sourceYamlPath).toBe(fact?.yamlPath)
  })

  it("сохраняет независимый исходный адрес именованного элемента", () => {
    const yamlPath: (string | number)[] = ["Реквизиты", "Получатель", "Тип"]
    const sourceYamlPath: (string | number)[] = ["Реквизиты", 0, "Тип"]
    const collector = createDirectImportFactsCollector()
    collector.acceptProperty({
      itemType: "MetadataAttribute", propertyKey: "type", value: "Строка",
      yamlPath, sourceYamlPath,
    })
    yamlPath[1] = "Изменённый"
    sourceYamlPath[1] = 1

    const [fact] = collector.finish()
    expect(fact?.yamlPath).toEqual(["Реквизиты", "Получатель", "Тип"])
    expect(fact?.sourceYamlPath).toEqual(["Реквизиты", 0, "Тип"])
  })
})
