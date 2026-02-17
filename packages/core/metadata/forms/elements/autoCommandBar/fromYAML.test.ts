import { describe, expect, it } from "vitest"
import { importPropertyFromYAML, PropertyRule } from "~/metadata/metadataFactory"
import {
  fullAutoCommandBar,
  fullAutoExportCommandBarEnterprise,
  minimalAutoCommandBar,
} from "~/tests/fixtures/forms/autoCommandBar/data"
import { mockContext } from "~/tests/mockContext"

const rule: PropertyRule<any> = { type: "AutoCommandBar" }

describe("importAutoCommandBarFromEnterprise", () => {
  it("should import all fields from Enterprise", () => {
    const result = importPropertyFromYAML({
      context: mockContext,
      rule: rule,
      value: fullAutoExportCommandBarEnterprise,
      sourceValue: fullAutoCommandBar,
    })

    expect(result).toEqual(fullAutoCommandBar)
  })

  it("should import minimal", () => {
    const result = importPropertyFromYAML({
      context: mockContext,
      rule: rule,
      value: undefined,
      sourceValue: minimalAutoCommandBar,
    })
    expect(result).toEqual(minimalAutoCommandBar)
  })
})
