import { describe, expect, it } from "vitest"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import { fullUseRestriction, fullUseRestrictionYAML } from "./__fixtures__/data"
import "./types"

describe("import CalculatedFieldUseRestriction from YAML", () => {
  it("imports full YAML", () => {
    const result = testImportPropertyFromYAML({
      rule: { type: "CalculatedFieldUseRestriction" },
      value: fullUseRestrictionYAML,
    })

    expect(result).toEqual(fullUseRestriction)
  })
})
