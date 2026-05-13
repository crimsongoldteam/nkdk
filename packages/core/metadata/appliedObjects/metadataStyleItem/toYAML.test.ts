import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"
import { border, borderYAML } from "./__fixtures__/border"
import { color, colorYAML } from "./__fixtures__/color"
import { font, fontYAML } from "./__fixtures__/font"

const rule: PropertyRule = { type: "MetadataStyleItem", yaml: "ЭлементСтиля" }

describe("export MetadataStyleItem to YAML", () => {
  it("exports undefined", () => {
    const result = testExportPropertyToYAML({ rule, value: undefined })
    expect(result).toBeUndefined()
  })

  it.each([
    ["font", font, fontYAML],
    ["color", color, colorYAML],
    ["border", border, borderYAML],
  ] as const)("exports %s fixture", (_name, value, expected) => {
    const result = testExportPropertyToYAML({ rule, value })
    expect(result).toEqual({ ЭлементСтиля: expected })
  })
})
