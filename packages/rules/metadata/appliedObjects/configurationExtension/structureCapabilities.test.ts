import { describe, expect, it } from "vitest"

import { createConfigurationExtensionStructureRegistry } from "./structureCapabilities"

describe("ограничения структуры расширения", () => {
  const registry = createConfigurationExtensionStructureRegistry()

  it.each([
    ["MetadataCommonAttribute", false],
    ["MetadataBot", false],
    ["MetadataSettingsStorage", false],
    ["MetadataLanguage", false],
    ["MetadataWebSocketClient", false],
    ["MetadataCatalog", true],
  ] as const)("определяет возможность собственного объекта %s", (itemType, allowed) => {
    expect(registry.resolve(itemType)?.ownObject).toBe(allowed)
  })

  it.each([
    ["MetadataWebService", "operations"],
    ["MetadataWebServiceOperation", "parameters"],
    ["MetadataHTTPService", "urlTemplates"],
    ["MetadataHTTPServiceURLTemplate", "methods"],
    ["MetadataDocumentJournal", "columns"],
    ["MetadataChartOfCharacteristicTypes", "attributes"],
    ["MetadataChartOfAccounts", "accountingFlags"],
    ["MetadataChartOfCalculationTypes", "tabularSections"],
    ["MetadataInformationRegister", "dimensions"],
    ["MetadataCalculationRegister", "recalculations"],
  ])("запрещает собственные %s.%s у заимствованного владельца", (itemType, collection) => {
    expect(registry.allowsOwnBorrowedChild(itemType, collection)).toBe(false)
  })

  it("разрешает собственный канал заимствованного сервиса интеграции", () => {
    expect(registry.allowsOwnBorrowedChild("MetadataIntegrationService", "channels")).toBe(true)
  })

  it("определяет заимствованного ребёнка по виду и имени", () => {
    expect(registry.classifyChild({ itemType: "MetadataCommand", name: "Печать" }, [
      { itemType: "MetadataCommand", name: "Печать" },
    ])).toBe("borrowed")
    expect(registry.classifyChild({ itemType: "MetadataCommand", name: "Новая" }, [
      { itemType: "MetadataCommand", name: "Печать" },
    ])).toBe("own")
  })
})
