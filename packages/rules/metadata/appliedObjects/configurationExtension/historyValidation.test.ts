import { describe, expect, it } from "vitest"
import { configurationExtensionStructureDocument } from "../../ruleRuntime/property/configurationExtensionStructureFacts"
import { validateConfigurationExtensionHistory } from "./historyValidation"

describe("configuration extension data history", () => {
  it.each([
    ["MetadataCatalog", "Версия8_3_10", false],
    ["MetadataCatalog", "Версия8_3_11", true],
    ["MetadataChartOfAccounts", "Версия8_3_11", false],
    ["MetadataChartOfAccounts", "Версия8_3_12", true],
    ["MetadataConstant", "Версия8_3_12", false],
    ["MetadataConstant", "Версия8_3_13", true],
    ["MetadataCatalog", "НеИспользовать", true],
  ] as const)("checks %s in %s", (itemType, compatibilityMode, allowed) => {
    const root = configurationExtensionStructureDocument({
      itemType: "MetadataConfigurationExtension",
      logicalAddress: "Configuration",
      workingProjectPath: "Конфигурация.yaml",
      compatibilityMode,
    })
    const own = configurationExtensionStructureDocument({
      itemType,
      logicalAddress: `${itemType}.Новый`,
      workingProjectPath: "Объект/Новый/Свойства.yaml",
    })
    const diagnostics = validate(root, own, "cfe/X/Объект/Новый/Свойства.yaml")
    expect(diagnostics.length === 0).toBe(allowed)
  })

  it.each([
    ["Версия8_3_26", 5, true],
    ["Версия8_3_26", 9, false],
    ["Версия8_3_27", 9, true],
  ] as const)("checks line number length in %s", (compatibilityMode, lineNumberLength, allowed) => {
    const root = configurationExtensionStructureDocument({
      itemType: "MetadataConfigurationExtension", logicalAddress: "Configuration",
      workingProjectPath: "Конфигурация.yaml", compatibilityMode,
    })
    const section = configurationExtensionStructureDocument({
      itemType: "MetadataTabularSection", logicalAddress: "Catalog.Один.TabularSection.Новая",
      workingProjectPath: "Справочник/Один/Свойства.yaml", lineNumberLength,
    })
    const diagnostics = validate(root, section, "cfe/X/Справочник/Один/Свойства.yaml")
    expect(diagnostics.length === 0).toBe(allowed)
  })
})

function validate(
  root: ReturnType<typeof configurationExtensionStructureDocument>,
  subject: ReturnType<typeof configurationExtensionStructureDocument>,
  subjectPath: string,
) {
  return validateConfigurationExtensionHistory({
    facts: [
      { componentPath: "cfe/X", projectPath: "cfe/X/Конфигурация.yaml", entry: root },
      { componentPath: "cfe/X", projectPath: subjectPath, entry: subject },
    ],
    projectDir: "/project",
    queryPort: {
      readStructuredDocumentEntries: () => [],
      readDependencyInputs: () => [],
      readDependencyOwnerInputs: () => [],
    },
  })
}
