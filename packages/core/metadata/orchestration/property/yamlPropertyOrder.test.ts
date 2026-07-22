import { describe, expect, it } from "vitest"

import { sortYamlRuleProperties } from "./yamlPropertyOrder"

describe("sortYamlRuleProperties", () => {
  it("puts title and synonym before kind, type and alphabetic properties", () => {
    const sorted = sortYamlRuleProperties({
      Бета: 1,
      Тип: 2,
      Синоним: 3,
      Вид: 4,
      Заголовок: 5,
      Альфа: 6,
    })

    expect(Object.keys(sorted)).toEqual(["Заголовок", "Синоним", "Вид", "Тип", "Альфа", "Бета"])
  })

  it("does not recursively sort arrays or nested values", () => {
    const nested = { Бета: 1, Альфа: 2 }
    const array = [{ Бета: 1, Альфа: 2 }]
    const sorted = sortYamlRuleProperties({ Значение: nested, Элементы: array })

    expect(Object.keys(sorted.Значение as object)).toEqual(["Бета", "Альфа"])
    expect(Object.keys((sorted.Элементы as object[])[0]!)).toEqual(["Бета", "Альфа"])
  })
})
