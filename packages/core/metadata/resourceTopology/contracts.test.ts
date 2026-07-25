import { describe, expect, it } from "vitest"
import { registerCoreMetadata } from "../register"
import { getMetadataExternalTransferCapability, getMetadataXmlPrepareCapability } from "./capabilities"
import { classifyMetadataProjectPath } from "./projectProjection"
import { compileRegisteredMetadataResourceTopology } from "./registry"

registerCoreMetadata()

describe("registered metadata resource topology contracts", () => {
  const topology = compileRegisteredMetadataResourceTopology()

  it("gives every assignment XML or external resources", () => {
    for (const assignment of topology.assignments) {
      expect(
        assignment.xmlDocuments.length + assignment.externalFiles.length,
        assignment.projectPattern
      ).toBeGreaterThan(0)
    }
  })

  it("registers capabilities required by declarations", () => {
    for (const assignment of topology.assignments) {
      for (const document of assignment.xmlDocuments) {
        if (document.prepareCapabilityId === undefined) {
          expect(document.required, document.xmlPattern).toBe(false)
        } else {
          expect(getMetadataXmlPrepareCapability(document.prepareCapabilityId), document.xmlPattern).toBeDefined()
        }
      }
      for (const file of assignment.externalFiles) {
        expect(getMetadataExternalTransferCapability(file.transferCapabilityId), file.xmlPattern).toBeDefined()
      }
    }
  })

  it.each([
    ["Конфигурация.yaml", "configuration"],
    ["Справочник/Товары/Свойства.yaml", "properties"],
    ["Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", "fileItem"],
    ["Подсистема/Продажи/Подсистемы/Розница/Свойства.yaml", "properties"],
  ] as const)("classifies %s through the common topology", (projectPath, role) => {
    expect(classifyMetadataProjectPath(topology, projectPath)).toMatchObject({
      kind: "content",
      role,
    })
  })
})
