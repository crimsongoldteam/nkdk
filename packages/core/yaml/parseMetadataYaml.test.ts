import { describe, expect, it } from "vitest"
import { parsedYamlFromKnownData } from "./parseMetadataYaml"

describe("parsedYamlFromKnownData", () => {
  it("сохраняет известный объект и строит точные координаты ключей по тексту", () => {
    const text = ["Внешний:", "  Внутренний:", "    Значение: 42"].join("\n")
    const yaml = Object.freeze({ Внешний: Object.freeze({ Внутренний: Object.freeze({ Значение: 42 }) }) })

    const parsed = parsedYamlFromKnownData(text, yaml)

    expect(parsed.data).toBe(yaml)
    expect(parsed.syntaxErrors).toEqual([])
    expect(parsed.locations.keyPosition(["Внешний", "Внутренний"])).toEqual({ line: 2, col: 3 })
    expect(parsed.locations.keyPosition(["Внешний", "Внутренний", "Значение"])).toEqual({ line: 3, col: 5 })
  })
})
