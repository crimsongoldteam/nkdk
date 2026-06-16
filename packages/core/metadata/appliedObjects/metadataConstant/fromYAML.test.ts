import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import { full, fullYAML } from "./__fixtures__/full"
import { minimal, minimalYAML } from "./__fixtures__/minimal"

const rule: PropertyRule = { type: "MetadataConstant", yaml: "Константа" }

describe("import MetadataConstant from YAML", () => {
  it("imports undefined", () => {
    const result = testImportPropertyFromYAML({ rule, value: undefined })
    expect(result).toBeUndefined()
  })

  it("imports full fixture with common form", () => {
    const result = testImportPropertyFromYAML({ rule, value: fullYAML, name: full.name })
    expect(result).toEqual({ ...full, name: undefined })
  })

  it("imports minimal fixture", () => {
    const result = testImportPropertyFromYAML({ rule, value: minimalYAML, name: minimal.name })
    expect(result).toEqual({ ...minimal, name: undefined })
  })

})
