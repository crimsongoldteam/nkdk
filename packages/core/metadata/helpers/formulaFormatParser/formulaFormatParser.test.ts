import { describe, expect, it } from "vitest"
import { formulaFormatParser } from "./formulaFormatParser"

describe("formulaFormatParser", () => {
  it("should parse formula format with one parameter", () => {
    const formula = "Formula(Parameter1)"
    const result = formulaFormatParser(formula)
    expect(result).toEqual({
      formula: "Formula",
      parameters: ["Parameter1"],
    })
  })

  it("should parse formula format with two parameters", () => {
    const formula = "Formula(Parameter1,Parameter2)"
    const result = formulaFormatParser(formula)
    expect(result).toEqual({
      formula: "Formula",
      parameters: ["Parameter1", "Parameter2"],
    })
  })

  it("should parse with spaces", () => {
    const formula = " Formula ( Parameter1, Parameter2 ) "
    const result = formulaFormatParser(formula)
    expect(result).toEqual({
      formula: "Formula",
      parameters: ["Parameter1", "Parameter2"],
    })
  })

  it("should parse formula format without parameters", () => {
    const formula = "Formula"
    const result = formulaFormatParser(formula)
    expect(result).toEqual({
      formula: "Formula",
      parameters: [],
    })
  })

  it("should parse with invalid formula", () => {
    const formula = "Formula(Parameter1,Parameter2"
    const result = formulaFormatParser(formula)
    expect(result).toEqual({
      formula: "Formula",
      parameters: ["Parameter1", "Parameter2"],
    })
  })
})
