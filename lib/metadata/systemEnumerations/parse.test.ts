import { describe, expect, it } from "vitest"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { parseSystemEnumeration } from "./parse"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { exportSystemEnumerationToEnterprise } from "./exportToEnterprise"

describe("parseSystemEnumeration", () => {
  it("should parse from enterprise to normal", () => {
    const mockValue = "Вертикальная"
    const expectedResult = "Vertical"

    const result = parseSystemEnumeration(mockValue, SE.ChildFormItemsGroupFromEnterprise)

    expect(result).toBe(expectedResult)
  })

  it("should return undefined when value is undefined", () => {
    const result = parseSystemEnumeration(undefined, SE.ChildFormItemsGroupFromEnterprise)

    expect(result).toBeUndefined()
  })

  it("should be inverse of formatSystemEnumeration", () => {
    const originalValue = "Vertical"

    const formatted = exportSystemEnumerationToEnterprise(mockConfigurationSettings, originalValue, SE.ChildFormItemsGroupToEnterprise)
    const parsed = parseSystemEnumeration(formatted, SE.ChildFormItemsGroupFromEnterprise)

    expect(parsed).toBe(originalValue)
  })
})
