import { beforeAll, describe, expect, it } from "vitest"
import type { CompiledMetadataResourceTopology } from "./core/types"
import { getMetadataExternalTransferCapability, getMetadataXmlPrepareCapability } from "./adapters/capabilities"
import { compileRegisteredMetadataResourceTopology } from "./adapters/registeredRules"
import { resolveTopologyMetadataTargetOwner } from "./adapters/metadataTargetOwner"
import { classifyMetadataProjectPath, projectMetadataFileBackedTargets } from "./core/projectProjection"
import { mockContextToXML } from "../../tests/mockContext"
import { createYAMLToXMLProfile } from "@nkdk/runtime/rule-kit"
import { resolvePartialXmlPackagePolicy } from "../partialSyncToXml/packagePolicy"
import { testConfigurationIndexReader } from "../../tests/configurationIndex"


describe("registered metadata resource topology contracts", () => {
  let topology: CompiledMetadataResourceTopology
  beforeAll(() => {
    topology = compileRegisteredMetadataResourceTopology()
  })

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

  it("разрешает все зарегистрированные политики частичного XML-пакета", () => {
    const policies = resolvePartialXmlPackagePolicy(topology)

    expect(policies.assignments.size).toBeGreaterThan(0)
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
      index: testConfigurationIndexReader(),
      composition: { children: () => [] },
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

  it("классифицирует плоский объект без поддержки прежнего пути", () => {
    expect(classifyMetadataProjectPath(topology, "Нумератор/НумераторЗаказов.yaml")).toMatchObject({
      kind: "content",
      role: "properties",
      values: { ownerName: "НумераторЗаказов" },
    })
    expect(classifyMetadataProjectPath(topology, "Нумератор/НумераторЗаказов/Свойства.yaml")).toBeUndefined()
  })

  it.each([
    [
      "Справочник/Товары/Формы/ФормаЭлемента/БазоваяФорма.yaml",
      "Справочник/{ownerName}/Формы/{itemName}/Форма.yaml",
    ],
    [
      "ОбщаяФорма/ВыборТовара/БазоваяФорма.yaml",
      "ОбщаяФорма/{ownerName}/Свойства.yaml",
    ],
  ] as const)("классифицирует основу %s за правильным заданием", (projectPath, assignmentProjectPattern) => {
    expect(classifyMetadataProjectPath(topology, projectPath)).toMatchObject({
      kind: "yamlCompanion",
      role: "form",
      assignment: { projectPattern: assignmentProjectPattern },
      yamlCompanion: {
        indexContribution: "isolated",
        logicalAddressSegment: "ОсноваФормы",
      },
    })
  })

  it("проецирует владельца вложенной формы через общий resolver", () => {
    const projectPath =
      "ВнешнийИсточникДанных/Источник/Таблицы/Таблица/Формы/Основная/Форма.yaml"
    const match = classifyMetadataProjectPath(topology, projectPath)

    expect(match).toBeDefined()
    expect(projectMetadataFileBackedTargets(
      topology,
      match!,
      resolveTopologyMetadataTargetOwner,
    )).toEqual([{
      kind: "member",
      memberKind: "Form",
      owner: { root: "ExternalDataSource", objectName: "Источник.Table.Таблица" },
      itemName: "Основная",
      evidenceProjectPath: projectPath,
      itemProjectPath: "ВнешнийИсточникДанных/Источник/Таблицы/Таблица/Формы/Основная",
      ownerProjectPath: "ВнешнийИсточникДанных/Источник/Таблицы/Таблица/Свойства.yaml",
    }])
  })
})
