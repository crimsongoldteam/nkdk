import { describe, expect, it } from "vitest"
import type { ProjectStateStructuredDocumentFact } from "../../projectState/contracts/dependencyValidation"
import type { ProjectStateStructuredDocumentEntry } from "../../projectState/fileUpdate"
import {
  CONFIGURATION_EXTENSION_PROPERTY_STATE_DOCUMENT,
  type ConfigurationExtensionPropertyStateFactPayload,
} from "../../ruleRuntime/property/propertyStateFacts"
import { validateConfigurationExtensionPropertyStates } from "./propertyStateValidation"

describe("configuration extension PropertyState validation", () => {
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
    const diagnostics = validateConfigurationExtensionPropertyStates({
      facts: [fact("cfe/X", entry(payload("extend", 2)))],
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
