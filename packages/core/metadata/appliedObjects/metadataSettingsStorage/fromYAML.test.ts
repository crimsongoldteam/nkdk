import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../orchestration"
import { testExportPropertyToYAML } from "../../../tests/property/exportPropertyToYAML"
import { testImportPropertyFromYAML } from "../../../tests/property/importPropertyFromYAML"
import { full, fullYAML } from "./__fixtures__/full"
import { minimal, minimalYAML } from "./__fixtures__/minimal"

const rule: PropertyRule = { type: "MetadataSettingsStorage", yaml: "ХранилищеНастроек" }

describe("import MetadataSettingsStorage from YAML", () => {
  it("imports undefined", () => {
    const result = testImportPropertyFromYAML({ rule, value: undefined })
    expect(result).toBeUndefined()
  })

  it("imports full fixture", () => {
    const result = testImportPropertyFromYAML({ rule, value: fullYAML, name: full.name })
    expect(result).toEqual({ ...full, name: undefined })
  })

  it("imports minimal fixture", () => {
    const result = testImportPropertyFromYAML({ rule, value: minimalYAML, name: minimal.name })
    const { synonym: _synonym, ...expected } = minimal
    expect(result).toEqual({ ...expected, name: undefined })
  })

  it("round-trip: full — import затем export даёт тот же YAML (parsed)", () => {
    const imported = testImportPropertyFromYAML({ rule, value: fullYAML, name: full.name })
    const exported = testExportPropertyToYAML({ rule, value: imported, name: full.name })
    expect(exported).toEqual({ ХранилищеНастроек: fullYAML })
  })
})
