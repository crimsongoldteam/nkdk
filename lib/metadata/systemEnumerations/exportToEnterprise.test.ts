import { describe, expect, it } from "vitest"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { mockcontext } from "~/lib/tests/mockContext"
import { exportSystemEnumerationToEnterprise } from "./exportToEnterprise"

describe("exportSystemEnumerationToEnterprise", () => {
  it("should format to enterprise", () => {
    const mockValue = "Vertical"
    const expectedResult = "Вертикальная"

    const result = exportSystemEnumerationToEnterprise(mockcontext, mockValue, SE.ChildFormItemsGroupToEnterprise)

    expect(result).toBe(expectedResult)
  })
})
