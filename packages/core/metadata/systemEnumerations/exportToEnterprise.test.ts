import { describe, expect, it } from "vitest"
import * as SE from "~/metadata/systemEnumerations/types"
import { mockСontext } from "~/tests/mockContext"
import { exportSystemEnumerationToEnterprise } from "./exportToEnterprise"

describe("exportSystemEnumerationToEnterprise", () => {
  it("should format to enterprise", () => {
    const mockValue = "Vertical"
    const expectedResult = "Вертикальная"

    const result = exportSystemEnumerationToEnterprise(mockСontext, mockValue, SE.ChildFormItemsGroupToEnterprise)

    expect(result).toBe(expectedResult)
  })
})
