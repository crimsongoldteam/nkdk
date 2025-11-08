import { describe, expect, it } from "vitest"
import {
  TChildFormItemsGroup,
  TChildFormItemsGroupEnterprise,
  ZChildFormItemsGroup,
  ZChildFormItemsGroupEnterprise,
} from "./types"
import { formatSystemEnumeration } from "./format"

describe("formatSystemEnumeration", () => {
  it("should format to enterprise", () => {
    const mockValue: TChildFormItemsGroup = "Vertical"
    const expectedResult: TChildFormItemsGroupEnterprise = "Вертикальная"

    const result = formatSystemEnumeration(
      mockValue,
      ZChildFormItemsGroup,
      ZChildFormItemsGroupEnterprise
    )

    expect(result).toBe(expectedResult)
  })
})
