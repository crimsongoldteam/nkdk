import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"
import {
  explicitNullValueDCSParameters,
  explicitNullValueDCSParametersYAML,
  fullDCSParameters,
  fullDCSParametersYAML,
  minimalDCSParameters,
  minimalDCSParametersYAML,
} from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "DCSParameters",
  yaml: "Параметры",
}

describe("export DCSParameter to YAML", () => {
  it("exports undefined", () => {
    const result = testExportPropertyToYAML({ rule, value: undefined })
    expect(result).toBeUndefined()
  })

  it("exports minimal collection", () => {
    const result = testExportPropertyToYAML({ rule, value: minimalDCSParameters })
    expect(result).toEqual({ Параметры: minimalDCSParametersYAML })
  })

  it("exports full collection", () => {
    const result = testExportPropertyToYAML({ rule, value: fullDCSParameters })
    expect(result).toEqual({ Параметры: fullDCSParametersYAML })
  })

  it("exports explicit null value fixture", () => {
    const result = testExportPropertyToYAML({ rule, value: explicitNullValueDCSParameters })
    expect(result).toEqual({ Параметры: explicitNullValueDCSParametersYAML })
  })
})
