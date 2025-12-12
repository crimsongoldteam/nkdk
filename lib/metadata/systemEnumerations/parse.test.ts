import { describe, expect, it } from "vitest"
import { TElementRule } from "~/lib/rulesManager/types"
import { TConfigurationSettings } from "../configurationSettings/types"
import { formatSystemEnumeration } from "./format"
import { parseSystemEnumeration } from "./parse"
import { ChildFormItemsGroup, ChildFormItemsGroupEnterprise } from "./types"

const configurationSettings: TConfigurationSettings = {
  defaultLanguage: "ru",
}

describe("parseSystemEnumeration", () => {
  it("should parse from enterprise to normal", () => {
    const mockValue: string = ChildFormItemsGroupEnterprise.Вертикальная
    const expectedResult: ChildFormItemsGroup = ChildFormItemsGroup.Vertical

    const rule: TElementRule = {
      nameEnterprise: "ChildFormItemsGroup",
      type: ChildFormItemsGroup,
      typeEnterprise: ChildFormItemsGroupEnterprise,
      inProperties: () => true,
    }

    const result = parseSystemEnumeration(
      mockValue,
      configurationSettings,
      rule
    )

    expect(result).toBe(expectedResult)
  })

  it("should parse with other case from enterprise to normal", () => {
    const mockValue = "вертикальная"
    const expectedResult: ChildFormItemsGroup = ChildFormItemsGroup.Vertical

    const rule: TElementRule = {
      nameEnterprise: "ChildFormItemsGroup",
      type: ChildFormItemsGroup,
      typeEnterprise: ChildFormItemsGroupEnterprise,
      inProperties: () => true,
    }

    const result = parseSystemEnumeration(
      mockValue,
      configurationSettings,
      rule
    )

    expect(result).toBe(expectedResult)
  })

  it("should return undefined when value is undefined", () => {
    const rule: TElementRule = {
      nameEnterprise: "ChildFormItemsGroup",
      type: ChildFormItemsGroup,
      typeEnterprise: ChildFormItemsGroupEnterprise,
      inProperties: () => true,
    }

    const result = parseSystemEnumeration(
      undefined,
      configurationSettings,
      rule
    )

    expect(result).toBeUndefined()
  })

  it("should be inverse of formatSystemEnumeration", () => {
    const originalValue: ChildFormItemsGroup = ChildFormItemsGroup.Vertical

    const rule: TElementRule = {
      nameEnterprise: "ChildFormItemsGroup",
      type: ChildFormItemsGroup,
      typeEnterprise: ChildFormItemsGroupEnterprise,
      format: formatSystemEnumeration,
      inProperties: () => true,
    }

    const formatted = formatSystemEnumeration(
      originalValue,
      configurationSettings,
      rule
    )
    const parsed = parseSystemEnumeration(
      formatted,
      configurationSettings,
      rule
    )

    expect(parsed).toBe(originalValue)
  })
})
