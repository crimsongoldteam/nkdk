import { describe, expect, it, vi } from "vitest"
import { acceptedPropertyFacts } from "./prepareFacts"
import type { DirectImportPropertyFact } from "./propertyFacts"
import { baseFormProjectionSourceFromFacts } from "./baseFormProjectionFacts"

describe("принятые факты свойств", () => {
  it("закрытие родительской коллекции не удаляет контейнер независимого свойства с nil", () => {
    const container: DirectImportPropertyFact = {
      itemType: "InputField", propertyKey: "$container:choiceParameters",
      yamlPath: ["Элементы", "Поле", "ПараметрыВыбора"], value: {},
    }
    const nil: DirectImportPropertyFact = {
      itemType: "InputField", propertyKey: "choiceParameters",
      yamlPath: ["Элементы", "Поле", "ПараметрыВыбора", "Отбор.Ссылка"],
      value: undefined, presentInXML: true,
    }
    const parent: DirectImportPropertyFact = {
      itemType: "Form", propertyKey: "$container:childItems", yamlPath: ["Элементы"], value: {},
    }
    const accepted = acceptedPropertyFacts({ metadata: { events: [{
      kind: "property", propertyType: "ChoiceParameters",
      yamlPath: ["Элементы", "Поле", "ПараметрыВыбора"], rulePath: [{ propertyKey: "choiceParameters" }],
    }] } }, [container, nil, parent])

    expect(accepted).toEqual([container, parent, nil])
    expect(baseFormProjectionSourceFromFacts(accepted).child("Элементы")!.child("Поле")!.read("ПараметрыВыбора"))
      .toEqual({ "Отбор.Ссылка": undefined })
  })

  it("не копирует префиксы глубокого пути в JSON и не перечитывает вид свойства", () => {
    let reads = 0
    const path = ["Корень", ...Array.from({ length: 200 }, (_, index) => `Уровень${index}`)]
    const fact: DirectImportPropertyFact = {
      itemType: "Item", yamlPath: path, value: "значение",
      get propertyKey() { reads++; return "value" },
    }
    const stringify = vi.spyOn(JSON, "stringify")
    try {
      const result = acceptedPropertyFacts({ metadata: { events: [{
        kind: "property", propertyType: "string", yamlPath: ["Корень"], rulePath: [{ propertyKey: "value" }],
      }] } }, [fact])
      expect(result).toEqual([fact])
      expect(reads).toBeLessThan(12)
      expect(stringify).not.toHaveBeenCalled()
    } finally {
      stringify.mockRestore()
    }
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

  it("сохраняет последние факты, различает числовые пути и перекрывает старые контейнеры", () => {
    const fact = (propertyKey: string, yamlPath: readonly (string | number)[], value: unknown): DirectImportPropertyFact => ({ itemType: "Item", propertyKey, yamlPath, value })
    const oldContainer = fact("$container:list", ["Список", 0], {})
    const rootContainer = fact("$container:list", ["Список"], [])
    const newContainer = fact("$container:list", ["Список", 1], {})
    const oldValue = fact("value", ["Список", 0, "Поле"], "старое")
    const lastValue = fact("value", ["Список", 0, "Поле"], "новое")
    const stringIndex = fact("value", ["Список", "0", "Поле"], "строковый")
    const kind = fact("$formElementKind", ["Элементы", "Поле"], "InputField")
    const result = acceptedPropertyFacts({ metadata: { events: [
      { kind: "property", propertyType: "string", yamlPath: ["Список", "0"], rulePath: [{ propertyKey: "value" }] },
      { kind: "property", propertyType: "string", yamlPath: ["Список", 0], rulePath: [{ propertyKey: "value" }] },
    ] } }, [oldContainer, oldValue, rootContainer, newContainer, stringIndex, lastValue, kind])
    expect(result).toEqual([rootContainer, newContainer, kind, stringIndex, lastValue])
  })
})
