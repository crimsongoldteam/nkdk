import { describe, expect, it } from "vitest"
import { asExplicitYAMLStringIfMarked, isExplicitYAMLString } from "./explicitString"
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
})
