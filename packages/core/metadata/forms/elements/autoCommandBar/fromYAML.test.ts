import { describe, expect, it } from "vitest"
import {
  fullAutoCommandBar,
  fullAutoExportCommandBarEnterprise,
  minimalAutoCommandBar,
} from "~/tests/fixtures/forms/autoCommandBar/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importAutoCommandBarFromYAML } from "./fromYAML"

describe("importAutoCommandBarFromEnterprise", () => {
  it("should import all fields from Enterprise", () => {
    const result = importAutoCommandBarFromYAML(
      mockContext,
      mockRule,
      fullAutoExportCommandBarEnterprise,
      fullAutoCommandBar
    )

    expect(result).toEqual(fullAutoCommandBar)
  })

  it("should import minimal", () => {
    const result = importAutoCommandBarFromYAML(mockContext, mockRule, undefined, minimalAutoCommandBar)

    expect(result).toEqual(minimalAutoCommandBar)
  })
})
