import { describe, expect, it } from "vitest"
import {
  configurationExtensionHistoryContributions,
  createConfigurationExtensionHistoryRegistry,
} from "./historyCapabilities"

describe("configuration extension history capabilities", () => {
  it("classifies every rules.ts item with ИсторияДанных", () => {
    const expected = [
      "MetadataBusinessProcess", "MetadataCatalog", "MetadataChartOfAccounts",
      "MetadataChartOfCalculationTypes", "MetadataChartOfCharacteristicTypes",
      "MetadataCommonAttribute", "MetadataConstant", "MetadataDocument",
      "MetadataExchangePlan", "MetadataExternalDataSourceCubeDimension",
      "MetadataExternalDataSourceCubeResource", "MetadataInformationRegister",
      "MetadataTask", "StandardAttributeDescription",
    ].sort()
    expect([...createConfigurationExtensionHistoryRegistry().itemTypes()].sort()).toEqual(expected)
  })

  it("rejects duplicate classifications", () => {
    const duplicate = configurationExtensionHistoryContributions[0]!
    expect(() => createConfigurationExtensionHistoryRegistry([duplicate, duplicate]))
      .toThrow("Повторная классификация")
  })
})
