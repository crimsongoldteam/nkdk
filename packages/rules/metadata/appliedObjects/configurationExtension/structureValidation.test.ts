import { describe, expect, it } from "vitest"
import { validateConfigurationExtensionStructure } from "./structureValidation"
import { configurationExtensionStructureDocument } from "./structureValidation"

describe("configuration extension structure validation", () => {
  it.each([
    "MetadataCommonAttribute",
    "MetadataBot",
    "MetadataSettingsStorage",
    "MetadataLanguage",
    "MetadataWebSocketClient",
  ])("forbids own %s", (itemType) => {
    const entry = configurationExtensionStructureDocument({
      itemType,
      logicalAddress: `${itemType}.Новый`,
      workingProjectPath: "Объект/Новый/Свойства.yaml",
    })
    const diagnostics = validateConfigurationExtensionStructure({
      facts: [{ componentPath: "cfe/X", projectPath: "cfe/X/Объект/Новый/Свойства.yaml", entry }],
      projectDir: "/project",
      queryPort: {
        readStructuredDocumentEntries: () => [],
        readDependencyInputs: () => [],
        readDependencyOwnerInputs: () => [],
      },
    })

    expect(diagnostics).toEqual([expect.objectContaining({ severity: "error", source: "structure" })])
  })

  it("allows an own subsystem", () => {
    const entry = configurationExtensionStructureDocument({
      itemType: "MetadataSubsystem",
      logicalAddress: "Subsystem.Новая",
      workingProjectPath: "Подсистема/Новая/Свойства.yaml",
    })
    expect(validateConfigurationExtensionStructure({
      facts: [{ componentPath: "cfe/X", projectPath: "cfe/X/Подсистема/Новая/Свойства.yaml", entry }],
      projectDir: "/project",
      queryPort: {
        readStructuredDocumentEntries: () => [],
        readDependencyInputs: () => [],
        readDependencyOwnerInputs: () => [],
      },
    })).toEqual([])
  })

  it.each([
    ["MetadataWebService", "MetadataWebServiceOperation", false],
    ["MetadataIntegrationService", "MetadataIntegrationServiceChannel", true],
    ["MetadataInformationRegister", "MetadataRegisterDimension", false],
  ] as const)("checks own child of borrowed %s", (parentType, childType, allowed) => {
    const parent = configurationExtensionStructureDocument({
      itemType: parentType,
      logicalAddress: "Parent.Один",
      workingProjectPath: "Родитель/Один/Свойства.yaml",
    })
    const child = configurationExtensionStructureDocument({
      itemType: childType,
      logicalAddress: "Parent.Один.Child.Новый",
      workingProjectPath: "Родитель/Один/Дети/Новый/Свойства.yaml",
    })
    const diagnostics = validateConfigurationExtensionStructure({
      facts: [{ componentPath: "cfe/X", projectPath: "cfe/X/child.yaml", entry: child }],
      projectDir: "/project",
      queryPort: {
        readStructuredDocumentEntries: ({ logicalAddress }) => logicalAddress === parent.logicalAddress ? [parent] : [],
        readDependencyInputs: () => [],
        readDependencyOwnerInputs: () => [],
      },
    })
    expect(diagnostics.length === 0).toBe(allowed)
  })
})
