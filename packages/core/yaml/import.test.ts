import { describe, expect, it } from "vitest"
import { asExplicitYAMLStringIfMarked, explicitYAMLString, isExplicitYAMLString } from "./explicitString"
import { importFromYAML } from "./import"

describe("importFromYAML", () => {
  it("marks double-quoted scalar strings without changing public value", () => {
    const data = importFromYAML<Record<string, unknown>>('Отбор.Код: "456"')

    expect(data["Отбор.Код"]).toBe("456")
    expect(isExplicitYAMLString(asExplicitYAMLStringIfMarked(data, "Отбор.Код", data["Отбор.Код"]))).toBe(true)
  })

  it("does not mark plain numeric scalar as an explicit string", () => {
    const data = importFromYAML<Record<string, unknown>>("Отбор.Код: 456")

    expect(data["Отбор.Код"]).toBe(456)
    expect(asExplicitYAMLStringIfMarked(data, "Отбор.Код", data["Отбор.Код"])).toBe(456)
  })

  it("marks double-quoted strings inside sequences", () => {
    const data = importFromYAML<{ Значения: unknown[] }>('Значения:\n  - "456"\n  - 789')

    expect(data.Значения).toEqual(["456", 789])
    expect(isExplicitYAMLString(asExplicitYAMLStringIfMarked(data.Значения, 0, data.Значения[0]))).toBe(true)
    expect(asExplicitYAMLStringIfMarked(data.Значения, 1, data.Значения[1])).toBe(789)
  })

  it("imports null-like empty values as undefined", () => {
    expect(importFromYAML<{ Поле?: string }>("Поле:\n")).toEqual({ Поле: undefined })
  })

  it("keeps double quoted string markers", () => {
    const result = importFromYAML<{ Значение: string }>('Значение: "001"\n')

    expect(asExplicitYAMLStringIfMarked(result, "Значение", result.Значение)).toEqual(explicitYAMLString("001"))
  })

  it("uses JSON schema scalar behavior for strings and numbers", () => {
    expect(importFromYAML("Строка: on\nЧисло: 123\n")).toEqual({ Строка: "on", Число: 123 })
  })
})
