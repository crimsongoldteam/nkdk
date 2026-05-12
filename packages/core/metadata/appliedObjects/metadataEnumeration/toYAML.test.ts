import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToYAML } from "~/tests/appliedObject"
import { full, fullYAML } from "./__fixtures__/full"
import { minimal, minimalYAML } from "./__fixtures__/minimal"
import { MetadataEnumerationRules } from "./rules"
import { MetadataEnumeration } from "./types"

describe("export MetadataEnumeration to YAML", () => {
  it("exports undefined", () => {
    const result = testExportAppliedObjectToYAML<MetadataEnumeration>({
      rule: MetadataEnumerationRules,
      data: undefined,
    })
    expect(result).toBeUndefined()
  })

  it("exports full fixture", () => {
    const result = testExportAppliedObjectToYAML({
      rule: MetadataEnumerationRules,
      data: full,
    })
    expect(result).toEqual(fullYAML)
  })

  it("exports minimal fixture", () => {
    const result = testExportAppliedObjectToYAML({
      rule: MetadataEnumerationRules,
      data: minimal,
    })
    expect(result).toEqual(minimalYAML)
  })
})
