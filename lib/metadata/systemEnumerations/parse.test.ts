import { describe, expect, it } from "vitest"
import { TElementRule } from "~/lib/rulesManager/types"
import { TConfigurationSettings } from "../configurationSettings/types"
import { formatSystemEnumeration } from "./format"
import { parseSystemEnumeration } from "./parse"
import {
  TChildFormItemsGroup,
  TChildFormItemsGroupEnterprise,
  ZChildFormItemsGroup,
  ZChildFormItemsGroupEnterprise,
} from "./types"

const configurationSettings: TConfigurationSettings = {
  defaultLanguage: "ru",
}

describe("parseSystemEnumeration", () => {
  it("should parse from enterprise to normal", () => {
    const mockValue: TChildFormItemsGroupEnterprise = "Вертикальная"
    const expectedResult: TChildFormItemsGroup = "Vertical"

    const rule: TElementRule = {
      nameEnterprise: "ChildFormItemsGroup",
      type: ZChildFormItemsGroup,
      typeEnterprise: ZChildFormItemsGroupEnterprise,
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
    const expectedResult: TChildFormItemsGroup = "Vertical"

    const rule: TElementRule = {
      nameEnterprise: "ChildFormItemsGroup",
      type: ZChildFormItemsGroup,
      typeEnterprise: ZChildFormItemsGroupEnterprise,
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
      type: ZChildFormItemsGroup,
      typeEnterprise: ZChildFormItemsGroupEnterprise,
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
    const originalValue: TChildFormItemsGroup = "Vertical"

    const rule: TElementRule = {
      nameEnterprise: "ChildFormItemsGroup",
      type: ZChildFormItemsGroup,
      typeEnterprise: ZChildFormItemsGroupEnterprise,
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
