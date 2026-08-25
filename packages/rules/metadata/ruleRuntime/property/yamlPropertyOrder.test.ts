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

  it.each([
    [{}, []],
    [{ Значение: 1 }, ["Значение"]],
    [
      { Яблоко: 1, Арбуз: 2, Синоним: 3, Тип: 4, Вид: 5, Заголовок: 6 },
      ["Заголовок", "Синоним", "Вид", "Тип", "Арбуз", "Яблоко"],
    ],
  ] as const)("preserves values while ordering keys for %#", (value, expectedKeys) => {
    const sorted = sortYamlRuleProperties(value)

    expect(Object.keys(sorted)).toEqual(expectedKeys)
    expect(Object.fromEntries(Object.entries(sorted))).toEqual(value)
  })

  it("preserves an own __proto__ property without changing the result prototype", () => {
    const value = Object.defineProperty({ Значение: 1 }, "__proto__", {
      value: "собственное значение",
      enumerable: true,
      configurable: true,
      writable: true,
    }) as Record<string, unknown>

    const sorted = sortYamlRuleProperties(value)

    expect(Object.prototype.hasOwnProperty.call(sorted, "__proto__")).toBe(true)
    expect(sorted["__proto__"]).toBe("собственное значение")
    expect(Object.getPrototypeOf(sorted)).toBe(Object.prototype)
  })

})
