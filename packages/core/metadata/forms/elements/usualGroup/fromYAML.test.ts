import { describe, expect, it } from "vitest"
import { importElementFromPartialYAML } from "~/metadata/orchestration"
import {
  fullUsualGroup,
  fullUsualGroupPartialYAML,
  minimalUsualGroup,
  minimalUsualGroupPartialYAML,
} from "~/tests/fixtures/forms/usualGroup/data"
import { mockContext } from "~/tests/mockContext"

describe("importUsualGroupFromYAML", () => {
  it("should import all fields from YAML", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: "UsualGroup",
      yaml: fullUsualGroupPartialYAML,
      source: fullUsualGroup,
    })

    expect(result).toEqual(fullUsualGroup)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: "UsualGroup",
      yaml: minimalUsualGroupPartialYAML,
      source: minimalUsualGroup,
    })

    expect(result).toEqual(minimalUsualGroup)
  })
})
