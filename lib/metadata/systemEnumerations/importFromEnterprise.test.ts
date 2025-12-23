import { describe, expect, it } from "vitest"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { importSystemEnumerationFromEnterprise } from "./importFromEnterprise"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"

describe("importSystemEnumerationFromEnterprise", () => {
  it("should parse from enterprise to normal", () => {
    const mockValue = "Вертикальная"
    const expectedResult = "Vertical"

    const result = importSystemEnumerationFromEnterprise(
      mockConfigurationSettings,
      mockValue,
      SE.ChildFormItemsGroupFromEnterprise
    )

    expect(result).toBe(expectedResult)
  })

  it("should return undefined when value is undefined", () => {
    const result = importSystemEnumerationFromEnterprise(
      mockConfigurationSettings,
      undefined,
      SE.ChildFormItemsGroupFromEnterprise
    )

    expect(result).toBeUndefined()
  })
})

