import { describe, expect, it } from "vitest"
import type { ProjectStateStructuredDocumentFact } from "../../projectState/contracts/dependencyValidation"
import type { ProjectStateStructuredDocumentEntry } from "../../projectState/fileUpdate"
import {
  CONFIGURATION_EXTENSION_PROPERTY_STATE_DOCUMENT,
  type ConfigurationExtensionPropertyStateFactPayload,
} from "../../ruleRuntime/property/propertyStateFacts"
import { validateConfigurationExtensionPropertyStates } from "./propertyStateValidation"
import { configurationExtensionStructureDocument } from "../../ruleRuntime/property/configurationExtensionStructureFacts"

describe("configuration extension PropertyState validation", () => {
  const externalFileFact = (mode: ConfigurationExtensionPropertyStateFactPayload["mode"]) =>
    fact("cfe/X", entry(payload(mode, { externalProjectPath: "Пакет/Package.bin" })))
  const baseExternalFile = entry(payload("control", { externalProjectPath: "Пакет/Package.bin" }))
  it.each([
    ["control", 2, "error"],
    ["notify", 2, "warning"],
    ["extend", 2, undefined],
    ["xml", 2, undefined],
    ["control", 1, undefined],
  ] as const)("validates %s mode", (mode, extensionValue, severity) => {
    const extension = fact("cfe/X", entry(payload(mode, extensionValue)))
    const base = entry(payload("control", 1))
    const diagnostics = validateConfigurationExtensionPropertyStates({
      facts: [extension],
      projectDir: "/project",
      queryPort: queryPort([base]),
    })

    expect(diagnostics.map((diagnostic) => diagnostic.severity)).toEqual(
      severity === undefined ? [] : [severity],
    )
  })

  it("reports a missing base property", () => {
    const missing = { ...payload("extend", 2), explicitMode: true } as const
    const diagnostics = validateConfigurationExtensionPropertyStates({
      facts: [fact("cfe/X", entry(missing))],
      projectDir: "/project",
      queryPort: queryPort([]),
    })

    expect(diagnostics).toEqual([expect.objectContaining({
      severity: "error",
      message: expect.stringContaining("основной конфигурации"),
      path: "/Поле",
    })])
  })

  it("validates MultiState parts independently", () => {
    const extension = payload("multi", [
      { mode: "control", value: "Число" },
      { mode: "notify", value: "Дата" },
      { mode: "extend", value: "Булево" },
    ])
    const base = payload("multi", [{ mode: "control", value: "Строка" }])
    const diagnostics = validateConfigurationExtensionPropertyStates({
      facts: [fact("cfe/X", entry(extension))],
      projectDir: "/project",
      queryPort: queryPort([entry(base)]),
    })

    expect(diagnostics.map(({ severity }) => severity)).toEqual(["error", "warning"])
  })

  it("uses the extension compatibility mode for the capability matrix", () => {
    const property = fact("cfe/X", entry({
      version: 1,
      itemType: "MetadataCatalog",
      propertyKey: "codeLength",
      mode: "extend",
      value: 10,
    }))
    const root = fact("cfe/X", configurationExtensionStructureDocument({
      itemType: "MetadataConfigurationExtension",
      logicalAddress: "Конфигурация",
      workingProjectPath: "Конфигурация.yaml",
      compatibilityMode: "Версия8_3_7",
    }))

    const diagnostics = validateConfigurationExtensionPropertyStates({
      facts: [root, property],
      projectDir: "/project",
      queryPort: queryPort([entry({
        version: 1,
        itemType: "MetadataCatalog",
        propertyKey: "codeLength",
        mode: "control",
        value: 9,
      })]),
    })

    expect(diagnostics).toEqual([expect.objectContaining({
      severity: "error",
      message: expect.stringContaining("Версия8_3_7"),
    })])
  })

  it.each([
    ["control", 2n, "error"],
    ["notify", 2n, "warning"],
    ["extend", 2n, undefined],
    ["control", 1n, undefined],
  ] as const)("validates an external file in %s mode", (mode, extensionHash, severity) => {
    const extension = externalFileFact(mode)
    const diagnostics = validateConfigurationExtensionPropertyStates({
      facts: [extension],
      projectDir: "/project",
      queryPort: {
        ...queryPort([baseExternalFile]),
        readFileHash: ({ componentPath }: { componentPath: string }) => componentPath === "cf" ? 1n : extensionHash,
      },
    })
    expect(diagnostics.map(({ severity: actual }) => actual)).toEqual(severity === undefined ? [] : [severity])
  })

  it("requires the external file named in a section", () => {
    const diagnostics = validateConfigurationExtensionPropertyStates({
      facts: [externalFileFact("extend")], projectDir: "/project",
      queryPort: { ...queryPort([baseExternalFile]), readFileHash: () => undefined },
    })
    expect(diagnostics).toEqual([expect.objectContaining({ severity: "error", message: expect.stringContaining("Отсутствует") })])
  })

  it.each([
    ["Булево", 0],
    ["Строка(10)", 1],
  ] as const)("validates functional-option content by the location type %s", (type, diagnosticCount) => {
    const logicalAddress = "FunctionalOption.Опция"
    const extensionEntry = {
      ...entry({
        version: 1,
        itemType: "MetadataFunctionalOption",
        propertyKey: "content",
        mode: "extend",
        value: ["Catalog.Товары"],
      }),
      logicalAddress,
      name: "content",
    }
    const baseProperty = {
      ...entry({
        version: 1,
        itemType: "MetadataFunctionalOption",
        propertyKey: "content",
        mode: "control",
        value: [],
      }),
      logicalAddress,
      name: "content",
    }
    const baseOption = configurationExtensionStructureDocument({
      itemType: "MetadataFunctionalOption",
      logicalAddress,
      workingProjectPath: "ФункциональнаяОпция/Опция.yaml",
      location: "Constant.Флаг",
    })
    const baseLocation = configurationExtensionStructureDocument({
      itemType: "MetadataConstant",
      logicalAddress: "Constant.Флаг",
      workingProjectPath: "Константа/Флаг/Свойства.yaml",
      valueType: type,
    })
    const diagnostics = validateConfigurationExtensionPropertyStates({
      facts: [fact("cfe/X", extensionEntry)],
      projectDir: "/project",
      queryPort: {
        ...queryPort([]),
        readStructuredDocumentEntries: ({ logicalAddress: address }: { logicalAddress: string }) =>
          address === logicalAddress ? [baseProperty, baseOption] : address === "Constant.Флаг" ? [baseLocation] : [],
      },
    })

    expect(diagnostics).toHaveLength(diagnosticCount)
    if (diagnosticCount > 0) expect(diagnostics[0]?.message).toContain("булев")
  })
})

function payload(mode: ConfigurationExtensionPropertyStateFactPayload["mode"], value: unknown) {
  return { version: 1, itemType: "MetadataExample", propertyKey: "field", mode, value } as const
}

function entry(value: ConfigurationExtensionPropertyStateFactPayload): ProjectStateStructuredDocumentEntry {
  return {
    documentKind: CONFIGURATION_EXTENSION_PROPERTY_STATE_DOCUMENT,
    representation: "working",
    logicalAddress: "Example.Один",
    workingProjectPath: "Пример/Один/Свойства.yaml",
    componentKind: "property",
    name: "field",
    yamlPath: ["Поле"],
    payload: JSON.stringify(value),
  }
}

function fact(componentPath: string, value: ProjectStateStructuredDocumentEntry): ProjectStateStructuredDocumentFact {
  return { componentPath, projectPath: `${componentPath}/${value.workingProjectPath}`, entry: value }
}

function queryPort(base: readonly ProjectStateStructuredDocumentEntry[]) {
  return {
    readStructuredDocumentEntries: () => base,
    readDependencyInputs: () => [],
    readDependencyOwnerInputs: () => [],
  }
}
