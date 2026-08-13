import { describe, expect, it } from "vitest"

import { createPropertyStateCapabilityRegistry } from "./propertyStateCapabilities"
import { configurationExtensionPropertyStateCapabilities } from "./propertyStateRules"
import { configurationExtensionPropertyStateRules } from "./propertyStateRules"

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
      .toEqual({ availability: "borrowed", modes: ["extend"], representation: "section", externalName: "Форма" })
  })

  it("различает группу общей и объектной команды", () => {
    expect(registry.resolve({ itemType: "MetadataCommonCommand", propertyKey: "group" })?.modes)
      .toEqual(["control", "notify", "extend"])
    expect(registry.resolve({ itemType: "MetadataCommand", propertyKey: "group" })?.modes)
      .toEqual(["control", "notify"])
  })

  it("контролирует тип и состав критерия отбора", () => {
    expect(registry.resolve({ itemType: "MetadataFilterCriterion", propertyKey: "type" })?.modes)
      .toEqual(["control", "notify"])
    expect(registry.resolve({ itemType: "MetadataFilterCriterion", propertyKey: "content" })?.modes)
      .toEqual(["control", "notify"])
  })

  it("считает тип функции внешнего источника собственным", () => {
    expect(registry.resolve({ itemType: "MetadataExternalDataSourceFunction", propertyKey: "type" }))
      .toEqual({ availability: "own", modes: [] })
  })

  it("подключает вынесенные модули через общий профиль", () => {
    expect(registry.resolve({ itemType: "MetadataTask", propertyKey: "objectModule" }))
      .toEqual({
        availability: "borrowed",
        modes: ["extend"],
        representation: "section",
        externalName: "МодульОбъекта",
      })
    expect(registry.resolve({ itemType: "MetadataCommand", propertyKey: "commandModule" })?.modes)
      .toEqual(["extend"])
    expect(registry.resolve({ itemType: "MetadataEnumeration", propertyKey: "managerModule" })?.modes)
      .toEqual(["extend"])
    expect(registry.resolve({ itemType: "MetadataExternalDataSourceTable", propertyKey: "managerModule" })?.modes)
      .toEqual(["extend"])
    expect(registry.resolve({ itemType: "MetadataExternalDataSourceTable", propertyKey: "recordSetModule" })?.modes)
      .toEqual(["extend"])
    expect(registry.resolve({ itemType: "MetadataCommand", propertyKey: "objectModule" }))
      .toBeUndefined()
  })

  it("регистрирует подтверждённые переносчики недопустимого PropertyState", () => {
    expect(configurationExtensionPropertyStateRules.explicitXMLProperties)
      .toHaveProperty("MetadataChartOfAccounts.codeLength")
    expect(configurationExtensionPropertyStateRules.explicitXMLProperties)
      .toHaveProperty("MetadataChartOfAccounts.descriptionLength")
  })

  it("не переносит возможность по совпадению имени свойства", () => {
    expect(registry.resolve({ itemType: "MetadataCatalog", propertyKey: "formType" })).toBeUndefined()
    expect(registry.resolve({ itemType: "MetadataCommonPicture", propertyKey: "choiceMode" })).toBeUndefined()
  })

  it.each([
    ["MetadataAttribute", "type"],
    ["MetadataRegisterAttribute", "type"],
    ["MetadataRegisterDimension", "type"],
    ["MetadataRegisterResource", "type"],
    ["MetadataTaskAddressingAttribute", "type"],
  ])("keeps MultiState for %s.%s", (itemType, propertyKey) => {
    expect(registry.resolve({ itemType, propertyKey })).toMatchObject({
      representation: "multi",
      modes: ["control", "notify", "extend", "multi"],
    })
  })

  it("treats the style item value as changed by the extension", () => {
    expect(registry.resolve({ itemType: "MetadataStyleItem", propertyKey: "value" }))
      .toEqual({ availability: "borrowed", modes: ["extend"], representation: "plain" })
  })

  it("applies the confirmed compatibility boundaries", () => {
    expect(registry.resolve({
      itemType: "MetadataCatalog", propertyKey: "codeLength", compatibilityMode: "Версия8_3_7",
    })).toBeUndefined()
    expect(registry.resolve({
      itemType: "MetadataCatalog", propertyKey: "codeLength", compatibilityMode: "Версия8_3_8",
    })?.modes).toEqual(["control", "extend"])
    expect(registry.resolve({
      itemType: "MetadataAttribute", propertyKey: "type", compatibilityMode: "Версия8_3_17",
    })?.modes).toEqual(["control", "notify"])
    expect(registry.resolve({
      itemType: "MetadataAttribute", propertyKey: "type", compatibilityMode: "Версия8_3_18",
    })?.modes).toEqual(["control", "notify", "extend", "multi"])
    expect(registry.resolve({
      itemType: "MetadataConfigurationExtension", propertyKey: "defaultRoles", compatibilityMode: "Версия8_3_13",
    })).toBeUndefined()
    expect(registry.resolve({
      itemType: "MetadataConfigurationExtension", propertyKey: "defaultRoles", compatibilityMode: "Версия8_3_14",
    })?.modes).toEqual(["extend"])
    expect(registry.resolve({
      itemType: "MetadataCatalog", propertyKey: "hierarchical", compatibilityMode: "Версия8_3_14",
    })?.modes).toEqual(["control"])
    expect(registry.resolve({
      itemType: "MetadataCatalog", propertyKey: "hierarchical", compatibilityMode: "Версия8_3_15",
    })?.modes).toEqual(["control", "notify"])
  })

  it.each([
    "MetadataCatalog",
    "MetadataExchangePlan",
    "MetadataDocument",
    "MetadataDocumentNumerator",
    "MetadataEnumeration",
    "MetadataEnumerationValue",
    "MetadataSequence",
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
