import { describe, expect, it } from "vitest"
import * as SE from "~/metadata/systemEnumerations/types"
import { mockContext } from "~/tests/mockContext"
import { importSystemEnumerationFromEnterprise } from "./importFromEnterprise"

describe("importSystemEnumerationFromEnterprise", () => {
  it("should parse from enterprise to normal", () => {
    const mockValue = "Вертикальная"
    const expectedResult = "Vertical"

    const result = importSystemEnumerationFromEnterprise(mockContext, mockValue, SE.ChildFormItemsGroupFromEnterprise)

    expect(result).toBe(expectedResult)
  })

  it("should return undefined when value is undefined", () => {
    const result = importSystemEnumerationFromEnterprise(mockContext, undefined, SE.ChildFormItemsGroupFromEnterprise)

    expect(result).toBeUndefined()
  })
})
