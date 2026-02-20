import { describe, expect, it } from "vitest"
import * as SE from "~/metadata/systemEnumerations/types"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportSystemEnumerationToYAMLDeprecated } from "./toYAML"

describe("exportSystemEnumerationToYAML", () => {
  it("should format to enterprise", () => {
    const mockValue = "Vertical"
    const expectedResult = "Вертикальная"

    const result = exportSystemEnumerationToYAMLDeprecated(
      mockContext,
      mockRule,
      mockValue,
      SE.ChildFormItemsGroupToYAML
    )

    expect(result).toBe(expectedResult)
  })
})
