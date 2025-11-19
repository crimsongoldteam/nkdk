import { describe, expect, it } from "vitest"
import {
  TChildFormItemsGroup,
  TChildFormItemsGroupEnterprise,
  ZChildFormItemsGroup,
  ZChildFormItemsGroupEnterprise,
} from "./types"
import { formatSystemEnumeration } from "./format"
import { TElementRule } from "~/lib/rulesManager/types"
import { TConfigurationSettings } from "../configurationSettings/types"

const configurationSettings: TConfigurationSettings = {
  defaultLanguage: "ru",
}

describe("formatSystemEnumeration", () => {
  it("should format to enterprise", () => {
    const mockValue: TChildFormItemsGroup = "Vertical"
    const expectedResult: TChildFormItemsGroupEnterprise = "Вертикальная"

    const rule: TElementRule = {
      nameEnterprise: "ChildFormItemsGroup",
      type: ZChildFormItemsGroup,
      typeEnterprise: ZChildFormItemsGroupEnterprise,
      format: formatSystemEnumeration,
      inProperties: () => true,
    }

    const result = formatSystemEnumeration(
      mockValue,
      configurationSettings,
      rule
    )

    expect(result).toBe(expectedResult)
  })

  it("should format with other case to enterprise", () => {
    const mockValue = "vertical"
    const expectedResult: TChildFormItemsGroupEnterprise = "Вертикальная"

    const rule: TElementRule = {
      nameEnterprise: "ChildFormItemsGroup",
      type: ZChildFormItemsGroup,
      typeEnterprise: ZChildFormItemsGroupEnterprise,
      format: formatSystemEnumeration,
      inProperties: () => true,
    }

    const result = formatSystemEnumeration(
      mockValue,
      configurationSettings,
      rule
    )

    expect(result).toBe(expectedResult)
  })
})
