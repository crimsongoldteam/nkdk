import { describe, expect, it } from "vitest"
import { TopLevelMetadataItemRules } from "./configuration/topLevelRules"

const expectedItemTypes = [
  "MetadataFunctionalOption",
  "MetadataRole",
  "MetadataScheduledJob",
  "MetadataLanguage",
  "MetadataCommonTemplate",
  "MetadataCommonPicture",
  "MetadataStyle",
  "MetadataCommandGroup",
  "MetadataSubsystem",
  "MetadataAccountingRegister",
  "MetadataBusinessProcess",
  "MetadataCalculationRegister",
  "MetadataChartOfAccounts",
  "MetadataChartOfCalculationTypes",
  "MetadataChartOfCharacteristicTypes",
  "MetadataCommonForm",
  "MetadataIntegrationService",
  "MetadataTask",
  "MetadataWebService",
  "MetadataCommonModule",
  "MetadataXDTOPackage",
  "MetadataWebSocketClient",
  "MetadataExternalDataSource",
]

describe("new applied object rules are registered as top-level rules", () => {
  it.each(expectedItemTypes)("registers %s", (itemType) => {
    expect(TopLevelMetadataItemRules.some((rule) => rule.itemType === itemType)).toBe(true)
  })
})
