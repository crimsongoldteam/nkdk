import { describe, expect, it } from "vitest"
import * as SE from "~/metadata/systemEnumerations/types"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importSystemEnumerationFromYAML } from "./fromYAML"

describe("importSystemEnumerationFromYAML", () => {
  it("should parse from enterprise to normal", () => {
    const mockValue = "Вертикальная"
    const expectedResult = "Vertical"

    const result = importSystemEnumerationFromYAML(mockContext, mockRule, mockValue, SE.ChildFormItemsGroupFromYAML)

    expect(result).toBe(expectedResult)
  })

  it("should return undefined when value is undefined", () => {
    const result = importSystemEnumerationFromYAML(mockContext, mockRule, undefined, SE.ChildFormItemsGroupFromYAML)

    expect(result).toBeUndefined()
  })
})
