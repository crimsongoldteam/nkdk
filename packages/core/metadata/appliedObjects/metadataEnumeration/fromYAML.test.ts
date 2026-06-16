import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToYAML } from "~/tests/appliedObject"
import { mockContext } from "~/tests/mockContext"
import { full, fullYAML } from "./__fixtures__/full"
import { minimal, minimalYAML } from "./__fixtures__/minimal"
import { importMetadataEnumerationFromYAML } from "./fromYAML"
import { MetadataEnumerationRules } from "./rules"

describe("import MetadataEnumeration from YAML", () => {
  it("imports undefined", () => {
    const result = importMetadataEnumerationFromYAML(mockContext, undefined, "СтатусЗаказа")
    expect(result).toBeUndefined()
  })

  it("imports full fixture", () => {
    const result = importMetadataEnumerationFromYAML(mockContext, fullYAML, "ПеречислениеВсеСвойства")
    expect(result).toEqual(full)
  })

  it("imports minimal fixture", () => {
    const result = importMetadataEnumerationFromYAML(mockContext, minimalYAML, "ПеречислениеПоУмолчанию")
    expect(result).toEqual(minimal)
  })

  it("round-trip: full — import затем export даёт тот же YAML (parsed)", () => {
    const imported = importMetadataEnumerationFromYAML(mockContext, fullYAML, "ПеречислениеВсеСвойства")
    const exported = testExportAppliedObjectToYAML({
      rule: MetadataEnumerationRules,
      data: imported,
    })
    expect(exported).toEqual(fullYAML)
  })
})
