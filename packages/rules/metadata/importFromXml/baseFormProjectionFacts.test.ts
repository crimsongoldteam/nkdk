import { describe, expect, it, vi } from "vitest"
import "../../tests/metadataExecutionContext"
import { baseFormProjectionSourceFromFacts } from "./baseFormProjectionFacts"
import { equalClientApplicationBaseFormSourceProjections } from "../forms/clientApplicationForm/baseFormProjection"
import { yamlBaseFormProjectionSource } from "../forms/clientApplicationForm/baseFormProjectionSource"
import type { DirectImportPropertyFact } from "./propertyFacts"

const fact = (yamlPath: readonly (string | number)[], value: unknown): DirectImportPropertyFact => ({
  itemType: "Probe", propertyKey: "value", yamlPath, value,
})

describe("адресный источник проекции основы", () => {
  it("читает только выбранное значение, сохраняя массивы, пустые элементы и метки", () => {
    const proxy = vi.spyOn(globalThis, "Proxy")
    const stringify = vi.spyOn(JSON, "stringify")
    try {
      const source = baseFormProjectionSourceFromFacts([
        fact(["Форма", "НеНужно"], { get Большое(): unknown { throw new Error("Не копировать посторонний объект") } }),
        { ...fact(["Форма", "Список"], []), propertyKey: "$container:list" },
        { ...fact(["Форма", "Список", 0], undefined), presentInXML: true },
        fact(["Форма", "Список", 1], "старое"),
        { ...fact(["Форма", "Список", 1], "новое"), scalarTag: "xml/string" },
        fact(["Форма", "Отсутствует", "Поле"], undefined),
      ], ["Форма"])
      const keys = source.keys()
      const value = source.read("Список")
      const tagged = source.child("Список")?.hasRuntimeMetadata("1")
      const absent = source.has("Отсутствует")
      const proxyCalls = proxy.mock.calls.length
      const stringifyCalls = stringify.mock.calls.length
      // Сам expect использует Proxy; измеряется только настоящий читатель.
      proxy.mockRestore()
      stringify.mockRestore()
      expect(keys).toEqual(["НеНужно", "Список"])
      expect(value).toEqual([undefined, "новое"])
      expect(yamlBaseFormProjectionSource({ Список: value }).child("Список")?.keys()).toEqual(["0", "1"])
      expect(tagged).toBe(true)
      expect(absent).toBe(false)
      expect(proxyCalls).toBe(0)
      expect(stringifyCalls).toBe(0)
    } finally {
      proxy.mockRestore()
      stringify.mockRestore()
    }
  })

  it.each([20, 99])("сравнивает поля и иерархию из фактов: ширина %s", width => {
    const current = yamlBaseFormProjectionSource({ Элементы: {
      Группа: { Вид: "Группа", Элементы: { Поле: { Вид: "ПолеВвода", Ширина: 20 } } },
    } })
    const saved = baseFormProjectionSourceFromFacts([
      fact(["Элементы", "Группа", "Вид"], "Группа"),
      fact(["Элементы", "Группа", "Элементы", "Поле", "Вид"], "ПолеВвода"),
      fact(["Элементы", "Группа", "Элементы", "Поле", "Ширина"], width),
    ])
    expect(equalClientApplicationBaseFormSourceProjections({ leftBase: current, rightBase: saved, extension: current })).toBe(width === 20)
  })
})
