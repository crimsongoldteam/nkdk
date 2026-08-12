import { describe, expect, it } from "vitest"

import { createPropertyStateCapabilityRegistry } from "./propertyStateCapabilities"
import { configurationExtensionPropertyStateCapabilities } from "./propertyStateRules"

describe("матрица PropertyState расширения", () => {
  const registry = createPropertyStateCapabilityRegistry(
    configurationExtensionPropertyStateCapabilities,
  )

  it.each([
    ["MetadataCatalog", "codeLength"],
    ["MetadataDocument", "numerator"],
    ["MetadataTask", "addressing"],
    ["MetadataExternalDataSourceTable", "nameInDataSource"],
  ])("разрешает все режимы для %s.%s", (itemType, propertyKey) => {
    expect(registry.resolve({ itemType, propertyKey })?.modes).toEqual([
      "control",
      "notify",
      "extend",
    ])
  })

  it.each([
    ["MetadataChartOfCharacteristicTypes", "type"],
    ["MetadataStyleItem", "value"],
    ["MetadataLanguage", "languageCode"],
    ["MetadataConfigurationExtension", "compatibilityMode"],
  ])("контролирует %s.%s", (itemType, propertyKey) => {
    expect(registry.resolve({ itemType, propertyKey })?.modes).toEqual([
      "control",
      "notify",
    ])
  })

  it("разрешает собственный состав движений заимствованного документа", () => {
    expect(registry.resolve({ itemType: "MetadataDocument", propertyKey: "registerRecords" }))
      .toEqual({ availability: "own", modes: [] })
  })

  it("разрешает содержимое вынесенной общей формы", () => {
    expect(registry.resolve({ itemType: "MetadataCommonForm", propertyKey: "form" }))
      .toEqual({ availability: "own", modes: [] })
  })

  it("различает группу общей и объектной команды", () => {
    expect(registry.resolve({ itemType: "MetadataCommonCommand", propertyKey: "group" })?.modes)
      .toEqual(["control", "notify", "extend"])
    expect(registry.resolve({ itemType: "MetadataCommand", propertyKey: "group" })?.modes)
      .toEqual(["control", "notify"])
  })

  it("не переносит возможность по совпадению имени свойства", () => {
    expect(registry.resolve({ itemType: "MetadataCatalog", propertyKey: "formType" })).toBeUndefined()
    expect(registry.resolve({ itemType: "MetadataCommonPicture", propertyKey: "choiceMode" })).toBeUndefined()
  })

  it.each([
    "MetadataCatalog",
    "MetadataExchangePlan",
    "MetadataDocument",
    "MetadataDocumentNumerator",
    "MetadataChartOfCharacteristicTypes",
    "MetadataChartOfAccounts",
    "MetadataChartOfCalculationTypes",
    "MetadataBusinessProcess",
    "MetadataTask",
    "MetadataDocumentJournal",
    "MetadataInformationRegister",
    "MetadataAccumulationRegister",
    "MetadataAccountingRegister",
    "MetadataCalculationRegister",
    "MetadataConstant",
    "MetadataStyleItem",
    "MetadataCommandGroup",
    "MetadataCommand",
    "MetadataCommonCommand",
    "MetadataExternalDataSourceTable",
    "MetadataExternalDataSourceField",
    "MetadataExternalDataSourceCube",
    "MetadataExternalDataSourceDimensionTable",
    "MetadataExternalDataSourceCubeResource",
    "MetadataExternalDataSourceFunction",
    "MetadataRegisterAttribute",
    "MetadataRegisterDimension",
    "MetadataRegisterResource",
    "MetadataSequenceDimension",
    "MetadataDocumentJournalColumn",
    "MetadataAttribute",
    "MetadataTabularSection",
    "MetadataTaskAddressingAttribute",
    "MetadataSubsystem",
    "MetadataCommonModule",
    "MetadataRole",
    "MetadataCommonAttribute",
    "MetadataFunctionalOption",
    "MetadataFunctionalOptionsParameter",
    "MetadataDefinedType",
    "MetadataFilterCriterion",
    "MetadataSessionParameter",
    "MetadataEventSubscription",
    "MetadataScheduledJob",
    "MetadataBot",
    "MetadataSettingsStorage",
    "MetadataDataProcessor",
    "MetadataReport",
    "MetadataCommonForm",
    "MetadataCommonPicture",
    "MetadataCommonTemplate",
    "MetadataStyle",
    "MetadataLanguage",
    "MetadataWebService",
    "MetadataHTTPService",
    "MetadataIntegrationService",
    "MetadataWebSocketClient",
    "MetadataWSReference",
    "MetadataXDTOPackage",
    "MetadataExternalDataSource",
    "MetadataConfigurationExtension",
  ])("содержит закрытую запись вида %s", (itemType) => {
    expect(registry.item(itemType)).toBeDefined()
  })
})
