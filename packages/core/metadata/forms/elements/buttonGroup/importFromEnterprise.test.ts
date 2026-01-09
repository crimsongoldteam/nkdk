import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/button/importFromEnterprise"
import {
  fullButtonGroup,
  fullButtonGroupEnterprise,
  minimalButtonGroup,
  minimalButtonGroupEnterprise,
} from "~/tests/fixtures/forms/buttonGroup/data"
import { mockСontext } from "~/tests/mockContext"
import { importButtonGroupFromEnterprise } from "./importFromEnterprise"

describe("importButtonGroupFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importButtonGroupFromEnterprise(mockСontext, undefined, fullButtonGroup.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importButtonGroupFromEnterprise(mockСontext, fullButtonGroupEnterprise, fullButtonGroup.name)

    expect(result).toEqual(fullButtonGroup)
  })

  it("should import minimal", () => {
    const result = importButtonGroupFromEnterprise(mockСontext, minimalButtonGroupEnterprise, minimalButtonGroup.name)

    expect(result).toEqual(minimalButtonGroup)
  })
})
