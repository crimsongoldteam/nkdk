import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import {
  fullDCSParameters,
  fullDCSParametersYAML,
  minimalDCSParameters,
  minimalDCSParametersYAML,
} from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = { type: "DCSParameter" }

describe("import DCSParameter from YAML", () => {
  it("imports undefined", () => {
    const result = testImportPropertyFromYAML({ rule, value: undefined })
    expect(result).toBeUndefined()
  })

  it("imports minimal fixture", () => {
    const result = testImportPropertyFromYAML({ rule, value: minimalDCSParametersYAML })
    expect(result).toEqual(minimalDCSParameters)
  })

  it("imports full fixture", () => {
    const result = testImportPropertyFromYAML({ rule, value: fullDCSParametersYAML })
    expect(result).toEqual(fullDCSParameters)
  })
})
