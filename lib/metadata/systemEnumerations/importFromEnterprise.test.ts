import { describe, expect, it } from "vitest"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { mockcontext } from "~/lib/tests/mockContext"
import { importSystemEnumerationFromEnterprise } from "./importFromEnterprise"

describe("importSystemEnumerationFromEnterprise", () => {
  it("should parse from enterprise to normal", () => {
    const mockValue = "Вертикальная"
    const expectedResult = "Vertical"

    const result = importSystemEnumerationFromEnterprise(mockcontext, mockValue, SE.ChildFormItemsGroupFromEnterprise)

    expect(result).toBe(expectedResult)
  })

  it("should return undefined when value is undefined", () => {
    const result = importSystemEnumerationFromEnterprise(mockcontext, undefined, SE.ChildFormItemsGroupFromEnterprise)

    expect(result).toBeUndefined()
  })
})
