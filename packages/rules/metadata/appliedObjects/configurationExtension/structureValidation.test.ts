import { describe, expect, it } from "vitest"
import { validateConfigurationExtensionStructure } from "./structureValidation"
import { configurationExtensionStructureDocument } from "../../ruleRuntime/property/configurationExtensionStructureFacts"

describe("configuration extension structure validation", () => {
  const baseConfiguration = configurationExtensionStructureDocument({
    itemType: "MetadataConfiguration", logicalAddress: "Configuration",
    workingProjectPath: "Конфигурация.yaml",
  })
  const emptyQueryPort = {
    readStructuredDocumentEntries: ({ logicalAddress }: { logicalAddress?: string }) =>
      logicalAddress === "Configuration" ? [baseConfiguration] : [],
    readDependencyInputs: () => [],
    readDependencyOwnerInputs: () => [],
  }
  const queryWithParent = (parent: ReturnType<typeof configurationExtensionStructureDocument>) => ({
    readStructuredDocumentEntries: ({ logicalAddress }: { logicalAddress?: string }) => logicalAddress === "Configuration"
      ? [baseConfiguration]
      : logicalAddress === parent.logicalAddress ? [parent] : [],
    readDependencyInputs: () => [],
    readDependencyOwnerInputs: () => [],
  })
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
      queryPort: queryWithParent(baseConfiguration),
    })

    expect(diagnostics).toEqual([expect.objectContaining({
      filePath: "cfe/X/Объект/Новый/Свойства.yaml",
      severity: "error",
      source: "structure",
    })])
  })

  it("requires the extended configuration index", () => {
    const root = configurationExtensionStructureDocument({
      itemType: "MetadataConfigurationExtension", logicalAddress: "Configuration",
      workingProjectPath: "Конфигурация.yaml",
    })
    expect(validateConfigurationExtensionStructure({
      facts: [{ componentPath: "cfe/X", projectPath: "cfe/X/Конфигурация.yaml", entry: root }],
      projectDir: "/project", queryPort: {
        readStructuredDocumentEntries: () => [],
        readDependencyInputs: () => [],
        readDependencyOwnerInputs: () => [],
      },
    })).toEqual([expect.objectContaining({ severity: "error", source: "structure" })])
  })

  it.each([
    ["MetadataWebService", "Версия8_3_6", false],
    ["MetadataWebService", "Версия8_3_7", true],
    ["MetadataCommonForm", "Версия8_3_7", false],
    ["MetadataCommonForm", "Версия8_3_8", true],
    ["MetadataCommonModule", "Версия8_3_8", false],
    ["MetadataCommonModule", "Версия8_3_9", true],
    ["MetadataCatalog", "Версия8_3_10", false],
    ["MetadataCatalog", "Версия8_3_11", true],
    ["MetadataEnumeration", "Версия8_3_11", false],
    ["MetadataEnumeration", "Версия8_3_12", true],
    ["MetadataChartOfAccounts", "Версия8_3_12", false],
    ["MetadataChartOfAccounts", "Версия8_3_13", true],
    ["MetadataSessionParameter", "Версия8_3_13", false],
    ["MetadataSessionParameter", "Версия8_3_14", true],
    ["MetadataConstant", "Версия8_3_15", false],
    ["MetadataConstant", "Версия8_3_16", true],
    ["MetadataDefinedType", "Версия8_3_19", false],
    ["MetadataDefinedType", "Версия8_3_20", true],
    ["MetadataCatalog", "НеИспользовать", true],
  ] as const)("checks own %s availability in %s", (itemType, compatibilityMode, allowed) => {
    const root = configurationExtensionStructureDocument({
      itemType: "MetadataConfigurationExtension", logicalAddress: "Configuration",
      workingProjectPath: "Конфигурация.yaml", compatibilityMode,
    })
    const own = configurationExtensionStructureDocument({
      itemType, logicalAddress: `${itemType}.Новый`, workingProjectPath: "Объект/Новый/Свойства.yaml",
    })
    const diagnostics = validateConfigurationExtensionStructure({
      facts: [
        { componentPath: "cfe/X", projectPath: "cfe/X/Конфигурация.yaml", entry: root },
        { componentPath: "cfe/X", projectPath: "cfe/X/Объект/Новый/Свойства.yaml", entry: own },
      ],
      projectDir: "/project",
      queryPort: emptyQueryPort,
    })
    expect(diagnostics.length === 0).toBe(allowed)
  })

  it("forbids moving a borrowed subsystem into an own subsystem", () => {
    const ownParent = configurationExtensionStructureDocument({
      itemType: "MetadataSubsystem", logicalAddress: "Subsystem.Своя",
      workingProjectPath: "Подсистема/Своя/Свойства.yaml",
    })
    const movedBorrowed = configurationExtensionStructureDocument({
      itemType: "MetadataSubsystem", logicalAddress: "Subsystem.Своя.Subsystem.Базовая",
      workingProjectPath: "Подсистема/Своя/Подсистема/Базовая/Свойства.yaml",
    })
    const base = configurationExtensionStructureDocument({
      itemType: "MetadataSubsystem", logicalAddress: "Subsystem.Базовая",
      workingProjectPath: "Подсистема/Базовая/Свойства.yaml",
    })
    const diagnostics = validateConfigurationExtensionStructure({
      facts: [
        { componentPath: "cfe/X", projectPath: "cfe/X/Подсистема/Своя/Свойства.yaml", entry: ownParent },
        { componentPath: "cfe/X", projectPath: "cfe/X/Подсистема/Своя/Подсистема/Базовая/Свойства.yaml", entry: movedBorrowed },
      ],
      projectDir: "/project",
      queryPort: {
        readStructuredDocumentEntries: ({ logicalAddress }) => logicalAddress === "Subsystem.Базовая" ? [base] : [],
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
      queryPort: emptyQueryPort,
    })).toEqual([])
  })

  it("allows an own child with the same name under another own parent", () => {
    const ownService = configurationExtensionStructureDocument({
      itemType: "MetadataWebService", logicalAddress: "WebService.Свой",
      workingProjectPath: "WebСервис/Свой/Свойства.yaml",
    })
    const movedOperation = configurationExtensionStructureDocument({
      itemType: "MetadataWebServiceOperation",
      logicalAddress: "WebService.Свой.Operation.Получить",
      workingProjectPath: "WebСервис/Свой/Операция/Получить/Свойства.yaml",
    })
    const originalOperation = configurationExtensionStructureDocument({
      itemType: "MetadataWebServiceOperation",
      logicalAddress: "WebService.Базовый.Operation.Получить",
      workingProjectPath: "WebСервис/Базовый/Операция/Получить/Свойства.yaml",
    })
    const diagnostics = validateConfigurationExtensionStructure({
      facts: [
        { componentPath: "cf", projectPath: "cf/WebСервис/Базовый/Операция/Получить/Свойства.yaml", entry: originalOperation },
        { componentPath: "cfe/X", projectPath: "cfe/X/WebСервис/Свой/Свойства.yaml", entry: ownService },
        { componentPath: "cfe/X", projectPath: "cfe/X/WebСервис/Свой/Операция/Получить/Свойства.yaml", entry: movedOperation },
      ],
      projectDir: "/project",
      queryPort: emptyQueryPort,
    })

    expect(diagnostics).toEqual([])
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
      queryPort: queryWithParent(parent),
    })
    expect(diagnostics.length === 0).toBe(allowed)
  })

  it.each([
    ["Версия8_3_8", false],
    ["Версия8_3_9", true],
  ] as const)("checks own integration service channel in %s", (compatibilityMode, allowed) => {
    const root = configurationExtensionStructureDocument({
      itemType: "MetadataConfigurationExtension", logicalAddress: "Configuration",
      workingProjectPath: "Конфигурация.yaml", compatibilityMode,
    })
    const parent = configurationExtensionStructureDocument({
      itemType: "MetadataIntegrationService", logicalAddress: "IntegrationService.Один",
      workingProjectPath: "СервисИнтеграции/Один/Свойства.yaml",
    })
    const child = configurationExtensionStructureDocument({
      itemType: "MetadataIntegrationServiceChannel",
      logicalAddress: "IntegrationService.Один.Channel.Новый",
      workingProjectPath: "СервисИнтеграции/Один/Каналы/Новый/Свойства.yaml",
    })
    const diagnostics = validateConfigurationExtensionStructure({
      facts: [
        { componentPath: "cfe/X", projectPath: "cfe/X/Конфигурация.yaml", entry: root },
        { componentPath: "cfe/X", projectPath: "cfe/X/child.yaml", entry: child },
      ],
      projectDir: "/project",
      queryPort: queryWithParent(parent),
    })
    expect(diagnostics.length === 0).toBe(allowed)
  })

  it("forbids an own exchange plan used in a distributed infobase", () => {
    const entry = configurationExtensionStructureDocument({
      itemType: "MetadataExchangePlan", logicalAddress: "ExchangePlan.Новый",
      workingProjectPath: "ПланОбмена/Новый/Свойства.yaml", distributedInfoBase: true,
    })
    expect(validateConfigurationExtensionStructure({
      facts: [{ componentPath: "cfe/X", projectPath: "cfe/X/ПланОбмена/Новый/Свойства.yaml", entry }],
      projectDir: "/project", queryPort: emptyQueryPort,
    })).toEqual([expect.objectContaining({
      severity: "error", path: "/РаспределеннаяИнформационнаяБаза",
    })])
  })

  it.each([
    ["Версия8_3_19", false],
    ["Версия8_3_20", true],
  ] as const)("checks type sets and defined types in %s", (compatibilityMode, allowed) => {
    const root = configurationExtensionStructureDocument({
      itemType: "MetadataConfigurationExtension", logicalAddress: "Configuration",
      workingProjectPath: "Конфигурация.yaml", compatibilityMode,
    })
    const entry = configurationExtensionStructureDocument({
      itemType: "MetadataConstant", logicalAddress: "Constant.Новая",
      workingProjectPath: "Константа/Новая/Свойства.yaml", usesRestrictedTypes: true,
    })
    const diagnostics = validateConfigurationExtensionStructure({
      facts: [
        { componentPath: "cfe/X", projectPath: "cfe/X/Конфигурация.yaml", entry: root },
        { componentPath: "cfe/X", projectPath: "cfe/X/Константа/Новая/Свойства.yaml", entry },
      ],
      projectDir: "/project", queryPort: emptyQueryPort,
    })
    expect(diagnostics.length === 0).toBe(allowed)
  })
})
