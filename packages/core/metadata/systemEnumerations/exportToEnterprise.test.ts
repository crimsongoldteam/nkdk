import { describe, expect, it } from "vitest"
import * as SE from "~/metadata/systemEnumerations/types"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportSystemEnumerationToYAML } from "./exportToEnterprise"

describe("exportSystemEnumerationToEnterprise", () => {
  it("should format to enterprise", () => {
    const mockValue = "Vertical"
    const expectedResult = "Вертикальная"

    const result = exportSystemEnumerationToYAML(mockContext, mockRule, mockValue, SE.ChildFormItemsGroupToEnterprise)

    expect(result).toBe(expectedResult)
  })
})
