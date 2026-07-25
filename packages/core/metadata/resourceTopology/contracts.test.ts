import { describe, expect, it } from "vitest"
import { registerCoreMetadata } from "../register"
import { getMetadataExternalTransferCapability, getMetadataXmlPrepareCapability } from "./capabilities"
import { classifyMetadataProjectPath } from "./projectProjection"
import { compileRegisteredMetadataResourceTopology } from "./registry"
import { mockContextToXML } from "../../tests/mockContext"
import { createYAMLToXMLProfile } from "../orchestration/property/fromYAMLToXMLTypes"
import { createConfigurationIndexReader, snapshotConfigurationIndex } from "../configurationIndex/sharedSnapshot"
import { encodeConfigurationIndex } from "../configurationIndex/encode"
import { sampleIndex } from "../configurationIndex/testData"

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

  it("prepares a required external XML property even when it is omitted from YAML", () => {
    const assignment = topology.assignments.find(
      (candidate) => candidate.projectPattern === "ОбщаяФорма/{ownerName}/Свойства.yaml"
    )
    const output = assignment?.xmlDocuments.find(
      (candidate) => candidate.xmlPattern === "CommonForms/{ownerName}/Ext/Form.xml"
    )
    const capability =
      output?.prepareCapabilityId === undefined ? undefined : getMetadataXmlPrepareCapability(output.prepareCapabilityId)
    expect(assignment).toBeDefined()
    expect(output).toBeDefined()
    expect(capability).toBeDefined()

    const documents = capability!.run({
      context: mockContextToXML(),
      preparedYamlFile: {
        projectPath: "ОбщаяФорма/Пустая/Свойства.yaml",
        filePath: "/project/ОбщаяФорма/Пустая/Свойства.yaml",
        role: "properties",
        owner: { dir: "ОбщаяФорма", name: "Пустая" },
        data: {},
        syntaxDiagnostics: [],
      },
      assignment: assignment!,
      itemName: "Пустая",
      logicalAddress: "ОбщаяФорма.Пустая",
      outputs: [
        {
          declarationId: output!.id,
          targetXmlPath: "CommonForms/Пустая/Ext/Form.xml",
          role: "body",
          propertyName: "form",
        },
      ],
      index: createConfigurationIndexReader(snapshotConfigurationIndex(encodeConfigurationIndex(sampleIndex()))),
      composition: [],
      profile: createYAMLToXMLProfile(),
    })

    expect(documents).toHaveLength(1)
    expect(documents[0]?.xml).toHaveProperty("Form")
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
