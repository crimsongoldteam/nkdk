import { describe, expect, it } from "vitest"
import { formatSystemEnumeration } from "./format"
import { ChildFormItemsGroup, ChildFormItemsGroupEnterprise } from "./types"

const configurationSettings: TConfigurationSettings = {
  defaultLanguage: "ru",
}

describe("formatSystemEnumeration", () => {
  it("should format to enterprise", () => {
    const mockValue: ChildFormItemsGroup = ChildFormItemsGroup.Vertical
    const expectedResult: ChildFormItemsGroupEnterprise = ChildFormItemsGroupEnterprise.Vertical

    const result = formatSystemEnumeration(
      mockValue,
      configurationSettings,
      ChildFormItemsGroup,
      ChildFormItemsGroupEnterprise
    )

    expect(result).toBe(expectedResult)
  })
})
