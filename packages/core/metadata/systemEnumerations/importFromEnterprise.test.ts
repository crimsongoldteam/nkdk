import { describe, expect, it } from "vitest"
import * as SE from "~/metadata/systemEnumerations/types"
import { mockContext } from "~/tests/mockContext"
import { importSystemEnumerationFromYAML } from "./importFromEnterprise"

describe("importSystemEnumerationFromEnterprise", () => {
  it("should parse from enterprise to normal", () => {
    const mockValue = "Вертикальная"
    const expectedResult = "Vertical"

    const result = importSystemEnumerationFromYAML(mockContext, mockValue, SE.ChildFormItemsGroupFromEnterprise)

    expect(result).toBe(expectedResult)
  })

  it("should return undefined when value is undefined", () => {
    const result = importSystemEnumerationFromYAML(
      mockContext,
      mockValue,
      undefined,
      SE.ChildFormItemsGroupFromEnterprise
    )

    expect(result).toBeUndefined()
  })
})
