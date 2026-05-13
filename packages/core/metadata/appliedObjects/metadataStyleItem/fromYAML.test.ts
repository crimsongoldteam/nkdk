import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import { border, borderYAML } from "./__fixtures__/border"
import { color, colorYAML } from "./__fixtures__/color"
import { font, fontYAML } from "./__fixtures__/font"

const rule: PropertyRule = { type: "MetadataStyleItem", yaml: "ЭлементСтиля" }

describe("import MetadataStyleItem from YAML", () => {
  it("imports undefined", () => {
    const result = testImportPropertyFromYAML({ rule, value: undefined })
    expect(result).toBeUndefined()
  })

  it.each([
    ["font", fontYAML, font],
    ["color", colorYAML, color],
    ["border", borderYAML, border],
  ] as const)("imports %s fixture", (_name, value, expected) => {
    const result = testImportPropertyFromYAML({ rule, value })
    expect(result).toEqual({ ...expected, name: undefined, uuid: undefined })
  })

  it("round-trip: font — import затем export даёт тот же YAML (parsed)", () => {
    const imported = testImportPropertyFromYAML({ rule, value: fontYAML })
    const exported = testExportPropertyToYAML({ rule, value: imported })
    expect(exported).toEqual({ ЭлементСтиля: fontYAML })
  })
})
