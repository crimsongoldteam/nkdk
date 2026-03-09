import { describe, expect, it } from "vitest"
import { getOrderedKeysFromXML } from "./helpers"

const createRule = (properties: Record<string, { xml?: string; tag?: string }>): any => {
  return {
    // Остальное для этих тестов не важно, используются только свойства
    properties: Object.fromEntries(
      Object.entries(properties).map(([name, rule]) => [
        name,
        {
          type: "string",
          ...rule,
        },
      ])
    ),
  }
}

describe("getOrderedKeysFromXML", () => {
  it("возвращает ключи в порядке сортировки по XML-именам, когда xml не передан", () => {
    const rule = createRule({
      firstName: { xml: "Имя" },
      lastName: { xml: "Фамилия" },
      age: {}, // будет использовано Capitalize("age") => "Age"
    })

    const result = getOrderedKeysFromXML({
      rule,
      xml: undefined,
    })

    // Ожидаем порядок по отсортированным XML-ключам
    expect(result).toEqual(["age", "firstName", "lastName"])
  })

  it("располагает ключи по порядку следования в xml и добавляет отсутствующие в конце", () => {
    const rule = createRule({
      firstName: { xml: "Имя" },
      lastName: { xml: "Фамилия" },
      age: {}, // Age
    })

    const xml = {
      Фамилия: "Иванов",
      Age: 30,
    }

    const result = getOrderedKeysFromXML({
      rule,
      xml,
    })

    // Сначала по порядку ключей в xml, затем оставшиеся свойства
    expect(result).toEqual(["lastName", "age", "firstName"])
  })

  it("игнорирует ключи xml, которых нет в описании свойств", () => {
    const rule = createRule({
      firstName: { xml: "Имя" },
    })

    const xml = {
      Unknown: "value",
      Имя: "Иван",
    }

    const result = getOrderedKeysFromXML({
      rule,
      xml,
    })

    expect(result).toEqual(["firstName"])
  })

  it("учитывает фильтрацию по тегу", () => {
    const rule = createRule({
      visible: { xml: "Visible", tag: "export" },
      hidden: { xml: "Hidden", tag: "internal" },
    })

    const result = getOrderedKeysFromXML({
      rule,
      xml: undefined,
      tags: ["export"],
    })

    expect(result).toEqual(["visible"])
  })
})
