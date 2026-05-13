import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import { full, fullYAML } from "./__fixtures__/full"
import { minimal, minimalYAML } from "./__fixtures__/minimal"

const rule: PropertyRule = { type: "MetadataSessionParameter", yaml: "ПараметрСеанса" }

describe("import MetadataSessionParameter from YAML", () => {
  it("imports undefined", () => {
    const result = testImportPropertyFromYAML({ rule, value: undefined })
    expect(result).toBeUndefined()
  })

  it("imports full fixture", () => {
    const result = testImportPropertyFromYAML({ rule, value: fullYAML })
    expect(result).toEqual({ ...full, name: undefined })
  })

  it("imports minimal fixture", () => {
    const result = testImportPropertyFromYAML({ rule, value: minimalYAML })
    expect(result).toEqual({ ...minimal, name: undefined })
  })

  it("round-trip: full — import затем export даёт тот же YAML (parsed)", () => {
    const imported = testImportPropertyFromYAML({ rule, value: fullYAML })
    const exported = testExportPropertyToYAML({ rule, value: imported })
    expect(exported).toEqual({ ПараметрСеанса: fullYAML })
  })
})
