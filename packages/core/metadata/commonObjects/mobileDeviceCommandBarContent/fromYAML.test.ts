import { describe, expect, it } from "vitest"
import type { MetadataValueYAML } from "~/metadata/commonObjects/metadataValue/types"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importFromYAML } from "~/yaml/import"
import {
  fullMobileDeviceCommandBarContent,
  fullMobileDeviceCommandBarContentYAML,
  twoItemsMobileDeviceCommandBarContent,
  twoItemsMobileDeviceCommandBarContentYAML,
} from "./__fixtures__/data"
import { importMobileDeviceCommandBarContentFromYAML } from "./fromYAML"

describe("importMobileDeviceCommandBarContentFromYAML", () => {
  it("returns undefined for undefined input", () => {
    const result = importMobileDeviceCommandBarContentFromYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("returns undefined for empty input", () => {
    const result = importMobileDeviceCommandBarContentFromYAML(mockContext, mockRule, [])
    expect(result).toBeUndefined()
  })

  it("imports full YAML", () => {
    const result = importMobileDeviceCommandBarContentFromYAML(
      mockContext,
      mockRule,
      fullMobileDeviceCommandBarContentYAML
    )

    expect(result).toEqual(fullMobileDeviceCommandBarContent)
  })

  it("imports two string items YAML", () => {
    const result = importMobileDeviceCommandBarContentFromYAML(
      mockContext,
      mockRule,
      twoItemsMobileDeviceCommandBarContentYAML
    )

    expect(result).toEqual(twoItemsMobileDeviceCommandBarContent)
  })

  it("imports form element names as plain strings", () => {
    const result = importMobileDeviceCommandBarContentFromYAML(mockContext, mockRule, ["КоманднаяПанельЕще"])

    expect(result).toEqual([{ type: "string", value: "КоманднаяПанельЕще" }])
  })

  it("keeps quoted numeric command bar item as plain string", () => {
    const yaml = importFromYAML<MetadataValueYAML[]>('- "2"')

    const result = importMobileDeviceCommandBarContentFromYAML(mockContext, mockRule, yaml)

    expect(result).toEqual([{ type: "string", value: "2" }])
  })

  it("keeps plain numeric command bar item delegated to MetadataValue", () => {
    const yaml = importFromYAML<MetadataValueYAML[]>("- 2")

    const result = importMobileDeviceCommandBarContentFromYAML(mockContext, mockRule, yaml)

    expect(result).toEqual([{ type: "decimal", value: 2 }])
  })

  it("does not parse metadata-like strings as metadata targets", () => {
    const result = importMobileDeviceCommandBarContentFromYAML(mockContext, mockRule, ["ОбщаяФорма.ПечатьДокументов"])

    expect(result).toEqual([{ type: "string", value: "ОбщаяФорма.ПечатьДокументов" }])
  })

  it("keeps object items delegated to MetadataValue import", () => {
    const result = importMobileDeviceCommandBarContentFromYAML(mockContext, mockRule, [
      { Тип: "ВидСчета", Значение: "АктивноПассивный" },
    ])

    expect(result).toEqual([{ type: "AccountType", value: "ActivePassive" }])
  })
})
