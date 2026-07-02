import { describe, expect, it } from "vitest"
import { parseWithJsYaml } from "./jsYamlParser"

describe("parseWithJsYaml", () => {
  it("parses data and exposes location index", () => {
    const parsed = parseWithJsYaml("Имя: Тест\nРеквизиты:\n  - Имя: Первый\n")

    expect(parsed.data).toEqual({ Имя: "Тест", Реквизиты: [{ Имя: "Первый" }] })
    expect(parsed.locations.keyPosition(["Реквизиты", 0, "Имя"])).toEqual({ line: 3, col: 5 })
    expect(parsed.syntaxErrors).toEqual([])
  })

  it("returns syntax diagnostics for invalid yaml", () => {
    const parsed = parseWithJsYaml("Имя: [")

    expect(parsed.syntaxErrors).toHaveLength(1)
    expect(parsed.syntaxErrors[0]).toMatchObject({ line: 1, col: 6 })
  })
})
