import fs from "node:fs"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { mockContextToXML } from "../../tests/mockContext"
import { encodeConfigurationIndex } from "../configurationIndex/encode"
import { createConfigurationIndexReader, snapshotConfigurationIndex } from "../configurationIndex/sharedSnapshot"
import { sampleIndex } from "../configurationIndex/testData"
import { prepareYamlFiles } from "../project/prepareYamlFiles"
import { prepareFullXmlSyncAssignment } from "./prepareAssignment"
import type { FullXmlSyncAssignment } from "./types"
import { compileMetadataResourceTopology } from "../resourceTopology/compiler"
import { registerMetadataXmlPrepareCapability } from "../resourceTopology/capabilities"
import type { MetadataItemRule } from "../orchestration/property/types"
import { fullXmlSyncTestTopologyFields } from "./testTopology"

describe("prepareFullXmlSyncAssignment", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    vi.restoreAllMocks()
    for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
  })

  it("calls one registered capability once for all of its XML outputs", () => {
    const rule = { itemType: "TestObject", properties: {} } as MetadataItemRule
    const source = { kind: "itemRule" as const, description: "test" }
    const topology = compileMetadataResourceTopology([
      {
        dir: "Объект",
        kind: "test",
        rule,
        exportSchema: () => ({}) as never,
        resources: [
          {
            kind: "content",
            projectPattern: "Объект/{ownerName}/Свойства.yaml",
            role: "properties",
            required: true,
            repeatable: true,
            compositionImpact: "configurationComposition",
            itemRule: rule,
            source,
          },
          ...(["metadata", "body"] as const).map((role) => ({
            kind: "xmlDocument" as const,
            assignmentProjectPattern: "",
            xmlPattern: `Objects/{ownerName}/${role}.xml`,
            role,
            required: true,
            prepareCapabilityId: "test-two-documents",
            source,
          })),
        ],
      },
    ])
    const node = topology.assignments[0]!
    const outputs = node.xmlDocuments.map((document) => ({
      declarationId: document.id,
      targetXmlPath: document.xmlPattern.replace("{ownerName}", "One"),
      role: document.role,
      required: document.required,
      prepareCapabilityId: "test-two-documents",
    }))
    const run = vi.fn(({ outputs: requested }) =>
      requested.map((output: (typeof outputs)[number]) => ({
        declarationId: output.declarationId,
        targetXmlPath: output.targetXmlPath,
        xml: { Root: output.role },
        deferred: [],
        rootRule: rule,
      }))
    )
    registerMetadataXmlPrepareCapability({ id: "test-two-documents", run })
    const assignment: FullXmlSyncAssignment = {
      id: "Объект/One/Свойства.yaml",
      sourceProjectPath: "Объект/One/Свойства.yaml",
      sourcePath: "/project/Объект/One/Свойства.yaml",
      role: "properties",
      itemType: "TestObject",
      itemName: "One",
      logicalAddress: "Объект.One",
      nodeId: node.id,
      potentialOutputs: outputs,
    }

    const prepared = prepareFullXmlSyncAssignment({
      assignment,
      preparedYamlFile: {
        projectPath: assignment.sourceProjectPath,
        filePath: assignment.sourcePath,
        role: "properties",
        owner: { dir: "Объект", name: "One" },
        data: {},
        syntaxDiagnostics: [],
      },
      context: mockContextToXML(),
      index: createConfigurationIndexReader(snapshotConfigurationIndex(encodeConfigurationIndex(sampleIndex()))),
      assignments: [],
      topology,
    })

    expect(run).toHaveBeenCalledTimes(1)
    expect(prepared.documents.map((document) => document.targetXmlPath)).toEqual([
      "Objects/One/metadata.xml",
      "Objects/One/body.xml",
    ])
  })

  it("prepares owner XML without writing files", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-prepare-assignment-"))
    tempDirs.push(projectDir)
    const sourceProjectPath = "Обработка/ОбработкаВсеСвойства/Свойства.yaml"
    const sourcePath = join(projectDir, ...sourceProjectPath.split("/"))
    fs.mkdirSync(join(projectDir, "Обработка", "ОбработкаВсеСвойства"), { recursive: true })
    fs.writeFileSync(sourcePath, "Синоним: Синоним\nКомментарий: Комментарий\n")
    const yaml = prepareYamlFiles({
      files: [
        {
          projectPath: sourceProjectPath,
          filePath: sourcePath,
          role: "properties",
          owner: { dir: "Обработка", name: "ОбработкаВсеСвойства" },
          itemType: "MetadataDataProcessor",
        },
      ],
      itemTypeByYamlDir: { Обработка: "MetadataDataProcessor" },
    }).yamlFiles[0]!
    const assignment: FullXmlSyncAssignment = {
      id: sourceProjectPath,
      sourceProjectPath,
      sourcePath,
      role: "properties",
      itemType: "MetadataDataProcessor",
      itemName: "ОбработкаВсеСвойства",
      logicalAddress: "Обработка.ОбработкаВсеСвойства",
      owner: undefined,
      ...fullXmlSyncTestTopologyFields(sourceProjectPath),
    }
    const writeFile = vi.spyOn(fs.promises, "writeFile")

    const prepared = prepareFullXmlSyncAssignment({
      assignment,
      preparedYamlFile: yaml,
      context: mockContextToXML(),
      index: createConfigurationIndexReader(snapshotConfigurationIndex(encodeConfigurationIndex(sampleIndex()))),
      assignments: [],
    })

    expect(prepared.documents.map((document) => document.targetXmlPath)).toEqual([
      "DataProcessors/ОбработкаВсеСвойства.xml",
    ])
    expect(prepared.documents[0]?.xml).toHaveProperty("MetaDataObject")
    expect(prepared.profile.rulesPassCount).toBe(1)
    expect(writeFile).not.toHaveBeenCalled()
  })

  it("provides the applied object owner to nested metadata targets", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-prepare-assignment-owner-"))
    tempDirs.push(projectDir)
    const sourceProjectPath = "Справочник/Товары/Свойства.yaml"
    const sourcePath = join(projectDir, ...sourceProjectPath.split("/"))
    fs.mkdirSync(join(projectDir, "Справочник", "Товары"), { recursive: true })
    fs.writeFileSync(
      sourcePath,
      [
        "Реквизиты:",
        "  ИспользоватьХранилище:",
        "    Тип: Булево",
        "    ПолеИспользованияХраненияВХранилищеДвоичныхДанных: ИспользоватьХранилище",
        "",
      ].join("\n")
    )
    const yaml = prepareYamlFiles({
      files: [
        {
          projectPath: sourceProjectPath,
          filePath: sourcePath,
          role: "properties",
          owner: { dir: "Справочник", name: "Товары" },
          itemType: "MetadataCatalog",
        },
      ],
      itemTypeByYamlDir: { Справочник: "MetadataCatalog" },
    }).yamlFiles[0]!
    const assignment: FullXmlSyncAssignment = {
      id: sourceProjectPath,
      sourceProjectPath,
      sourcePath,
      role: "properties",
      itemType: "MetadataCatalog",
      itemName: "Товары",
      logicalAddress: "Справочник.Товары",
      owner: undefined,
      ...fullXmlSyncTestTopologyFields(sourceProjectPath),
    }

    const prepared = prepareFullXmlSyncAssignment({
      assignment,
      preparedYamlFile: yaml,
      context: mockContextToXML(),
      index: createConfigurationIndexReader(snapshotConfigurationIndex(encodeConfigurationIndex(sampleIndex()))),
      assignments: [],
    })

    expect(prepared.documents[0]?.xml).toMatchObject({
      MetaDataObject: {
        Catalog: {
          ChildObjects: {
            Attribute: [
              {
                Properties: {
                  BinaryDataStorageLocationUseField:
                    "Catalog.Товары.Attribute.ИспользоватьХранилище",
                },
              },
            ],
          },
        },
      },
    })
  })

  it("restores the topology owner for an independently prepared nested object", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-prepare-nested-assignment-owner-"))
    tempDirs.push(projectDir)
    const sourceProjectPath =
      "ВнешнийИсточникДанных/Источник/Кубы/Куб/Свойства.yaml"
    const sourcePath = join(projectDir, ...sourceProjectPath.split("/"))
    fs.mkdirSync(join(projectDir, "ВнешнийИсточникДанных", "Источник", "Кубы", "Куб"), {
      recursive: true,
    })
    fs.writeFileSync(
      sourcePath,
      ["ИмяВИсточникеДанных: Куб", "ОсновнаяФормаЗаписи: ФормаЗаписи", ""].join("\n")
    )
    const yaml = prepareYamlFiles({
      files: [
        {
          projectPath: sourceProjectPath,
          filePath: sourcePath,
          role: "form",
          owner: { dir: "ВнешнийИсточникДанных", name: "Источник" },
          itemType: "MetadataExternalDataSourceCube",
        },
      ],
      itemTypeByYamlDir: {
        ВнешнийИсточникДанных: "MetadataExternalDataSource",
      },
    }).yamlFiles[0]!
    const assignment: FullXmlSyncAssignment = {
      id: sourceProjectPath,
      sourceProjectPath,
      sourcePath,
      role: "form",
      itemType: "MetadataExternalDataSourceCube",
      itemName: "Куб",
      logicalAddress: "ВнешнийИсточникДанных.Источник.Куб.Куб",
      owner: {
        itemType: "MetadataExternalDataSource",
        name: "Источник",
        logicalAddress: "ВнешнийИсточникДанных.Источник",
      },
      ...fullXmlSyncTestTopologyFields(sourceProjectPath),
    }

    const prepared = prepareFullXmlSyncAssignment({
      assignment,
      preparedYamlFile: yaml,
      context: mockContextToXML(),
      index: createConfigurationIndexReader(snapshotConfigurationIndex(encodeConfigurationIndex(sampleIndex()))),
      assignments: [],
    })

    expect(prepared.documents[0]?.xml).toMatchObject({
      MetaDataObject: {
        Cube: {
          Properties: {
            DefaultRecordForm: "ExternalDataSource.Источник.Cube.Куб.Form.ФормаЗаписи",
          },
        },
      },
    })
  })
})
