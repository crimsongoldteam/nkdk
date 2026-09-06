import { describe, expect, it } from "vitest"
import { selectImportPropertyValues, selectImportPropertyPaths, selectImportCompactPropertyPaths } from "./selectedPropertyFacts"

describe("отбор свойств из фактов", () => {
  it("определяет присутствие и компактное значение без сборки вложенного объекта", () => {
    const values = selectImportCompactPropertyPaths([
      { itemType: "Item", propertyKey: "object", yamlPath: ["Объект"], value: {
        get Вложенный(): unknown { throw new Error("Не нужно копировать содержимое") },
      } },
      { itemType: "Item", propertyKey: "empty", yamlPath: ["Пустой"], value: {} },
      { itemType: "Item", propertyKey: "text", yamlPath: ["Текст"], value: "строка", scalarTag: "xml/string" as const },
      { itemType: "Item", propertyKey: "nested", yamlPath: ["ИзЛистьев", "Поле"], value: "строка" },
    ], new Map(["Объект", "Пустой", "Текст", "ИзЛистьев", "Нет"].map(key => [key, [key]])))
    expect(values.get("Объект")).toEqual({ value: undefined, kind: "object" })
    expect(values.get("Пустой")).toEqual({ value: {}, kind: "object" })
    expect(values.get("Текст")).toEqual({ value: "строка", scalarTag: "xml/string", kind: "scalar" })
    expect(values.get("ИзЛистьев")).toEqual({ value: undefined, kind: "object" })
    expect(values.has("Нет")).toBe(false)
  })

  it("сохраняет отдельный пустой контейнер поверх родительского значения", () => {
    const values = selectImportPropertyValues([
      { itemType: "Item", propertyKey: "$container:items", yamlPath: ["Объект", "Список"], value: [] },
      { itemType: "Item", propertyKey: "object", yamlPath: ["Объект"], value: { Список: [1] } },
    ], ["Объект"])
    expect(values.get("Объект")).toEqual({ Список: [] })
  })

  it("отдаёт приоритет отдельному полю перед значением внутри родительского факта", () => {
    const values = selectImportPropertyPaths([
      { itemType: "Item", propertyKey: "type", yamlPath: ["Объект", "Тип"], value: "Число" },
      { itemType: "Item", propertyKey: "object", yamlPath: ["Объект"], value: { Тип: "Строка" } },
    ], new Map([["type", ["Объект", "Тип"]], ["object", ["Объект"]]]))
    expect(values.get("type")).toEqual({ value: "Число" })
    expect(values.get("object")).toEqual({ value: { Тип: "Число" } })
  })

  it("читает только запрошенные вложенные пути, включая значения внутри атомарного факта", () => {
    const values = selectImportPropertyPaths([
      { itemType: "Item", propertyKey: "item", yamlPath: ["Объекты", "Первый"], value: {
        Тип: "Строка", get Прочее(): unknown { throw new Error("Лишнее вложенное чтение") },
      } },
      { itemType: "Item", propertyKey: "type", yamlPath: ["Объекты", "Второй", "Тип"], value: "Число" },
    ], new Map([
      ["first", ["Объекты", "Первый", "Тип"]],
      ["second", ["Объекты", "Второй", "Тип"]],
      ["missing", ["Объекты", "Третий", "Тип"]],
    ]))
    expect(values.get("first")).toEqual({ value: "Строка" })
    expect(values.get("second")).toEqual({ value: "Число" })
    expect(values.has("missing")).toBe(false)
  })

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
