import { describe, expect, it } from "vitest"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"
import { fullUseRestriction, fullUseRestrictionYAML } from "./__fixtures__/data"
import "./types"

describe("export CalculatedFieldUseRestriction to YAML", () => {
  it("exports full YAML", () => {
    const result = testExportPropertyToYAML({
      rule: { type: "CalculatedFieldUseRestriction", yaml: "ОграничениеИспользования" },
      value: fullUseRestriction,
    })

    expect(result).toEqual({ ОграничениеИспользования: fullUseRestrictionYAML })
  })
})
