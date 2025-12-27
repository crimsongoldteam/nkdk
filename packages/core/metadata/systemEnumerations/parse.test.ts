import { describe, expect, it } from "vitest"
import * as SE from "~/metadata/systemEnumerations/types"
import { mockСontext } from "~/tests/mockContext"
import { exportSystemEnumerationToEnterprise } from "./exportToEnterprise"
import { importSystemEnumerationFromEnterprise } from "./importFromEnterprise"

describe("importSystemEnumerationFromEnterprise", () => {
  it("should parse from enterprise to normal", () => {
    const mockValue = "Вертикальная"
    const expectedResult = "Vertical"

    const result = importSystemEnumerationFromEnterprise(mockСontext, mockValue, SE.ChildFormItemsGroupFromEnterprise)

    expect(result).toBe(expectedResult)
  })

  it("should return undefined when value is undefined", () => {
    const result = importSystemEnumerationFromEnterprise(mockСontext, undefined, SE.ChildFormItemsGroupFromEnterprise)

    expect(result).toBeUndefined()
  })

  it("should be inverse of exportSystemEnumerationToEnterprise", () => {
    const originalValue = "Vertical"

    const formatted = exportSystemEnumerationToEnterprise(
      mockСontext,
      originalValue,
      SE.ChildFormItemsGroupToEnterprise
    )
    const parsed = importSystemEnumerationFromEnterprise(mockСontext, formatted, SE.ChildFormItemsGroupFromEnterprise)

    expect(parsed).toBe(originalValue)
  })
})
