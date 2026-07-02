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

  it("normalizes EOF diagnostics to the unterminated flow collection", () => {
    const parsed = parseWithJsYaml("Имя: [")

    expect(parsed.syntaxErrors).toHaveLength(1)
    expect(parsed.syntaxErrors[0]).toMatchObject({
      line: 1,
      col: 6,
      message: expect.stringContaining("unexpected end"),
    })
  })

  it("keeps direct mark diagnostics when the parser points into an existing line", () => {
    const parsed = parseWithJsYaml("Имя: Тест\n  ЛишнийОтступ: 1\n")

    expect(parsed.syntaxErrors).toHaveLength(1)
    expect(parsed.syntaxErrors[0].line).toBeGreaterThanOrEqual(1)
    expect(parsed.syntaxErrors[0].col).toBeGreaterThanOrEqual(1)
  })
})

describe("parseMetadataYaml", () => {
  it("does not expose yaml AST compatibility fields", async () => {
    const { parseMetadataYaml } = await import("./parseMetadataYaml")
    const parsed = parseMetadataYaml("Имя: Тест\n")

    expect("doc" in parsed).toBe(false)
    expect("lineCounter" in parsed).toBe(false)
    expect(parsed.data).toEqual({ Имя: "Тест" })
  })
})
