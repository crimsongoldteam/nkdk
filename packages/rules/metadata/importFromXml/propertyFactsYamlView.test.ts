import { describe, expect, it } from "vitest"
import {
  applyPropertyFactChanges,
  createPropertyFactsYamlView,
  propertyFactsWithReconstructionValues,
  type DirectImportPropertyFact,
} from "./propertyFactsYamlView"

describe("createPropertyFactsYamlView", () => {
  it("читает адресные объекты и массивы без полной материализации YAML", () => {
    const facts = [
      fact(["Имя"], "Форма"),
      fact(["Элементы", "Поле", "Вид"], "ПолеВвода"),
      fact(["Элементы", "Поле", "Колонки", 0, "Имя"], "Код"),
    ]
    const yaml = createPropertyFactsYamlView(facts)
    const columns = (yaml.Элементы as Record<string, Record<string, unknown>>).Поле!.Колонки as unknown[]
    expect(columns.length).toBe(1)
    expect(Object.keys(columns)).toEqual(["0"])
    expect(columns[0]).toEqual({ Имя: "Код" })

    expect(yaml).toEqual({
      Имя: "Форма",
      Элементы: { Поле: { Вид: "ПолеВвода", Колонки: [{ Имя: "Код" }] } },
    })
  })

  it("последний факт заменяет прежнее значение того же адреса", () => {
    const yaml = createPropertyFactsYamlView([fact(["Значение"], 1), fact(["Значение"], 2)])
    expect(yaml.Значение).toBe(2)
  })

  it("применяет адресные удаления и добавления без обхода полного YAML", () => {
    const facts = [
      fact(["Элементы", "Поле", "Вид"], "ПолеВвода"),
      fact(["Элементы", "Поле", "ПутьКДанным"], "Объект.Поле"),
      fact(["Элементы", "БезПути", "Вид"], "ПолеВвода"),
    ]
    const changed = applyPropertyFactChanges(facts, [
      { yamlPath: ["Элементы", "Поле", "ПутьКДанным"], kind: "delete" },
      { yamlPath: ["Элементы", "БезПути", "ПутьКДанным"], kind: "set", value: "" },
    ])

    expect(createPropertyFactsYamlView(changed)).toEqual({
      Элементы: {
        Поле: { Вид: "ПолеВвода" },
        БезПути: { Вид: "ПолеВвода", ПутьКДанным: "" },
      },
    })
  })

  it("строит исходное представление из значений локального proof", () => {
    const source = {
      ...fact(["Путь"], "Объект.Номер"),
      reconstructionValue: "Объект.Number",
    }
    expect(createPropertyFactsYamlView(propertyFactsWithReconstructionValues([source]))).toEqual({
      Путь: "Объект.Number",
    })
  })

  it("не материализует вторую YAML-копию большой коллекции фактов", () => {
    const count = 20_000
    const facts = Array.from({ length: count }, (_, index) =>
      fact(["Элементы", `Поле${index}`, "Значение"], index))
    const heapBefore = process.memoryUsage().heapUsed

    const yaml = createPropertyFactsYamlView(facts)
    const heapGrowth = process.memoryUsage().heapUsed - heapBefore
    const elements = yaml.Элементы as Record<string, { Значение: number }>

    expect(elements.Поле0?.Значение).toBe(0)
    expect(elements[`Поле${count - 1}`]?.Значение).toBe(count - 1)
    expect(heapGrowth).toBeLessThan(64 * 1024 * 1024)
  })
})

function fact(yamlPath: readonly (string | number)[], value: unknown): DirectImportPropertyFact {
  return { itemType: "Test", propertyKey: String(yamlPath.at(-1)), yamlPath, value }
}
