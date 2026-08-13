import { describe, expect, it } from "vitest"
import { configurationExtensionStructureDocument } from "../../ruleRuntime/property/configurationExtensionStructureFacts"
import { validateConfigurationExtensionHistory } from "./historyValidation"

describe("configuration extension data history", () => {
  const structureRoot = (compatibilityMode: string) => configurationExtensionStructureDocument({
    itemType: "MetadataConfigurationExtension",
    logicalAddress: "Configuration",
    workingProjectPath: "Конфигурация.yaml",
    compatibilityMode,
  })
  it.each([
    ["MetadataCatalog", "Версия8_3_10", false],
    ["MetadataCatalog", "Версия8_3_11", false],
    ["MetadataChartOfAccounts", "Версия8_3_11", false],
    ["MetadataChartOfAccounts", "Версия8_3_12", false],
    ["MetadataConstant", "Версия8_3_12", false],
    ["MetadataConstant", "Версия8_3_13", false],
    ["MetadataCatalog", "НеИспользовать", false],
  ] as const)("checks %s in %s", (itemType, compatibilityMode, allowed) => {
    const root = structureRoot(compatibilityMode)
    const own = configurationExtensionStructureDocument({
      itemType,
      logicalAddress: `${itemType}.Новый`,
      workingProjectPath: "Объект/Новый/Свойства.yaml",
      dataHistory: "Использовать",
    })
    const diagnostics = validate(root, own, "cfe/X/Объект/Новый/Свойства.yaml")
    expect(diagnostics.length === 0).toBe(allowed)
  })

  it("allows data history for a borrowed object after its version boundary", () => {
    const root = structureRoot("Версия8_3_11")
    const borrowed = configurationExtensionStructureDocument({
      itemType: "MetadataCatalog", logicalAddress: "Catalog.Базовый",
      workingProjectPath: "Справочник/Базовый/Свойства.yaml", dataHistory: "Использовать",
    })
    expect(validate(root, borrowed, "cfe/X/Справочник/Базовый/Свойства.yaml", true)).toEqual([])
  })

  it("не применяет матрицу истории к объекту без включённой истории данных", () => {
    const root = structureRoot("Версия8_3_10")
    const own = configurationExtensionStructureDocument({
      itemType: "MetadataCatalog", logicalAddress: "Catalog.Новый",
      workingProjectPath: "Справочник/Новый/Свойства.yaml", dataHistory: "НеИспользовать",
    })
    expect(validate(root, own, "cfe/X/Справочник/Новый/Свойства.yaml")).toEqual([])
  })

  it.each([
    "MetadataCommonAttribute",
    "MetadataExternalDataSourceCubeDimension",
    "MetadataExternalDataSourceCubeResource",
    "StandardAttributeDescription",
  ])("всегда запрещает собственное поле истории данных %s", (itemType) => {
    const root = structureRoot("Версия8_3_27")
    const own = configurationExtensionStructureDocument({
      itemType,
      logicalAddress: `${itemType}.Новый`,
      workingProjectPath: "Объект/Новый/Свойства.yaml",
      dataHistory: "Использовать",
    })
    expect(validate(root, own, "cfe/X/Объект/Новый/Свойства.yaml"))
      .toEqual([expect.objectContaining({ severity: "error" })])
  })

  it.each([
    ["Версия8_3_26", 5, true],
    ["Версия8_3_26", 9, false],
    ["Версия8_3_27", 9, true],
  ] as const)("checks line number length in %s", (compatibilityMode, lineNumberLength, allowed) => {
    const root = structureRoot(compatibilityMode)
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
  hasBase = false,
) {
  return validateConfigurationExtensionHistory({
    facts: [
      { componentPath: "cfe/X", projectPath: "cfe/X/Конфигурация.yaml", entry: root },
      { componentPath: "cfe/X", projectPath: subjectPath, entry: subject },
    ],
    projectDir: "/project",
    queryPort: {
      readStructuredDocumentEntries: ({ logicalAddress }) => hasBase && logicalAddress === subject.logicalAddress
        ? [subject]
        : [],
      readDependencyInputs: () => [],
      readDependencyOwnerInputs: () => [],
    },
  })
}
