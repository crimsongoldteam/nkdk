import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"
import { full, fullYAML } from "./__fixtures__/full"
import { minimal, minimalYAML } from "./__fixtures__/minimal"

const rule: PropertyRule = { type: "MetadataConstant", yaml: "Константа" }

describe("export MetadataConstant to YAML", () => {
  it("exports undefined", () => {
    const result = testExportPropertyToYAML({ rule, value: undefined })
    expect(result).toBeUndefined()
  })

  it("exports full fixture", () => {
    const result = testExportPropertyToYAML({ rule, value: full })
    expect(result).toEqual({ Константа: fullYAML })
  })

  it("exports minimal fixture", () => {
    const result = testExportPropertyToYAML({ rule, value: minimal })
    expect(result).toEqual({ Константа: minimalYAML })
  })
})
