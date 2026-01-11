import { describe, it, expect } from "vitest"
import { addIndents } from "./addIndents"
import { IFormatterParams } from "../types"

describe("addIndents", () => {
  it("should format lines with first line unchanged when isFirst is true", () => {
    const lines = ["# First line", "Second line", "Third line"]
    const params: IFormatterParams = { isFirst: true }

    const result = addIndents(lines, params)

    expect(result).toEqual(["# First line ", "  Second line", "  Third line "])
  })

  it("should remove first character from first line when isFirst is false", () => {
    const lines = ["# First line", "Second line", "Third line"]
    const params: IFormatterParams = { isFirst: false }

    const result = addIndents(lines, params)

    expect(result).toEqual([" First line", "Second line", "Third line "])
  })

  it("should handle single line", () => {
    const lines = ["# Single line"]
    const params: IFormatterParams = { isFirst: true }

    const result = addIndents(lines, params)

    expect(result).toEqual(["# Single line"])
  })

  it("should pad all lines to same length", () => {
    const lines = ["# Short", "Very long line here", "Medium"]
    const params: IFormatterParams = { isFirst: true }

    const result = addIndents(lines, params)

    expect(result).toEqual([
      "# Short              ",
      "  Very long line here",
      "  Medium             ",
    ])
  })

  it("should handle empty lines array", () => {
    const lines: string[] = []
    const params: IFormatterParams = { isFirst: true }

    const result = addIndents(lines, params)

    expect(result).toEqual([])
  })
})
